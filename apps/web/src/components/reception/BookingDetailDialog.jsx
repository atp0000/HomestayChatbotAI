import React, { useEffect, useMemo, useState } from "react";
import pb from "@/lib/pocketbaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  LogOut as LogOutIcon,
  XCircle,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { fmtVND, fmtDate, api, applyServiceQuantityDelta } from "@/lib/store";

/**
 * POPUP CHI TIẾT ĐẶT PHÒNG
 *
 * Props:
 * - booking: booking đang chọn xem (null nếu đóng popup)
 * - onClose(): đóng popup
 * - onUpdateStatus(booking, newStatus): cập nhật trạng thái booking
 */
export default function BookingDetailDialog({ booking, onClose, onUpdateStatus, onBookingUpdated }) {
  const [bookingData, setBookingData] = useState(booking);
  const [services, setServices] = useState([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceQty, setServiceQty] = useState({});
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    setBookingData(booking);
  }, [booking]);

  useEffect(() => {
    api.services().then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (!bookingData) return;
    const initial = {};
    (bookingData.servicesDetail || []).forEach((svc) => {
      const key = svc.serviceId || svc.id || svc.name;
      if (key) initial[key] = Number(svc.count || 0);
    });
    setServiceQty(initial);
    setShowServicePicker(false);
  }, [bookingData]);

  const roomObj = bookingData?.expand?.roomCode;
  const displayRoomCode = roomObj?.code || bookingData?.roomCode || "";
  const payStatusLabel =
    bookingData?.payStatus === "paid"
      ? "Đã thanh toán"
      : bookingData?.payStatus === "unpaid"
      ? "Chưa thanh toán"
      : bookingData?.payStatus || "Chưa thanh toán";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = bookingData?.checkIn ? new Date(bookingData.checkIn) : null;
  if (checkInDate) checkInDate.setHours(0, 0, 0, 0);
  const canCheckIn = !!checkInDate && today >= checkInDate;

  const roomBaseTotal = Number(bookingData?.roomPrice || 0) * Number(bookingData?.nights || 1);
  const serviceSummary = (bookingData?.servicesDetail || []).map((item) => ({
    ...item,
    count: Number(item.count || 0),
    unitPrice: Number(item.unitPrice || item.price || 0),
    amount: Number(item.amount || 0),
  }));

  const selectedServiceDetail = services
    .map((s) => {
      const count = Number(serviceQty[s.id] || 0);
      if (count <= 0) return null;
      const nights = Number(bookingData?.nights || 1);
      const amount = (Number(s.price) || 0) * count * (s.perDay ? nights : 1);
      return {
        serviceId: s.id,
        id: s.id,
        name: s.name,
        count,
        unitPrice: Number(s.price) || 0,
        amount,
        unit: s.unit,
      };
    })
    .filter(Boolean);

  const serviceTotal = selectedServiceDetail.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const previewTotal = roomBaseTotal + serviceTotal;

  const isStockTrackedService = (service) => {
    const val = Number(service?.quantity ?? 0);
    return Number.isFinite(val) && val > 0;
  };

  const bumpService = (id, delta) => {
    setServiceQty((prev) => ({
      ...prev,
      [id]: Math.max(0, Number(prev[id] || 0) + delta),
    }));
  };

  const handleSaveService = async () => {
    if (!bookingData) return;
    setSavingService(true);

    try {
      const resolveServiceId = (item) => {
        const byId = item?.serviceId || item?.id;
        if (byId) return byId;
        if (!item?.name) return null;
        const matched = services.find((s) => s.name === item.name);
        return matched?.id || null;
      };

      const previousMap = Object.fromEntries(
        (bookingData.servicesDetail || [])
          .map((item) => {
            const serviceId = resolveServiceId(item);
            if (!serviceId) return null;
            return [serviceId, Number(item.count || 0)];
          })
          .filter(Boolean)
      );

      const nextMap = {};
      selectedServiceDetail.forEach((item) => {
        const serviceId = resolveServiceId(item);
        const service = services.find((s) => s.id === serviceId);
        if (serviceId && service && Number(service.quantity ?? 0) > 0) {
          nextMap[serviceId] = Number(item.count || 0);
        }
      });

      const adjustmentItems = [];
      const allIds = new Set([...Object.keys(previousMap), ...Object.keys(nextMap)]);

      allIds.forEach((serviceId) => {
        const previousCount = Number(previousMap[serviceId] || 0);
        const nextCount = Number(nextMap[serviceId] || 0);
        const delta = nextCount - previousCount;
        if (delta !== 0) {
          adjustmentItems.push({ serviceId, count: delta });
        }
      });

      if (adjustmentItems.length > 0) {
        await applyServiceQuantityDelta(adjustmentItems);
      }

      const nextServiceDetail = selectedServiceDetail;
      const nextServicesTotal = nextServiceDetail.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );
      const nextTotal =
        Number(bookingData.roomPrice || 0) * Number(bookingData.nights || 1) +
        nextServicesTotal;

      await pb.collection("bookings").update(bookingData.id, {
        servicesDetail: nextServiceDetail,
        servicesTotal: nextServicesTotal,
        total: nextTotal,
      });

      setBookingData((prev) => ({
        ...prev,
        servicesDetail: nextServiceDetail,
        servicesTotal: nextServicesTotal,
        total: nextTotal,
      }));

      if (typeof onBookingUpdated === "function") {
        await onBookingUpdated();
      }

      setShowServicePicker(false);
    } catch (err) {
      alert("Thêm dịch vụ thất bại: " + (err?.message || "Lỗi không xác định"));
    } finally {
      setSavingService(false);
    }
  };

  return (
    <Dialog open={!!bookingData} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Chi tiết đặt phòng
          </DialogTitle>
        </DialogHeader>

        {bookingData && (
          <div className="space-y-2 text-sm py-2">
            <p>
              Mã booking:{" "}
              <b className="text-primary font-mono">{bookingData.code}</b>
            </p>
            <p>
              Khách hàng: <b>{bookingData.guestName}</b> ·{" "}
              {bookingData.guestPhone || "Chưa có SĐT"}
            </p>
            <p>
              Địa chỉ: <b>{bookingData.guestAddress || "Chưa cập nhật"}</b>
            </p>
            <p>
              Phòng: <b>{displayRoomCode}</b>
            </p>
            <p>
              Trạng thái thanh toán: <b>{payStatusLabel}</b>
            </p>
            <p>
              Nhận → Trả:{" "}
              <b>
                {fmtDate(bookingData.checkIn)} → {fmtDate(bookingData.checkOut)}
              </b>{" "}
              ({bookingData.nights || 1} Ngày)
            </p>
            <p>
              Tiền phòng: <b>{fmtVND(roomBaseTotal)}</b>
            </p>
            {serviceSummary.length > 0 && (
              <p>
                Dịch vụ: <b>{fmtVND(Number(bookingData.servicesTotal || 0))}</b>
              </p>
            )}
            <p>
              Tổng tiền:{" "}
              <b className="text-emerald-600 text-base">
                {fmtVND(Number(bookingData.total || roomBaseTotal))}
              </b>
            </p>
            {bookingData.note && (
              <p className="text-muted-foreground italic">
                Ghi chú: {bookingData.note}
              </p>
            )}

            {bookingData.status === "checkedin" && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 border-sky-200 text-sky-700 hover:bg-sky-50"
                  onClick={() => setShowServicePicker((prev) => !prev)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {showServicePicker ? "Đóng danh sách dịch vụ" : "Thêm dịch vụ"}
                </Button>

                {showServicePicker && (
                  <div className="mt-3 space-y-3 rounded-lg border bg-slate-50 p-3">
                    {services.map((s) => {
                      const stockTracked = isStockTrackedService(s);

                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-md border bg-white p-2"
                        >
                          <div>
                            <p className="font-semibold text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtVND(Number(s.price) || 0)} / {s.unit}
                            </p>
                          </div>

                          {stockTracked ? (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => bumpService(s.id, -1)}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="w-7 text-center text-sm font-semibold">
                                {serviceQty[s.id] || 0}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => bumpService(s.id, 1)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => bumpService(s.id, 1)}
                            >
                              Thêm
                            </Button>
                          )}
                        </div>
                      );
                    })}

                    <div className="rounded-md border bg-white p-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Dịch vụ chọn thêm</span>
                        <span>{fmtVND(serviceTotal)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">Tổng dự kiến</span>
                        <span className="text-base font-bold text-emerald-600">
                          {fmtVND(previewTotal)}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={handleSaveService}
                      disabled={savingService}
                    >
                      {savingService ? "Đang lưu..." : "Lưu dịch vụ"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-[8px]">
          {bookingData && bookingData.status !== "checkedin" && (
            <>
              <Button
                onClick={() => onUpdateStatus(bookingData, "checkedin")}
                disabled={!canCheckIn}
                className={`flex-1 ${canCheckIn ? "bg-amber-400 hover:bg-amber-500 text-black" : "bg-slate-300 text-slate-600 cursor-not-allowed"} font-bold gap-1.5 shadow`}
              >
                <CheckCircle className="w-4 h-4" />
                Nhận phòng
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Xác nhận hủy đơn đặt phòng này?"))
                    onUpdateStatus(bookingData, "cancelled");
                }}
                className="flex-1 gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Hủy đặt
              </Button>
            </>
          )}

          {bookingData && bookingData.status === "checkedin" && (
            <Button
              onClick={() => {
                if (
                  window.confirm("Xác nhận trả phòng và thu đủ tiền thanh toán?")
                )
                  onUpdateStatus(bookingData, "checkedout");
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