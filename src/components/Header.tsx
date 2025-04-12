import React from 'react';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Building className="h-8 w-8 text-[#8B8455]" />
            <h1 className="ml-3 text-2xl font-bold text-[#2D2D2D]">Harmonija gamtoje</h1>
          </Link>
          <button className="px-6 py-2 bg-[#8B8455] text-white rounded hover:bg-[#726D46] transition-colors">
            REZERVUOTI
          </button>
        </div>
      </div>
    </header>
  );
}