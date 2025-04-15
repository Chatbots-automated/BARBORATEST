import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Wifi, Coffee, Wind, Tv, MapPin } from 'lucide-react';
import { BookingForm } from '../components/BookingForm';
import { Apartment } from '../types';
import { supabase } from '../lib/supabase';

export function ApartmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchApartment() {
      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setApartment(data);
      } catch (err) {
        console.error('Error fetching apartment:', err);
        setError('Failed to load apartment details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchApartment();
  }, [id]);

  if (isLoading) {
    return (
      <div className="pt-24 min-h-screen bg-[#F5F2EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="pt-24 min-h-screen bg-[#F5F2EA] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Apartment not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-[#8B8455] text-white rounded hover:bg-[#726D46] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-[#F5F2EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to all apartments
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <img
              src={apartment.image_url || 'https://via.placeholder.com/800x600?text=No+Image'}
              alt={apartment.name}
              className="w-full h-[600px] object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{apartment.name}</h1>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2" />
                <span>Trakai, Lithuania</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{apartment.description}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h2 className="text-2xl font-semibold mb-6">Amenities</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center text-gray-600">
                  <Wifi className="w-5 h-5 mr-3" />
                  <span>Free WiFi</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Coffee className="w-5 h-5 mr-3" />
                  <span>Kitchen</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Wind className="w-5 h-5 mr-3" />
                  <span>Air conditioning</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Tv className="w-5 h-5 mr-3" />
                  <span>TV</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-3xl font-bold text-gray-900">€{apartment.price_per_night}</span>
                  <span className="text-gray-600 ml-2">per night</span>
                </div>
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="px-8 py-3 bg-[#8B8455] text-white rounded-lg hover:bg-[#726D46] transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingForm && apartment && (
        <BookingForm
          apartment={apartment}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}