import { useState } from "react";
import pb from "@/lib/pocketbaseClient";
import { fmt } from "@/lib/store";
import { Trash2, Edit, Power, Plus, X } from "lucide-react";
import Pagination from "@/components/layout/Pagination";

const ITEMS_PER_PAGE = 5;

export default function RoomsTab({ rooms, types, del, load }) {
  const [subTab, setSubTab] = useState("roomList");
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);

  // Form Loại phòng (Chứa đầy đủ thông tin thương mại/mô tả/ảnh)
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    price: "",
    capacity: 2,
    beds: 1,
    rules: "Cấm hút thuốc",
    amenities: "Wifi, Điều hòa",
    description: "Phòng tiện nghi tại Núi Homestay.",
  });

  // Form Phòng vật lý (Chỉ giữ lại Tên/Mã phòng, Loại phòng, Khu vực)
  const [roomForm, setRoomForm] = useState({
    code: "",
    room_type_id: "",
    area: "Tầng 1",
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // State phân trang
  const [typePage, setTypePage] = useState(1);
  const [roomPage, setRoomPage] = useState(1);

  const totalTypePages = Math.ceil((types?.length || 0) / ITEMS_PER_PAGE) || 1;
  const paginatedTypes = (types || []).slice(
    (typePage - 1) * ITEMS_PER_PAGE,
    typePage * ITEMS_PER_PAGE
  );

  const totalRoomPages = Math.ceil((rooms?.length || 0) / ITEMS_PER_PAGE) || 1;
  const paginatedRooms = (rooms || []).slice(
    (roomPage - 1) * ITEMS_PER_PAGE,
    roomPage * ITEMS_PER_PAGE
  );

  const toggleRoomStatus = async (room) => {
    const newStatus = room.status === "active" ? "inactive" : "active";
    try {
      await pb.collection("rooms").update(room.id, { status: newStatus });
      load();
    } catch {
      alert("Lỗi khi đổi trạng thái phòng!");
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Mở modal Thêm mới
  const handleOpenAddModal = () => {
    if (subTab === "roomTypes") {
      setEditingTypeId(null);
      setTypeForm({
        code: "",
        name: "",
        price: "",
        capacity: 2,
        beds: 1,
        rules: "Cấm hút thuốc",
        amenities: "Wifi, Điều hòa",
        description: "Phòng tiện nghi tại Núi Homestay.",
      });
      setSelectedFiles([]);
      setPreviewImages([]);
    } else {
      setEditingRoomId(null);
      setRoomForm({
        code: "",
        room_type_id: types[0]?.id || "",
        area: "Tầng 1",
      });
    }
    setShowModal(true);
  };

  // Mở modal Sửa loại phòng
  const handleOpenEditTypeModal = (type) => {
    setEditingTypeId(type.id);
    setTypeForm({
      code: type.code || "",
      name: type.name || "",
      price: type.price || "",
      capacity: type.capacity ?? 2,
      beds: type.beds ?? 1,
      rules: Array.isArray(type.rules) ? type.rules.join(", ") : type.rules || "",
      amenities: Array.isArray(type.amenities) ? type.amenities.join(", ") : type.amenities || "",
      description: type.description || "",
    });
    setPreviewImages(type.images ? type.images.map((img) => pb.files.getUrl(type, img)) : []);
    setSelectedFiles([]);
    setShowModal(true);
  };

  // Mở modal Sửa phòng vật lý
  const handleOpenEditModal = (room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      code: room.code || "",
      room_type_id: room.room_type_id || types[0]?.id || "",
      area: room.area || "Tầng 1",
    });
    setShowModal(true);
  };

  // Lưu Loại phòng (Lưu vào bảng room_types kèm FormData xử lý ảnh)
  const handleSaveRoomType = async (e) => {
    e.preventDefault();
    const formattedCode = typeForm.code.trim().toUpperCase();

    const isDuplicate = types.some((t) => {
      if (editingTypeId && t.id === editingTypeId) return false;
      return t.code && t.code.trim().toUpperCase() === formattedCode;
    });

    if (isDuplicate) {
      alert(`Mã loại phòng "${formattedCode}" đã tồn tại! Vui lòng nhập mã khác.`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("code", formattedCode);
      formData.append("name", typeForm.name);
      formData.append("price", Number(typeForm.price));
      formData.append("capacity", Number(typeForm.capacity));
      formData.append("beds", Number(typeForm.beds || 1));
      formData.append("description", typeForm.description);

      const amenitiesArr = typeForm.amenities.split(",").map((s) => s.trim()).filter(Boolean);
      const rulesArr = typeForm.rules.split(",").map((s) => s.trim()).filter(Boolean);

      amenitiesArr.forEach((item) => formData.append("amenities", item));
      rulesArr.forEach((item) => formData.append("rules", item));

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (editingTypeId) {
        await pb.collection("room_types").update(editingTypeId, formData);
      } else {
        formData.append("status", "active");
        await pb.collection("room_types").create(formData);
      }

      setShowModal(false);
      setSelectedFiles([]);
      setPreviewImages([]);
      load();
      alert("Lưu loại phòng thành công!");
    } catch (err) {
      console.error("Lỗi PocketBase:", err);
      alert(`Lỗi khi lưu loại phòng: ${err.message}`);
    }
  };

  // Lưu Phòng vật lý (Lưu vào bảng rooms - Gọn nhẹ)
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const formattedCode = roomForm.code.trim().toUpperCase();

    const isDuplicate = rooms.some((r) => {
      if (editingRoomId && r.id === editingRoomId) return false;
      return r.code && r.code.trim().toUpperCase() === formattedCode;
    });

    if (isDuplicate) {
      alert(`Tên/Mã phòng "${formattedCode}" đã tồn tại! Vui lòng nhập tên khác.`);
      return;
    }

    if (!roomForm.room_type_id) {
      alert("Vui lòng chọn loại phòng!");
      return;
    }

    try {
      const payload = {
        code: formattedCode,
        room_type_id: roomForm.room_type_id,
        area: roomForm.area,
        status: "active",
      };

      if (editingRoomId) {
        await pb.collection("rooms").update(editingRoomId, payload);
      } else {
        await pb.collection("rooms").create(payload);
      }

      setShowModal(false);
      load();
      alert("Lưu thông tin phòng thành công!");
    } catch (err) {
      console.error("Lỗi PocketBase chi tiết:", err.response?.data || err);
      alert(`Lỗi khi lưu phòng: ${err.message}`);
    }
  };

  return (
    <>
      <h2 className="font-display text-2xl font-bold mb-4">Loại phòng và phòng</h2>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 bg-secondary/80 p-1 rounded-lg">
          <button
            onClick={() => {
              setSubTab("roomTypes");
              setTypePage(1);
            }}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              subTab === "roomTypes" ? "bg-sky-200 text-slate-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Loại phòng
          </button>
          <button
            onClick={() => {
              setSubTab("roomList");
              setRoomPage(1);
            }}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
              subTab === "roomList" ? "bg-sky-300 text-slate-900 shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Danh sách phòng
          </button>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm transition-all"
        >
          + Thêm mới
        </button>
      </div>

      {/* TAB BẢNG LOẠI PHÒNG */}
      {subTab === "roomTypes" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sky-200/80 text-sky-950 font-bold">
              <tr>
                {["Mã loại", "Tên loại phòng", "Giá phòng", "Sức chứa", "Số giường", "Hình ảnh", "Thao tác"].map((h) => (
                  <th key={h} className="text-left p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTypes.length > 0 ? (
                paginatedTypes.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3 font-semibold">{t.code || "---"}</td>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="p-3">{fmt(t.price)}</td>
                    <td className="p-3">{t.capacity ?? 0} người</td>
                    <td className="p-3">{t.beds ?? 1} giường</td>
                    <td className="p-3">
                      {t.images && t.images.length > 0 ? (
                        <img src={pb.files.getUrl(t, t.images[0])} alt="Type" className="w-12 h-9 object-cover rounded-md border" />
                      ) : (
                        <div className="w-12 h-9 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">Ảnh</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => del("room_types", t.id)} className="text-rose-500 hover:opacity-80" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEditTypeModal(t)} className="text-emerald-500 hover:opacity-80" title="Chỉnh sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">Chưa có dữ liệu loại phòng</td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={typePage}
            totalPages={totalTypePages}
            onPageChange={setTypePage}
            totalItems={types?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="loại phòng"
          />
        </div>
      )}

      {/* TAB BẢNG DANH SÁCH PHÒNG VẬT LÝ */}
      {subTab === "roomList" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sky-200/80 text-sky-950 font-bold">
              <tr>
                {["Tên phòng", "Tên loại phòng", "Giá phòng", "Khu vực", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} className="text-left p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.length > 0 ? (
                paginatedRooms.map((r) => {
                  const roomType = r.expand?.room_type_id || types.find((t) => t.id === r.room_type_id);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-3 font-semibold">{r.code}</td>
                      <td className="p-3 font-medium">{roomType?.name || "N/A"}</td>
                      <td className="p-3">{fmt(roomType?.price || 0)}</td>
                      <td className="p-3">{r.area}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {r.status === "active" ? "Đang hoạt động" : "Ngừng kinh doanh"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => del("rooms", r.id)} className="text-rose-500 hover:opacity-80" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenEditModal(r)} className="text-emerald-500 hover:opacity-80" title="Chỉnh sửa">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleRoomStatus(r)}
                            className={`hover:opacity-80 transition-colors ${r.status === "active" ? "text-emerald-500" : "text-rose-500"}`}
                            title={r.status === "active" ? "Ngừng kinh doanh" : "Kích hoạt"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">Chưa có dữ liệu phòng</td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={roomPage}
            totalPages={totalRoomPages}
            onPageChange={setRoomPage}
            totalItems={rooms?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="phòng"
          />
        </div>
      )}

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-border text-slate-900 relative my-8">
            
            {/* FORM THÊM/SỬA LOẠI PHÒNG */}
            {subTab === "roomTypes" ? (
              <div>
                <h3 className="text-xl font-bold mb-6">
                  {editingTypeId ? "Chỉnh sửa loại phòng" : "Thêm mới loại phòng"}
                </h3>
                <form onSubmit={handleSaveRoomType} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Mã loại phòng</label>
                      <input required placeholder="L001" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Tên loại phòng</label>
                      <input required placeholder="Phòng đơn" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Giá phòng</label>
                      <input required type="number" placeholder="300000" value={typeForm.price} onChange={(e) => setTypeForm({ ...typeForm, price: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Sức chứa (số người)</label>
                      <input required type="number" min="1" placeholder="2" value={typeForm.capacity} onChange={(e) => setTypeForm({ ...typeForm, capacity: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Số giường</label>
                      <input required type="number" min="1" placeholder="1" value={typeForm.beds} onChange={(e) => setTypeForm({ ...typeForm, beds: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Quy định</label>
                      <input placeholder="Cấm hút thuốc, Cấm thú cưng" value={typeForm.rules} onChange={(e) => setTypeForm({ ...typeForm, rules: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Cơ sở / Tiện ích</label>
                      <input placeholder="Wifi, Điều hòa, Nóng lạnh" value={typeForm.amenities} onChange={(e) => setTypeForm({ ...typeForm, amenities: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Mô tả</label>
                    <textarea rows={2} placeholder="Mô tả chi tiết loại phòng..." value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500 resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Thêm hình ảnh</label>
                    <div className="flex flex-wrap gap-3">
                      {previewImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-28 h-20 rounded-lg overflow-hidden border border-gray-300 group">
                          <img src={imgUrl} alt="Room Type" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <label className="w-28 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-sky-500 hover:text-sky-500 transition-all bg-gray-50 cursor-pointer">
                        <Plus className="w-5 h-5 mb-1" />
                        <span className="text-xs font-semibold">+ Thêm ảnh</span>
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg bg-rose-300 text-rose-900 font-bold text-sm hover:bg-rose-400">HỦY BỎ</button>
                    <button type="submit" className="px-8 py-2 rounded-lg bg-sky-300 text-slate-900 font-bold text-sm hover:bg-sky-400">LƯU</button>
                  </div>
                </form>
              </div>
            ) : (

              /* FORM THÊM/SỬA PHÒNG VẬT LÝ (RÚT GỌN TỐI ĐA) */
              <div>
                <h3 className="text-xl font-bold mb-6">
                  {editingRoomId ? "Chỉnh sửa thông tin phòng" : "Thêm mới phòng"}
                </h3>

                <form onSubmit={handleSaveRoom} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Tên phòng / Số phòng</label>
                      <input
                        required
                        placeholder="P001"
                        value={roomForm.code}
                        onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
                        className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Loại phòng</label>
                      <select
                        value={roomForm.room_type_id}
                        onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                        className="w-full border-b border-gray-400 py-1 focus:outline-none bg-transparent cursor-pointer"
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({fmt(t.price)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Khu vực</label>
                      <input
                        placeholder="Tầng 1 / Ngoài vườn"
                        value={roomForm.area}
                        onChange={(e) => setRoomForm({ ...roomForm, area: e.target.value })}
                        className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 rounded-lg bg-rose-300 text-rose-900 font-bold text-sm hover:bg-rose-400"
                    >
                      HỦY BỎ
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2 rounded-lg bg-sky-300 text-slate-900 font-bold text-sm hover:bg-sky-400"
                    >
                      LƯU
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}