import { Apartment } from '../types';

export const apartments: Apartment[] = [
  {
    id: 'gintaras',
    name: 'Senovinis medinis namas "Gintaras"',
    description: 'A cozy apartment with stunning amber-colored interiors, perfect for couples.',
    pricePerNight: 0.5,
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
    features: ['1 Bedroom', 'Kitchen', 'Wi-Fi', 'Air Conditioning', 'City View']
  },
  {
    id: 'pikulas',
    name: 'Dvivietis apartamentas "Pikulas"',
    description: 'Modern and spacious apartment with traditional Lithuanian elements.',
    pricePerNight: 150,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
    features: ['2 Bedrooms', 'Full Kitchen', 'Wi-Fi', 'Balcony', 'Park View']
  },
  {
    id: 'mara',
    name: 'Šeimyninis apartamentas "Māra"',
    description: 'Luxurious waterfront apartment with panoramic views.',
    pricePerNight: 180,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
    features: ['2 Bedrooms', 'Luxury Kitchen', 'Wi-Fi', 'Terrace', 'Sea View']
  },
  {
    id: 'medeine',
    name: 'Namelis dviems "Medeinė"',
    description: 'Forest-themed apartment surrounded by nature.',
    pricePerNight: 140,
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
    features: ['1 Bedroom', 'Kitchen', 'Wi-Fi', 'Garden Access', 'Forest View']
  }
];