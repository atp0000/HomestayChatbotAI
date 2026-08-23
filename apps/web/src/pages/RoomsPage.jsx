import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import { api, fmt, overlaps } from "@/lib/store";
import SearchBar from "@/components/common/SearchBar";
import pb from "@/lib/pocketbaseClient";

import {
  Wifi,
  Tv,
  AirVent,
  ShowerHead,
  Sparkles,
  BedDouble,
  Users,
  Refrigerator,
  Wind,
  DoorClosed,
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
  return <Sparkles className="w-3.5 h-3.5" />;
};

export default function RoomsPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [allRooms, setAllRooms] = useState([]);

  const [f, setF] = useState({
    checkIn: sp.get("checkIn") || "",
    checkOut: sp.get("checkOut") || "",
    capacity: sp.get("capacity") || sp.get("guests") || "",
  });

  useEffect(() => {
    // 1. Lấy danh sách Booking
    api.bookings().then(setBookings).catch(() => {});

    // 2. Lấy danh sách Loại phòng từ PocketBase
    pb.collection("room_types")
      .getFullList({ sort: "name" })
      .then((data) => setRoomTypes(data || []))
      .catch(() => {});

    // 3. Lấy toàn bộ danh sách phòng thực tế
    pb.collection("rooms")
      .getFullList()
      .then((data) => setAllRooms(data || []))
      .catch(() => {});
  }, []);

  // Kiểm tra 1 phòng cụ thể có bận trong khoảng thời gian checkIn - checkOut không
  const isRoomBusy = (room) => {
    if (!f.checkIn || !f.checkOut) return false;
    return bookings.some((b) => {
      const isSameRoom =
        b.roomId === room.id ||
        b.room_id === room.id ||
        b.roomCode === room.code ||
        b.roomCode === room.id ||
        b.expand?.roomCode?.id === room.id ||
        b.expand?.roomCode?.code === room.code;

      return (
        isSameRoom &&
        b.status !== "cancelled" &&
        overlaps(f.checkIn, f.checkOut, b.checkIn, b.checkOut)
      );
    });
  };

  // Tính toán số phòng khả dụng cho từng loại phòng
  const getAvailableRoomsCount = (type) => {
    const roomsInType = allRooms.filter((r) => {
      const typeId = r.room_type_id || r.roomTypeId || r.room_type || r.type;
      return typeId === type.id || typeId === type.name;
    });

    const availableRooms = roomsInType.filter((room) => !isRoomBusy(room));

    return {
      availableCount: availableRooms.length,
      totalCount: roomsInType.length,
    };
  };

  // Lọc loại phòng thỏa mãn các điều kiện
  const list = roomTypes
    .map((type) => {
      const { availableCount, totalCount } = getAvailableRoomsCount(type);
      return { ...type, availableCount, totalCount };
    })
    .filter((type) => {
      if (f.capacity) {
        const targetCapacity = Number(f.capacity);
        const roomCapacity = Number(type.capacity ?? 0);
        if (roomCapacity < targetCapacity) return false;
      }

      if (f.checkIn && f.checkOut) {
        return type.availableCount > 0;
      }

      return true;
    });

  const getImageUrl = (record) => {
    const images = Array.isArray(record.images)
      ? record.images
      : record.images
      ? [record.images]
      : [];
    if (!images.length) return "";
    return pb.files.getUrl(record, images[0]);
  };

  return (
    <SiteLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Danh Sách Loại Phòng
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Tìm kiếm không gian nghỉ dưỡng lý tưởng phù hợp với lịch trình của bạn
          </p>
        </div>

        <SearchBar
          initialValues={f}
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
                Không có loại phòng nào trống phù hợp với điều kiện tìm kiếm của bạn.
              </p>
            </div>
          )}

          {list.map((type) => {
            const roomPrice = type.price ?? 0;
            const imgUrl = getImageUrl(type);

            return (
              <Card
                key={type.id}
                className="overflow-hidden border-border/60 hover:shadow-xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12 md:h-[240px]"
              >
                {/* Khung chứa ảnh */}
                <div className="md:col-span-4 h-[240px] relative overflow-hidden bg-muted shrink-0">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={type.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                      Không có ảnh
                    </div>
                  )}
                  {type.code && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 font-mono text-xs shadow-md"
                    >
                      {type.code}
                    </Badge>
                  )}
                </div>

                {/* KHU VỰC NỘI DUNG */}
                <div className="md:col-span-8 p-5 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-2xl font-bold tracking-tight">
                          {type.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-primary" />
                            {type.capacity ? `${type.capacity} người` : "2 người"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-primary" />
                            {type.beds ? `${type.beds} giường` : "1 giường"}
                          </span>
                          
                          {/* Chỉ hiển thị số phòng còn trống khi người dùng lọc theo checkIn & checkOut */}
                          {f.checkIn && f.checkOut && (
                            <>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold gap-1 text-xs"
                              >
                                <DoorClosed className="w-3.5 h-3.5" />
                                Còn {type.availableCount} phòng trống
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-extrabold text-primary">
                          {fmt(roomPrice)}
                        </span>
                        <span className="text-xs text-muted-foreground block font-normal">
                          / Đêm
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(type.amenities || []).slice(0, 5).map((a) => (
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
                      onClick={() => {
                        const q = new URLSearchParams();
                        if (f.checkIn) q.set("checkIn", f.checkIn);
                        if (f.checkOut) q.set("checkOut", f.checkOut);
                        if (f.capacity) q.set("capacity", f.capacity);

                        const queryString = q.toString();
                        nav(`/rooms/${type.id}${queryString ? `?${queryString}` : ""}`);
                      }}
                      className="rounded-full font-semibold px-6 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Xem chi tiết
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