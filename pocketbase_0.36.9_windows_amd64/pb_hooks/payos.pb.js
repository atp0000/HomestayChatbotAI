<<<<<<< HEAD
// 1. ROUTE TẠO YÊU CẦU THANH TOÁN PAYOS
routerAdd("POST", "/api/create-payos-payment", (e) => {
    try {
        const body = e.requestInfo().body || {};
        const { orderCode, amount } = body;

        if (!orderCode || !amount) {
            return e.json(400, { error: "Thiếu orderCode hoặc amount" });
        }

        const PAYOS_CLIENT_ID = $os.getenv("PAYOS_CLIENT_ID") || "55f0c23c-5bbc-4c2e-b6d9-a2470b307a14";
        const PAYOS_API_KEY = $os.getenv("PAYOS_API_KEY") || "33ac70d5-cf1b-4837-aa4d-1f0da058df81";
        const PAYOS_CHECKSUM_KEY = $os.getenv("PAYOS_CHECKSUM_KEY") || "6e11bad79881ddd21378e69a52988389cbd59d10c3d8ce290056a718e2a0c8e9";

        const numOrderCode = Number(orderCode);
        const numAmount = Number(amount);

        const description = `Thanh toan don ${numOrderCode}`.slice(0, 25);
        const cancelUrl = "http://localhost:5173/cancel";
        const returnUrl = "http://localhost:5173/success";

        const signData = `amount=${numAmount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${numOrderCode}&returnUrl=${returnUrl}`;
        const signature = $security.hs256(signData, PAYOS_CHECKSUM_KEY);

        const paymentData = {
            orderCode: numOrderCode,
            amount: numAmount,
            description,
            cancelUrl,
            returnUrl,
            signature,
        };
=======
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
>>>>>>> customer

        const response = $http.send({
            url: "https://api-merchant.payos.vn/v2/payment-requests",
            method: "POST",
<<<<<<< HEAD
            body: JSON.stringify(paymentData),
            headers: {
                "x-client-id": PAYOS_CLIENT_ID,
                "x-api-key": PAYOS_API_KEY,
=======
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
>>>>>>> customer
                "Content-Type": "application/json",
            },
        });

<<<<<<< HEAD
        const resData = response.json;

        if (response.statusCode === 200 && resData && resData.code === "00") {
            return e.json(200, {
                checkoutUrl: resData.data.checkoutUrl,
                qrCode: resData.data.qrCode,
            });
        }

        console.log("PayOS trả lỗi:", JSON.stringify(resData));
        return e.json(400, { error: resData?.desc || "Không tạo được giao dịch PayOS" });
    } catch (err) {
        console.log("Exception khi gọi PayOS:", err);
        return e.json(500, { error: err.message });
    }
});

// 2. ROUTE NHẬN WEBHOOK TỪ PAYOS KHI THANH TOÁN THÀNH CÔNG
routerAdd("POST", "/api/payos-webhook", (e) => {
    try {
        // Đặt trực tiếp PAYOS_CHECKSUM_KEY vào trong hàm này
        const PAYOS_CHECKSUM_KEY = $os.getenv("PAYOS_CHECKSUM_KEY") || "6e11bad79881ddd21378e69a52988389cbd59d10c3d8ce290056a718e2a0c8e9";
        
        const body = e.requestInfo().body || {};

        console.log("[PayOS webhook] Nhận request:", JSON.stringify(body));

        const { code, data, signature } = body;

        if (!data || !signature) {
            return e.json(400, { error: "Thiếu dữ liệu webhook" });
        }

        // Tạo chuỗi signature đúng chuẩn PayOS
        const sortedKeys = Object.keys(data).sort();
        const signStr = sortedKeys
            .map((key) => {
                let value = data[key];
                if (value === null || value === undefined) {
                    value = "";
                } else if (typeof value === "object") {
                    value = JSON.stringify(value);
                }
                return `${key}=${value}`;
            })
            .join("&");

        const expectedSignature = $security.hs256(signStr, PAYOS_CHECKSUM_KEY);

        if (expectedSignature !== signature) {
            console.log("[PayOS webhook] Chữ ký KHÔNG khớp.");
            console.log("  - signStr  :", signStr);
            console.log("  - expected :", expectedSignature);
            console.log("  - received :", signature);
            return e.json(400, { error: "Chữ ký không hợp lệ" });
        }

        if (code === "00") {
            const orderCode = Number(data.orderCode);

            try {
                const record = $app.findFirstRecordByFilter(
                    "bookings",
                    `orderCode = ${orderCode}`
                );

                record.set("payStatus", "paid");
                record.set("status", "confirmed");
                $app.save(record);

                console.log("[PayOS webhook] Đã cập nhật thanh toán cho đơn:", orderCode);
            } catch (findErr) {
                console.log("[PayOS webhook] Không tìm thấy booking với orderCode:", orderCode);
            }
        }

        return e.json(200, { success: true });
    } catch (err) {
        console.log("[PayOS webhook] Lỗi xử lý webhook:", err);
        return e.json(500, { error: err.message });
=======
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
>>>>>>> customer
    }
});