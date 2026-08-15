import pb from "@/lib/pocketbaseClient";

export const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";
export const fmtVND = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " VNĐ";

export function nights(ci, co) {
  if (!ci || !co) return 1;
  const a = new Date(ci), b = new Date(co);
  const d = Math.round((b - a) / 86400000);
  return d > 0 ? d : 1;
}

export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("vi-VN");
}

export async function applyServiceQuantityDelta(serviceItems = []) {
  if (!Array.isArray(serviceItems) || serviceItems.length === 0) return;

  for (const item of serviceItems) {
    const serviceId = item.serviceId || item.id;
    const delta = Number(item.count ?? item.quantity ?? item.qty ?? 0);
    if (!serviceId || delta === 0) continue;

    try {
      const service = await pb.collection("services").getOne(serviceId);
      const stockQty = Number(service?.quantity ?? 0);
      const isStockTracked =
        service?.quantity !== "" &&
        service?.quantity !== null &&
        service?.quantity !== undefined &&
        Number.isFinite(stockQty) &&
        stockQty > 0;

      if (!isStockTracked) continue;

      const available = stockQty;
      const nextQuantity = available - delta;

      if (nextQuantity < 0) {
        throw new Error(`Số lượng dịch vụ "${service?.name || serviceId}" không đủ.`);
      }

      await pb.collection("services").update(serviceId, {
        quantity: nextQuantity,
      });
    } catch (err) {
      if (err?.status === 404 || err?.response?.code === 404) {
        console.warn(`Bỏ qua dịch vụ không tồn tại khi cập nhật kho: ${serviceId}`);
        continue;
      }
      throw err;
    }
  }
}

export async function updateServiceQuantities(serviceItems = []) {
  return applyServiceQuantityDelta(
    (serviceItems || []).map((item) => ({
      ...item,
      count: Math.max(0, Number(item.count ?? item.quantity ?? item.qty ?? 0)),
    }))
  );
}

// overlap check: two ranges [aIn,aOut) and [bIn,bOut)
export function overlaps(aIn, aOut, bIn, bOut) {
  return new Date(aIn) < new Date(bOut) && new Date(bIn) < new Date(aOut);
}

export function genCode(prefix = "BK") {
  return prefix + Math.floor(1000 + Math.random() * 9000);
}

// ===== Payments helpers (collection "payments" tách riêng khỏi "bookings") =====

export function genOrderCode() {
  return Number(String(Date.now()).slice(-6));
}

export async function createPayment({ booking, amount, method, status = "pending", transactionCode }) {
  return pb.collection("payments").create({
    booking,
    amount: Number(amount) || 0,
    method,
    status,
    ...(transactionCode !== undefined && transactionCode !== null
      ? { transactionCode: String(transactionCode) }
      : {}),
  });
}

export async function getPaymentByBooking(bookingId) {
  if (!bookingId) return null;
  try {
    return await pb
      .collection("payments")
      .getFirstListItem(pb.filter("booking = {:id}", { id: bookingId }));
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export const api = {
  rooms: () => pb.collection("rooms").getFullList({ expand: "room_type_id" }),
  roomTypes: () => pb.collection("room_types").getFullList({ sort: "price" }),
  services: () => pb.collection("services").getFullList({ sort: "created" }),
  bookings: () => pb.collection("bookings").getFullList({
    sort: "-created",
    expand: "roomCode,room_type_id",
  }),
  reviews: (roomId) =>
    pb.collection("reviews").getFullList({
      sort: "-created",
      expand: "roomCode",
      ...(roomId ? { filter: pb.filter("roomCode = {:id}", { id: roomId }) } : {}),
    }),
  customers: () =>
    pb.collection("users").getFullList({ filter: "role = 'customer' || role = ''", sort: "-created" }),
};