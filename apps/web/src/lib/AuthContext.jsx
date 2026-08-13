import React, { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbaseClient";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
useEffect(() => {
    const unsub = pb.authStore.onChange((_t, rec) => setUser(rec));
    return unsub;
  }, []);

  const value = {
    user,
    isAuthed: pb.authStore.isValid,
    role: user?.role || (user ? "customer" : null),
    login: async (email, password) => {
      try {
        return await pb.collection("users").authWithPassword(email, password);
      } catch (err) {
        throw new Error("Email hoặc mật khẩu không chính xác.");
      }
    },
    signup: async (data) => {
      let newUser = null;

      try {
        // 1. Tạo tài khoản người dùng
        newUser = await pb.collection("users").create({
          email: data.email,
          password: data.password,
          passwordConfirm: data.password,
          fullName: data.fullName,
          phone: data.phone || "",
          role: "customer",
          emailVisibility: true,
        });

        // 2. Thử gửi mail xác nhận trực tiếp
        await pb.collection("users").requestVerification(data.email);

        return true;
      } catch (err) {
        // Nếu đã tạo record ở bước 1 nhưng gửi mail thất bại (vd: lỗi SMTP/Email không hợp lệ) -> Rollback bằng cách xóa ngay
        if (newUser?.id) {
          try {
            await pb.collection("users").delete(newUser.id);
          } catch (deleteErr) {
            console.error("Lỗi khi tự động dọn dẹp record rác:", deleteErr);
          }
        }

        if (err?.data?.data?.email?.code === "validation_not_unique") {
          throw new Error("Email này đã được đăng ký. Vui lòng chọn email khác hoặc Đăng nhập.");
        }

        throw new Error(err.message || "Tạo tài khoản thất bại. Vui lòng thử lại.");
      }
    },
   forgot: async (email) => {
      try {
        return await pb.collection("users").requestPasswordReset(email);
      } catch (err) {
        throw new Error("Không thể gửi email khôi phục. Vui lòng kiểm tra lại địa chỉ Email.");
      }
    },

    logout: () => pb.authStore.clear(),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);