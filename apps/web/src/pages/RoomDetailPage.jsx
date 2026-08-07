import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { api, fmt, overlaps } from "@/lib/store";

// Components đã tái sử dụng
import DateRangePicker from "@/components/DateRangePicker";
import BookingAvailabilityAlert from "@/components/BookingAvailabilityAlert";

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

export default function RoomDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const [b, setB] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    guests: sp.get("guests") || 2,
    type: "",
  });

  useEffect(() => {
    // Expand relation room_type_id / room_type / roomType
    pb.collection("rooms")
      .getOne(id, { expand: "room_type_id,room_type,roomType" })
      .then((r) => {
        setRoom(r);
        const roomTypeObj =
          r.expand?.room_type_id || r.expand?.room_type || r.expand?.roomType;
        const roomTypeName = roomTypeObj?.name || r.typeName || "";
        setB((s) => ({ ...s, type: roomTypeName }));
      })
      .catch(() => {});

    api.bookings().then(setBookings).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (room) {
      api.reviews(room.id || room.code).then(setReviews).catch(() => {});
    }
  }, [room]);

  if (!room) {
    return (
      <SiteLayout>
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin phòng...</span>
        </div>
      </SiteLayout>
    );
  }

  const roomType =
    room.expand?.room_type_id || room.expand?.room_type || room.expand?.roomType;
  const roomTypeName = roomType?.name || "Chưa phân loại";
  const roomPrice = roomType?.price ?? room.price ?? 0;

  // 🟢 LẤY SỨC CHỨA TỐI ĐA (MẶC ĐỊNH LÀ 2 NẾU TRONG DB CHƯA ĐỊNH NGHĨA)
  const maxCapacity = Number(
    room.maxGuests || room.capacity || roomType?.maxGuests || roomType?.capacity || 2
  );

  // 🟢 BẢO VỆ CHUYỂN ĐỔI DỮ LIỆU SANG MẢNG CHO AMENITIES VÀ RULES
  const safeAmenities = Array.isArray(room.amenities)
    ? room.amenities
    : typeof room.amenities === "string"
    ? room.amenities.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const safeRules = Array.isArray(room.rules)
    ? room.rules
    : typeof room.rules === "string"
    ? room.rules.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Kiểm tra trùng lịch trực tiếp để hỗ trợ nút bấm
  const busy =
    b.checkIn &&
    b.checkOut &&
    bookings.some((x) => {
      const bookingRoomCode = x.expand?.roomCode?.code || x.roomCode;
      const bookingRoomId = x.expand?.roomCode?.id || x.roomCode;

      const isSameRoom =
        bookingRoomCode === room.code ||
        bookingRoomId === room.id ||
        x.roomCode === room.code ||
        x.roomCode === room.id;

      return (
        isSameRoom &&
        x.status !== "cancelled" &&
        overlaps(b.checkIn, b.checkOut, x.checkIn, x.checkOut)
      );
    });

  const proceed = () => {
    setErr("");
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
    // 🟢 VALIDATE SỐ LƯỢNG KHÁCH TRƯỚC KHI ĐẶT
    if (numGuests > maxCapacity) {
      return setErr(`Phòng này chỉ chứa tối đa ${maxCapacity} khách.`);
    }
    if (busy) {
      return setErr("Phòng đã có người đặt trong khoảng thời gian này.");
    }

    nav("/booking", {
      state: {
        room,
        roomId: room.id,
        roomTypeId: roomType?.id || room.room_type_id,
        ...b,
        guests: numGuests,
      },
    });
  };

  const getImageUrl = (filename) => {
    if (!filename) return "";
    return pb.files.getURL(room, filename);
  };

  const rawImages = Array.isArray(room.images)
    ? room.images
    : room.images
    ? [room.images]
    : [];
  const imageUrls = rawImages.map((img) => getImageUrl(img)).filter(Boolean);

  return (
    <SiteLayout>
      {/* KHU VỰC BÌA & GALLERY ẢNH */}
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
              <span className="text-muted-foreground text-sm">
                Chưa có ảnh hiển thị
              </span>
            )}
            <Badge
              className="absolute top-4 left-4 font-mono text-sm shadow-md"
              variant="secondary"
            >
              #{room.code}
            </Badge>
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

      {/* NỘI DUNG CHI TIẾT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: THÔNG TIN PHÒNG */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">
                {fmt(roomPrice)}
              </span>
              <span className="text-sm text-muted-foreground">/ đêm</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">
              {roomTypeName} · {room.code}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <BedDouble className="w-4 h-4 text-primary" />{" "}
                {room.beds || "1 giường lớn"}
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <Users className="w-4 h-4 text-primary" /> Tối đa {maxCapacity} khách
              </span>
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <Building2 className="w-4 h-4 text-primary" /> Phòng tắm riêng
              </span>
              {room.area && (
                <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                  <Maximize2 className="w-4 h-4 text-primary" /> {room.area}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground text-sm md:text-base border-t pt-6">
              {room.description}
            </p>
          </div>

          {/* CÁC TIỆN ÍCH */}
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

          {/* QUY ĐỊNH PHÒNG */}
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

          {/* ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
          <div>
            <h3 className="font-display text-xl font-bold text-primary flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" /> Đánh giá từ khách hàng (
              {reviews.length})
            </h3>

            <div className="space-y-4">
              {reviews.length === 0 && (
                <p className="text-muted-foreground italic text-sm py-4">
                  Chưa có đánh giá nào cho phòng này!
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
                        <span className="font-semibold text-primary">
                          Homestay:
                        </span>{" "}
                        <span className="text-muted-foreground">{rv.reply}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG ĐẶT PHÒNG (STICKY) */}
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
                <Input
                  value={b.type}
                  readOnly
                  className="bg-muted/50 font-medium"
                />
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
                {/* 🟢 GIỚI HẠN INPUT VỚI MAX */}
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

              {/* TỰ ĐỘNG HIỂN THỊ CẢNH BÁO */}
              <BookingAvailabilityAlert
                checkIn={b.checkIn}
                checkOut={b.checkOut}
                roomCode={room.id || room.code}
                bookings={bookings}
                customError={err}
              />
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                onClick={proceed}
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