import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Chặn Admin và Lễ tân truy cập vào trang dành cho Khách hàng
 */
export function CustomerOnlyRoute({ children }) {
  const { role } = useAuth();

  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "receptionist") return <Navigate to="/reception" replace />;

  return children;
}

/**
 * Kiểm tra quyền hạn (Role-based Authorization) cho Admin / Lễ tân
 */
export function RequireRole({ allowedRoles, children }) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}