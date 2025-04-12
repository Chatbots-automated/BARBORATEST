import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Apartment } from '../types';

interface ApartmentCardProps {
  apartment: Apartment;
  onSelect: (apartment: Apartment) => void;
}

export function ApartmentCard({ apartment, onSelect }: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img 
        src={apartment.image_url || 'https://via.placeholder.com/600x400?text=No+Image'} 
        alt={apartment.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{apartment.name}</h3>
          <span className="text-lg font-bold text-green-600">
            €{apartment.price_per_night}/night
          </span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2">{apartment.description || 'No description available'}</p>

        <button
          onClick={() => onSelect(apartment)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          Book Now
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
