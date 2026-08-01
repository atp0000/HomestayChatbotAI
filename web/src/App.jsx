import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/success/:id" element={<SuccessPage />} />
          <Route path="/lich-su" element={<HistoryPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/gioi-thieu" element={<HomePage />} />
          <Route path="/lien-he" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
