import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/layout/Pagination";

export default function CustomersTab({ customers = [], del }) {
  // State quản lý Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Số lượng khách hàng trên 1 trang

  // Tính toán dữ liệu hiển thị theo trang
  const totalItems = customers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Danh sách khách hàng</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 text-sm font-semibold">
              <th className="p-3">Tên khách hàng</th>
              <th className="p-3">Số điện thoại</th>
              <th className="p-3">Email</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers && paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30 text-sm">
                  {/* Tên khách hàng */}
                  <td className="p-3 font-medium">
                    {c.fullName || c.name || "Khách lẻ"}
                  </td>

                  {/* Số điện thoại */}
                  <td className="p-3">
                    {c.phone || "---"}
                  </td>

                  {/* Email */}
                  <td className="p-3">
                    {c.email || "---"}
                  </td>

                  {/* Thao tác xóa */}
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => del && del("users", c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">
                  Chưa có dữ liệu khách hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* COMPONENT PHÂN TRANG */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          itemName="khách hàng"
        />
      </div>
    </div>
  );
}