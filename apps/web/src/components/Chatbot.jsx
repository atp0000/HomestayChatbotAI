import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, BedDouble, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, fmt, overlaps } from "@/lib/store";

const KB = [
  { k: ["giá", "bao nhiêu", "tiền"], a: "Phòng đơn 300.000đ/đêm, phòng đôi 500.000đ/đêm, phòng gia đình 800.000đ/đêm. Bạn có thể xem chi tiết bên dưới hoặc mục Phòng." },
  { k: ["dịch vụ", "ăn sáng", "đưa đón"], a: "Chúng tôi có dịch vụ đưa đón tận nơi (150.000đ/người), bữa ăn sáng (30.000đ/phần) và nước uống (15.000đ/phần)." },
  { k: ["thanh toán", "chuyển khoản", "trả tiền"], a: "Bạn có thể thanh toán khi nhận phòng hoặc chuyển khoản giữ phòng. Thông tin tài khoản sẽ hiển thị khi đặt phòng." },
  { k: ["liên hệ", "hotline", "số điện thoại"], a: "Hotline: 035 356 600 - Email: Nuihomstay@gmail.com. Bạn cần hỗ trợ gấp? Hãy gọi hotline nhé!" },
  { k: ["địa chỉ", "ở đâu", "vị trí"], a: "Núi Homestay cách trung tâm TP. Huế 3,6km, không gian yên tĩnh và xanh mát." },
];

export default function Chatbot() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      from: "bot",
      t: "Xin chào! Mình là trợ lý Núi Homestay. Hãy thử hỏi ví dụ: 'Xem phòng đôi từ 12/12/2026 đến 13/12/2026' nhé!",
    },
  ]);
  const [inp, setInp] = useState("");
  const [allRooms, setAllRooms] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const end = useRef(null);

  // Lấy dữ liệu phòng & lịch đặt để lọc
  useEffect(() => {
    api.rooms().then(setRoomsData).catch(() => {});
    api.bookings().then(setAllBookings).catch(() => {});
  }, []);

  function setRoomsData(data) {
    setAllRooms(data || []);
  }

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  // 🔴 Hàm bóc tách ngày dạng dd/mm/yyyy từ câu chat và chuyển thành yyyy-mm-dd
  const extractDates = (text) => {
    const dates = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
    if (!dates || dates.length < 2) return null;

    const parseDate = (str) => {
      const [d, m, y] = str.split("/");
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    };

    return {
      checkIn: parseDate(dates[0]),
      checkOut: parseDate(dates[1]),
      rawIn: dates[0],
      rawOut: dates[1],
    };
  };

  const send = () => {
    const q = inp.trim();
    if (!q) return;

    const lowerQ = q.toLowerCase();
    const dates = extractDates(q);

    // 🟢 CASE 1: Khách hỏi tìm phòng có ngày tháng
    if (dates || lowerQ.includes("phòng") || lowerQ.includes("xem")) {
      let matchedRooms = allRooms.filter((r) => r.status === "active");

      // Lọc theo loại phòng (đơn / đôi / gia đình)
      if (lowerQ.includes("đôi")) {
        matchedRooms = matchedRooms.filter((r) => r.typeName?.toLowerCase().includes("đôi"));
      } else if (lowerQ.includes("đơn")) {
        matchedRooms = matchedRooms.filter((r) => r.typeName?.toLowerCase().includes("đơn"));
      } else if (lowerQ.includes("gia đình")) {
        matchedRooms = matchedRooms.filter((r) => r.typeName?.toLowerCase().includes("gia đình"));
      }

      // Lọc phòng trống theo ngày nếu có thông tin ngày
      if (dates) {
        matchedRooms = matchedRooms.filter((r) => {
          const isBusy = allBookings.some(
            (b) =>
              b.roomCode === r.code &&
              b.status !== "cancelled" &&
              overlaps(dates.checkIn, dates.checkOut, b.checkIn, b.checkOut)
          );
          return !isBusy;
        });
      }

      let replyText = "";
      if (matchedRooms.length > 0) {
        replyText = dates
          ? `Dưới đây là các phòng phù hợp từ ${dates.rawIn} đến ${dates.rawOut}:`
          : "Dưới đây là các phòng phù hợp với yêu cầu của bạn:";
      } else {
        replyText = dates
          ? `Rất tiếc, khoảng thời gian từ ${dates.rawIn} đến ${dates.rawOut} không còn phòng trống phù hợp.`
          : "Không tìm thấy phòng phù hợp. Bạn có thể tham khảo mục Phòng nhé!";
      }

      setMsgs((m) => [
        ...m,
        { from: "me", t: q },
        {
          from: "bot",
          t: replyText,
          rooms: matchedRooms.slice(0, 3), // Lấy tối đa 3 phòng hiển thị
          dates: dates,
        },
      ]);
      setInp("");
      return;
    }

    // 🟡 CASE 2: Trả lời bằng Knowledge Base thông thường
    const found = KB.find((e) => e.k.some((w) => lowerQ.includes(w)));
    const a = found
      ? found.a
      : "Cảm ơn bạn! Bạn có thể xem danh sách phòng ở mục Phòng, hoặc gọi Hotline 035 356 600 để được hỗ trợ nhanh nhất nhé.";

    setMsgs((m) => [...m, { from: "me", t: q }, { from: "bot", t: a }]);
    setInp("");
  };

  // Chuyển hướng sang trang chi tiết phòng kèm ngày đã chọn
  const handleSelectRoom = (roomId, dates) => {
    setOpen(false);
    let url = `/rooms/${roomId}`;
    if (dates) {
      url += `?checkIn=${dates.checkIn}&checkOut=${dates.checkOut}&book=1`;
    }
    nav(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-105 transition"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm h-[520px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-fadeup">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center gap-2 font-semibold">
            <Bot className="w-5 h-5" /> Trợ lý Núi Homestay
          </div>

          {/* Tin nhắn */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.from === "me" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    m.from === "me"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {m.t}
                </div>

                {/* 🟢 Render Card Phòng nếu có danh sách phòng kèm theo */}
                {m.rooms && m.rooms.length > 0 && (
                  <div className="mt-2 space-y-2 w-[90%]">
                    {m.rooms.map((r) => {
                      const roomType = r.expand?.room_type_id || r.expand?.room_type;
                      const roomPrice = roomType?.price ?? r.price ?? 0;
                      const roomImage =
                        r.images && r.images.length > 0
                          ? r.images[0]
                          : "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500";

                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelectRoom(r.id, m.dates)}
                          className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all"
                        >
                          <img
                            src={roomImage}
                            alt={r.code}
                            className="w-14 h-14 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {r.typeName || `Phòng ${r.code}`}
                            </h4>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <BedDouble className="w-3 h-3 text-primary" /> {r.beds || "Giường đôi"}
                            </p>
                            <p className="text-xs font-extrabold text-primary">
                              {fmt(roomPrice)}/đêm
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={end} />
          </div>

          {/* Ô nhập liệu */}
          <div className="p-3 border-t border-border flex gap-2 bg-white">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Nhập: Cho tôi xem phòng đôi từ 12/12/2026..."
              className="flex-1 px-3 py-2 rounded-full bg-gray-100 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary/90 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}