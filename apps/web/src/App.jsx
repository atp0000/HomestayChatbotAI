import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/layout/ScrollToTop';
import { AuthProvider } from '@/lib/AuthContext';
<<<<<<< HEAD
import ReceptionPage from './pages/ReceptionPage';
=======
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import SuccessPage from './pages/SuccessPage';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';

>>>>>>> customer

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
<<<<<<< HEAD
          <Route path="/" element={<ReceptionPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="*" element={<ReceptionPage />} />
=======
           <Route path="/" element={<HomePage />} />
         <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} /> 
          <Route path="/gioi-thieu" element={<HomePage />} />
          <Route path="/lien-he" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
           <Route path="/success/:id" element={<SuccessPage />} />
           <Route path="/lich-su" element={<HistoryPage />} /> 
         
          <Route path="/auth" element={<AuthPage />} />
>>>>>>> customer
        </Routes>
      </Router>
    </AuthProvider>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> customer
