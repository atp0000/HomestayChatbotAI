import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import BookingTable from "@/components/admin/BookingTable";

const ITEMS_PER_PAGE = 10;

export default function BookingsTab({ bookings = [], setStatus, del }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset về trang 1 khi người dùng gõ từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 🔍 Lọc danh sách theo Mã booking hoặc Tên khách
  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return bookings;

    return bookings.filter((b) => {
      const codeMatch = b.code?.toLowerCase().includes(keyword);
      const nameMatch = b.guestName?.toLowerCase().includes(keyword);
      return codeMatch || nameMatch;
    });
  }, [bookings, searchTerm]);

  // 📄 Cắt dữ liệu theo trang (10 dòng/trang)
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">
          Tất cả đơn đặt phòng
        </h2>

        {/* Thanh tìm kiếm */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã booking hoặc tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Bảng dữ liệu gốc (truyền danh sách đã lọc và phân trang) */}
      <BookingTable
        bookings={paginatedBookings}
        setStatus={setStatus}
        del={del}
      />

      {/* Điều hướng phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}{" "}
            trong tổng số {filteredBookings.length} đơn
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-xs rounded-lg border ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}