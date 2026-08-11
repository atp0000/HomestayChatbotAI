import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import SearchBar from "@/components/SearchBar";
import { api, fmt } from "@/lib/store";
import pb from "@/lib/pocketbaseClient";
import { ABOUT_IMAGES } from "@/assets/aboutImages";
import background from "@/assets/background.jpg";

// Lucide Icons
import {
  Wifi,
  Tv,
  Snowflake,
  Flame,
  MapPin,
  ChevronRight,
  Phone,
  Mail,
  ChevronLeft,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  useEffect(() => {
    // 1. Lấy danh sách 3 phòng nổi bật
    api
      .rooms()
      .then((r) => setRooms((r || []).slice(0, 3)))
      .catch(() => {});

    // 2. Lấy danh sách Loại phòng từ PocketBase
    pb.collection("room_types")
      .getFullList({ sort: "name" })
      .then((data) => setRoomTypes(data || []))
      .catch(() => {});
  }, []);

  // Tự động chuyển ảnh ở phần "Về chúng tôi" mỗi 4 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % ABOUT_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Hàm tạo URL ảnh chuẩn PocketBase
  const getImageUrl = (record) => {
    const images = Array.isArray(record.images)
      ? record.images
      : record.images
      ? [record.images]
      : [];
    if (!images.length)
      return "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000";
    return pb.files.getURL(record, images[0]);
  };

  const amenities = [
    { i: Wifi, t: "Wifi" },
    { i: Tv, t: "Tivi" },
    { i: Snowflake, t: "Điều hòa" },
    { i: Flame, t: "Nóng lạnh" },
  ];

  const nextImg = () =>
    setCurrentImgIdx((prev) => (prev + 1) % ABOUT_IMAGES.length);
  const prevImg = () =>
    setCurrentImgIdx(
      (prev) => (prev - 1 + ABOUT_IMAGES.length) % ABOUT_IMAGES.length
    );

  return (
    <SiteLayout>
      {/* HERO SECTION */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
  backgroundImage: `url(${background})`,
}}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-44 text-white text-center">
          <Badge
            variant="outline"
            className="text-amber-400 border-amber-400/50 bg-amber-400/10 font-bold tracking-widest uppercase mb-3 py-1 px-4 text-xs animate-fadeup"
          >
            Chào mừng đến Huế
          </Badge>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-balance animate-fadeup">
            Núi Homestay
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-200 max-w-xl mx-auto leading-relaxed animate-fadeup">
            Nghỉ dưỡng yên bình giữa thiên nhiên xanh mát, chỉ cách trung tâm cố
            đô 3,6km.
          </p>
        </div>

        {/* SEARCH BAR OVERLAP */}
        <div className="relative -mt-20 px-4 sm:px-6 pb-8 z-10">
          <SearchBar
            roomTypes={roomTypes}
            onSearch={(f) => {
              const q = new URLSearchParams();
              Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
              nav("/rooms?" + q.toString());
            }}
          />
        </div>
      </section>

      {/* PHÒNG NỔI BẬT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Phòng nổi bật
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Khám phá không gian lưu trú thoải mái và ấm cúng nhất
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => nav("/rooms")}
            className="text-primary font-semibold hover:text-primary/80 gap-1"
          >
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rooms.map((r) => {
            const typeInfo = r.expand?.room_type_id || r.expand?.room_type;
            const roomPrice = typeInfo?.price ?? r.price ?? 0;
            const roomImage = getImageUrl(r);

            return (
              <Card
                key={r.id}
                className="group overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* 🟢 SỬA THÀNH THẺ <img> CÓ RỘNG/CAO CỐ ĐỊNH TỈ LỆ */}
                  <div className="relative h-56 overflow-hidden bg-muted">
                    <img
                      src={roomImage}
                      alt={typeInfo?.name || r.code}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge
                      className="absolute top-3 right-3 font-mono shadow-md"
                      variant="secondary"
                    >
                      #{r.code}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold flex justify-between items-center">
                      {typeInfo?.name || "Chưa phân loại"}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {r.beds || "Giường đôi"} · Phù hợp cho khách
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-primary">
                      {fmt(roomPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      / đêm
                    </span>
                  </div>

                  <Button
                    onClick={() => nav("/rooms/" + r.id)}
                    className="w-full font-semibold rounded-full"
                  >
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CÁC TIỆN NGHI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-extrabold">Các tiện nghi</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Trải nghiệm trọn vẹn với các tiện ích hiện đại
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenities.map((a) => (
            <Card
              key={a.t}
              className="border-border/60 hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <a.i className="w-8 h-8" />
                </div>
                <span className="font-semibold text-sm">{a.t}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* VỀ CHÚNG TÔI */}
      <section
        id="gioi-thieu"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center"
      >
        <div className="relative group h-80 rounded-2xl overflow-hidden shadow-lg border border-border/40">
          <img
            src={ABOUT_IMAGES[currentImgIdx]}
            alt="Về chúng tôi"
            className="w-full h-full object-cover transition-all duration-700 ease-in-out"
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={prevImg}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={nextImg}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {ABOUT_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImgIdx(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentImgIdx ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Giới thiệu
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Về chúng tôi
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            Núi Homestay là điểm dừng chân lý tưởng cho những ai yêu thích sự
            yên tĩnh và gần gũi thiên nhiên. Với hệ thống phòng đầy đủ tiện
            nghi, dịch vụ chu đáo và vị trí thuận tiện, chúng tôi cam kết mang
            đến cho bạn kỳ nghỉ trọn vẹn tại Huế.
          </p>
          <div className="flex items-center gap-2 text-primary font-medium text-sm pt-2">
            <MapPin className="w-5 h-5 shrink-0" />
            <span>Cách trung tâm TP. Huế 3,6km</span>
          </div>
        </div>
      </section>

      {/* LIÊN HỆ */}
      <section id="lien-he" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Card className="border-border/60 overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="bg-primary/5 p-8 flex flex-col justify-center space-y-4 md:col-span-1">
              <div>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30 mb-2"
                >
                  Liên hệ
                </Badge>
                <h2 className="font-display text-2xl font-extrabold">
                  Núi Homestay
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Hãy liên hệ với chúng tôi nếu bạn cần tư vấn hoặc hỗ trợ đặt
                  phòng.
                </p>
              </div>

              <div className="space-y-3 text-sm pt-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>035 356 600</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>Nuihomstay@gmail.com</span>
                </div>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span> 2 Ngự Bình, An Cụ, Thành phố Huế</span>
                </div>
              </div>
            </div>

            <div className="h-64 md:h-auto min-h-[250px] md:col-span-2 relative bg-muted">
              <iframe
                title="Google Maps Nui Homestay"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3826.438763543748!2d107.59792107460758!3d16.453306129042545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3141a16a340ff1fb%3A0xb694d9c639f5f39f!2zMiBOZ-G7sSBCw6xuaCwgdOG7lSA2LCBBbiBD4buxdSwgSHXhur8sIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1786464347463!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-cross-origin"
                className="w-full h-full"
              />
            </div>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}