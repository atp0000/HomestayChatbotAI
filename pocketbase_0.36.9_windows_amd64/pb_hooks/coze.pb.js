/// <reference path="../pb_data/types.d.ts" />

// =====================================================================
// Custom route: POST /api/coze-chat
// Proxy giữa frontend React và Coze Chat API (v3/chat).
// Token PAT được giữ ở đây (server), KHÔNG BAO GIỜ gửi về frontend.
// =====================================================================

// TODO: cách an toàn nhất là đặt token qua biến môi trường khi chạy PocketBase,
// ví dụ: COZE_PAT_TOKEN=pat_xxx ./pocketbase serve
// rồi đọc bằng $os.getenv("COZE_PAT_TOKEN").
// Nếu PocketBase bản bạn dùng chưa hỗ trợ $os.getenv, có thể tạm hardcode thẳng
// ở đây (file này chỉ nằm trên server, không bao giờ gửi ra browser) —
// chỉ cần nhớ KHÔNG commit file này lên repo public / thêm vào .gitignore.
routerAdd("POST", "/api/coze-chat", (e) => {
  // QUAN TRỌNG: các hằng số này phải khai báo BÊN TRONG handler,
  // vì JSVM chạy handler ở 1 VM instance riêng, không đọc được biến
  // khai báo ở ngoài top-level của file (xem JSVM "Caveats and limitations").
  const COZE_PAT_TOKEN = $os.getenv("COZE_PAT_TOKEN") || "pat_8icSm2m1t4DTlfATUu4sKavj0So7rGuezfJgJyhmIAashMTq0TjPqW8jjLQxUX5v";
  const COZE_BOT_ID = "7670933824876085253";
  const COZE_BASE_URL = "https://api.coze.com"; // đổi thành api.coze.cn nếu dùng bản Trung Quốc

  const data = new DynamicModel({
    message: "",
    conversation_id: "",
  });
  e.bindBody(data);

  if (!data.message || data.message.trim() === "") {
    return e.json(400, { error: "Thiếu nội dung tin nhắn (message)." });
  }

  try {
    // 1. Tạo chat (gửi tin nhắn)
    const createBody = {
      bot_id: COZE_BOT_ID,
      user_id: "web_guest", // có thể thay bằng id thật nếu người dùng đã đăng nhập
      stream: false,
      auto_save_history: true,
      additional_messages: [
        {
          role: "user",
          content: data.message,
          content_type: "text",
        },
      ],
    };

    let url = COZE_BASE_URL + "/v3/chat";
    if (data.conversation_id) {
      url += "?conversation_id=" + encodeURIComponent(data.conversation_id);
    }

    const createRes = $http.send({
      url: url,
      method: "POST",
      body: JSON.stringify(createBody),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + COZE_PAT_TOKEN,
      },
    });

    if (createRes.statusCode >= 400 || !createRes.json || !createRes.json.data) {
      // Debug tạm thời: trả nguyên văn response của Coze để xem chính xác lỗi gì
      return e.json(502, {
        error: "Coze API không trả về dữ liệu hợp lệ",
        statusCode: createRes.statusCode,
        raw: createRes.raw,
      });
    }

    const chatId = createRes.json.data.id;
    const conversationId = createRes.json.data.conversation_id;

    // 2. Poll trạng thái cho tới khi completed (tối đa ~15s)
    let status = createRes.json.data.status;
    let tries = 0;
    while (status !== "completed" && tries < 30) {
      sleep(500);
      const pollRes = $http.send({
        url:
          COZE_BASE_URL +
          "/v3/chat/retrieve?conversation_id=" +
          encodeURIComponent(conversationId) +
          "&chat_id=" +
          encodeURIComponent(chatId),
        method: "GET",
        headers: { "Authorization": "Bearer " + COZE_PAT_TOKEN },
      });
      status = pollRes.json.data.status;
      if (status === "failed" || status === "requires_action") {
        return e.json(502, { error: "Chat không hoàn tất", status: status });
      }
      tries++;
    }

    if (status !== "completed") {
      return e.json(504, { error: "Bot phản hồi quá lâu, vui lòng thử lại." });
    }

    // 3. Lấy danh sách message, tìm message loại "answer"
    const msgRes = $http.send({
      url:
        COZE_BASE_URL +
        "/v3/chat/message/list?conversation_id=" +
        encodeURIComponent(conversationId) +
        "&chat_id=" +
        encodeURIComponent(chatId),
      method: "GET",
      headers: { "Authorization": "Bearer " + COZE_PAT_TOKEN },
    });

    const messages = msgRes.json.data || [];
    const answer = messages.find((m) => m.type === "answer");

    return e.json(200, {
      reply: answer ? answer.content : "(Không có phản hồi)",
      conversation_id: conversationId,
    });
  } catch (err) {
    return e.json(500, { error: "Lỗi server khi gọi Coze", detail: String(err) });
  }
});