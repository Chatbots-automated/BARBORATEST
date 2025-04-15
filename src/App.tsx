import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ApartmentPage } from './pages/ApartmentPage';

function App() {
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apartments/:id" element={<ApartmentPage />} />
      </Routes>
    </div>
  );
}

export default App;