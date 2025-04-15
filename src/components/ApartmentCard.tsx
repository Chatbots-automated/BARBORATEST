import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Apartment } from '../types';

interface ApartmentCardProps {
  apartment: Apartment;
  onSelect: (apartment: Apartment) => void;
}

export function ApartmentCard({ apartment, onSelect }: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md group">
      <div className="relative">
        <img 
          src={apartment.image_url || 'https://via.placeholder.com/600x400?text=No+Image'} 
          alt={apartment.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-2">{apartment.name}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Users className="w-4 h-4" />
          <span className="text-sm">2-4 asmenys</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-medium">€{apartment.price_per_night}</span>
            <span className="text-gray-600 text-sm ml-1">/ naktis</span>
          </div>
          
          <button
            onClick={() => onSelect(apartment)}
            className="px-6 py-2 bg-[#4A5859] text-white rounded hover:bg-[#3A4445] transition-colors"
          >
            Rezervuoti
          </button>
        </div>
      </div>
    </div>
  );
}