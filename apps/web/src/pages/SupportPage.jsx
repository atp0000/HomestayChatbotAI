import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fmtDate } from "@/lib/store";
import Pagination from "@/components/layout/Pagination";

import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  HelpCircle,
  Clock,
  CheckCircle2,
  User,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  pending: { label: "Chờ phản hồi", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  answered: { label: "Đã phản hồi", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  closed: { label: "Đã đóng", className: "bg-slate-500/10 text-slate-600 border-slate-200" },
};

export default function SupportPage() {
  const { user, isAuthed } = useAuth();
  const currentUser = user || pb.authStore.record;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hasNewResponse, setHasNewResponse] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchRequests = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await pb.collection("support_requests").getFullList({
        filter: pb.filter("user = {:id}", { id: currentUser.id }),
        sort: "-created",
      });
      setList(res);

      // 🔴 KIỂM TRA PHẢN HỒI MỚI CHƯA ĐỌC
      const lastSeen = localStorage.getItem(`last_seen_reply_${currentUser.id}`) || "1970-01-01T00:00:00.000Z";
      
      const hasUnread = res.some((item) => {
        const isAnswered = Boolean(item.reply && item.reply.trim() !== "" && item.reply !== "N/A");
        const updatedTime = item.updated || item.created;
        return isAnswered && new Date(updatedTime) > new Date(lastSeen);
      });

      setHasNewResponse(hasUnread);
    } catch (err) {
      console.error("Lỗi khi tải danh sách hỗ trợ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Lắng nghe Realtime phản hồi từ Lễ tân
    if (currentUser?.id) {
      pb.collection("support_requests").subscribe("*", (e) => {
        if (e.record.user === currentUser.id) {
          fetchRequests();
        }
      });
    }

    return () => {
      pb.collection("support_requests").unsubscribe("*");
    };
  }, [user]);

  // 🟢 Đánh dấu đã đọc khi mở Modal hoặc thực hiện tương tác
  const handleOpenModal = () => {
    markAllAsRead();
    setShowModal(true);
  };

  const markAllAsRead = () => {
    if (currentUser?.id) {
      localStorage.setItem(`last_seen_reply_${currentUser.id}`, new Date().toISOString());
      setHasNewResponse(false);
    }
  };

  if (!isAuthed) return <Navigate to="/auth" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await pb.collection("support_requests").create({
        user: currentUser?.id,
        subject: subject.trim(),
        message: message.trim(),
        status: "pending",
      });

      setSubject("");
      setMessage("");
      setShowModal(false);
      await fetchRequests();
    } catch (err) {
      alert("Có lỗi xảy ra khi gửi yêu cầu: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + itemsPerPage);

  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trung tâm hỗ trợ</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gửi thắc mắc và xem lại lịch sử phản hồi từ lễ tân
            </p>
          </div>

          {/* 🔴 NÚT CÓ CHẤM ĐỎ/CẢNH BÁO KHI CÓ PHẢN HỒI MỚI */}
          <div className="relative">
            <Button
              onClick={handleOpenModal}
              size="sm"
              className="rounded-full gap-1.5 shadow-xs relative"
            >
              <Plus className="w-4 h-4" /> Thêm hỏi đáp
            </Button>

            {hasNewResponse && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </div>
        </div>

        {/* TRẠNG THÁI TRỐNG */}
        {!loading && list.length === 0 && (
          <Card className="text-center py-10 border-dashed">
            <CardContent className="space-y-3">
              <MessageSquare className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <div>
                <CardTitle className="text-base">Chưa có yêu cầu hỗ trợ nào</CardTitle>
                <CardDescription className="text-xs">
                  Bạn chưa tạo câu hỏi hoặc thắc mắc nào với bộ phận lễ tân.
                </CardDescription>
              </div>
              
            </CardContent>
          </Card>
        )}

        {/* DANH SÁCH YÊU CẦU HỖ TRỢ */}
        {list.length > 0 && (
          <div className="space-y-4">
            {paginatedList.map((item) => {
              const isAnswered = Boolean(item.reply && item.reply.trim() !== "" && item.reply !== "N/A");
              const currentStatus = isAnswered ? "answered" : (item.status || "pending");
              const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

              return (
                <Card
                  key={item.id}
                  onClick={markAllAsRead}
                  className="overflow-hidden border shadow-none hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <CardHeader className="p-4 bg-muted/20 border-b">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[11px] px-2 py-0 ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDate(item.created)}
                        </span>
                      </div>
                    </div>

                    <CardTitle className="text-base font-medium flex items-center gap-1.5 mt-2">
                      <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{item.subject}</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-700 whitespace-pre-wrap">
                      <strong className="block text-slate-900 mb-1">Nội dung câu hỏi:</strong>
                      {item.message}
                    </div>

                    {isAnswered ? (
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3 text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>Phản hồi từ Lễ tân:</span>
                        </div>
                        <p className="whitespace-pre-wrap text-emerald-800 pl-5">
                          {item.reply}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic pt-1">
                        * Bộ phận lễ tân đang xử lý thắc mắc của bạn.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <div className="rounded-xl border bg-card overflow-hidden mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemName="yêu cầu hỗ trợ"
              />
            </div>
          </div>
        )}

        {/* MODAL THÊM MỚI */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-6 relative border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Thêm mới hỏi đáp
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ đề cần hỗ trợ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Hỏi về giờ check-in, thuê xe máy..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-sm py-1.5 border-b border-slate-300 focus:border-slate-800 dark:focus:border-slate-200 focus:outline-none bg-transparent placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nội dung chi tiết
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Nhập chi tiết thắc mắc của bạn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-sm py-1.5 border-b border-slate-300 focus:border-slate-800 dark:focus:border-slate-200 focus:outline-none bg-transparent placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 rounded-full text-xs font-bold text-white bg-pink-400 hover:bg-pink-500 transition-colors shadow-xs"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="px-8 py-2 rounded-full text-xs font-bold text-slate-900 bg-sky-300 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    LƯU
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}