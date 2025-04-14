import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Coffee, ArrowRight } from 'lucide-react';
import { Apartment } from '../types';

interface ApartmentCardProps {
  apartment: Apartment;
  onSelect: (apartment: Apartment) => void;
}

export function ApartmentCard({ apartment, onSelect }: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
      <Link to={`/apartments/${apartment.id}`} className="block relative overflow-hidden">
        <img 
          src={apartment.image_url || 'https://via.placeholder.com/600x400?text=No+Image'} 
          alt={apartment.name}
          className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
      
      <div className="p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Link to={`/apartments/${apartment.id}`} className="group-hover:text-primary transition-colors">
              <h3 className="text-2xl font-light text-gray-900 mb-2">{apartment.name}</h3>
            </Link>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">2-4 asmenys</span>
              </div>
              <div className="flex items-center gap-1">
                <Coffee className="w-4 h-4" />
                <span className="text-sm">Pilnai įrengtas</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6 line-clamp-2">{apartment.description || 'No description available'}</p>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div>
            <span className="text-2xl font-light text-gray-900">€{apartment.price_per_night}</span>
            <span className="text-gray-600 text-sm ml-1">/ naktis</span>
          </div>
          
          <button
            onClick={() => onSelect(apartment)}
            className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark 
            transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group/button"
          >
            <Calendar className="w-5 h-5" />
            <span>Rezervuoti</span>
            <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}