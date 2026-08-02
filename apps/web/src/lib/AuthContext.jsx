import React, { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbaseClient";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);

//Lắng nghe sự thay đổi trạng thái đăng nhập. Ngay khi người dùng đăng nhập
//thành công hoặc bấm Đăng xuất, setUser(rec) sẽ tự động chạy và cập nhật lại giao diện trên toàn hệ thống.
 
useEffect(() => {
    const unsub = pb.authStore.onChange((_t, rec) => setUser(rec));
    return unsub;
  }, []);

  const value = {
    user,
    isAuthed: pb.authStore.isValid,
    role: user?.role || (user ? "customer" : null),
    
    //: Gọi API PocketBase xác thực email/mật khẩu
    login: async (email, password) => {
      try {
        return await pb.collection("users").authWithPassword(email, password);
      } catch (err) {
        throw new Error("Email hoặc mật khẩu không chính xác.");
      }
    },

    signup: async (data) => {
      try {
        // 1. Tạo tài khoản trong PocketBase
        await pb.collection("users").create({
          email: data.email,
          password: data.password,
          passwordConfirm: data.password,
          fullName: data.fullName,
          phone: data.phone || "",
          role: "customer",
        });

        // 2. Tự động đăng nhập luôn sau khi tạo thành công
        return await pb.collection("users").authWithPassword(data.email, data.password);
      } catch (err) {
        // Kiểm tra lỗi Email bị trùng từ PocketBase
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
        throw new Error("Không thể gửi yêu cầu. Vui lòng kiểm tra lại Email.");
      }
    },

    logout: () => pb.authStore.clear(),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);