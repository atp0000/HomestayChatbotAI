import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { api, fmtVND, nights, genCode, fmtDate } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import TransferPaymentModal from "@/components/TransferPaymentModal";

import { 
  Minus, Plus, CreditCard, Wallet, Users, Bed, ConciergeBell, AlertCircle 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function BookingPage() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const st = loc.state;

  const [services, setServices] = useState([]);
  const [qty, setQty] = useState({});
  const [info, setInfo] = useState({
    guestName: user?.fullName || "",
    guestPhone: user?.phone || "",
    guestEmail: user?.email || "",
    guestAddress: "",
    note: "",
  });
  const [pay, setPay] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.services().then(setServices).catch(() => {});
  }, []);

  if (!st?.room) return <Navigate to="/rooms" replace />;

  // 1. TRÍCH XUẤT DỮ LIỆU PHÒNG & LOẠI PHÒNG
  const roomPrice = st.room.expand?.room_type_id?.price ?? st.room.price ?? 0;
  const roomTypeName = st.room.expand?.room_type_id?.name ?? st.room.typeName ?? "";
  
  // Lấy Record ID của loại phòng (chuỗi ID 15 ký tự trong PocketBase)
  const roomTypeId = st.room.expand?.room_type_id?.id ?? st.room.room_type_id ?? st.room.room_type;

  const n = nights(st.checkIn, st.checkOut);
  const roomTotal = roomPrice * n;
  
  const svcDetail = services
    .map((s) => ({ ...s, count: qty[s.id] || 0 }))
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.name,
      count: s.count,
      unitPrice: s.price,
      amount: s.price * s.count * (s.perDay ? n : 1),
    }));
    
  const svcTotal = svcDetail.reduce((a, s) => a + s.amount, 0);
  const total = roomTotal + svcTotal;

  const bump = (id, d) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + d) }));

  // Kiểm tra thông tin bắt buộc đã nhập đủ chưa
  const isFormValid = info.guestName && info.guestPhone && info.guestEmail && info.guestAddress;

  // 2. TẠO PAYLOAD CHÍNH XÁC VỚI FIELD TRONG POCKETBASE
  const getBookingPayload = () => ({
    code: genCode(),
    customer: user?.id || null,
    
    // Gửi Record ID cho các trường Relation trong DB
    roomCode: st.room.id,         // Relation trỏ tới collection rooms
    roomTypeName: roomTypeId,     // Relation trỏ tới collection room_types

    guestName: info.guestName,
    guestPhone: info.guestPhone,
    guestEmail: info.guestEmail,
    guestAddress: info.guestAddress,
    note: info.note,
    guests: Number(st.guests) || 1,
    checkIn: st.checkIn,
    checkOut: st.checkOut,
    nights: n,
    roomPrice: roomPrice,
    servicesTotal: svcTotal,
    servicesDetail: svcDetail,
    total,
  });

  const submitCash = async () => {
    setErr("");
    if (!isFormValid) {
      return setErr("Vui lòng điền đầy đủ các trường bắt buộc (*).");
    }
    setSaving(true);
    try {
      const rec = await pb.collection("bookings").create({
        ...getBookingPayload(),
        payMethod: "cash",
        payStatus: "unpaid",
        status: "pending",
      });

      nav("/success/" + rec.id, { replace: true });
    } catch (e) {
      setErr("Đặt phòng thất bại. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-8">
          Thông tin đặt phòng
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI: DỊCH VỤ & THÔNG TIN */}
          <div className="lg:col-span-2 space-y-6">
            {/* CARD 1: DỊCH VỤ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <ConciergeBell className="w-5 h-5" /> Lựa chọn dịch vụ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((s) => {
                  const imageName = Array.isArray(s.image) ? s.image[0] : s.image;
                  const imageUrl = (s && imageName) ? pb.files.getURL(s, imageName) : null;

                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg gap-4">
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt={s.name} className="w-16 h-16 rounded-md object-cover border" />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted border flex items-center justify-center text-xs text-muted-foreground">Không ảnh</div>
                        )}
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{fmtVND(s.price)} / {s.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => bump(s.id, -1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-sm">{qty[s.id] || 0}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => bump(s.id, 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* CARD 2: THÔNG TIN KHÁCH HÀNG */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Users className="w-5 h-5" /> Điền thông tin đặt phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Họ và tên *</Label>
                    <Input id="guestName" value={info.guestName} onChange={(e) => setInfo({ ...info, guestName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Số điện thoại *</Label>
                    <Input id="guestPhone" value={info.guestPhone} onChange={(e) => setInfo({ ...info, guestPhone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email *</Label>
                    <Input id="guestEmail" type="email" value={info.guestEmail} onChange={(e) => setInfo({ ...info, guestEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestAddress">Địa chỉ *</Label>
                    <Input id="guestAddress" value={info.guestAddress} onChange={(e) => setInfo({ ...info, guestAddress: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="note">Ghi chú thêm</Label>
                  <Textarea id="note" value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: PHƯƠNG THỨC THANH TOÁN */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <CreditCard className="w-5 h-5" /> Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={pay} onValueChange={setPay} className="space-y-3">
                  <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer ${pay === "cash" ? "border-primary bg-primary/5" : ""}`} onClick={() => setPay("cash")}>
                    <RadioGroupItem value="cash" id="pay-cash" />
                    <Label htmlFor="pay-cash" className="cursor-pointer flex items-center gap-2 font-medium">
                      <Wallet className="w-4 h-4 text-muted-foreground" /> Thanh toán khi nhận phòng (Trực tiếp)
                    </Label>
                  </div>

                  <div className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer ${pay === "transfer" ? "border-primary bg-primary/5" : ""}`} onClick={() => setPay("transfer")}>
                    <RadioGroupItem value="transfer" id="pay-transfer" />
                    <Label htmlFor="pay-transfer" className="cursor-pointer flex items-center gap-2 font-medium">
                      <CreditCard className="w-4 h-4 text-muted-foreground" /> Chuyển khoản QR (Tự động xác nhận)
                    </Label>
                  </div>
                </RadioGroup>

                {pay === "transfer" && (
                  isFormValid ? (
                    <TransferPaymentModal 
                      bookingData={getBookingPayload()} 
                      onError={(msg) => setErr(msg)} 
                    />
                  ) : (
                    <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        Vui lòng điền đầy đủ <strong>Thông tin đặt phòng (*)</strong> ở trên để hệ thống hiển thị mã QR thanh toán.
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* CỘT PHẢI: CHI TIẾT TÓM TẮT */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 shadow-md">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Chi tiết đặt phòng</CardTitle>
                <Badge variant="secondary" className="w-fit mx-auto mt-1">
                  <Bed className="w-3.5 h-3.5 mr-1" /> Phòng {st.room.code}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row l="Loại phòng" v={roomTypeName} />
                <Row l="Nhận phòng" v={fmtDate(st.checkIn)} />
                <Row l="Trả phòng" v={fmtDate(st.checkOut)} />
                <Row l="Thời gian" v={`${n} đêm`} />
                <Row l="Số lượng khách" v={`${st.guests} người`} />
                <Separator className="my-2" />
                <Row l="Giá phòng / đêm" v={fmtVND(roomPrice)} />
                <Row l="Tiền phòng tạm tính" v={fmtVND(roomTotal)} />

                {svcDetail.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <p className="font-semibold text-xs text-muted-foreground uppercase">Dịch vụ bổ sung</p>
                    {svcDetail.map((s) => (
                      <Row key={s.name} l={`${s.name} (x${s.count})`} v={fmtVND(s.amount)} />
                    ))}
                  </>
                )}

                <Separator className="my-3" />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-base">Tổng thanh toán</span>
                  <span className="font-extrabold text-xl text-primary">{fmtVND(total)}</span>
                </div>

                {err && (
                  <Alert variant="destructive" className="mt-4 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{err}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  onClick={submitCash}
                  disabled={pay === "transfer" || saving}
                  className={`w-full text-base font-semibold py-6 rounded-xl shadow-lg transition-all ${
                    pay === "transfer" ? "opacity-60 cursor-not-allowed bg-gray-400" : ""
                  }`}
                  size="lg"
                >
                  {pay === "transfer" 
                    ? "Quét mã QR ở trên để hoàn tất" 
                    : saving ? "Đang xử lý..." : "Xác nhận đặt phòng"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

const Row = ({ l, v }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">{l}</span>
    <span className="font-medium text-right">{v}</span>
  </div>
);