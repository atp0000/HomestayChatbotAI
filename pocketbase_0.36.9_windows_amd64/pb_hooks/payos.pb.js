routerAdd("POST", "/api/create-payos-payment", (e) => {
    try {
        const info = e.requestInfo();
        const data = info.body || {};

        const bookingId = data.bookingId;
        const orderCode = data.orderCode;
        const amount = data.amount;

        if (!bookingId || !orderCode || !amount) {
            return e.json(400, { message: "Missing bookingId, orderCode or amount" });
        }

       const clientId = "55f0c23c-5bbc-4c2e-b6d9-a2470b307a14";
        const apiKey = "33ac70d5-cf1b-4837-aa4d-1f0da058df81";
        const checksumKey = "6e11bad79881ddd21378e69a52988389cbd59d10c3d8ce290056a718e2a0c8e9";

        if (!clientId || !apiKey || !checksumKey) {
            return e.json(500, { message: "PayOS environment variables are not configured" });
        }

        const numericOrderCode = Number(orderCode);
        const numericAmount = Number(amount);
        const baseUrl = $os.getenv("APP_URL") || "http://localhost:5173";
        const cancelUrl = `${baseUrl}/cancel`;
        const returnUrl = `${baseUrl}/success/${bookingId}`;
        const description = `Thanh toan don ${numericOrderCode}`.slice(0, 25);

        const signData = `amount=${numericAmount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${numericOrderCode}&returnUrl=${returnUrl}`;

        const response = $http.send({
            url: "https://api-merchant.payos.vn/v2/payment-requests",
            method: "POST",
            body: JSON.stringify({
                orderCode: numericOrderCode,
                amount: numericAmount,
                description: description,
                cancelUrl: cancelUrl,
                returnUrl: returnUrl,
                signature: $security.hs256(signData, checksumKey),
            }),
            headers: {
                "x-client-id": clientId,
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
        });

        const result = response.json;
        if (response.statusCode === 200 && result && result.code === "00") {
            return e.json(200, { checkoutUrl: result.data.checkoutUrl, qrCode: result.data.qrCode });
        }

        return e.json(400, { message: (result && result.desc) || "Unable to create PayOS payment" });
    } catch (err) {
        return e.json(500, { message: err.message });
    }
});

// WEBHOOK XỬ LÝ KHI KHÁCH CHUYỂN KHOẢN THÀNH CÔNG
routerAdd("POST", "/api/payos-webhook", (e) => {
    try {
        const info = e.requestInfo();
        const body = info.body || {};
        const code = body.code;
        const data = body.data;

        if (code === "00" && data) {
            const orderCodeStr = String(data.orderCode);

            // 1. Tìm payment theo transactionCode
            const paymentRecord = $app.findFirstRecordByFilter("payments", `transactionCode = '${orderCodeStr}'`);
            
            if (paymentRecord) {
                // Cập nhật trạng thái payment thành completed
                paymentRecord.set("status", "completed");
                $app.save(paymentRecord);

                // 2. Cập nhật booking liên quan sang status 'confirmed' & 'paid'
                const bookingId = paymentRecord.get("booking");
                if (bookingId) {
                    const bookingRecord = $app.findRecordById("bookings", bookingId);
                    if (bookingRecord) {
                        bookingRecord.set("payStatus", "paid");
                        bookingRecord.set("status", "confirmed");
                        $app.save(bookingRecord);
                    }
                }
            }

            return e.json(200, { success: true });
        }

        return e.json(200, { message: "Ignored event" });
    } catch (err) {
        return e.json(500, { message: err.message });
    }
});
cronAdd("cancel-unpaid-bookings", "*/1 * * * *", () => {
    try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
            .toISOString().replace("T", " ").slice(0, 19) + "Z";

        // Chỉ lấy payment CHUYỂN KHOẢN đang pending và đã tạo quá 1 phút
        const expiredPayments = $app.findRecordsByFilter(
            "payments",
            `method = 'transfer' && status = 'pending' && created <= '${oneMinuteAgo}'`,
            "-created",
            100
        );

        for (const payment of expiredPayments) {
            const bookingId = payment.get("booking");
            if (!bookingId) continue;

            const booking = $app.findRecordById("bookings", bookingId);
            if (!booking) continue;

            // Chỉ huỷ nếu booking vẫn pending/unpaid (tránh đè đơn đã confirmed)
            if (booking.get("status") !== "pending" || booking.get("payStatus") !== "unpaid") continue;

            booking.set("status", "cancelled");
            $app.save(booking);

            payment.set("status", "failed");
            $app.save(payment);

            const servicesDetail = booking.get("servicesDetail");
            if (Array.isArray(servicesDetail) && servicesDetail.length) {
                for (const item of servicesDetail) {
                    try {
                        const svc = $app.findRecordById("services", item.id);
                        if (svc) {
                            svc.set("quantity", svc.get("quantity") + (item.count || 0));
                            $app.save(svc);
                        }
                    } catch (e) {
                        console.log("Không thể hoàn dịch vụ:", item.id, e);
                    }
                }
            }
        }
    } catch (err) {
        console.log("Lỗi cron cancel-unpaid-bookings:", err);
    }
});

routerAdd("POST", "/api/create-booking", (e) => {
    try {
        const info = e.requestInfo();
        const data = info.body || {};

        if (!data.roomCode || !data.checkIn || !data.checkOut || !data.total) {
            return e.json(400, { message: "Thiếu thông tin đặt phòng" });
        }

        let result = null;
        let conflict = false;

        $app.runInTransaction((txApp) => {
            const overlapping = txApp.findRecordsByFilter(
                "bookings",
                `roomCode = '${data.roomCode}' && status != 'cancelled' && checkIn < '${data.checkOut}' && checkOut > '${data.checkIn}'`,
                "",
                1
            );

            if (overlapping.length > 0) {
                conflict = true;
                return;
            }

            const bookingCollection = txApp.findCollectionByNameOrId("bookings");
            const booking = new Record(bookingCollection);
            for (const key in data) {
                if (key === "method" || key === "transactionCode") continue;
                booking.set(key, data[key]);
            }
            booking.set("status", "pending");
            booking.set("payStatus", "unpaid");
            txApp.save(booking);

            const payCollection = txApp.findCollectionByNameOrId("payments");
            const payment = new Record(payCollection);
            payment.set("booking", booking.id);
            payment.set("amount", data.total);
            payment.set("method", data.method || "cash");
            payment.set("status", "pending");
            if (data.transactionCode) payment.set("transactionCode", String(data.transactionCode));
            txApp.save(payment);

            result = { booking, payment };
        });

        if (conflict) {
            return e.json(409, {
                message: "Rất tiếc, phòng vừa được người khác đặt trong khoảng thời gian này. Vui lòng chọn phòng hoặc ngày khác.",
            });
        }
        if (!result) {
            return e.json(500, { message: "Không thể tạo booking" });
        }

        return e.json(200, { booking: result.booking, payment: result.payment });
    } catch (err) {
        return e.json(500, { message: err.message });
    }
});
