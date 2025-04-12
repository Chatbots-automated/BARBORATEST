import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import { ApartmentCard } from './components/ApartmentCard';
import { BookingForm } from './components/BookingForm';
import { Apartment } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Apartment Bookings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                onSelect={setSelectedApartment}
              />
            ))}
          </div>
        )}
      </main>

      {selectedApartment && (
        <BookingForm
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </div>
  );
}

export default App;
