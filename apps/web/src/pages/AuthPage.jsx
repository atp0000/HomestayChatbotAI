import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { login, signup, forgot, resendVerification } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("login"); 
  const [f, setF] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!f.email || !emailRegex.test(f.email)) {
      setErr("Vui lòng nhập đúng định dạng Email (ví dụ: example@gmail.com).");
      return false;
    }

    if (tab === "forgot" || tab === "resend") return true;

    if (!f.password || f.password.length < 8) {
      setErr("Mật khẩu phải có ít nhất 8 ký tự.");
      return false;
    }

    if (tab === "signup") {
      if (!f.fullName.trim()) {
        setErr("Vui lòng nhập Họ và tên.");
        return false;
      }

      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!f.phone || !phoneRegex.test(f.phone)) {
        setErr("Số điện thoại không hợp lệ (Phải đúng 10 số).");
        return false;
      }
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!validate()) return;

    setLoading(true);

    try {
      if (tab === "login") {
        const a = await login(f.email, f.password);
        go(a.record);
      } else if (tab === "signup") {
        await signup(f);
        setMsg("Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác thực trước khi đăng nhập. Link xác thực chỉ có hiệu lực trong 1 phút.");
        setTab("login");
      } else if (tab === "forgot") {
        await forgot(f.email);
        setMsg("Đã gửi email khôi phục mật khẩu (nếu email tồn tại).");
      } else if (tab === "resend") {
        await resendVerification(f.email);
        setMsg("Đã gửi lại email xác thực! Vui lòng kiểm tra hộp thư của bạn.");
      }
    } catch (e2) {
      setErr(e2.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const go = (u) => nav(u?.role === "admin" ? "/admin" : u?.role === "receptionist" ? "/reception" : "/");

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 text-2xl font-extrabold text-primary mb-6">
          <Palmtree className="h-7 w-7" />
          <span>Núi Homestay</span>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-4">
            {tab === "login" || tab === "signup" ? (
              <Tabs value={tab} onValueChange={(val) => { setTab(val); setErr(""); setMsg(""); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                  <TabsTrigger value="signup">Đăng ký</TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <CardTitle className="text-center text-lg font-semibold">
                {tab === "forgot" ? "Khôi phục mật khẩu" : "Gửi lại email xác thực"}
              </CardTitle>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              
              {/* Ô Nhập cho Đăng ký */}
              {tab === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input
                      id="fullName"
                      required
                      placeholder="Nguyễn Văn A"
                      value={f.fullName}
                      onChange={(e) => setF({ ...f, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      required
                      placeholder="0912345678"
                      maxLength={10}
                      value={f.phone}
                      onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </>
              )}

              {/* Ô Nhập Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </div>

              {/* Ô Nhập Mật khẩu */}
              {(tab === "login" || tab === "signup") && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="Tối thiểu 8 ký tự"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                  />

                  {tab === "login" && (
                    <div className="flex justify-between items-center pt-1">
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={() => { setTab("resend"); setErr(""); setMsg(""); }}
                      >
                        Chưa nhận được email xác thực?
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                        onClick={() => { setTab("forgot"); setErr(""); setMsg(""); }}
                      >
                        Quên mật khẩu?
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {tab === "forgot" && (
                <p className="text-xs text-muted-foreground">
                  Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
                </p>
              )}

              {tab === "resend" && (
                <p className="text-xs text-muted-foreground">
                  Nhập email đăng ký để nhận lại đường dẫn kích hoạt tài khoản.
                </p>
              )}

              {/* Thông báo lỗi / Thành công */}
              {err && <p className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-md">{err}</p>}
              {msg && <p className="text-primary text-sm font-medium bg-primary/10 p-3 rounded-md">{msg}</p>}

              {/* Nút Submit chính */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Đang xử lý..."
                  : tab === "login"
                  ? "Đăng nhập"
                  : tab === "signup"
                  ? "Tạo tài khoản"
                  : tab === "forgot"
                  ? "Gửi email khôi phục"
                  : "Gửi lại link xác thực"}
              </Button>

              {/* Quay lại Đăng nhập từ Quên mật khẩu hoặc Gửi lại Email */}
              {(tab === "forgot" || tab === "resend") && (
                <div className="text-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setTab("login"); setErr(""); setMsg(""); }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại Đăng nhập
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

      </div>
    </SiteLayout>
  );
}