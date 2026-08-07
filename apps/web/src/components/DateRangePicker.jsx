import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, CalendarX } from "lucide-react";

// Lấy ngày hôm nay (YYYY-MM-DD) để làm minDate mặc định
const getTodayString = () => new Date().toISOString().split("T")[0];

export default function DateRangePicker({ checkIn, checkOut, onChange, className = "" }) {
  const today = getTodayString();

  // 1. Khi đổi Ngày Nhận
  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    // Nếu Ngày Trả hiện tại <= Ngày Nhận mới -> Tự động xoá Ngày Trả
    if (checkOut && checkOut <= newCheckIn) {
      onChange({ checkIn: newCheckIn, checkOut: "" });
    } else {
      onChange({ checkIn: newCheckIn, checkOut });
    }
  };

  // 2. Khi đổi Ngày Trả
  const handleCheckOutChange = (e) => {
    onChange({ checkIn, checkOut: e.target.value });
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Ô NGÀY NHẬN */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4 text-primary" /> Ngày nhận
        </Label>
        <Input
          type="date"
          min={today}
          value={checkIn}
          onChange={handleCheckInChange}
          className="bg-background"
        />
      </div>

      {/* Ô NGÀY TRẢ */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <CalendarX className="w-4 h-4 text-primary" /> Ngày trả
        </Label>
        <Input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={handleCheckOutChange}
          className="bg-background"
        />
      </div>
    </div>
  );
}