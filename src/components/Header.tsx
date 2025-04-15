import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img 
            src="https://i.imgur.com/1IbdOtP.png" 
            alt="Girios Horizontas" 
            className="h-12"
          />
        </Link>
      </div>
    </header>
  );
}