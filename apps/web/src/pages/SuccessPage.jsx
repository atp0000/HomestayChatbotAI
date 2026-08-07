import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { fmtVND, fmtDate } from "@/lib/store";

// Lucide Icons
import {
  CheckCircle2,
  Home,
  Printer,
  Calendar,
  User,
  CreditCard,
  Hash,
  Loader2,
} from "lucide-react";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SuccessPage() {
  const { id } = useParams();
  const [b, setB] = useState(null);

  useEffect(() => {
    pb.collection("bookings")
      .getOne(id, { expand: "roomCode,roomTypeName" })
      .then(setB)
      .catch(() => {});
  }, [id]);

  if (!b) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Đang tải thông tin đặt phòng...</span>
        </div>
      </div>
    );
  }

  const P = ({ label, value, highlight = false }) => (
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`font-semibold text-sm ${highlight ? "text-primary font-bold" : "text-foreground"}`}>
        {value || "—"}
      </p>
    </div>
  );

  const payLabel =
    b.payMethod === "transfer"
      ? "Chuyển khoản giữ phòng"
      : "Thanh toán khi nhận phòng";

  // Trích xuất thông tin Tên phòng và Loại phòng từ Relation Expand hoặc Field gốc
  const displayRoomCode = b.expand?.roomCode?.code || b.roomCode;
  const displayRoomType = b.expand?.roomTypeName?.name || b.roomTypeName;

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG (Ẩn khi in hóa đơn) */}
      <div className="bg-primary text-primary-foreground py-3 px-6 flex justify-between items-center shadow-sm print:hidden">
        <span className="font-bold text-sm tracking-wide">Núi Homestay</span>
        <Button variant="outline" size="sm" asChild className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" /> Trang chủ
          </Link>
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Card className="shadow-xl border-border/60 overflow-hidden bg-card">
          {/* HEADER THÔNG BÁO THÀNH CÔNG */}
          <CardHeader className="bg-emerald-500/10 text-center pb-8 pt-10 border-b border-emerald-500/20">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
              Đặt Phòng Thành Công!
            </CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto mt-1">
              Thông tin đặt phòng của bạn đã được ghi nhận. Vui lòng lưu lại mã đặt phòng bên dưới.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* THÔNG TIN MÃ ĐẶT PHÒNG */}
            <div className="bg-muted/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Mã đặt phòng
                  </p>
                  <p className="font-mono text-xl font-bold text-primary">
                    {b.code}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs">
                {payLabel}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CỘT 1: THÔNG TIN KHÁCH HÀNG & PHÒNG */}
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                  <User className="w-4 h-4" /> Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <P label="Họ và tên" value={b.guestName} />
                  <P label="Số điện thoại" value={b.guestPhone} />
                  <div className="col-span-2">
                    <P label="Email" value={b.guestEmail} />
                  </div>
                </div>

                <h3 className="font-display text-base font-bold flex items-center gap-2 text-primary border-b pb-2 pt-4">
                  <Calendar className="w-4 h-4" /> Chi tiết lưu trú
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <P label="Tên phòng" value={displayRoomCode} />
                  <P label="Loại phòng" value={displayRoomType} />
                  <P label="Ngày nhận" value={fmtDate(b.checkIn)} />
                  <P label="Ngày trả" value={fmtDate(b.checkOut)} />
                  <P label="Số lượng khách" value={`${b.guests} người`} />
                  <P label="Số đêm lưu trú" value={`${b.nights} đêm`} />
                </div>
              </div>

              {/* CỘT 2: CHI TIẾT THANH TOÁN */}
              <div className="space-y-4 md:border-l md:pl-8 border-border/60">
                <h3 className="font-display text-base font-bold flex items-center gap-2 text-primary border-b pb-2">
                  <CreditCard className="w-4 h-4" /> Chi tiết thanh toán
                </h3>
                
                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Hình thức:</span>
                    <span className="font-medium text-right">{payLabel}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-base">Tổng tiền:</span>
                    <span className="text-2xl font-extrabold text-primary">
                      {fmtVND(b.total)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed pt-2">
                  * Vui lòng xuất trình mã đặt phòng hoặc giấy tờ tùy thân khi làm thủ tục nhận phòng tại Homestay.
                </div>
              </div>
            </div>
          </CardContent>

          {/* FOOTER NÚT IN HÓA ĐƠN (Ẩn khi in hóa đơn) */}
          <CardFooter className="bg-muted/20 border-t p-6 flex justify-center gap-4 print:hidden">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="font-semibold gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Xuất / In hóa đơn
            </Button>
            <Button asChild className="font-semibold shadow-sm">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}