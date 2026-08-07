import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { fmt, fmtVND } from "@/lib/store";
import DateRangePicker from "@/components/DateRangePicker";
import BookingAvailabilityAlert from "@/components/BookingAvailabilityAlert";


export default function WalkInBookingModal({
  open,
  onOpenChange,
  rooms,
  bookings,
  formData,
  setFormData,
  isRoomLocked,
  formErr,
  saving,
  onSubmit,
  onDateChange,
  currentRoomPrice,
  calcNights,
  calcTotal,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 gap-0">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
            <UserPlus className="w-5 h-5" />
            Đặt phòng cho khách trực tiếp
          </DialogTitle>
        </DialogHeader>

        {/* CẢNH BÁO TRÙNG LỊCH HOẶC LỖI VALIDATE TRỰC TIẾP */}
        <div className="mt-4">
          <BookingAvailabilityAlert
            checkIn={formData.checkIn}
            checkOut={formData.checkOut}
            roomCode={formData.roomCode}
            bookings={bookings}
            customError={formErr}
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pt-4 text-xs">
          {/* SECTION 1: THÔNG TIN LƯU TRÚ */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground/80 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Thông tin lưu trú
            </h4>

            <div className="grid grid-cols-12 gap-3">
              {/* Chọn Phòng */}
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">
                  Chọn phòng *{" "}
                  {isRoomLocked && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (Cố định)
                    </span>
                  )}
                </Label>
                <Select
                  disabled={isRoomLocked}
                  value={formData.roomCode}
                  onValueChange={(val) =>
                    setFormData({ ...formData, roomCode: val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs font-semibold">
                    <SelectValue placeholder="Chọn phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => {
                      const p = r.expand?.room_type_id?.price ?? r.price ?? 0;
                      return (
                        <SelectItem key={r.id} value={r.code} className="text-xs">
                          Phòng {r.code} ({r.expand?.room_type_id?.name ?? r.typeName}) -{" "}
                          {fmt(p)}đ
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Quy trình */}
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Trạng thái nhận phòng *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue placeholder="Chọn quy trình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkedin" className="text-xs">
                      🟡 Nhận phòng ngay (Đang ở)
                    </SelectItem>
                    <SelectItem value="pending" className="text-xs">
                      🔴 Đặt trước (Sắp đến)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tái sử dụng DateRangePicker cho Chọn Ngày */}
              <div className="col-span-10">
                <DateRangePicker
                  checkIn={formData.checkIn}
                  checkOut={formData.checkOut}
                  onChange={onDateChange}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Số khách</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.guests}
                  onChange={(e) =>
                    setFormData({ ...formData, guests: e.target.value })
                  }
                  className="h-9 text-xs text-center font-medium bg-background"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: THÔNG TIN KHÁCH HÀNG */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-foreground/80 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Thông tin khách hàng
            </h4>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Họ tên khách *</Label>
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={formData.guestName}
                  onChange={(e) =>
                    setFormData({ ...formData, guestName: e.target.value })
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Số điện thoại *</Label>
                <Input
                  type="text"
                  placeholder="0901234567"
                  value={formData.guestPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, guestPhone: e.target.value })
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Email (Tùy chọn)</Label>
                <Input
                  type="email"
                  placeholder="khach@gmail.com"
                  value={formData.guestEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, guestEmail: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Địa chỉ (Tùy chọn)</Label>
                <Input
                  type="text"
                  placeholder="Hà Nội, Huế..."
                  value={formData.guestAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, guestAddress: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TẠM TÍNH & THANH TOÁN */}
          <div className="grid grid-cols-12 gap-4 pt-2">
            <div className="col-span-5 bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Đơn giá:</span>
                  <span className="font-semibold text-foreground">
                    {fmtVND(currentRoomPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Thời gian:</span>
                  <span className="font-semibold text-foreground">
                    {calcNights > 0 ? calcNights : 0} đêm
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex justify-between items-baseline mt-2">
                <span className="font-bold text-xs text-emerald-950">
                  Tạm tính:
                </span>
                <span className="font-extrabold text-sm text-emerald-600">
                  {fmtVND(calcTotal)}
                </span>
              </div>
            </div>

            <div className="col-span-7 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hình thức</Label>
                  <Select
                    value={formData.payMethod}
                    onValueChange={(val) =>
                      setFormData({ ...formData, payMethod: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="text-xs">
                        Tiền mặt
                      </SelectItem>
                      <SelectItem value="transfer" className="text-xs">
                        Chuyển khoản
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Thanh toán</Label>
                  <Select
                    value={formData.payStatus}
                    onValueChange={(val) =>
                      setFormData({ ...formData, payStatus: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid" className="text-xs">
                        Chưa thanh toán
                      </SelectItem>
                      <SelectItem value="paid" className="text-xs">
                        Đã thanh toán đủ
                      </SelectItem>
                      <SelectItem value="deposit" className="text-xs">
                        Đã cọc
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Input
                type="text"
                placeholder="Ghi chú thêm (yêu cầu riêng...)"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <DialogFooter className="pt-4 border-t flex gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="flex-1 h-9 text-xs font-bold bg-primary hover:bg-primary/90"
            >
              {saving ? "Đang xử lý..." : "Xác nhận đặt phòng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}