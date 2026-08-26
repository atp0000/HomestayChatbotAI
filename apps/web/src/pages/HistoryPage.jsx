import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fmtVND, fmtDate } from "@/lib/store";
import Pagination from "@/components/layout/Pagination";

import {
  Star,
  Calendar,
  Building2,
  CheckCircle2,
  Send,
  ShoppingBag,
  Loader2,
  ConciergeBell,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PAY_CONFIG = {
  unpaid: { label: "Chưa thanh toán", variant: "destructive" },
  deposit: { label: "Đã cọc", variant: "outline" },
  paid: { label: "Đã thanh toán", variant: "default" },
};

const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  confirmed: { label: "Đã xác nhận", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
  checkedin: { label: "Đang ở", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  checkedout: { label: "Đã trả phòng", className: "bg-purple-500/10 text-purple-600 border-purple-200" },
  cancelled: { label: "Đã hủy", className: "bg-slate-500/10 text-slate-600 border-slate-200" },
};

export default function HistoryPage() {
  const { user, isAuthed } = useAuth();
  const [list, setList] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [rv, setRv] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});

 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.id) {
      setLoading(true);

      Promise.all([
        pb.collection("bookings").getFullList({
          filter: pb.filter("customer = {:id}", { id: user.id }),
          expand: "roomCode,roomTypeName",
          sort: "-created",
        }),
  
        pb.collection("services").getFullList(),
        pb.collection("reviews").getFullList({
          filter: pb.filter("author = {:name}", { name: user.fullName || "" }),
        }).catch(() => []),
      ])
        .then(([bookingsRes, servicesRes, reviewsRes]) => {
          setList(bookingsRes);

          const sMap = {};
          servicesRes.forEach((s) => {
            sMap[s.id] = s;
          });
          setServicesMap(sMap);

          const initialRvState = {};
          bookingsRes.forEach((b) => {
            const roomTarget = b.expand?.roomCode?.id || b.roomCode;
            const existingReview = reviewsRes.find(
              (r) => r.booking === b.id || (r.roomCode === roomTarget && r.author === (b.guestName || user?.fullName))
            );

            initialRvState[b.id] = {
              rating: existingReview?.rating || 5,
              comment: existingReview?.comment || "",
              done: Boolean(existingReview || b.isReviewed),
            };
          });

          setRv(initialRvState);
        })
        .catch((err) => console.error("Lỗi khi tải lịch sử:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!isAuthed) return <Navigate to="/auth" replace />;

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + itemsPerPage);

  const handleReview = async (b) => {
    const r = rv[b.id];
    if (!r?.comment?.trim() || r?.done) return;

    setSubmitting((prev) => ({ ...prev, [b.id]: true }));

    try {
      const roomTarget = b.expand?.roomCode?.id || b.roomCode;

      await pb.collection("reviews").create({
        booking: b.id,
        roomCode: roomTarget,
        author: b.guestName || user?.fullName || "Khách hàng",
        rating: r.rating || 5,
        comment: r.comment.trim(),
      });

      try {
        await pb.collection("bookings").update(b.id, { isReviewed: true });
      } catch (e) {}

      setRv((s) => ({
        ...s,
        [b.id]: { ...s[b.id], done: true },
      }));
    } catch (e) {
      console.error("Lỗi gửi đánh giá:", e);
    } finally {
      setSubmitting((prev) => ({ ...prev, [b.id]: false }));
    }
  };

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử đặt phòng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xem lại thông tin các chuyến đi và trải nghiệm của bạn
          </p>
        </div>

        {/* TRẠNG THÁI TRỐNG */}
        {!loading && list.length === 0 && (
          <Card className="text-center py-10 border-dashed">
            <CardContent className="space-y-3">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <div>
                <CardTitle className="text-base">Chưa có lịch sử đặt phòng</CardTitle>
                <CardDescription className="text-xs">
                  Bạn chưa thực hiện đơn đặt phòng nào tại homestay.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/rooms">Khám phá phòng ngay »</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* DANH SÁCH ĐẶT PHÒNG */}
        {list.length > 0 && (
          <div className="space-y-4">
            {paginatedList.map((b) => {
              const payInfo = PAY_CONFIG[b.payStatus] || { label: b.payStatus, variant: "outline" };
              const statusInfo = STATUS_CONFIG[b.status] || { label: b.status, className: "" };
              const currentRv = rv[b.id] || { rating: 5, comment: "", done: false };
              const isSubmitting = submitting[b.id];

              const displayRoomCode = b.expand?.roomCode?.code || b.roomCode || "";
              const displayRoomType = b.expand?.roomTypeName?.name || b.roomTypeName || "";

              // 🔍 Parse JSON mảng dịch vụ từ trường servicesDetail
              let serviceItems = [];
              if (b.servicesDetail) {
                if (typeof b.servicesDetail === "string") {
                  try {
                    serviceItems = JSON.parse(b.servicesDetail);
                  } catch (e) {
                    serviceItems = [];
                  }
                } else if (Array.isArray(b.servicesDetail)) {
                  serviceItems = b.servicesDetail;
                }
              }

              const isEligibleForReview =
                (b.payStatus === "paid" || b.status === "checkedout") &&
                !b.isReviewed &&
                !currentRv.done;

              return (
                <Card key={b.id} className="overflow-hidden border shadow-none hover:border-slate-300 transition-colors">
                  {/* Header */}
                  <CardHeader className="p-4 bg-muted/20 border-b">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">#{b.code}</span>
                        <Badge variant="outline" className={`text-[11px] px-2 py-0 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={payInfo.variant} className="text-[11px] px-2 py-0">
                          {payInfo.label}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground mr-1">Tổng:</span>
                        <span className="text-base font-bold text-primary">{fmtVND(b.total)}</span>
                      </div>
                    </div>

                    <CardTitle className="text-base font-medium flex items-center gap-1.5 mt-2">
                      <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{displayRoomType} {displayRoomCode && `· Phòng ${displayRoomCode}`}</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    {/* Dòng thời gian thu gọn */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
                      </div>
                      <span>Lưu trú: <b className="text-slate-700">{b.nights} đêm</b></span>
                    </div>

                    {/* 🛎️ DANH SÁCH DỊCH VỤ ĐÃ ĐẶT */}
                    {serviceItems.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs space-y-1.5 mt-2">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold border-b border-slate-200/60 pb-1">
                          <ConciergeBell className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dịch vụ sử dụng:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {serviceItems.map((item, idx) => {
                            const serviceInfo = servicesMap[item.id];
                            const name = serviceInfo?.name || "Dịch vụ";
                            const unit = serviceInfo?.unit ? ` (${serviceInfo.unit})` : "";
                            const count = item.count ? ` x${item.count}` : "";
                            const price = item.amount ? ` - ${fmtVND(item.amount)}` : "";

                            return (
                              <Badge
                                key={item.id || idx}
                                variant="secondary"
                                className="bg-white border text-slate-700 text-[11px] font-normal px-2 py-0.5 shadow-2xs"
                              >
                                {name}{unit}{count}{price}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* KHU VỰC ĐÁNH GIÁ */}
                    {isEligibleForReview && (
                      <div className="pt-2 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            Đánh giá dịch vụ
                          </span>

                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setRv((s) => ({
                                    ...s,
                                    [b.id]: { ...s[b.id], rating: star },
                                  }))
                                }
                                className="p-0.5 focus:outline-none"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    (currentRv.rating || 5) >= star
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Nhận xét ngắn về phòng..."
                            value={currentRv.comment || ""}
                            onChange={(e) =>
                              setRv((s) => ({
                                ...s,
                                [b.id]: { ...s[b.id], comment: e.target.value },
                              }))
                            }
                            className="h-8 text-xs bg-background"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleReview(b)}
                            disabled={!currentRv.comment?.trim() || isSubmitting}
                            className="h-8 text-xs px-3 gap-1 shrink-0"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Gửi
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* THÔNG BÁO ĐÃ ĐÁNH GIÁ */}
                    {(b.isReviewed || currentRv.done) && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Đã gửi đánh giá</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* COMPONENT PHÂN TRANG */}
            <div className="rounded-xl border bg-card overflow-hidden mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemName="đơn đặt phòng"
              />
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}