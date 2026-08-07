import React from "react";
import { Card } from "@/components/ui/card";

const getCleanDate = (dateVal) => {
  const d = new Date(dateVal);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function ReceptionTimelineView({
  rooms,
  days,
  roomBookings,
  onSelectBooking,
}) {
  const totalDays = days.length;
  const startTimelineDate = getCleanDate(days[0]);

  return (
    <Card className="overflow-x-auto">
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
          {rooms.map((r) => (
            <React.Fragment key={r.id}>
              <div className="p-3 font-semibold border-t border-border flex items-center">
                {r.code}
              </div>
              <div
                className="border-t border-l border-border relative h-12 bg-background/50"
                style={{ gridColumn: `span ${totalDays}` }}
              >
                {roomBookings(r.code).map((b) => {
                  const checkInDate = getCleanDate(b.checkIn);
                  const checkOutDate = getCleanDate(b.checkOut);

                  // Số đêm khách ở thực tế
                  const nightCount = Math.max(
                    1,
                    Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
                  );

                  // Tính vị trí bắt đầu theo ngày check-in
                  const dayOffsetIn = Math.round(
                    (checkInDate - startTimelineDate) / (1000 * 60 * 60 * 24)
                  );

                  // Vị trí kết thúc = ngày checkin + số đêm
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
          ))}
        </div>
      </div>
    </Card>
  );
}