import React, { useState, useEffect } from 'react';
import { ApartmentCard } from '../components/ApartmentCard';
import { BookingForm } from '../components/BookingForm';
import { Apartment } from '../types';
import { supabase } from '../lib/supabase';
import { Leaf, Wind, Coffee, Moon, ArrowRight } from 'lucide-react';

export function HomePage() {
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHeaderVisible(currentScrollY <= lastScrollY || currentScrollY <= 50);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://player.vimeo.com/external/517090081.hd.mp4?s=146b43a62aa6b5fddf96493941e26f6c0cd5c48e&profile_id=175" type="video/mp4" />
          </video>
        </div>

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-6xl md:text-7xl font-light mb-6 text-center leading-tight">
            Harmonija
            <span className="block font-normal">gamtoje</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl text-center mb-12 text-gray-100">
            Atraskite ramybę Trakų miškuose, kur modernūs patogumai susitinka su gamtos didybe
          </p>
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full 
            transition-all duration-300 transform hover:scale-105 border border-white/30 
            flex items-center gap-3 group"
          >
            Atrasti
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F5F2EA] to-transparent z-20" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/70 transition-colors">
              <Leaf className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gamtos apsuptyje</h3>
              <p className="text-gray-600">Mėgaukitės ramybe ir privatumu miško apsuptyje</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/70 transition-colors">
              <Wind className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tyras oras</h3>
              <p className="text-gray-600">Atgaivinkite kūną ir sielą gryname miško ore</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/70 transition-colors">
              <Coffee className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Modernus komfortas</h3>
              <p className="text-gray-600">Mėgaukitės šiuolaikiniais patogumais gamtoje</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/70 transition-colors">
              <Moon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rami aplinka</h3>
              <p className="text-gray-600">Idealios sąlygos poilsiui ir atsipalaidavimui</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apartments Section */}
      <section className="py-24 px-4 bg-white/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-6">Jūsų tobulas poilsis</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Išsirinkite sau tinkamiausią apgyvendinimo variantą ir leiskitės į nepamirštamą poilsį gamtos apsuptyje
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [...Array(6)].map((_, index) => (
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
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/10 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-light mb-6">Turite klausimų?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Susisiekite su mumis bet kuriuo metu. Mūsų komanda pasiruošusi atsakyti į visus jūsų klausimus ir padėti suplanuoti tobulą poilsį.
            </p>
            <a
              href="mailto:info@girioshorizontas.lt"
              className="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full 
              transition-all duration-300 transform hover:scale-105"
            >
              Susisiekti
            </a>
          </div>
        </div>
      </section>

      {selectedApartment && (
        <BookingForm
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </div>
  );
}