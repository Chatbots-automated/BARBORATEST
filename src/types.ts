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
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: string;
}
