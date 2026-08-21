import React, { useMemo, useState } from "react";
import {
  MessageSquareText,
  Send,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import pb from "@/lib/pocketbaseClient";
import Pagination from "@/components/layout/Pagination";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReviewTab({ reviews = [], load }) {
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [expandedIds, setExpandedIds] = useState({});

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Số lượng đánh giá trên 1 trang

  const sortedReviews = useMemo(
    () => [...(reviews || [])].sort((a, b) => new Date(b.created) - new Date(a.created)),
    [reviews]
  );

  // Tính toán dữ liệu phân trang
  const totalItems = sortedReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, startIndex + itemsPerPage);

  const toggleReview = (reviewId) => {
    setExpandedIds((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const handleReply = async (review) => {
    const value = (drafts[review.id] ?? review.reply ?? "").trim();
    if (!value) return;

    setSaving((prev) => ({ ...prev, [review.id]: true }));

    try {
      await pb.collection("reviews").update(review.id, {
        reply: value,
        replyAt: new Date().toISOString(),
      });

      setDrafts((prev) => ({ ...prev, [review.id]: "" }));
      if (load) load();
    } catch (error) {
      console.error("Lỗi lưu phản hồi đánh giá:", error);
      alert("Không thể lưu phản hồi. Vui lòng thử lại.");
    } finally {
      setSaving((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Đánh giá khách hàng</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary border border-primary/10">
          <MessageSquareText className="w-4 h-4" />
          {sortedReviews.length} đánh giá
        </div>
      </div>

      {sortedReviews.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="py-10 text-center text-muted-foreground">
            Chưa có đánh giá nào được gửi từ khách hàng.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* DANH SÁCH ĐÁNH GIÁ THEO TRANG */}
          {paginatedReviews.map((review) => {
            const expandedRoom = review.expand?.roomCode;
            const roomLabel =
              expandedRoom?.name ||
              expandedRoom?.code ||
              review.roomCode?.name ||
              review.roomCode?.code ||
              (typeof review.roomCode === "string" ? review.roomCode : "Phòng");
            const replyValue = drafts[review.id] ?? review.reply ?? "";
            const isSaving = !!saving[review.id];
            const isExpanded = !!expandedIds[review.id];

            return (
              <Card key={review.id} className="overflow-hidden border-border/70 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleReview(review.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg font-bold">
                              {review.author || "Khách hàng"}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {roomLabel} · {new Date(review.created).toLocaleString("vi-VN")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: Number(review.rating) || 5 }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber-400" />
                              ))}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="space-y-4 border-t bg-muted/10 pt-4">
                    <div className="rounded-xl border bg-muted/20 p-3">
                      <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
                        {review.comment || "Khách hàng chưa viết nội dung đánh giá."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground/80">
                        Phản hồi từ Homestay
                      </label>

                      <Textarea
                        value={replyValue}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                        placeholder="Nhập phản hồi cho khách hàng..."
                        className="min-h-[110px] resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {review.reply ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Đã trả lời
                          </>
                        ) : (
                          <>
                            <MessageSquareText className="w-4 h-4 text-amber-500" />
                            Chưa có phản hồi
                          </>
                        )}
                      </div>

                      <Button
                        onClick={() => handleReply(review)}
                        disabled={isSaving || !replyValue.trim()}
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSaving ? "Đang gửi..." : "Gửi phản hồi"}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* COMPONENT PHÂN TRANG */}
          <div className="rounded-xl border border-border bg-card overflow-hidden mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemName="đánh giá"
            />
          </div>
        </div>
      )}
    </div>
  );
}