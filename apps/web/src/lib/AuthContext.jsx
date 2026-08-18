import React, { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbaseClient";
//pb: Instance kết nối SDK PocketBase được khởi tạo sẵn từ tệp cấu hình
//AuthCtx: Đối tượng Context dùng để chia sẻ dữ liệu giữa các component
//mà không cần truyền props thủ công qua nhiều tầng (prop drilling).
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
//AuthCtx: Đối tượng Context dùng để chia sẻ dữ liệu giữa các component
//mà không cần truyền props thủ công qua nhiều tầng (prop drilling).
//Lắng nghe sự thay đổi trạng thái đăng nhập. Ngay khi người dùng đăng nhập
//thành công hoặc bấm Đăng xuất, setUser(rec) sẽ tự động chạy và cập nhật lại giao diện trên toàn hệ thống.
 
//pb.authStore.onChange(...):
  //Đăng ký một listener lắng nghe mọi biến động của token/user (khi login, logout hoặc token hết hạn).
  //Mỗi khi trạng thái auth thay đổi, hàm callback (_t, rec) => setUser(rec) chạy, cập nhật state user ngay lập tức.

useEffect(() => {
    const unsub = pb.authStore.onChange((_t, rec) => setUser(rec));
    return unsub;
  }, []);

  //return unsub;:
  //Hàm cleanup giúp huỷ đăng ký listener khi AuthProvider bị unmount, tránh leak bộ nhớ.

  const value = {
    user,
    isAuthed: pb.authStore.isValid,
    role: user?.role || (user ? "customer" : null),
     //user: Chứa object thông tin user hiện tại (ID, email, name, role...).
    //isAuthed: Trả về true/false kiểm tra xem token xác thực có tồn tại và còn hiệu lực hay không.
    //role: Xác định quyền của user. Ưu tiên lấy user.role, nếu không có nhưng user tồn tại thì gán mặc định là "customer", ngược lại là null.
    //: Gọi API PocketBase xác thực email/mật khẩu
   
    login: async (email, password) => {
      try {
        return await pb.collection("users").authWithPassword(email, password);
      } catch (err) {
        throw new Error("Email hoặc mật khẩu không chính xác.");
      }
    },
    //Gọi SDK PocketBase xác thực với cặp email/password.
    //Nếu thành công, PocketBase tự lưu token vào authStore và kích hoạt hàm onChange ở useEffect trên.
    //Nếu thất bại, bắt lỗi và ném ra (throw) thông báo tiếng Việt thân thiện với người dùng.


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