// pb_hooks/coze.pb.js

// Hàm sleep đồng bộ (busy-wait) vì JSVM của PocketBase không có hàm sleep sẵn
function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // chặn có chủ đích để chờ
  }
}

routerAdd("POST", "/api/coze/chat", (e) => {
  try {
    // ==== CẤU HÌNH ====
    const COZE_BOT_ID = "7670933824876085253";
    const COZE_API_TOKEN = "pat_ymPCXHtjs57UiGQW3sVhI07jkLtUfoaCQUDXehBtVP6OgFhtAhOjXmhW9qgXKnGA";
    const COZE_API_BASE = "https://api.coze.com"; // đổi thành .cn nếu token tạo bên coze.cn
    // ===================

    const info = e.requestInfo();
    const data = info.body || {};
    const { message, conversationId, userId } = data;

    if (!message || !userId) {
      return e.json(400, { error: "Thiếu message hoặc userId" });
    }

    // ---- Tạo chat ----
    const createRes = $http.send({
      url: `${COZE_API_BASE}/v3/chat`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${COZE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        user_id: userId,
        stream: false,
        auto_save_history: true,
        conversation_id: conversationId || undefined,
        additional_messages: [
          { role: "user", content: message, content_type: "text" },
        ],
      }),
    });

    let createBody;
    try {
      createBody = JSON.parse(createRes.raw);
    } catch (parseErr) {
      throw new Error(
        `Không parse được response tạo chat (HTTP ${createRes.statusCode}): ${createRes.raw}`
      );
    }

    if (createBody.code && createBody.code !== 0) {
      throw new Error(
        `Coze báo lỗi khi tạo chat -> code: ${createBody.code}, msg: ${createBody.msg}`
      );
    }

    const chat = createBody.data;
    if (!chat) {
      throw new Error("Coze trả về không có 'data' khi tạo chat: " + createRes.raw);
    }

    const newConversationId = chat.conversation_id;
    const chatId = chat.id;

    // ---- Poll trạng thái (có nghỉ thật giữa các lần) ----
    let status = chat.status;
    let tries = 0;
    const maxTries = 20;
    const statusLog = [status];

    while (status !== "completed" && tries < maxTries) {
      sleep(1500); // nghỉ 1.5s thật sự trước khi hỏi lại

      const pollRes = $http.send({
        url: `${COZE_API_BASE}/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${newConversationId}`,
        method: "GET",
        headers: { Authorization: `Bearer ${COZE_API_TOKEN}` },
      });

      let pollBody;
      try {
        pollBody = JSON.parse(pollRes.raw);
      } catch (e2) {
        throw new Error(`Không parse được response poll: ${pollRes.raw}`);
      }

      if (pollBody.code && pollBody.code !== 0) {
        throw new Error(`Coze báo lỗi khi poll -> code: ${pollBody.code}, msg: ${pollBody.msg}`);
      }

      const pollData = pollBody.data;
      status = pollData?.status;
      statusLog.push(status);

      if (status === "failed" || status === "requires_action") {
        throw new Error(
          "Bot xử lý thất bại, status: " + status + " chi tiết: " + pollRes.raw
        );
      }
      tries++;
    }

    if (status !== "completed") {
      throw new Error(
        "Bot xử lý quá lâu, chưa hoàn thành sau " +
          tries +
          " lần thử. Lịch sử status: " +
          JSON.stringify(statusLog)
      );
    }

    // ---- Lấy danh sách tin nhắn trả lời ----
    const msgRes = $http.send({
      url: `${COZE_API_BASE}/v3/chat/message/list?chat_id=${chatId}&conversation_id=${newConversationId}`,
      method: "GET",
      headers: { Authorization: `Bearer ${COZE_API_TOKEN}` },
    });

    let msgBody;
    try {
      msgBody = JSON.parse(msgRes.raw);
    } catch (e3) {
      throw new Error(`Không parse được response message list: ${msgRes.raw}`);
    }

    if (msgBody.code && msgBody.code !== 0) {
      throw new Error(`Coze báo lỗi khi lấy message -> code: ${msgBody.code}, msg: ${msgBody.msg}`);
    }

    const msgData = msgBody.data || [];
    const answer = msgData
      .filter((m) => m.type === "answer")
      .map((m) => m.content)
      .join("\n");

    return e.json(200, {
      answer: answer || "(Bot không trả lời)",
      conversationId: newConversationId,
    });
  } catch (err) {
    return e.json(400, { debug_error: String(err), stack: err.stack || null });
  }
});