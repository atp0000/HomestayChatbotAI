import React from "react";
import { Input } from "@/components/ui/input";

// Lấy ngày hôm nay dưới dạng YYYY-MM-DD
export const getTodayString = () => new Date().toISOString().split("T")[0];

export default function DateInput({ minDate, value, onChange, ...props }) {
  const today = getTodayString();
  
  // Nếu có truyền minDate (ví dụ: ngày nhận) thì dùng minDate, không thì lấy hôm nay
  const min = minDate || today;

  return (
    <Input
      type="date"
      min={min}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}