import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export function FailPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Rezervacija nepavyko
        </h1>
        <p className="text-gray-600 mb-8">
          Atsiprašome, bet įvyko klaida apdorojant jūsų rezervaciją. Prašome bandyti dar kartą arba susisiekti su mumis tiesiogiai.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors"
        >
          Grįžti į pradžią
        </button>
      </div>
    </div>
  );
}