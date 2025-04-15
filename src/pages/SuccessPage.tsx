import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Users, Phone, Globe, Mail, PawPrint, Bed } from 'lucide-react';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';

interface BookingDetails {
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  email: string;
  guestName: string;
  country: string;
  phoneNumber: string;
  numberOfGuests: string;
  hasPets: string;
  extraBed: string;
  price: string;
  couponCode?: string;
  discountPercent?: string;
}

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    if (Object.keys(params).length > 0) {
      setBookingDetails(params as BookingDetails);
    }
  }, [searchParams]);

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Dėkojame!
          </h1>
          <p className="text-gray-600 mb-8">
            Jūsų rezervacija patvirtinta. Detalią informaciją išsiuntėme Jums el.paštu. Pasitikrinkite ir spam skiltį.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors"
          >
            Grįžti į pradžią
          </button>
        </div>
      </div>
    );
  }

  const checkIn = new Date(bookingDetails.checkIn);
  const checkOut = new Date(bookingDetails.checkOut);

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-xl my-8">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Dėkojame!
          </h1>
          <p className="text-gray-600">
            Jūsų rezervacija patvirtinta. Detalią informaciją išsiuntėme Jums el.paštu. Pasitikrinkite ir spam skiltį.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Rezervacijos detalės</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Atvykimas</p>
                  <p className="font-medium">
                    {format(checkIn, 'yyyy-MM-dd', { locale: lt })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Išvykimas</p>
                  <p className="font-medium">
                    {format(checkOut, 'yyyy-MM-dd', { locale: lt })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Svečių skaičius</p>
                  <p className="font-medium">{bookingDetails.numberOfGuests}</p>
                </div>
              </div>

              {bookingDetails.hasPets === 'true' && (
                <div className="flex items-center gap-3">
                  <PawPrint className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Augintinis</p>
                    <p className="font-medium">Taip (+10€)</p>
                  </div>
                </div>
              )}

              {bookingDetails.extraBed === 'true' && (
                <div className="flex items-center gap-3">
                  <Bed className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Papildoma lova</p>
                    <p className="font-medium">Taip (+15€)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">El. paštas</p>
                  <p className="font-medium">{bookingDetails.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Telefono numeris</p>
                  <p className="font-medium">{bookingDetails.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Šalis</p>
                  <p className="font-medium">{bookingDetails.country}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Bendra suma</span>
              <span className="text-xl font-semibold">€{parseFloat(bookingDetails.price).toFixed(2)}</span>
            </div>
            {bookingDetails.couponCode && (
              <div className="flex justify-between items-center mt-2 text-green-600">
                <span>Pritaikyta nuolaida</span>
                <span>{bookingDetails.discountPercent}%</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors"
        >
          Grįžti į pradžią
        </button>
      </div>
    </div>
  );
}