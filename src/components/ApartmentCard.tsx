import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Apartment } from '../types';

interface ApartmentCardProps {
  apartment: Apartment;
  onSelect: (apartment: Apartment) => void;
}

export function ApartmentCard({ apartment, onSelect }: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/apartments/${apartment.id}`}>
        <img 
          src={apartment.image_url || 'https://via.placeholder.com/600x400?text=No+Image'} 
          alt={apartment.name}
          className="w-full h-64 object-cover"
        />
      </Link>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Link to={`/apartments/${apartment.id}`} className="hover:text-primary">
              <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">{apartment.name}</h3>
            </Link>
            <p className="text-gray-600 text-sm">2 asmenims</p>
          </div>
          <div className="text-right">
            <div className="bg-[#8B8455] text-white px-3 py-1 rounded-full text-sm">
              nuo €{apartment.price_per_night}
              <span className="text-xs ml-1">už naktį</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-gray-600 line-clamp-2">{apartment.description || 'No description available'}</p>
          <div className="text-sm text-gray-600">Pilnai įrengtas</div>
          <div className="text-sm text-gray-600">Ramiam poilsiui</div>
        </div>

        <button
          onClick={() => onSelect(apartment)}
          className="w-full bg-[#8B8455] text-white py-3 rounded hover:bg-[#726D46] transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Calendar size={20} />
          REZERVUOTI
        </button>
      </div>
    </div>
  );
}