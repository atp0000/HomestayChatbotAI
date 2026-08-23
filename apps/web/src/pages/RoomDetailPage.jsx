import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { api, fmt, overlaps } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import DateRangePicker from "@/components/common/DateRangePicker";

// Lucide Icons
import {
  CheckCircle2,
  Star,
  Ban,
  Users,
  Building2,
  BedDouble,
  Maximize2,
  MessageSquare,
  ShieldAlert,
  DoorClosed,
  AlertCircle,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RoomDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { isAuthed } = useAuth();

  const [roomType, setRoomType] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // 1. Tải dữ liệu từ URL Query String
  const [b, setB] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    guests: sp.get("guests") || sp.get("capacity") || 2,
    type: "",
  });

  useEffect(() => {
    setB((prev) => ({
      ...prev,
      checkIn: sp.get("checkIn") || prev.checkIn || "",
      checkOut: sp.get("checkOut") || prev.checkOut || "",
      guests: sp.get("guests") || sp.get("capacity") || prev.guests || 2,
    }));
  }, [sp]);

  useEffect(() => {
    // Tải thông tin loại phòng
    pb.collection("room_types")
      .getOne(id)
      .then((type) => {
        setRoomType(type);
        setB((s) => ({ ...s, type: type.name || "" }));
      })
      .catch(() => {});

    // Tải toàn bộ phòng vật lý
    pb.collection("rooms")
      .getFullList()
      .then((data) => setAllRooms(data || []))
      .catch(() => setAllRooms([]));

    // Tải tất cả đơn đặt phòng
    api.bookings().then(setBookings).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (roomType?.id) {
      api.reviews(roomType.id).then(setReviews).catch(() => {});
    }
  }, [roomType]);

  if (!roomType) {
    return (
      <SiteLayout>
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin loại phòng...</span>
        </div>
      </SiteLayout>
    );
  }

  // --- LOGIC KIỂM TRA PHÒNG BẬN ---
  const isRoomBusy = (room) => {
    if (!b.checkIn || !b.checkOut) return false;
    return bookings.some((bk) => {
      const isSameRoom =
        bk.roomId === room.id ||
        bk.room_id === room.id ||
        bk.roomCode === room.code ||
        bk.roomCode === room.id ||
        bk.expand?.roomCode?.id === room.id ||
        bk.expand?.roomCode?.code === room.code;

      return (
        isSameRoom &&
        bk.status !== "cancelled" &&
        overlaps(b.checkIn, b.checkOut, bk.checkIn, bk.checkOut)
      );
    });
  };

  // Lọc lấy các phòng vật lý thuộc loại phòng hiện tại và đang RẢNH
  const getAvailableRooms = () => {
    const roomsInType = allRooms.filter((r) => {
      const typeId = r.room_type_id || r.roomTypeId || r.room_type || r.type;
      return typeId === roomType.id || typeId === roomType.name;
    });

    if (!b.checkIn || !b.checkOut) return roomsInType;

    return roomsInType.filter((room) => !isRoomBusy(room));
  };

  const availableRooms = getAvailableRooms();
  const availableCount = availableRooms.length;
  const isBusy = b.checkIn && b.checkOut && availableCount === 0;

  const roomTypeName = roomType.name || "Chưa phân loại";
  const roomPrice = roomType.price ?? 0;
  const maxCapacity = Number(roomType.capacity || roomType.maxGuests || 2);

  const safeAmenities = Array.isArray(roomType.amenities)
    ? roomType.amenities
    : typeof roomType.amenities === "string"
    ? roomType.amenities.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const safeRules = Array.isArray(roomType.rules)
    ? roomType.rules
    : typeof roomType.rules === "string"
    ? roomType.rules.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const proceed = () => {
    setErr("");

    if (!isAuthed) {
      return setErr("Bạn vui lòng đăng nhập tài khoản để tiến hành đặt phòng.");
    }

    const numGuests = Number(b.guests);

    if (!b.checkIn || !b.checkOut) {
      return setErr("Vui lòng chọn ngày nhận và ngày trả.");
    }
    if (new Date(b.checkOut) <= new Date(b.checkIn)) {
      return setErr("Ngày trả phải sau ngày nhận.");
    }
    if (numGuests < 1) {
      return setErr("Số lượng khách phải lớn hơn 0.");
    }
    if (numGuests > maxCapacity) {
      return setErr(`Loại phòng này chỉ chứa tối đa ${maxCapacity} khách.`);
    }

    if (availableRooms.length === 0) {
      return setErr("Tất cả các phòng thuộc loại này đã được đặt kín trong khoảng thời gian trên.");
    }

    const randomIndex = Math.floor(Math.random() * availableRooms.length);
    const selectedRoom = availableRooms[randomIndex];

    const roomWithExpand = {
      ...selectedRoom,
      expand: {
        ...(selectedRoom.expand || {}),
        room_type_id: roomType,
      },
    };

    nav("/booking", {
      state: {
        room: roomWithExpand,
        roomType,
        roomTypeId: roomType.id,
        ...b,
        guests: numGuests,
      },
    });
  };

  const getImageUrl = (filename) => {
    if (!filename) return "";
    return pb.files.getUrl(roomType, filename);
  };

  const rawImages = Array.isArray(roomType.images)
    ? roomType.images
    : roomType.images
    ? [roomType.images]
    : [];
  const imageUrls = rawImages.map((img) => getImageUrl(img)).filter(Boolean);

  return (
    <SiteLayout>
      {/* BÌA & GALLERY ẢNH */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="relative h-[360px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm bg-muted flex items-center justify-center">
            {imageUrls.length > 0 ? (
              <img
                src={imageUrls[activeImgIdx] || imageUrls[0]}
                alt={roomTypeName}
                className="w-full h-full object-cover transition-all duration-500"
              />
            ) : (
              <span className="text-muted-foreground text-sm">Chưa có ảnh hiển thị</span>
            )}
            {roomType.code && (
              <Badge
                className="absolute top-4 left-4 font-mono text-sm shadow-md"
                variant="secondary"
              >
                #{roomType.code}
              </Badge>
            )}
          </div>

          {imageUrls.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImgIdx
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`${roomTypeName} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHI TIẾT VÀ KHUNG ĐẶT PHÒNG */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">
                {fmt(roomPrice)}
              </span>
              <span className="text-sm text-muted-foreground">/ Đêm</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">
              {roomTypeName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <BedDouble className="w-4 h-4 text-primary" />{" "}
                {roomType.beds ? `${roomType.beds} giường` : "1 giường"}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <Users className="w-4 h-4 text-primary" /> Tối đa {maxCapacity} khách
              </span>
              {roomType.area && (
                <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                  <Maximize2 className="w-4 h-4 text-primary" /> {roomType.area}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground text-sm md:text-base border-t pt-6">
              {roomType.description || "Chưa có mô tả cho loại phòng này."}
            </p>
          </div>

          {/* TIỆN ÍCH */}
          {safeAmenities.length > 0 && (
            <div>
              <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5" /> Tiện ích đi kèm
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {safeAmenities.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl border bg-card text-sm font-medium shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUY ĐỊNH PHÒNG */}
          {safeRules.length > 0 && (
            <div>
              <h3 className="font-display text-xl font-bold text-destructive flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5" /> Quy định lưu trú
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {safeRules.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm font-medium text-destructive"
                  >
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ĐÁNH GIÁ */}
          <div>
            <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" /> Đánh giá từ khách hàng ({reviews.length})
            </h3>
            <div className="space-y-4">
              {reviews.length === 0 && (
                <p className="text-muted-foreground italic text-sm py-4">
                  Chưa có đánh giá nào cho loại phòng này!
                </p>
              )}
              {reviews.map((rv) => (
                <Card key={rv.id} className="border-border/60">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{rv.author}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rv.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90">{rv.comment}</p>
                    {rv.reply && (
                      <div className="mt-3 pl-3 border-l-2 border-primary bg-primary/5 p-2 rounded-r-lg text-xs md:text-sm">
                        <span className="font-semibold text-primary">Homestay: </span>
                        <span className="text-muted-foreground">{rv.reply}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* KHUNG ĐẶT PHÒNG STICKY */}
        <div>
          <Card className="sticky top-20 shadow-lg border-primary/20 bg-card">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-xl text-center">Đặt phòng này</CardTitle>
              <CardDescription className="text-center text-xs">
                Chọn khoảng thời gian dự định lưu trú của bạn
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <DateRangePicker
                checkIn={b.checkIn}
                checkOut={b.checkOut}
                onChange={({ checkIn, checkOut }) => {
                  setErr("");
                  setB({ ...b, checkIn, checkOut });
                }}
              />

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Loại phòng
                </Label>
                <Input value={b.type} readOnly className="bg-muted/50 font-medium" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> Số lượng khách
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Tối đa: {maxCapacity} khách
                  </span>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={maxCapacity}
                  value={b.guests}
                  onChange={(e) => {
                    setErr("");
                    let val = Number(e.target.value);
                    if (val > maxCapacity) val = maxCapacity;
                    setB({ ...b, guests: val });
                  }}
                  className="bg-background"
                />
              </div>

              {/* Thông báo tình trạng phòng trống */}
              {/* Thông báo tình trạng phòng trống */}
{b.checkIn && b.checkOut && (
  <div className="pt-2">
    {isBusy ? (
      <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Đã hết phòng trong khoảng thời gian này.</span>
      </div>
    ) : (
      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-xs font-medium flex items-center gap-2">
        <DoorClosed className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Còn <strong>{availableCount}</strong> phòng trống khả dụng.
        </span>
      </div>
    )}
  </div>
)}


              {/* Thông báo lỗi khi người dùng bấm Đặt phòng (chưa chọn ngày, quá số khách...) */}
              {err && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs">{err}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={proceed}
                disabled={isBusy}
                className="w-full font-semibold py-6 text-base rounded-xl shadow-md"
                size="lg"
              >
                Tiến hành đặt phòng
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}