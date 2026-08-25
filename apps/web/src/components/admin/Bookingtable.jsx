import React, { useState, useEffect, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { fmtVND, fmtDate } from "@/lib/store";
import Pagination from "@/components/layout/Pagination";

const ITEMS_PER_PAGE = 10;

export default function BookingTable({ bookings = [], setStatus, del, editableStatus = false }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset về trang 1 khi danh sách bookings thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings.length]);

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

  // Tính toán dữ liệu phân trang
  const totalItems = bookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return bookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [bookings, currentPage]);

  // Danh sách các trạng thái khớp đúng với PocketBase Schema
  const statusOptions = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkedin", label: "Đang ở" },
    { value: "checkedout", label: "Đã trả phòng" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  // Hàm chuyển đổi mã trạng thái sang Tiếng Việt cho chế độ chỉ xem
  const renderStatusText = (status) => {
    const found = statusOptions.find((opt) => opt.value === status);
    return found ? found.label : status;
  };

  // Lấy thông tin người đặt
  const renderBookedBy = (b) => {
    const creator = b.expand?.customer;
    if (!creator) {
      return <span className="text-muted-foreground">Khách tự đặt</span>;
    }
    return creator.fullName || creator.name || creator.email;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
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
            {paginatedBookings.map((b) => {
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

                  <td className="p-3">{renderBookedBy(b)}</td>
                  <td className="p-3 font-mono">{displayRoomInfo}</td>
                  <td className="p-3 whitespace-nowrap">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {fmtVND(b.total)}
                  </td>

                  {/* CỘT TRẠNG THÁI */}
                  <td className="p-3">
                    {editableStatus ? (
                      <select
                        value={b.status || "pending"}
                        onChange={(e) => setStatus(b.id, e.target.value)}
                        className="bg-background border border-input text-foreground text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block bg-secondary rounded-lg px-2.5 py-1 text-xs font-semibold border border-border whitespace-nowrap">
                        {renderStatusText(b.status)}
                      </span>
                    )}
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
            {paginatedBookings.length === 0 && (
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

      {/* COMPONENT PHÂN TRANG Ở FOOTER BẢNG */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="đơn đặt phòng"
      />
    </div>
  );
}