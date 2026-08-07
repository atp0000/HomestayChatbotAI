import React from "react";
import { QRCodeSVG } from 'qrcode.react';

export default function QrImage({ value, size = 240, className = "" }) {
  if (!value) {
    return (
      <p className="text-sm text-red-500">Không có dữ liệu QR để hiển thị</p>
    );
  }

  return (
    <QRCodeSVG 
      value={value} 
      size={size} 
      className={className}
      marginSize={1}
    />
  );
}