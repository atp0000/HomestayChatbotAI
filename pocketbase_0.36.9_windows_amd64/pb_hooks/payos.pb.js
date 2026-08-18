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