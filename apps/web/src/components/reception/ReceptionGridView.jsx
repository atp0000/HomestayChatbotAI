import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { fmt } from "@/lib/store";
import { STATUS_COLOR, STATUS_LABEL } from "./ReceptionConstants";

/**
 * SƠ ĐỒ PHÒNG - GRID VIEW
 *
 * Props:
 * - rooms: danh sách phòng
 * - roomState(code): trả về { s: "coming"|"staying"|"empty", b: booking|null }
 * - onSelectBooking(booking): mở popup chi tiết booking
 * - onCreateWalkIn(roomCode): mở modal tạo đặt phòng trực tiếp cho 1 phòng cụ thể
 */
export default function ReceptionGridView({
  rooms,
  roomState,
  onSelectBooking,
  onCreateWalkIn,
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {rooms.map((r) => {
        const st = roomState(r.code);

        // 🟢 Lấy dữ liệu Relation Loại phòng linh hoạt
        const roomType =
          r.expand?.room_type_id || r.expand?.room_type || r.expand?.roomType;
        const price = roomType?.price ?? r.price ?? 0;
        const typeName = roomType?.name ?? r.typeName ?? "Phòng Homestay";

        return (
          <Card
            key={r.id}
            className="overflow-hidden hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div
                className={`${
                  STATUS_COLOR[st.s].split(" hover:")[0]
                } px-3 py-2 font-bold flex justify-between items-center`}
              >
                <span>{r.code}</span>
                <span className="text-xs font-normal uppercase opacity-90">
                  {STATUS_LABEL[st.s]}
                </span>
              </div>
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">{typeName}</p>
                <p className="font-semibold mt-1 text-emerald-600">
                  {fmt(price)}/đêm
                </p>
                {st.b ? (
                  <p className="text-xs mt-2 font-bold text-primary truncate">
                    👤 {st.b.guestName}
                  </p>
                ) : (
                  <p className="text-xs mt-2 text-muted-foreground">
                    🟢 Phòng trống sẵn sàng
                  </p>
                )}
              </CardContent>
            </div>

            <div className="p-3 pt-0">
              {st.b ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectBooking(st.b)}
                  className="w-full font-bold text-xs"
                >
                  Xem chi tiết
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateWalkIn(r.code)}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border-emerald-200 gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Tạo đặt phòng
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}