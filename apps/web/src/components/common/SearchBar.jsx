import React, { useState } from "react";
import DateRangePicker from "@/components/common/DateRangePicker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search } from "lucide-react";

export default function SearchBar({
  initialValues = {},
  onSearch,
}) {
  const [f, setF] = useState({
    checkIn: initialValues.checkIn || "",
    checkOut: initialValues.checkOut || "",
    capacity: initialValues.capacity || initialValues.guests || 2,
  });

  // Nhận giá trị ngày nhận & ngày trả từ DateRangePicker
  const handleDateChange = ({ checkIn, checkOut }) => {
    setF((prev) => ({
      ...prev,
      checkIn,
      checkOut,
    }));
  };

  const handleSearch = () => {
    if (onSearch) onSearch(f);
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-2xl border-none bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* 1 & 2. Bộ chọn Ngày nhận / Ngày trả */}
          <div className="md:col-span-6">
            <DateRangePicker
              checkIn={f.checkIn}
              checkOut={f.checkOut}
              onChange={handleDateChange}
            />
          </div>

          {/* 3. Sức chứa */}
          <div className="space-y-1 md:col-span-3">
            <Label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-500" /> Sức chứa
            </Label>
            <Input
              type="number"
              min={1}
              value={f.capacity}
              onChange={(e) => setF({ ...f, capacity: e.target.value })}
              className="bg-gray-100/80 border-none rounded-xl text-xs h-9"
            />
          </div>

          {/* 4. Nút Tìm kiếm */}
          <div className="md:col-span-3">
            <Button
              onClick={handleSearch}
              className="w-full font-semibold gap-1.5 bg-[#0e95c4] hover:bg-[#0b7ea6] text-white rounded-xl h-9 text-xs shadow-sm transition-all"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}