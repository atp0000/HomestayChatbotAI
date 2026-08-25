import React, { useState, useEffect } from "react";
import pb from "@/lib/pocketbaseClient";
import { Button } from "@/components/ui/button";
import { X, Send, Bell } from "lucide-react";
import Pagination from "@/components/layout/Pagination"; // 🟢 Import component Phân trang

const ITEMS_PER_PAGE = 5; // Số lượng yêu cầu hiển thị trên mỗi trang

export default function ReceptionSupportTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // State Modal Trả lời
  const [selectedReq, setSelectedReq] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      const records = await pb.collection("support_requests").getFullList({
        sort: "-created",
        expand: "user",
      });
      setRequests(records);
    } catch (err) {
      console.error("Lỗi tải danh sách hỗ trợ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Realtime subscription
    pb.collection("support_requests").subscribe("*", async (e) => {
      if (e.action === "create" || e.action === "update") {
        const updatedRecord = await pb.collection("support_requests").getOne(e.record.id, {
          expand: "user",
        });

        setRequests((prev) => {
          const exists = prev.some((item) => item.id === updatedRecord.id);
          if (exists) {
            return prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
          }
          return [updatedRecord, ...prev];
        });
      }
    });

    return () => {
      pb.collection("support_requests").unsubscribe("*");
    };
  }, []);

  // Tính toán dữ liệu phân trang
  const totalItems = requests.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRequests = requests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Đảm bảo không bị out-of-bound trang khi danh sách giảm số lượng
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalItems, totalPages, currentPage]);

  // Báo chấm đỏ tổng số yêu cầu mới chưa xử lý
  const pendingCount = requests.filter(
    (req) => !req.reply || req.reply.trim() === "" || req.status !== "resolved"
  ).length;

  const handleOpenReply = (req) => {
    setSelectedReq(req);
    setReplyText(req.reply || "");
  };

  const handleCloseReply = () => {
    setSelectedReq(null);
    setReplyText("");
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!selectedReq || !replyText.trim()) return;

    setSaving(true);
    try {
      await pb.collection("support_requests").update(selectedReq.id, {
        reply: replyText.trim(),
        status: "resolved",
      });

      handleCloseReply();
      fetchRequests();
    } catch (err) {
      console.error("Lỗi cập nhật PocketBase:", err);
      alert("Không thể lưu phản hồi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
          Quản Lý Yêu Cầu Hỗ Trợ (Lễ Tân)
          {pendingCount > 0 && (
            <span className="relative flex items-center gap-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-xs">
              <span className="animate-ping absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
              <Bell className="w-3 h-3" />
              {pendingCount} mới
            </span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Đang tải danh sách...</div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3">Thời gian</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Liên hệ</th>
                <th className="p-3">Chủ đề</th>
                <th className="p-3">Nội dung</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Chưa có yêu cầu hỗ trợ nào.
                  </td>
                </tr>
              ) : (
                currentRequests.map((req) => {
                  const userInfo = req.expand?.user;
                  const isAnswered = Boolean(req.reply && req.reply.trim() !== "");

                  return (
                    <tr
                      key={req.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {!isAnswered && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {new Date(req.created).toLocaleString("vi-VN")}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {userInfo?.fullName || "Khách chưa đặt tên"}
                      </td>
                      <td className="p-3 text-xs">
                        <div>
                          SĐT: <strong className="text-slate-800">{userInfo?.phone || "Chưa có"}</strong>
                        </div>
                        <div className="text-slate-500">Email: {userInfo?.email || "Chưa có"}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{req.subject}</td>
                      <td className="p-3 max-w-xs break-words">
                        <div>{req.message}</div>
                        {isAnswered && (
                          <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                            <strong>Trả lời:</strong> {req.reply}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            isAnswered ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isAnswered ? "Đã trả lời" : "Chưa xử lý"}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <Button
                          onClick={() => handleOpenReply(req)}
                          className={`font-semibold text-xs h-8 px-4 ${
                            !isAnswered
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-teal-700 hover:bg-teal-800 text-white"
                          }`}
                        >
                          {isAnswered ? "Sửa trả lời" : "Trả lời"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* 🟢 TÍCH HỢP COMPONENT PHÂN TRANG */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="yêu cầu"
          />
        </div>
      )}

      {/* MODAL TRẢ LỜI KHÁCH HÀNG */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={handleCloseReply}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-3">Phản hồi câu hỏi khách hàng</h3>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 space-y-1 mb-4">
              <div>
                <strong>Khách hàng:</strong> {selectedReq.expand?.user?.fullName || "Khách chưa đặt tên"}
              </div>
              <div>
                <strong>Chủ đề:</strong> {selectedReq.subject}
              </div>
              <div>
                <strong>Nội dung:</strong> {selectedReq.message}
              </div>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập nội dung phản hồi cho khách..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseReply}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !replyText.trim()}
                  className="bg-teal-700 hover:bg-teal-800 text-white h-9 px-5 text-xs font-semibold gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  {saving ? "Đang gửi..." : "Gửi phản hồi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}