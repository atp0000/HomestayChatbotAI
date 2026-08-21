import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import BookingTable from "@/components/admin/BookingTable";
import Pagination from "@/components/layout/Pagination";

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

  // 📄 Tính toán và cắt dữ liệu theo trang
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
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

      {/* Bảng dữ liệu và Component Phân trang */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        <BookingTable
          bookings={paginatedBookings}
          setStatus={setStatus}
          del={del}
        />

        {/* COMPONENT PHÂN TRANG */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          itemName="đơn đặt phòng"
        />
      </div>
    </div>
  );
}