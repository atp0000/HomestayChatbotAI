const API_URL = "http://localhost:8090/api/create-booking";

// Cập nhật payload đầy đủ thuộc tính Backend yêu cầu
const payload = {
  roomCode: "sb0ycb8pnfo7krn",
  roomTypeName: "sv4h2mmsreavpcu",
  checkIn: "2026-08-30",
  checkOut: "2026-08-31",
  guestName: "Test Concurrency",
  guestPhone: "0374949279",
  guestEmail: "test@gmail.com",
  guestAddress: "Bến Tre",
  guests: 2,
  nights: 1,
  roomPrice: 3000,
  servicesTotal: 0,
  servicesDetail: [],
  total: 3000,
  payStatus: "unpaid",
  status: "pending",
  paymentMethod: "cash"
};

async function sendRequest(userId) {
  console.log(`⏳ [User ${userId}] Đang gửi request...`);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, guestName: `User ${userId}` })
    });
    
    const data = await res.json();
    console.log(`[User ${userId}] Status Code: ${res.status}`, data);
  } catch (err) {
    console.error(`❌ [User ${userId}] Lỗi kết nối:`, err.message);
  }
}

async function runTest() {
  console.log("BẮT ĐẦU GỬI 3 REQUEST ĐỒNG THỜI...");
  
  await Promise.all([
    sendRequest("A"),
    sendRequest("B"),
    sendRequest("C")
  ]);
  
  console.log("🏁 BÀI TEST HOÀN TẤT.");
}

runTest();