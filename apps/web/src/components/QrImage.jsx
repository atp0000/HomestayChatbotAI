import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";


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