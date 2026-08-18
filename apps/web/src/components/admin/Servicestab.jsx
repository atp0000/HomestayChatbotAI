import { useState } from "react";
import { Plus, Trash2, Edit, X } from "lucide-react";
import pb from "@/lib/pocketbaseClient";
import { fmtVND } from "@/lib/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ServicesTab({ services, del, load }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State (Đã bỏ field 'code')
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "lượt",
    quantity: "",
    image: null,
    existingImage: "",
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      price: "",
      unit: "lượt",
      quantity: "",
      image: null,
      existingImage: "",
    });
    setOpen(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name || "",
      price: service.price || "",
      unit: service.unit || "lượt",
      quantity: service.quantity || "",
      image: null,
      existingImage: service.image || "",
    });
    setOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", Number(formData.price));
      data.append("unit", formData.unit);
      data.append("quantity", formData.quantity);

      if (formData.image) {
        data.append("image", formData.image);
      }

      if (editingId) {
        await pb.collection("services").update(editingId, data);
      } else {
        await pb.collection("services").create(data);
      }

      setOpen(false);
      load();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi lưu dịch vụ!");
    }
  };

  const getImageUrl = (record, filename) => {
    if (!record || !filename) return null;
    return pb.files.getURL(record, filename);
  };

  return (
    <div className="space-y-6">
      {/* HEADER TAB */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dịch vụ</h2>
        <Button
          onClick={handleOpenAddModal}
          className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold"
        >
          <Plus className="w-4 h-4 mr-1" /> Thêm mới
        </Button>
      </div>

      {/* DANH SÁCH BẢNG DỊCH VỤ (Bỏ cột Mã dịch vụ) */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-sky-300">
            <TableRow className="hover:bg-sky-300">
              <TableHead className="text-slate-900 font-bold">Tên dịch vụ</TableHead>
              <TableHead className="text-slate-900 font-bold">Đơn giá</TableHead>
              <TableHead className="text-slate-900 font-bold">Đơn vị</TableHead>
              <TableHead className="text-slate-900 font-bold text-center">Hình ảnh</TableHead>
              <TableHead className="text-slate-900 font-bold text-center">Số lượng</TableHead>
              <TableHead className="text-slate-900 font-bold text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.name}</TableCell>
                <TableCell className="font-medium">{fmtVND(s.price)}</TableCell>
                <TableCell>
                  <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                    {s.unit || "lượt"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {s.image ? (
                    <img
                      src={getImageUrl(s, s.image)}
                      alt={s.name}
                      className="w-12 h-10 object-cover rounded mx-auto border"
                    />
                  ) : (
                    <div className="w-12 h-10 bg-muted rounded mx-auto flex items-center justify-center text-xs text-muted-foreground">
                      Không ảnh
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">{s.quantity || "...."}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => del("services", s.id)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditModal(s)}
                      className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Chưa có dịch vụ nào được tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL THÊM / SỬA (Bỏ ô nhập Mã dịch vụ) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? "Chỉnh sửa dịch vụ" : "Thêm mới dịch vụ"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Tên dịch vụ</label>
              <Input
                required
                placeholder="VD: Đưa đón tận nơi, Nước ngọt..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-0 border-b border-gray-400 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Đơn giá</label>
                <Input
                  required
                  type="number"
                  placeholder="15000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="border-0 border-b border-gray-400 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Đơn vị</label>
                <Input
                  placeholder="lượt, lon, kg..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="border-0 border-b border-gray-400 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Số lượng</label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="border-0 border-b border-gray-400 rounded-none px-0 focus-visible:ring-0 focus-visible:border-sky-500"
                />
              </div>
            </div>

            {/* UPLOAD ẢNH */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Hình ảnh</label>
              <div className="flex items-center gap-4">
                {(formData.image || formData.existingImage) && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img
                      src={
                        formData.image
                          ? URL.createObjectURL(formData.image)
                          : getImageUrl(
                              services.find((s) => s.id === editingId),
                              formData.existingImage
                            )
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null, existingImage: "" })}
                      className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <label className="w-24 h-20 bg-muted hover:bg-muted/80 rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer font-medium border border-dashed transition-colors">
                  + Thêm ảnh
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" className="bg-sky-200 text-slate-900 hover:bg-sky-300">
                Lưu
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="bg-rose-200 text-rose-900 hover:bg-rose-300"
                onClick={() => setOpen(false)}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}