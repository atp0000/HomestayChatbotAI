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

// overlap check: two ranges [aIn,aOut) and [bIn,bOut)
export function overlaps(aIn, aOut, bIn, bOut) {
  return new Date(aIn) < new Date(bOut) && new Date(bIn) < new Date(aOut);
}

export function genCode(prefix = "BK") {
  return prefix + Math.floor(1000 + Math.random() * 9000);
}

export const api = {
  rooms: () => pb.collection("rooms").getFullList({ expand: "room_type_id" }),
  roomTypes: () => pb.collection("room_types").getFullList({ sort: "price" }),
  services: () => pb.collection("services").getFullList({ sort: "created" }),
  bookings: () => pb.collection("bookings").getFullList({ sort: "-created" }),
  reviews: (roomCode) =>
    pb.collection("reviews").getFullList({
      sort: "-created",
      ...(roomCode ? { filter: pb.filter("roomCode = {:c}", { c: roomCode }) } : {}),
    }),
  customers: () =>
    pb.collection("users").getFullList({ filter: "role = 'customer' || role = ''", sort: "-created" }),
};
