import { useEffect } from "react";
import { Trash2, UserCheck, User } from "lucide-react";
import { fmtVND, fmtDate } from "@/lib/store";

export default function BookingTable({ bookings, setStatus, del }) {
  // 🟢 Tự động quét và cập nhật Database khi quá ngày trả phòng
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;

    const today = new Date().toISOString().split("T")[0];

    bookings.forEach((b) => {
      if (!b.checkOut) return;

      try {
        const checkOutDate = new Date(b.checkOut).toISOString().split("T")[0];

        if (
          checkOutDate < today &&
          (b.status === "checkedin" || b.status === "confirmed")
        ) {
          setStatus(b.id, "checkedout");
        }
      } catch (err) {
        console.error("Lỗi parse ngày checkOut:", err);
      }
    });
  }, [bookings, setStatus]);

  // Hàm chuyển đổi mã trạng thái sang Tiếng Việt
  const renderStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "checkedin":
        return "Đang ở";
      case "checkedout":
        return "Đã trả phòng";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // 🔵 Lấy thông tin người đặt từ pb.authStore (qua b.expand.customer)
  // 🔵 Lấy thông tin người đặt (Chỉ hiện tên dạng chữ thuần túy)
  const renderBookedBy = (b) => {
    const creator = b.expand?.customer;

    if (!creator) {
      return <span className="text-muted-foreground">Khách tự đặt</span>;
    }

    return creator.fullName || creator.name || creator.email;
  };
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="bg-secondary">
          <tr>
            {[
              "Mã",
              "Khách ở",
              "Người đặt",
              "Phòng",
              "Nhận → Trả",
              "Tổng",
              "Trạng thái",
              "Thao tác",
            ].map((h) => (
              <th key={h} className="text-left p-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const expandedRoom = b.expand?.roomCode;
            const displayRoomInfo =
              expandedRoom?.code || expandedRoom?.id || b.roomCode || "";

            return (
              <tr
                key={b.id}
                className="border-t border-border hover:bg-secondary/30 transition-colors"
              >
                <td className="p-3 font-semibold text-primary">{b.code}</td>
                <td className="p-3">
                  <div className="font-medium">{b.guestName}</div>
                  <span className="text-xs text-muted-foreground">
                    {b.guestPhone}
                  </span>
                </td>
                
                {/* 🟢 Cột Người đặt */}
                <td className="p-3">{renderBookedBy(b)}</td>
                
                <td className="p-3 font-mono">{displayRoomInfo}</td>
                <td className="p-3 whitespace-nowrap">
                  {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                </td>
                <td className="p-3 font-semibold whitespace-nowrap">
                  {fmtVND(b.total)}
                </td>
                <td className="p-3">
                  <span className="inline-block bg-secondary rounded-lg px-2.5 py-1 text-xs font-semibold border border-border whitespace-nowrap">
                    {renderStatusText(b.status)}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => del("bookings", b.id)}
                    className="text-rose-500 hover:text-rose-600 transition-colors p-1"
                    title="Xóa đơn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          {bookings.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="text-center py-6 text-muted-foreground"
              >
                Chưa có đơn đặt phòng nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}