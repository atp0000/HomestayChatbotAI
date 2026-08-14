import React from "react";
import Stat from "@/components/admin/Stat";
import BookingTable from "@/components/admin/BookingTable";

export default function OverviewTab({ rooms = [], occupied = 0, bookings = [], setStatus, del }) {
    return (
        <>
            <h2 className="font-display text-2xl font-bold mb-4">Công suất phòng hiện tại</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Stat l="Phòng đang có khách" v={occupied} />
                <Stat l="Phòng đang trống" v={Math.max(0, rooms.length - occupied)} />
                <Stat l="Tổng số phòng" v={rooms.length} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Hoạt động gần đây</h2>
            <BookingTable bookings={bookings.slice(0, 8)} setStatus={setStatus} del={del} />
        </>
    );
}