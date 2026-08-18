import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/store";
import { Palmtree, LogOut, LayoutDashboard, BedDouble, Coffee, Users, CalendarRange, TrendingUp, MessageSquareText } from "lucide-react";

import OverviewTab from "@/components/admin/OverviewTab";
import RoomsTab from "@/components/admin/RoomsTab";
import ServicesTab from "@/components/admin/ServicesTab";
import CustomersTab from "@/components/admin/CustomersTab";
import BookingsTab from "@/components/admin/BookingsTab";
import StatsTab from "@/components/admin/StatsTab";
import ReviewTab from "@/components/admin/ReviewTab";

const TABS = [
  { k: "overview", l: "Tổng quan", i: LayoutDashboard },
  { k: "rooms", l: "Phòng", i: BedDouble },
  { k: "services", l: "Dịch vụ", i: Coffee },
  { k: "customers", l: "Khách hàng", i: Users },
  { k: "bookings", l: "Đặt phòng", i: CalendarRange },
  { k: "reviews", l: "Đánh giá", i: MessageSquareText },
  { k: "stats", l: "Thống kê", i: TrendingUp },
];

export default function AdminPage() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  const [rooms, setRooms] = useState([]);
  const [types, setTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);

  const load = () => {
    api.rooms().then(setRooms);
    api.roomTypes().then(setTypes);
    api.services().then(setServices);
    api.bookings().then(setBookings);
    
    // Lấy danh sách khách hàng và lọc chỉ lấy những người đã xác thực email (verified === true)
    api.customers()
      .then((data) => {
        const verifiedCustomers = (data || []).filter((c) => c.verified === true);
        setCustomers(verifiedCustomers);
      })
      .catch(() => {});
      
    api.reviews().then(setReviews);
  };

  useEffect(() => {
    load();

    const unsubscribe = pb.collection("bookings").subscribe("*", () => {
      load();
    });

    return () => {
      pb.collection("bookings").unsubscribe("*");
    };
  }, []);

  const occupied = bookings.filter((b) => b.status === "checkedin").length;
  const revenue = bookings
    .filter((b) => b.payStatus === "paid" || b.status === "checkedout")
    .reduce((a, b) => a + b.total, 0);

  const chart = Array.from({ length: 12 }, (_, i) => ({ m: `Thg ${i + 1}`, v: 0 }));
  bookings.forEach((b) => {
    if (b.created) {
      const mo = new Date(b.created).getMonth();
      if (b.payStatus !== "unpaid") chart[mo].v += b.total;
    }
  });

  const del = async (col, id) => {
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) {
      await pb.collection(col).delete(id);
      load();
    }
  };

  const setStatus = async (id, status) => {
    await pb.collection("bookings").update(id, { status, payStatus: status === "checkedout" ? "paid" : undefined });
    load();
  };

  const handleLogout = () => {
    logout();
    nav("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER QUẢN TRỊ ADMIN - DÙNG RIÊNG ĐỘC LẬP */}
      <header className="bg-primary text-white px-5 h-14 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setTab("overview")} 
            className="font-display font-extrabold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Palmtree className="w-5 h-5 text-amber-400" /> Núi Homestay (Admin)
          </button>

          {TABS.map((t) => (
            <button 
              key={t.k} 
              onClick={() => setTab(t.k)} 
              className={`flex items-center gap-1 text-sm whitespace-nowrap px-3 py-1.5 rounded-full transition-all ${
                tab === t.k ? "bg-white/25 font-bold" : "hover:bg-white/10"
              }`}
            >
              <t.i className="w-4 h-4" />{t.l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Quản Lý</span>
          <button 
            onClick={handleLogout} 
            title="Đăng xuất"
            className="text-white/80 hover:text-white flex items-center gap-1 text-sm bg-white/10 px-2.5 py-1 rounded-md hover:bg-white/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-8">
        {tab === "overview" && (
          <OverviewTab rooms={rooms} occupied={occupied} bookings={bookings} setStatus={setStatus} del={del} />
        )}
        {tab === "rooms" && <RoomsTab rooms={rooms} types={types} del={del} load={load} />}
        {tab === "services" && <ServicesTab services={services} del={del} load={load} />}
        {tab === "customers" && <CustomersTab customers={customers} del={del} />}
        {tab === "bookings" && <BookingsTab bookings={bookings} setStatus={setStatus} del={del} />}
        {tab === "reviews" && <ReviewTab reviews={reviews} load={load} />}
        {tab === "stats" && <StatsTab revenue={revenue} bookings={bookings} chart={chart} />}
      </div>
    </div>
  );
}