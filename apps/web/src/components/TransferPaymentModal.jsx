import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { fmtVND } from "@/lib/store";
import { Loader2, ExternalLink, Copy, Check, QrCode } from "lucide-react";
import QrImage from "@/components/QrImage";
import { Button } from "@/components/ui/button";

export default function TransferPaymentModal({ bookingData, onError }) {
  const nav = useNavigate();
  const [createdBooking, setCreatedBooking] = useState(null);
  const [payOsData, setPayOsData] = useState({ qrCode: "", checkoutUrl: "" });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initPayment() {
      try {
        setLoading(true);

        // Tạo orderCode ngẫu nhiên dạng số nguyên cho PayOS
        const numericOrderCode = Number(String(Date.now()).slice(-6));

        // 1. Tạo bản ghi Booking trong PocketBase
        const rec = await pb.collection("bookings").create({
          ...bookingData,
          payMethod: "transfer",
          payStatus: "unpaid",
          status: "pending",
          orderCode: numericOrderCode,
        });

        if (!isMounted) return;
        setCreatedBooking(rec);

        // 2. Gọi backend PocketBase để đăng ký đơn hàng sang PayOS
        const res = await pb.send("/api/create-payos-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: rec.id,
            amount: rec.total,
            orderCode: numericOrderCode,
          }),
        });

        if (isMounted) {
          if (res?.checkoutUrl || res?.qrCode) {
            setPayOsData({
              qrCode: res.qrCode,
              checkoutUrl: res.checkoutUrl,
            });
          } else {
            onError("Không tạo được link thanh toán PayOS.");
          }
        }
      } catch (err) {
        console.error("Lỗi khởi tạo PayOS:", err);
        if (isMounted) onError("Lỗi kết nối đến cổng thanh toán PayOS.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initPayment();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Đăng ký Realtime PocketBase (Chờ Webhook cập nhật status thành 'paid')
  useEffect(() => {
    if (!createdBooking?.id) return;

    pb.collection("bookings").subscribe(createdBooking.id, (e) => {
      if (e.action === "update" && e.record.payStatus === "paid") {
        nav(`/success/${createdBooking.id}`, { replace: true });
      }
    });

    return () => {
      pb.collection("bookings").unsubscribe(createdBooking.id);
    };
  }, [createdBooking?.id, nav]);

  const copyCode = () => {
    if (createdBooking?.code) {
      navigator.clipboard.writeText(createdBooking.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed my-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Đang kết nối PayOS và tạo mã QR...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50/50 to-white rounded-xl border border-blue-200 shadow-sm my-4 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-primary font-semibold text-lg">
        <QrCode className="w-5 h-5 text-blue-600" />
        <span>Quét mã QR Chuyển khoản qua Ngân hàng</span>
      </div>

      <div className="flex flex-col items-center justify-center">
     <div className="p-3 bg-white rounded-xl shadow-md border border-blue-100 min-h-[200px] flex items-center justify-center">
  {payOsData.qrCode ? (
    <QrImage value={payOsData.qrCode} size={240} />
  ) : (
    <p className="text-sm text-red-500">Không hiển thị được mã QR PayOS</p>
  )}
</div>
        <div className="mt-4 text-sm space-y-1.5 bg-blue-50/80 p-3 rounded-lg w-full max-w-sm">
          <p className="text-muted-foreground flex items-center justify-center">
            Mã đơn hàng: <strong className="text-foreground ml-1">{createdBooking?.orderCode || createdBooking?.code}</strong>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={copyCode}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </p>
          <p className="text-muted-foreground">
            Số tiền: <strong className="text-primary font-bold">{fmtVND(createdBooking?.total || 0)}</strong>
          </p>
        </div>
      </div>

     {payOsData.checkoutUrl && (
        <div className="pt-1">
          <a href={payOsData.checkoutUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <ExternalLink className="w-4 h-4 mr-2" />
              Mở trang thanh toán PayOS
            </Button>
          </a>
        </div>
      )}

      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-center gap-2 text-left">
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-emerald-600" />
        <span>
          Hệ thống đang chờ giao dịch. Khi bạn chuyển khoản thành công, màn hình sẽ <strong>tự động chuyển sang trang Hoàn tất</strong>.
        </span>
      </div>
    </div>
  );
}