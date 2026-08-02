import BookingTable from "@/components/admin/BookingTable";

export default function BookingsTab({ bookings, setStatus, del }) {
    return (
        <div>
            <h2 className="font-display text-2xl font-bold mb-6">Tất cả đơn đặt phòng</h2>
            <BookingTable bookings={bookings} setStatus={setStatus} del={del} />
        </div>
    );
}