import React, { useState, useEffect } from 'react';
import { ApartmentCard } from '../components/ApartmentCard';
import { BookingForm } from '../components/BookingForm';
import { Apartment } from '../types';
import { supabase } from '../lib/supabase';

export function HomePage() {
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchApartments() {
      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('id, name, description, price_per_night, image_url');

        if (error) throw error;
        setApartments(data);
      } catch (err) {
        console.error('Error fetching apartments:', err);
        setError('Failed to load apartments');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApartments();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      {/* Apartments Section */}
      <section className="pt-32 px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {isLoading ? (
              [...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200" />
                  <div className="p-8 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            ) : (
              apartments.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  onSelect={setSelectedApartment}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-left">
            <h2 className="text-3xl font-light mb-6">Kontaktai</h2>
            <div className="space-y-2">
              <p className="text-gray-600">El. paštas: info@giriohorizontas.lt</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <img 
            src="https://i.imgur.com/1IbdOtP.png" 
            alt="Girios Horizontas" 
            className="h-12"
          />
        </div>
      </footer>

      {selectedApartment && (
        <BookingForm
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </div>
  );
}