import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersTab({ customers, del }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Danh sách khách hàng</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
            {customers && customers.length > 0 ? (
              customers.map((c) => (
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
      </div>
    </div>
  );
}