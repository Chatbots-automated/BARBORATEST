import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, eachDayOfInterval, parseISO, isSameDay, subDays } from 'date-fns';
import { Calendar, Tag, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { Apartment, BookingDetails, Coupon } from '../types';
import { supabase } from '../lib/supabase';

interface BookingFormProps {
  apartment: Apartment;
  onClose: () => void;
}

export function BookingForm({ apartment, onClose }: BookingFormProps) {
  const [bookingDetails, setBookingDetails] = useState<Partial<BookingDetails>>({
    apartmentId: apartment.id,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const getApartmentBaseName = (fullName: string): string => {
    const nameMap: { [key: string]: string } = {
      'Senovinis medinis namas "Gintaras"': 'gintaras',
      'Dvivietis apartamentas "Pikulas"': 'pikulas',
      'Šeimyninis apartamentas "Māra"': 'mara',
      'Namelis dviems "Medeinė"': 'medeine'
    };
    return nameMap[fullName] || fullName.toLowerCase();
  };

  useEffect(() => {
    async function fetchBookedDates() {
      try {
        const baseName = getApartmentBaseName(apartment.name);
        const { data, error } = await supabase
          .from('bookings')
          .select('check_in, check_out')
          .eq('apartment_name', baseName);

        if (error) throw error;

        const allDates: Date[] = [];
        data.forEach(booking => {
          const start = parseISO(booking.check_in);
          const end = parseISO(booking.check_out);
          // Only block the nights the guest is staying, not the check-out day
          const daysInRange = eachDayOfInterval({ start, end: subDays(end, 1) });
          allDates.push(...daysInRange);
        });

        const uniqueDates = Array.from(
          new Set(allDates.map(date => format(date, 'yyyy-MM-dd')))
        ).map(dateStr => parseISO(dateStr));

        setBookedDates(uniqueDates);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
        setError('Failed to fetch available dates');
      }
    }

    fetchBookedDates();
  }, [apartment.name]);

  const validateCoupon = async (code: string) => {
    setIsValidatingCoupon(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      if (data) {
        setAppliedCoupon(data as Coupon);
        return true;
      }

      setError('Invalid or expired coupon code');
      setAppliedCoupon(null);
      return false;
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError('Failed to validate coupon');
      setAppliedCoupon(null);
      return false;
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    await validateCoupon(couponCode.trim());
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(bookedDate => isSameDay(bookedDate, date));
  };

  const handleDateChange = (type: 'checkIn' | 'checkOut', date: Date | null) => {
    if (!date) return;

    const newBookingDetails = { ...bookingDetails };

    if (type === 'checkIn') {
      if (isDateBooked(date)) {
        setError('This date is already booked');
        return;
      }
      newBookingDetails.checkIn = date;
      if (bookingDetails.checkOut && date >= bookingDetails.checkOut) {
        newBookingDetails.checkOut = undefined;
      }
    } else {
      if (isDateBooked(date)) {
        setError('This date is already booked');
        return;
      }
      newBookingDetails.checkOut = date;
    }

    if (newBookingDetails.checkIn && newBookingDetails.checkOut) {
      const daysToCheck = eachDayOfInterval({
        start: newBookingDetails.checkIn,
        end: newBookingDetails.checkOut,
      });

      if (daysToCheck.some(date => isDateBooked(date))) {
        setError('Some days in this range are already booked');
        return;
      }
    }

    setBookingDetails(newBookingDetails);
    setError(null);
  };

  const calculateTotalPrice = (numberOfNights: number) => {
    let totalPrice = numberOfNights * apartment.price_per_night;

    if (appliedCoupon) {
      const discount = totalPrice * (appliedCoupon.discount_percent / 100);
      totalPrice -= discount;
    }

    return totalPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { checkIn, checkOut, guestEmail, guestName } = bookingDetails;

    if (!checkIn || !checkOut || !guestEmail || !guestName) {
      setError('Please fill in all required fields');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date');
      return;
    }

    setShowSummary(true);
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { checkIn, checkOut, guestEmail, guestName } = bookingDetails;

      if (!checkIn || !checkOut || !guestEmail || !guestName) {
        throw new Error('Please fill in all required fields');
      }

      // Double-check dates availability
      const { data: latestBookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('apartment_name', getApartmentBaseName(apartment.name));

      const newBookingDates = eachDayOfInterval({ start: checkIn, end: checkOut });
      const isStillAvailable = !newBookingDates.some(date => 
        latestBookings?.some(booking => 
          isSameDay(date, parseISO(booking.check_in)) || 
          isSameDay(date, parseISO(booking.check_out))
        )
      );

      if (!isStillAvailable) {
        throw new Error('Selected dates are no longer available. Please choose different dates.');
      }

      const numberOfNights = differenceInDays(checkOut, checkIn);
      const totalPrice = calculateTotalPrice(numberOfNights);
      const priceInCents = Math.round(totalPrice * 100);

      const params = new URLSearchParams({
        mode: 'payment',
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`,
        customer_email: guestEmail,
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': apartment.name,
        'line_items[0][price_data][unit_amount]': priceInCents.toString(),
        'line_items[0][quantity]': '1',
        'metadata[apartmentId]': apartment.id,
        'metadata[apartmentName]': getApartmentBaseName(apartment.name),
        'metadata[checkIn]': checkIn.toISOString(),
        'metadata[checkOut]': checkOut.toISOString(),
        'metadata[email]': guestEmail,
        'metadata[guestName]': guestName,
        'metadata[price]': totalPrice.toString(),
      });

      if (appliedCoupon) {
        params.append('metadata[couponCode]', appliedCoupon.code);
        params.append('metadata[discountPercent]', appliedCoupon.discount_percent.toString());
      }

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer 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`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const text = await response.text();

      if (!response.ok) {
        console.error('Stripe error:', text);
        throw new Error('Failed to create checkout session');
      }

      const session = JSON.parse(text);
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowSummary(false);
    } finally {
      setIsLoading(false);
    }
  };

  const numberOfNights = bookingDetails.checkIn && bookingDetails.checkOut
    ? differenceInDays(bookingDetails.checkOut, bookingDetails.checkIn)
    : 0;

  const totalPrice = calculateTotalPrice(numberOfNights);

  const renderDayContents = (day: number, date: Date) => {
    const isBooked = isDateBooked(date);
    return (
      <div className={`w-8 h-8 flex items-center justify-center rounded-full
        ${isBooked ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
        ${bookingDetails.checkIn && isSameDay(date, bookingDetails.checkIn) ? 'ring-2 ring-primary' : ''}
        ${bookingDetails.checkOut && isSameDay(date, bookingDetails.checkOut) ? 'ring-2 ring-primary' : ''}
      `}>
        {day}
      </div>
    );
  };

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
          <button
            onClick={() => setShowSummary(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Summary</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Apartment</span>
                <span className="font-medium">{apartment.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Check-in</span>
                <span className="font-medium">{format(bookingDetails.checkIn!, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Check-out</span>
                <span className="font-medium">{format(bookingDetails.checkOut!, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Guest</span>
                <span className="font-medium">{bookingDetails.guestName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{bookingDetails.guestEmail}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per night</span>
                <span className="font-medium">€{apartment.price_per_night}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Number of nights</span>
                <span className="font-medium">{numberOfNights}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Discount ({appliedCoupon.discount_percent}%)</span>
                  <span>-€{(numberOfNights * apartment.price_per_night * (appliedCoupon.discount_percent / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold mt-4 pt-4 border-t border-gray-200">
                <span>Total</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Book Your Stay</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Date
              </label>
              <DatePicker
                selected={bookingDetails.checkIn}
                onChange={(date) => handleDateChange('checkIn', date)}
                minDate={new Date()}
                excludeDates={bookedDates}
                dateFormat="MMM d, yyyy"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                placeholderText="Select date"
                showPopperArrow={false}
                renderDayContents={renderDayContents}
                calendarClassName="availability-calendar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Date
              </label>
              <DatePicker
                selected={bookingDetails.checkOut}
                onChange={(date) => handleDateChange('checkOut', date)}
                minDate={bookingDetails.checkIn || new Date()}
                excludeDates={bookedDates}
                dateFormat="MMM d, yyyy"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                placeholderText="Select date"
                showPopperArrow={false}
                renderDayContents={renderDayContents}
                calendarClassName="availability-calendar"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={bookingDetails.guestName || ''}
              onChange={(e) => setBookingDetails({ ...bookingDetails, guestName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={bookingDetails.guestEmail || ''}
              onChange={(e) => setBookingDetails({ ...bookingDetails, guestEmail: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter coupon code"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isValidatingCoupon}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              {isValidatingCoupon ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Tag className="w-5 h-5" />
              )}
            </button>
          </div>

          {appliedCoupon && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <p>Coupon applied: {appliedCoupon.discount_percent}% discount</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price per night</span>
              <span className="font-medium">€{apartment.price_per_night}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Number of nights</span>
              <span className="font-medium">{numberOfNights}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-green-600">
                <span>Discount ({appliedCoupon.discount_percent}%)</span>
                <span>-€{(numberOfNights * apartment.price_per_night * (appliedCoupon.discount_percent / 100)).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
              <span>Total</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Continue to Book
          </button>
        </form>
      </div>
    </div>
  );
}