import React, { useState } from "react";
import { Card } from "@/components/ui/card";

const getCleanDate = (dateVal) => {
  const d = new Date(dateVal);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateStr = (d) => {
  const dateObj = new Date(d);
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // Trả về dạng chuẩn YYYY-MM-DD
};

export default function ReceptionTimelineView({
  rooms,
  days,
  roomBookings,
  onSelectBooking,
  onCreateWalkIn,
}) {
  const totalDays = days.length;
  const startTimelineDate = getCleanDate(days[0]);

  // State lưu vết khi giữ và kéo chuột
  const [dragState, setDragState] = useState(null); // { roomCode, startIndex, currentIndex }

  // Khi nhấn chuột xuống một ngày trống
  const handleMouseDown = (roomCode, dayIdx) => {
    setDragState({ roomCode, startIndex: dayIdx, currentIndex: dayIdx });
  };

  // Khi di chuột qua các ngày tiếp theo trong lúc đè chuột
  const handleMouseEnter = (roomCode, dayIdx) => {
    if (dragState && dragState.roomCode === roomCode) {
      setDragState((prev) => ({ ...prev, currentIndex: dayIdx }));
    }
  };

  // Khi nhả chuột ra -> Tính ngày Check-in/Check-out và mở Modal
  const handleMouseUp = () => {
    if (!dragState) return;

    const { roomCode, startIndex, currentIndex } = dragState;
    const startIdx = Math.min(startIndex, currentIndex);
    const endIdx = Math.max(startIndex, currentIndex);

    const checkInDate = new Date(days[startIdx]);
    const checkOutDate = new Date(days[endIdx]);

    // Nếu nhấp vào 1 ngày duy nhất -> Check-out là ngày hôm sau
    if (startIdx === endIdx) {
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }

    const checkInStr = formatDateStr(checkInDate);
    const checkOutStr = formatDateStr(checkOutDate);

    if (onCreateWalkIn) {
      onCreateWalkIn(roomCode, checkInStr, checkOutStr);
    }

    setDragState(null);
  };

  return (
    <Card className="overflow-x-auto select-none" onMouseUp={handleMouseUp}>
      <div className="min-w-[760px]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `100px repeat(${totalDays}, 1fr)` }}
        >
          {/* Header Ngày */}
          <div className="p-3 font-semibold bg-secondary border-b border-border">
            Phòng
          </div>
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="p-3 text-center text-sm font-medium bg-secondary border-l border-b border-border"
            >
              {d.getDate()}/{d.getMonth() + 1}
            </div>
          ))}

          {/* Danh sách phòng */}
          {rooms.map((r) => {
            const currentRoomCode = r.code || r.id;

            return (
              <React.Fragment key={r.id}>
                {/* Tên phòng */}
                <div className="p-3 font-semibold border-t border-border flex items-center">
                  {r.code}
                </div>

                {/* Khung ô ngày của phòng */}
                <div
                  className="border-t border-l border-border relative h-12 bg-background/50 grid"
                  style={{
                    gridColumn: `span ${totalDays}`,
                    gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
                  }}
                >
                  {/* Ô ngày tương tác kéo chọn */}
                  {days.map((d, dayIdx) => {
                    const isSelected =
                      dragState &&
                      dragState.roomCode === currentRoomCode &&
                      dayIdx >= Math.min(dragState.startIndex, dragState.currentIndex) &&
                      dayIdx <= Math.max(dragState.startIndex, dragState.currentIndex);

                    return (
                      <div
                        key={d.toISOString()}
                        onMouseDown={() => handleMouseDown(currentRoomCode, dayIdx)}
                        onMouseEnter={() => handleMouseEnter(currentRoomCode, dayIdx)}
                        className={`border-r border-border h-full transition-colors ${
                          isSelected ? "bg-amber-200/60 dark:bg-amber-900/40" : ""
                        }`}
                      />
                    );
                  })}

                  {/* Render danh sách đơn đặt cắm đè lên Timeline */}
                  {roomBookings(currentRoomCode).map((b) => {
                    const checkInDate = getCleanDate(b.checkIn);
                    const checkOutDate = getCleanDate(b.checkOut);

                    const nightCount = Math.max(
                      1,
                      Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
                    );

                    const dayOffsetIn = Math.round(
                      (checkInDate - startTimelineDate) / (1000 * 60 * 60 * 24)
                    );
                    const dayOffsetOut = dayOffsetIn + nightCount;

                    if (dayOffsetOut <= 0 || dayOffsetIn >= totalDays) return null;

                    const startCol = Math.max(0, dayOffsetIn);
                    const endCol = Math.min(totalDays, dayOffsetOut);
                    const durationCols = endCol - startCol;

                    const leftPercent = (startCol / totalDays) * 100;
                    const widthPercent = (durationCols / totalDays) * 100;

                    const isStaying = b.status === "checkedin";
                    const bgBtn = isStaying
                      ? "bg-amber-400 text-black hover:bg-amber-500"
                      : "bg-rose-500 text-white hover:bg-rose-600";

                    return (
                      <button
                        key={b.id}
                        onMouseDown={(e) => e.stopPropagation()} // Ngăn kích hoạt kéo chọn khi bấm vào booking
                        onClick={() => onSelectBooking(b)}
                        className={`absolute top-1 bottom-1 text-xs rounded-md px-2 font-medium truncate shadow-sm transition flex items-center justify-between ${bgBtn}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          zIndex: 10,
                        }}
                      >
                        <span className="truncate">
                          {b.code} · {b.guestName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
}