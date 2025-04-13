export interface Apartment {
  id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  image_url: string | null;
}

export interface BookingDetails {
  apartmentId: string;
  checkIn: Date;
  checkOut: Date;
  guestName: string;
  guestEmail: string;
  country: string;
  phoneNumber: string;
  numberOfGuests: number;
  hasPets: boolean;
  extraBed: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: string;
}