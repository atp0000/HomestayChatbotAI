import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api, genCode, nights, createPayment } from "@/lib/store";

// Components con của trang Lễ tân
import StatusLegend from "@/components/reception/StatusLegend";
import ReceptionGridView from "@/components/reception/ReceptionGridView";
import ReceptionTimelineView from "@/components/reception/ReceptionTimelineView";
import BookingDetailDialog from "@/components/reception/BookingDetailDialog";
import WalkInBookingModal from "@/components/reception/WalkInBookingModal";

// shadcn/ui & Icons
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, LogOut, UserPlus, Palmtree } from "lucide-react";

export default function ReceptionPage() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [view, setView] = useState("grid");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sel, setSel] = useState(null);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    roomCode: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestAddress: "",
    note: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    status: "checkedin",
    payStatus: "unpaid",
    payMethod: "cash",
  });

  // 🟢 Lấy danh sách rooms và bookings hỗ trợ Expand Relation
  const load = async () => {
    try {
      const [roomsData, bookingsData] = await Promise.all([
        pb.collection("rooms").getFullList({ expand: "room_type_id,room_type,roomType" }),
        pb.collection("bookings").getFullList({ expand: "roomCode,roomTypeName,room_type_id" }),
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
      setSel((prev) => {
        if (!prev) return prev;
        return bookingsData.find((b) => b.id === prev.id) || prev;
      });
    } catch (err) {
      api.rooms().then(setRooms).catch(() => {});
      api.bookings().then((data) => {
        setBookings(data);
        setSel((prev) => {
          if (!prev) return prev;
          return data.find((b) => b.id === prev.id) || prev;
        });
      }).catch(() => {});
    }
  };

  useEffect(() => {
    load();

    const unsubscribe = pb.collection("bookings").subscribe("*", () => {
      load();
    });

    return () => {
      pb.collection("bookings").unsubscribe("*");
    };
  }, []);

  const handleLogout = () => {
    logout();
    nav("/auth", { replace: true });
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🟢 Hàm kiểm tra trạng thái phòng tương thích với Relation (ID / Object / Code)
  const roomState = (code) => {
    const room = rooms.find((r) => r.code === code || r.id === code);
    const roomId = room?.id;
    const roomCode = room?.code || code;

    const activeBookings = bookings.filter((b) => {
      const bRoomId = b.expand?.roomCode?.id || b.roomCode;
      const bRoomCode = b.expand?.roomCode?.code || b.roomCode;

      const isSameRoom =
        bRoomId === roomId ||
        bRoomCode === roomCode ||
        b.roomCode === roomCode ||
        b.roomCode === roomId;

      return isSameRoom && b.status !== "cancelled" && b.status !== "checkedout";
    });

    const stayingBooking = activeBookings.find((b) => b.status === "checkedin");
    if (stayingBooking) return { s: "staying", b: stayingBooking };

    const comingBooking = activeBookings.find(
      (b) => b.status === "pending" || b.status === "confirmed"
    );
    if (comingBooking) return { s: "coming", b: comingBooking };

    return { s: "empty", b: null };
  };

  // 🟢 Lấy danh sách đơn đặt của từng phòng tương thích Relation
  const roomBookings = (code) => {
    const room = rooms.find((r) => r.code === code || r.id === code);
    const roomId = room?.id;
    const roomCode = room?.code || code;

    return bookings.filter((b) => {
      const bRoomId = b.expand?.roomCode?.id || b.roomCode;
      const bRoomCode = b.expand?.roomCode?.code || b.roomCode;

      const isSameRoom =
        bRoomId === roomId ||
        bRoomCode === roomCode ||
        b.roomCode === roomCode ||
        b.roomCode === roomId;

      return isSameRoom && b.status !== "cancelled" && b.status !== "checkedout";
    });
  };

  const updateStatus = async (b, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === "checkedout") {
        updateData.payStatus = "paid";
      }
      await pb.collection("bookings").update(b.id, updateData);
      load();
      setSel(null);
    } catch (err) {
      alert("Cập nhật thất bại: " + err.message);
    }
  };

  let minDate = new Date(today);
  let maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);

  bookings.forEach((b) => {
    if (b.status !== "cancelled" && b.status !== "checkedout" && b.checkIn && b.checkOut) {
      const checkInParts = b.checkIn.split("T")[0].split("-").map(Number);
      const checkOutParts = b.checkOut.split("T")[0].split("-").map(Number);
      const inD = new Date(checkInParts[0], checkInParts[1] - 1, checkInParts[2], 0, 0, 0, 0);
      const outD = new Date(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2], 0, 0, 0, 0);

      if (inD < minDate) {
        minDate = inD;
      }
      if (outD > maxDate) {
        maxDate = outD;
      }
    }
  });

  const totalDaysToShow = Math.max(
    7,
    Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
  );

  const days = Array.from(
    { length: totalDaysToShow },
    (_, i) => new Date(minDate.getTime() + i * 86400000)
  );

  const handleOpenWalkIn = (fromRoomCode = "") => {
    setFormErr("");
    const defaultRoom = fromRoomCode || "";
    const tomorrowStr = new Date(Date.now() + 86400000)
      .toISOString()
      .split("T")[0];

    setIsRoomLocked(!!fromRoomCode);

    setFormData({
      roomCode: defaultRoom,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      guestAddress: "",
      note: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      status: "checkedin",
      payStatus: "unpaid",
      payMethod: "cash",
    });
    setShowWalkInModal(true);
  };

  const validateBooking = () => {
    const { guestName, guestPhone, roomCode, checkIn, checkOut } = formData;
    if (!guestName.trim() || !guestPhone.trim()) {
      return "Vui lòng nhập đầy đủ Họ tên và Số điện thoại khách hàng.";
    }
    if (!roomCode) {
      return "Vui lòng chọn phòng trước khi đặt.";
    }
    if (!checkIn || !checkOut) {
      return "Vui lòng chọn ngày nhận và ngày trả.";
    }
    return null;
  };

  // 🟢 Lưu phòng & loại phòng dạng Relation (Truyền Record ID)
  const handleCreateWalkInBooking = async (e) => {
    e.preventDefault();
    setFormErr("");

    const errorMsg = validateBooking();
    if (errorMsg) {
      setFormErr(errorMsg);
      return;
    }

    setSaving(true);
    try {
      const room = rooms.find(
        (r) => r.code === formData.roomCode || r.id === formData.roomCode
      );
      if (!room) throw new Error("Không tìm thấy thông tin phòng đã chọn.");

      // Lấy Object loại phòng tương ứng
      const roomTypeObj =
        room.expand?.room_type_id || room.expand?.room_type || room.expand?.roomType;
      
      const roomPrice = roomTypeObj?.price ?? room.price ?? 0;

      // 🟢 LẤY ĐÚNG ID CỦA RECORD LOẠI PHÒNG (Relation ID)
      const roomTypeId = roomTypeObj?.id || room.room_type_id || room.roomType;

      const n = nights(formData.checkIn, formData.checkOut);
      const total = roomPrice * n;

      const checkInDate = new Date(formData.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      const effectiveStatus = checkInDate <= today ? "checkedin" : "pending";

      // 🟢 ĐÃ SỬA: bỏ payMethod khỏi bookings (field này đã chuyển sang collection "payments")
      const recordData = {
        code: genCode(),
        roomCode: room.id,          // Lưu Record ID của phòng (Relation)
        roomTypeName: roomTypeId,   // Lưu Record ID của loại phòng (Relation)
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestEmail:
          formData.guestEmail || `${formData.guestPhone}@homestay.local`,
        guestAddress: formData.guestAddress || "Tại quầy Lễ tân",
        note: formData.note,
        guests: Number(formData.guests) || 1,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights: n,
        roomPrice: roomPrice,
        servicesTotal: 0,
        servicesDetail: [],
        total: total,
        payStatus: formData.payStatus,
        status: effectiveStatus,
      };

      const createdBooking = await pb.collection("bookings").create(recordData);

      // 🟢 MỚI: tạo record payments tương ứng, thay cho payMethod đã xóa khỏi bookings
      await createPayment({
        booking: createdBooking.id,
        amount: total,
        method: formData.payMethod,
        status: formData.payStatus === "paid" ? "completed" : "pending",
      });

      alert("Tạo đơn đặt phòng thành công!");
      setShowWalkInModal(false);
      load();
    } catch (err) {
      setFormErr("Lỗi hệ thống: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedRoom = rooms.find(
    (r) => r.code === formData.roomCode || r.id === formData.roomCode
  );
  const roomTypeObj =
    selectedRoom?.expand?.room_type_id ||
    selectedRoom?.expand?.room_type ||
    selectedRoom?.expand?.roomType;
  const currentRoomPrice = roomTypeObj?.price ?? selectedRoom?.price ?? 0;
  const calcNights = nights(formData.checkIn, formData.checkOut);
  const calcTotal = currentRoomPrice * Math.max(0, calcNights);

  const handleDateChange = ({ checkIn, checkOut }) => {
    setFormData((prev) => ({ ...prev, checkIn, checkOut }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER RIÊNG CHO LỄ TÂN */}
      <header className="bg-primary text-primary-foreground px-5 h-14 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 font-extrabold text-lg">
          <Palmtree className="w-5 h-5 text-amber-400" />
          <span>Núi Homestay · Lễ tân</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenWalkIn("")}
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs h-8 gap-1.5 shadow"
          >
            <UserPlus className="w-4 h-4" />+ Đặt phòng trực tiếp
          </Button>

          <div className="h-6 w-[1px] bg-primary-foreground/20 mx-1"></div>

          {/* Nút Xem dạng Lưới (Grid) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("grid")}
            className={`h-9 w-9 transition-all ${
              view === "grid"
                ? "bg-white/25 text-white font-bold shadow-sm"
                : "text-white/80 hover:bg-white/15 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>

          {/* Nút Xem dạng Danh sách/Thời gian (Timeline) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView("timeline")}
            className={`h-9 w-9 transition-all ${
              view === "timeline"
                ? "bg-white/25 text-white font-bold shadow-sm"
                : "text-white/80 hover:bg-white/15 hover:text-white"
            }`}
          >
            <List className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Đăng xuất"
            className="h-9 gap-1.5 text-primary-foreground hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-semibold">Đăng xuất</span>
          </Button>
        </div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-6">
        <StatusLegend />

        {view === "grid" ? (
          <ReceptionGridView
            rooms={rooms}
            roomState={roomState}
            onSelectBooking={setSel}
            onCreateWalkIn={handleOpenWalkIn}
          />
        ) : (
          <ReceptionTimelineView
            rooms={rooms}
            days={days}
            roomBookings={roomBookings}
            onSelectBooking={setSel}
          />
        )}
      </div>

      <BookingDetailDialog
        booking={sel}
        onClose={() => setSel(null)}
        onUpdateStatus={updateStatus}
        onBookingUpdated={load}
      />

      <WalkInBookingModal
        open={showWalkInModal}
        onOpenChange={setShowWalkInModal}
        rooms={rooms}
        bookings={bookings}
        formData={formData}
        setFormData={setFormData}
        isRoomLocked={isRoomLocked}
        formErr={formErr}
        saving={saving}
        onSubmit={handleCreateWalkInBooking}
        onDateChange={handleDateChange}
        currentRoomPrice={currentRoomPrice}
        calcNights={calcNights}
        calcTotal={calcTotal}
      />
    </div>
  );
}