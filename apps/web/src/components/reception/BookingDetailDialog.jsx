import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, LogOut as LogOutIcon, XCircle } from "lucide-react";
import { fmtVND, fmtDate } from "@/lib/store";


export default function BookingDetailDialog({ booking, onClose, onUpdateStatus }) {
  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chi tiết đặt phòng
          </DialogTitle>
        </DialogHeader>

        {booking && (
          <div className="space-y-2 text-sm py-2">
            <p>
              Mã booking:{" "}
              <b className="text-primary font-mono">{booking.code}</b>
            </p>
            <p>
              Khách hàng: <b>{booking.guestName}</b> ·{" "}
              {booking.guestPhone || "Chưa có SĐT"}
            </p>
            <p>
              Địa chỉ: <b>{booking.guestAddress || "Chưa cập nhật"}</b>
            </p>
            <p>
              Phòng: <b>{booking.roomCode}</b> ({booking.roomTypeName})
            </p>
            <p>
              Nhận → Trả:{" "}
              <b>
                {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
              </b>{" "}
              ({booking.nights || 1} đêm)
            </p>
            <p>
              Tổng tiền:{" "}
              <b className="text-emerald-600 text-base">
                {fmtVND(booking.total)}
              </b>
            </p>
            {booking.note && (
              <p className="text-muted-foreground italic">
                Ghi chú: {booking.note}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-[8px]">
          {booking && booking.status !== "checkedin" && (
            <>
              <Button
                onClick={() => onUpdateStatus(booking, "checkedin")}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-bold gap-1.5 shadow"
              >
                <CheckCircle className="w-4 h-4" />
                Nhận phòng
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Xác nhận hủy đơn đặt phòng này?"))
                    onUpdateStatus(booking, "cancelled");
                }}
                className="flex-1 gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Hủy đặt
              </Button>
            </>
          )}

          {booking && booking.status === "checkedin" && (
            <Button
              onClick={() => {
                if (
                  window.confirm("Xác nhận trả phòng và thu đủ tiền thanh toán?")
                )
                  onUpdateStatus(booking, "checkedout");
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2 shadow"
            >
              <LogOutIcon className="w-4 h-4" />
              Trả phòng & Thanh toán
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}