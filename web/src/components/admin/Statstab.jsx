import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Stat from "@/components/admin/Stat";
import { fmtVND } from "@/lib/store";

export default function StatsTab({ bookings = [] }) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 - 12

    // State quản lý bộ lọc
    const [viewMode, setViewMode] = useState("month"); // 'month' (xem các ngày trong tháng) hoặc 'year' (xem 12 tháng)
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Danh sách các năm có sẵn để chọn (từ 2024 đến năm hiện tại)
    const availableYears = useMemo(() => {
        const years = [];
        for (let y = 2024; y <= currentYear; y++) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    // 🔴 Lọc danh sách đơn thành công (chỉ tính đơn checkedout hoặc checkedin)
    const completedBookings = useMemo(() => {
        return bookings.filter((b) => b.status === "checkedout" || b.status === "checkedin");
    }, [bookings]);

    // 🟢 TÍNH TOÁN DỮ LIỆU BỂ ĐỒ THỊ (CHART DATA) & TỔNG DOANH THU LỌC
    const { chartData, totalRevenue, totalCompletedCount } = useMemo(() => {
        let filteredBookings = [];
        let data = [];

        if (viewMode === "month") {
            // 1️⃣ XEM THEO NGÀY TRONG THÁNG
            // Tính số ngày của tháng đã chọn (ví dụ: tháng 7 -> 31 ngày, tháng 6 -> 30 ngày)
            const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

            // Khởi tạo mảng các ngày từ 1 đến daysInMonth
            const daysMap = {};
            for (let d = 1; d <= daysInMonth; d++) {
                daysMap[d] = 0;
            }

            // Lọc các đơn nằm trong tháng/năm đã chọn
            completedBookings.forEach((b) => {
                const dateObj = new Date(b.checkOut || b.checkIn);
                const bYear = dateObj.getFullYear();
                const bMonth = dateObj.getMonth() + 1;
                const bDay = dateObj.getDate();

                if (bYear === selectedYear && bMonth === selectedMonth) {
                    daysMap[bDay] = (daysMap[bDay] || 0) + Number(b.total || 0);
                    filteredBookings.push(b);
                }
            });

            // Format dữ liệu cho Recharts
            data = Object.keys(daysMap).map((day) => ({
                label: `${day}/${selectedMonth}`,
                v: daysMap[day],
            }));

        } else {
            // 2️⃣ XEM THEO 12 THÁNG TRONG NĂM
            const monthsMap = {};
            for (let m = 1; m <= 12; m++) {
                monthsMap[m] = 0;
            }

            completedBookings.forEach((b) => {
                const dateObj = new Date(b.checkOut || b.checkIn);
                const bYear = dateObj.getFullYear();
                const bMonth = dateObj.getMonth() + 1;

                if (bYear === selectedYear) {
                    monthsMap[bMonth] = (monthsMap[bMonth] || 0) + Number(b.total || 0);
                    filteredBookings.push(b);
                }
            });

            data = Object.keys(monthsMap).map((m) => ({
                label: `Thg ${m}`,
                v: monthsMap[m],
            }));
        }

        const sumRevenue = filteredBookings.reduce((acc, b) => acc + Number(b.total || 0), 0);

        return {
            chartData: data,
            totalRevenue: sumRevenue,
            totalCompletedCount: filteredBookings.length,
        };
    }, [completedBookings, viewMode, selectedMonth, selectedYear]);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="font-display text-2xl font-bold">Thống kê doanh thu</h2>

                {/* ⚡ BỘ LỌC THỜI GIAN DỘNG */}
                <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-2 rounded-xl shadow-sm">
                    {/* Chọn chế độ xem */}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="bg-secondary text-sm font-medium rounded-lg px-3 py-1.5 border border-border cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="month">Theo ngày trong tháng</option>
                        <option value="year">Theo 12 tháng trong năm</option>
                    </select>

                    {/* Chọn Tháng (Chỉ hiện khi ở chế độ xem theo tháng) */}
                    {viewMode === "month" && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-secondary text-sm font-medium rounded-lg px-3 py-1.5 border border-border cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                    Tháng {m}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Chọn Năm */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-secondary text-sm font-medium rounded-lg px-3 py-1.5 border border-border cursor-pointer outline-none focus:ring-1 focus:ring-primary"
                    >
                        {availableYears.map((y) => (
                            <option key={y} value={y}>
                                Năm {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* THỐNG KÊ TỔNG QUAN THEO BỘ LỌC */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Stat
                    l={viewMode === "month" ? `Doanh thu T${selectedMonth}/${selectedYear}` : `Doanh thu năm ${selectedYear}`}
                    v={fmtVND(totalRevenue)}
                />
                <Stat
                    l="Số đơn phát sinh doanh thu"
                    v={totalCompletedCount}
                />
            </div>

            {/* BIỂU ĐỒ BARCHART */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-6">
                    {viewMode === "month"
                        ? `Chi tiết doanh thu Tháng ${selectedMonth}/${selectedYear} (Đơn vị: VNĐ)`
                        : `Doanh thu 12 tháng năm ${selectedYear} (Đơn vị: VNĐ)`}
                </h3>

                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis
                                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`)}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value) => [fmtVND(value), "Doanh thu"]}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            />
                            <Bar dataKey="v" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}