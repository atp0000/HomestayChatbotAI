import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { api, fmt, overlaps } from "@/lib/store";
import SearchBar from "@/components/SearchBar";
import pb from "@/lib/pocketbaseClient";

import {
  Wifi,
  Tv,
  AirVent,
  ShowerHead,
  Coffee,
  Sparkles,
  BedDouble,
  Maximize,
  Refrigerator,
  Wind,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getAmenityIcon = (name = "") => {
  const lower = name.toLowerCase();
  if (lower.includes("wifi") || lower.includes("mạng") || lower.includes("internet")) {
    return <Wifi className="w-3.5 h-3.5" />;
  }
  if (lower.includes("tivi") || lower.includes("tv")) {
    return <Tv className="w-3.5 h-3.5" />;
  }
  if (lower.includes("điều hòa") || lower.includes("máy lạnh") || lower.includes("ac")) {
    return <AirVent className="w-3.5 h-3.5" />;
  }
  if (lower.includes("nóng lạnh") || lower.includes("vòi sen") || lower.includes("tắm")) {
    return <ShowerHead className="w-3.5 h-3.5" />;
  }
  if (lower.includes("tủ lạnh") || lower.includes("minibar")) {
    return <Refrigerator className="w-3.5 h-3.5" />;
  }
  if (lower.includes("máy sấy") || lower.includes("quạt")) {
    return <Wind className="w-3.5 h-3.5" />;
  }
  if (lower.includes("cà phê") || lower.includes("trà") || lower.includes("ăn sáng")) {
    return <Coffee className="w-3.5 h-3.5" />;
  }
  return <Sparkles className="w-3.5 h-3.5" />;
};

export default function RoomsPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [f, setF] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    capacity: sp.get("capacity") || sp.get("guests") || "",
    type: sp.get("type") || "",
  });

  useEffect(() => {
    api.rooms().then(setRooms).catch(() => {});
    api.bookings().then(setBookings).catch(() => {});

    pb.collection("room_types")
      .getFullList({ sort: "name" })
      .then((data) => setRoomTypes(data || []))
      .catch(() => {});
  }, []);

  const roomBusy = (code) => {
    if (!f.checkIn || !f.checkOut) return false;
    return bookings.some(
      (b) =>
        b.roomCode === code &&
        b.status !== "cancelled" &&
        overlaps(f.checkIn, f.checkOut, b.checkIn, b.checkOut)
    );
  };

  // 🟢 ĐÃ THÊM LOGIC LỌC THEO SỨC CHỨA
 const list = rooms
    .filter((r) => r.status === "active")
    .filter((r) => {
      // 1. Lọc theo Loại phòng
      if (!f.type || f.type === "all") return true;

      // Lấy tên loại phòng từ quan hệ expand
      const roomTypeObj = r.expand?.room_type_id || r.expand?.room_type;
      const typeName = roomTypeObj?.name || r.typeName;

      return typeName === f.type;
    })
    .filter((r) => {
      // 2. Lọc theo Sức chứa
      if (!f.capacity) return true;
      const targetCapacity = Number(f.capacity);

      // Lấy capacity trực tiếp từ room (hoặc fallback từ room_type nếu r.capacity trống)
      const roomCapacity = Number(
        r.capacity ?? r.expand?.room_type_id?.capacity ?? 0
      );

      return roomCapacity >= targetCapacity;
    })
    .filter((r) => !roomBusy(r.code));
  // Hàm phụ trợ lấy URL ảnh PocketBase chuẩn
  const getImageUrl = (record) => {
    const images = Array.isArray(record.images) ? record.images : record.images ? [record.images] : [];
    if (!images.length) return "";
    return pb.files.getUrl(record, images[0]);
  };

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Danh Sách Phòng
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Tìm kiếm không gian nghỉ dưỡng lý tưởng phù hợp với lịch trình của bạn
          </p>
        </div>

        <SearchBar
          initialValues={f}
          roomTypes={roomTypes}
          onSearch={(newFilters) => {
            setF(newFilters);
            const q = new URLSearchParams();
            Object.entries(newFilters).forEach(([k, v]) => v && q.set(k, v));
            setSp(q);
          }}
        />

        <div className="space-y-6">
          {list.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border/80">
              <p className="text-muted-foreground font-medium">
                Không có phòng nào phù hợp với điều kiện tìm kiếm của bạn.
              </p>
            </div>
          )}

          {list.map((r) => {
            const roomType = r.expand?.room_type_id || r.expand?.room_type;
            const roomPrice = roomType?.price ?? r.price ?? 0;
            const imgUrl = getImageUrl(r);

            return (
              <Card
                key={r.id}
                className="overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12 md:h-[240px]"
              >
                {/* Khung chứa ảnh */}
                <div className="md:col-span-4 h-[240px] relative overflow-hidden bg-muted shrink-0">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={r.typeName || r.code}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                      Không có ảnh
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 font-mono text-xs shadow-md"
                  >
                    #{r.code}
                  </Badge>
                </div>

                {/* KHU VỰC NỘI DUNG */}
                <div className="md:col-span-8 p-5 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-2xl font-bold tracking-tight">
                          {r.typeName || roomType?.name || `Phòng ${r.code}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                          {r.area && (
                            <span className="flex items-center gap-1.5">
                              <Maximize className="w-4 h-4 text-primary" /> {r.area}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-primary" /> {r.beds || "1 phòng ngủ"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-extrabold text-primary">
                          {fmt(roomPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground block font-normal">
                          / đêm
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(r.amenities || []).slice(0, 5).map((a) => (
                        <Badge
                          key={a}
                          variant="outline"
                          className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-medium text-xs py-1 px-2.5"
                        >
                          {getAmenityIcon(a)}
                          <span>{a}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border/40 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => nav("/rooms/" + r.id)}
                      className="rounded-full font-semibold px-6"
                    >
                      Xem chi tiết
                    </Button>
                    <Button
                      onClick={() => nav(`/rooms/${r.id}?book=1&${sp.toString()}`)}
                      className="rounded-full font-semibold px-6 shadow-sm"
                    >
                      Đặt phòng ngay
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}