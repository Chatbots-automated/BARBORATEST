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
      <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-[#8B8455]" />
              <h1 className="ml-3 text-2xl font-bold text-[#2D2D2D]">Harmonija gamtoje</h1>
            </div>
            <button className="px-6 py-2 bg-[#8B8455] text-white rounded hover:bg-[#726D46] transition-colors">
              REZERVUOTI
            </button>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-12 text-center bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85')] bg-cover bg-center">
        <div className="max-w-4xl mx-auto px-4 py-20 text-white">
          <h2 className="text-5xl font-light mb-6">Harmonija gamtoje</h2>
          <p className="text-xl">
            Atraškite mūsų unikalią poilsio vietą šalia Trakų – erdvę, kur susitinka komfortas ir gamtos ramybė.
            Pasaulis nesustos, bet tu gali sustoti ir pasimėgauti gamta!
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-10 bg-gray-200 rounded" />
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