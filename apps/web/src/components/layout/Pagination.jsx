import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Component phân trang chuẩn giao diện Núi Homestay
 * @param {number} currentPage Trang hiện tại (từ 1)
 * @param {number} totalPages Tổng số trang
 * @param {function} onPageChange Hàm chuyển trang
 * @param {number} totalItems Tổng số dòng dữ liệu
 * @param {number} itemsPerPage Số lượng dòng hiển thị / trang (mặc định 5 hoặc 10)
 * @param {string} itemName Tên đơn vị hiển thị (ví dụ: "phòng", "loại phòng", "đơn")
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 5,
  itemName = "mục",
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 1) pages.push(1);
      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) {
        if (i > 0 && i <= totalPages) pages.push(i);
      }

      if (end < totalPages - 1) pages.push("...");
      if (end < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 text-sm">
      {/* Thông tin số lượng hiển thị bên trái */}
      <div className="text-slate-500 text-xs sm:text-sm">
        Hiển thị {startItem} – {endItem} trong tổng số {totalItems} {itemName}
      </div>

      {/* Bộ nút phân trang căn phải */}
      <div className="flex items-center gap-1.5">
        {/* Nút lùi */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Các con số trang */}
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none text-xs">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                currentPage === page
                  ? "bg-[#0ea5e9] text-white shadow-sm font-bold"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Nút tiến */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}