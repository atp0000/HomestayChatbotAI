import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { overlaps } from "@/lib/store";

export default function BookingAvailabilityAlert({
  checkIn,
  checkOut,
  roomCode,
  bookings = [],
  customError = "",
}) {
  // Logic kiểm tra trùng lịch đặt phòng (Hỗ trợ cả ID relation & String code)
  const isBusy =
    checkIn &&
    checkOut &&
    roomCode &&
    bookings.some((b) => {
      // Bỏ qua đơn đã hủy
      if (b.status === "cancelled") return false;

      // Kiểm tra khớp phòng (ID hoặc Code)
      const bRoomId = b.roomCode;
      const bRoomCode = b.expand?.roomCode?.code;

      const isSameRoom =
        bRoomId === roomCode ||
        bRoomCode === roomCode ||
        b.expand?.roomCode?.id === roomCode;

      return isSameRoom && overlaps(checkIn, checkOut, b.checkIn, b.checkOut);
    });

  // Hiển thị lỗi custom (nếu có)
  if (customError) {
    return (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">{customError}</AlertDescription>
      </Alert>
    );
  }

  // Hiển thị cảnh báo trùng lịch
  if (isBusy) {
    return (
      <Alert variant="destructive" className="py-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Phòng đã có người đặt trong khoảng thời gian này.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}