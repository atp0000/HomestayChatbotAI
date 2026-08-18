import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Vẽ mã QR từ chuỗi dữ liệu (vd: chuỗi VietQR do PayOS trả về)
 * Dùng package "qrcode" (canvas thuần) — không dùng hook nội bộ
 * nên không bị lỗi "Invalid hook call" khi có 2 bản React trong node_modules.
 */
export default function QrImage({ value, size = 240, className = "" }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    setError(false);
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: size, margin: 1 },
      (err) => {
        if (err) {
          console.error("Lỗi vẽ mã QR:", err);
          setError(true);
        }
      }
    );
  }, [value, size]);

  if (!value) {
    return (
      <p className="text-sm text-red-500">Không có dữ liệu QR để hiển thị</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">Không thể vẽ mã QR</p>
    );
  }

  return <canvas ref={canvasRef} className={className} />;
}