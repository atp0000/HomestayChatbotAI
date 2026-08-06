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
    pb.collection("rooms")
      .getOne(id, { expand: "room_type_id,room_type" })
      .then((r) => {
        setRoom(r);
        // Lấy tên loại phòng từ expand
        const roomTypeObj = r.expand?.room_type_id || r.expand?.room_type;
        const roomTypeName = roomTypeObj?.name || r.typeName || "";
        setB((s) => ({ ...s, type: roomTypeName }));
      })
      .catch(() => {});

    api.bookings().then(setBookings).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (room) {
      api.reviews(room.code).then(setReviews).catch(() => {});
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

  // 1. Lấy object room_type từ relation expand
  const roomType = room.expand?.room_type_id || room.expand?.room_type;
  // 2. Lấy tên loại phòng
  const roomTypeName = roomType?.name || "Chưa phân loại";
  // 3. Lấy giá phòng
  const roomPrice = roomType?.price ?? 0;

  // Kiểm tra phòng có bị trùng lịch trong khoảng ngày được chọn hay không
  const busy =
    b.checkIn &&
    b.checkOut &&
    bookings.some(
      (x) =>
        x.roomCode === room.code &&
        x.status !== "cancelled" &&
        overlaps(b.checkIn, b.checkOut, x.checkIn, x.checkOut)
    );

  const proceed = () => {
    setErr("");
    if (!b.checkIn || !b.checkOut) {
      return setErr("Vui lòng chọn ngày nhận và ngày trả.");
    }
    if (new Date(b.checkOut) <= new Date(b.checkIn)) {
      return setErr("Ngày trả phải sau ngày nhận.");
    }
    if (busy) {
      return setErr("Phòng đã có người đặt trong khoảng thời gian này.");
    }
    nav("/booking", { state: { room, ...b } });
  };

  const images = room.images || [];

  return (
    <SiteLayout>
      {/* KHU VỰC BÌA & GALLERY ẢNH */}
      <div className="bg-muted/40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="relative h-[360px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm">
            <div
              className="w-full h-full bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${images[activeImgIdx] || images[0]})` }}
            />
            <Badge className="absolute top-4 left-4 font-mono text-sm shadow-md" variant="secondary">
              #{room.code}
            </Badge>
          </div>

          {/* Danh sách ảnh thu nhỏ */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
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
                    src={img}
                    alt={`${roomTypeName} ${idx}`}
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
              <span className="text-3xl font-extrabold text-primary">{fmt(roomPrice)}</span>
              <span className="text-sm text-muted-foreground">/ đêm</span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">
              {roomTypeName} · {room.code}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border">
                <BedDouble className="w-4 h-4 text-primary" /> {room.beds}
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
              {(room.amenities || []).map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2.5 p-3 rounded-xl border bg-card text-sm font-medium shadow-2xl shadow-black/5"
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
              {(room.rules || []).map((a) => (
                <div
                  key={a}
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
              <MessageSquare className="w-5 h-5" /> Đánh giá từ khách hàng ({reviews.length})
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
                        <span className="font-semibold text-primary">Núi Homestay:</span>{" "}
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
              {/* Component chọn ngày Checkin - Checkout */}
              <DateRangePicker
                checkIn={b.checkIn}
                checkOut={b.checkOut}
                onChange={({ checkIn, checkOut }) => setB({ ...b, checkIn, checkOut })}
              />

              {/* Loại phòng (Readonly) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Loại phòng
                </Label>
                <Input value={b.type} readOnly className="bg-muted/50 font-medium" />
              </div>

              {/* Số người */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Số lượng khách
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={b.guests}
                  onChange={(e) => setB({ ...b, guests: e.target.value })}
                  className="bg-background"
                />
              </div>

              {/* Component tự kiểm tra và hiển thị cảnh báo trùng lịch / lỗi */}
              <BookingAvailabilityAlert
                checkIn={b.checkIn}
                checkOut={b.checkOut}
                roomCode={room.code}
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