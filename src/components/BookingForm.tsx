import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, eachDayOfInterval, parseISO, isSameDay, addDays } from 'date-fns';
import { Calendar, Tag } from 'lucide-react';
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

  useEffect(() => {
    async function fetchBookedDates() {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('check_in, check_out')
          .eq('apartment_name', apartment.name.toLowerCase()); // ✅ filtering by name

        if (error) throw error;

        const allDates: Date[] = [];

        data.forEach(booking => {
          const start = parseISO(booking.check_in);
          const end = parseISO(booking.check_out);
          const daysInRange = eachDayOfInterval({ start, end });
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
    let totalPrice = numberOfNights * apartment.pricePerNight;

    if (appliedCoupon) {
      const discount = totalPrice * (appliedCoupon.discount_percent / 100);
      totalPrice -= discount;
    }

    return totalPrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { checkIn, checkOut, guestEmail, guestName } = bookingDetails;

      if (!checkIn || !checkOut || !guestEmail || !guestName) {
        throw new Error('Please fill in all required fields');
      }

      if (checkOut <= checkIn) {
        throw new Error('Check-out date must be after check-in date');
      }

      const daysToCheck = eachDayOfInterval({ start: checkIn, end: checkOut });

      if (daysToCheck.some(date => isDateBooked(date))) {
        throw new Error('Some days in this range are already booked');
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
        'metadata[apartmentName]': apartment.name,
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
    } finally {
      setIsLoading(false);
    }
  };

  const numberOfNights = bookingDetails.checkIn && bookingDetails.checkOut
    ? differenceInDays(bookingDetails.checkOut, bookingDetails.checkIn)
    : 0;

  const totalPrice = calculateTotalPrice(numberOfNights);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Book {apartment.name}</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* ✅ Continue rendering DatePickers, inputs, total price display, coupon field, etc. like before */}
        {/* (You can reuse the previous layout for form inputs and buttons) */}
      </div>
    </div>
  );
}
