import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ApartmentPage } from './pages/ApartmentPage';
import { SuccessPage } from './pages/SuccessPage';
import { FailPage } from './pages/FailPage';

function App() {
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apartments/:id" element={<ApartmentPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/fail" element={<FailPage />} />
      </Routes>
    </div>
  );
}

export default App;