import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/layout/ScrollToTop';
import { AuthProvider } from '@/lib/AuthContext';
import ReceptionPage from './pages/ReceptionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<ReceptionPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="*" element={<ReceptionPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;