import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fmtVND, fmtDate } from "@/lib/store";

// Lucide Icons
import {
  Star,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Send,
  ShoppingBag,
} from "lucide-react";

// shadcn/ui components
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
import { Separator } from "@/components/ui/separator";

// Cấu hình nhãn và màu sắc Badge cho Trạng thái Thanh toán
const PAY_CONFIG = {
  unpaid: { label: "Chưa thanh toán", variant: "destructive" },
  deposit: { label: "Đã cọc giữ phòng", variant: "outline" },
  paid: { label: "Đã thanh toán", variant: "default" },
};

// Cấu hình nhãn và màu sắc Badge cho Trạng thái Đặt phòng
const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-500/15 text-amber-600 border-amber-200" },
  confirmed: { label: "Đã xác nhận", className: "bg-blue-500/15 text-blue-600 border-blue-200" },
  checkedin: { label: "Đang ở", className: "bg-emerald-500/15 text-emerald-600 border-emerald-200" },
  checkedout: { label: "Đã trả phòng", className: "bg-purple-500/15 text-purple-600 border-purple-200" },
  cancelled: { label: "Đã hủy", className: "bg-slate-500/15 text-slate-600 border-slate-200" },
};

export default function HistoryPage() {
  const { user, isAuthed } = useAuth();
  const [list, setList] = useState([]);
  const [rv, setRv] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      // Gọi PocketBase API với expand để lấy tên phòng và loại phòng chính xác từ relation
      pb.collection("bookings")
        .getFullList({
          filter: pb.filter("customer = {:id}", { id: user.id }),
          expand: "roomCode,roomTypeName",
          sort: "-created",
        })
        .then((res) => {
          setList(res);
        })
        .catch((err) => {
          console.error("Lỗi khi tải lịch sử:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!isAuthed) return <Navigate to="/auth" replace />;

  const handleReview = async (b) => {
    const r = rv[b.id];
    if (!r?.comment?.trim()) return;

    try {
      // Ưu tiên truyền Record ID của phòng nếu có relation, fallback về chuỗi b.roomCode
      const roomTarget = b.expand?.roomCode?.id || b.roomCode;

      await pb.collection("reviews").create({
        roomCode: roomTarget,
        author: b.guestName || user?.fullName || "Khách hàng",
        rating: r.rating || 5,
        comment: r.comment.trim(),
      });
      setRv((s) => ({ ...s, [b.id]: { ...s[b.id], done: true } }));
    } catch (e) {
      console.error("Lỗi gửi đánh giá:", e);
    }
  };

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
              Lịch sử đặt phòng
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Quản lý các chuyến đi và đánh giá trải nghiệm dịch vụ của bạn
            </p>
          </div>
        </div>

        {/* TRẠNG THÁI KHÔNG CÓ DỮ LIỆU */}
        {!loading && list.length === 0 && (
          <Card className="text-center py-12 border-dashed">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-xl">Chưa có lịch sử đặt phòng</CardTitle>
                <CardDescription className="mt-1">
                  Bạn chưa thực hiện đơn đặt phòng nào tại homestay của chúng tôi.
                </CardDescription>
              </div>
              <Button asChild className="mt-2 rounded-full">
                <Link to="/rooms">Khám phá danh sách phòng ngay »</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* DANH SÁCH ĐẶT PHÒNG */}
        <div className="space-y-6">
          {list.map((b) => {
            const payInfo = PAY_CONFIG[b.payStatus] || { label: b.payStatus, variant: "outline" };
            const statusInfo = STATUS_CONFIG[b.status] || { label: b.status, className: "" };
            const currentRv = rv[b.id] || { rating: 5, comment: "", done: false };

            // Trích xuất linh hoạt Tên phòng và Loại phòng (Hỗ trợ cả Relation Expand lẫn Direct Field)
            const displayRoomCode = b.expand?.roomCode?.code || b.roomCode || "";
            const displayRoomType = b.expand?.roomTypeName?.name || b.roomTypeName || "";

            return (
              <Card key={b.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{b.code}
                        </Badge>
                        <Badge variant="outline" className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={payInfo.variant}>{payInfo.label}</Badge>
                      </div>
                      <CardTitle className="text-xl mt-2 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {displayRoomType} {displayRoomCode && `· Phòng ${displayRoomCode}`}
                      </CardTitle>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Tổng tiền</p>
                      <p className="text-2xl font-extrabold text-primary">{fmtVND(b.total)}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground bg-background p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Thời gian: <b>{fmtDate(b.checkIn)}</b> → <b>{fmtDate(b.checkOut)}</b>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>
                        Thời lượng lưu trú: <b>{b.nights} Ngày</b>
                      </span>
                    </div>
                  </div>

                  {/* KHU VỰC ĐÁNH GIÁ (Cho phép đánh giá khi đã trả phòng hoặc đã thanh toán) */}
                  {(b.payStatus === "paid" || b.status === "checkedout") && !currentRv.done && (
                    <div className="pt-2">
                      <Separator className="mb-4" />
                      <div className="space-y-3 bg-muted/20 p-4 rounded-xl border">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          Đánh giá trải nghiệm chuyến đi này
                        </p>

                        {/* Chọn Số Sao */}
                        <div className="flex items-center gap-1">
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
                              className="p-1 hover:scale-110 transition-transform focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  (currentRv.rating || 5) >= star
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/40"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs text-muted-foreground ml-2 font-medium">
                            ({currentRv.rating || 5}/5 sao)
                          </span>
                        </div>

                        {/* Nhập nội dung & nút Gửi */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Chia sẻ cảm nhận của bạn về phòng nghỉ, dịch vụ..."
                            value={currentRv.comment || ""}
                            onChange={(e) =>
                              setRv((s) => ({
                                ...s,
                                [b.id]: { ...s[b.id], comment: e.target.value },
                              }))
                            }
                            className="bg-background"
                          />
                          <Button
                            onClick={() => handleReview(b)}
                            disabled={!currentRv.comment?.trim()}
                            className="gap-1.5 shrink-0"
                          >
                            <Send className="w-4 h-4" /> Gửi
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* THÔNG BÁO ĐÃ ĐÁNH GIÁ XONG */}
                  {currentRv.done && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Cảm ơn bạn đã đóng góp đánh giá về dịch vụ của chúng tôi!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}