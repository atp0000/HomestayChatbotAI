import React, { useState } from "react";
import DateInput from "@/components/DateInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck,
  CalendarX,
  Users,
  Home,
  Search,
} from "lucide-react";

export default function SearchBar({
  initialValues = {},
  roomTypes = [],
  onSearch,
}) {
  const [f, setF] = useState({
    checkIn: initialValues.checkIn || "",
    checkOut: initialValues.checkOut || "",
    guests: initialValues.guests || 2,
    type: initialValues.type || "",
  });

  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    if (f.checkOut && f.checkOut <= newCheckIn) {
      setF({ ...f, checkIn: newCheckIn, checkOut: "" });
    } else {
      setF({ ...f, checkIn: newCheckIn });
    }
  };

  const handleSearch = () => {
    if (onSearch) onSearch(f);
  };

  return (
    /* max-w-4xl giúp thanh gọn lại, rounded-2xl bo tròn góc theo mẫu */
    <Card className="max-w-4xl mx-auto shadow-2xl border-none bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* 1. Ngày nhận */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5 text-sky-500" /> Ngày nhận
            </Label>
            <DateInput
              value={f.checkIn}
              onChange={handleCheckInChange}
              className="bg-gray-100/80 border-none rounded-xl text-xs h-9"
            />
          </div>

          {/* 2. Ngày trả */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
              <CalendarX className="w-3.5 h-3.5 text-sky-500" /> Ngày trả
            </Label>
            <DateInput
              minDate={f.checkIn}
              value={f.checkOut}
              onChange={(e) => setF({ ...f, checkOut: e.target.value })}
              className="bg-gray-100/80 border-none rounded-xl text-xs h-9"
            />
          </div>

          {/* 3. Số khách */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-500" /> Số khách
            </Label>
            <Input
              type="number"
              min={1}
              value={f.guests}
              onChange={(e) => setF({ ...f, guests: e.target.value })}
              className="bg-gray-100/80 border-none rounded-xl text-xs h-9"
            />
          </div>

          {/* 4. Loại phòng */}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-sky-500" /> Loại phòng
            </Label>
            <Select
              value={f.type || "all"}
              onValueChange={(val) => setF({ ...f, type: val === "all" ? "" : val })}
            >
              <SelectTrigger className="bg-gray-100/80 border-none rounded-xl text-xs h-9">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id || rt.name} value={rt.name}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Nút Tìm kiếm màu xanh cyan/sky chuẩn thiết kế mẫu */}
          <Button
            onClick={handleSearch}
            className="w-full font-semibold gap-1.5 bg-[#0e95c4] hover:bg-[#0b7ea6] text-white rounded-xl h-9 text-xs shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5" /> Tìm kiếm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}