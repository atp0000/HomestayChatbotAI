import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/layout/ScrollToTop';
import Chatbot from './components/Chatbot';
import { CustomerOnlyRoute, RequireRole } from './routes/ProtectedRoutes';
import { AuthProvider } from '@/lib/AuthContext';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingPage from './pages/BookingPage';
import SuccessPage from './pages/SuccessPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import ReceptionPage from './pages/ReceptionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Chatbot />
        <Routes>
          {/* 1. Trang Đăng nhập / Đăng ký */}
          <Route path="/auth" element={<AuthPage />} />

          {/* 2. Trang công khai cho Khách xem tự do */}
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/gioi-thieu" element={<HomePage />} />
          <Route path="/lien-he" element={<HomePage />} />

          {/* 3. Trang yêu cầu đăng nhập đối với Khách hàng */}
          <Route element={<CustomerOnlyRoute />}>
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/success/:id" element={<SuccessPage />} />
            <Route path="/lich-su" element={<HistoryPage />} />
          </Route>

          {/* 4. Nhóm trang Quản trị & Lễ tân */}
          <Route path="/admin" element={<RequireRole allowedRoles={['admin']}><AdminPage /></RequireRole>} />
          <Route path="/reception" element={<RequireRole allowedRoles={['receptionist']}><ReceptionPage /></RequireRole>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;