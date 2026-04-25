import { TravelInventoryItem } from '../types';

/**
 * Pool of 30 possible travel recommendations spanning all regions,
 * booking types, price ranges, and travel styles.
 *
 * In production this would come from a travel inventory/deals service.
 */
export const TRAVEL_INVENTORY: TravelInventoryItem[] = [
  // --- Caribbean ---
  {
    id: 'inv_001', destination: 'Cancún', region: 'Caribbean', bookingType: 'package',
    title: 'All-Inclusive Cancún Beach Resort', description: '7-night stay at a beachfront all-inclusive resort with water sports and spa.',
    estimatedPrice: { amount: 2200, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 11, 12], loyaltyPointsEarned: 4400,
  },
  {
    id: 'inv_002', destination: 'St. Lucia', region: 'Caribbean', bookingType: 'hotel',
    title: 'St. Lucia Boutique Hotel', description: 'Luxury boutique hotel overlooking the Pitons with private beach access.',
    estimatedPrice: { amount: 3500, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 4, 12], loyaltyPointsEarned: 7000, tierMinimum: 'Gold',
  },
  {
    id: 'inv_003', destination: 'Caribbean Islands', region: 'Caribbean', bookingType: 'cruise',
    title: 'Eastern Caribbean Cruise', description: '10-day cruise visiting St. Thomas, St. Maarten, and Barbados.',
    estimatedPrice: { amount: 2800, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 11, 12], loyaltyPointsEarned: 5600,
  },
  {
    id: 'inv_004', destination: 'Aruba', region: 'Caribbean', bookingType: 'flight',
    title: 'Round-Trip Flights to Aruba', description: 'Direct flights to Aruba from major US hubs with flexible dates.',
    estimatedPrice: { amount: 450, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 6, 7, 11, 12], loyaltyPointsEarned: 900,
  },

  // --- Europe ---
  {
    id: 'inv_005', destination: 'Paris', region: 'Europe', bookingType: 'hotel',
    title: 'Boutique Hotel in Le Marais, Paris', description: '5-night stay in a charming boutique hotel in the heart of Paris.',
    estimatedPrice: { amount: 1800, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [4, 5, 6, 9, 10], loyaltyPointsEarned: 3600,
  },
  {
    id: 'inv_006', destination: 'Santorini', region: 'Europe', bookingType: 'package',
    title: 'Santorini Sunset Package', description: 'Hotel, island tours, wine tasting, and sunset catamaran cruise.',
    estimatedPrice: { amount: 3200, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [5, 6, 7, 8, 9], loyaltyPointsEarned: 6400, tierMinimum: 'Gold',
  },
  {
    id: 'inv_007', destination: 'Reykjavik', region: 'Europe', bookingType: 'package',
    title: 'Iceland Adventure Week', description: 'Northern Lights, glacier hiking, hot springs, and whale watching.',
    estimatedPrice: { amount: 2600, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [1, 2, 3, 10, 11, 12], loyaltyPointsEarned: 5200,
  },
  {
    id: 'inv_008', destination: 'London', region: 'Europe', bookingType: 'flight',
    title: 'Business Class to London', description: 'Premium business class flights London Heathrow with lounge access.',
    estimatedPrice: { amount: 4200, currency: 'USD' }, travelStyle: 'business', seasonalMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], loyaltyPointsEarned: 8400, tierMinimum: 'Platinum',
  },
  {
    id: 'inv_009', destination: 'Lisbon', region: 'Europe', bookingType: 'flight',
    title: 'Economy Flights to Lisbon', description: 'Budget-friendly round-trip flights to Lisbon from East Coast cities.',
    estimatedPrice: { amount: 380, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [3, 4, 5, 9, 10], loyaltyPointsEarned: 760,
  },
  {
    id: 'inv_010', destination: 'Mediterranean', region: 'Europe', bookingType: 'cruise',
    title: 'Mediterranean Grand Voyage', description: '14-day cruise visiting Barcelona, Rome, Athens, and Dubrovnik.',
    estimatedPrice: { amount: 4500, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [5, 6, 7, 8, 9], loyaltyPointsEarned: 9000, tierMinimum: 'Gold',
  },

  // --- Asia-Pacific ---
  {
    id: 'inv_011', destination: 'Tokyo', region: 'Asia-Pacific', bookingType: 'hotel',
    title: 'Tokyo City Center Hotel', description: 'Modern hotel in Shinjuku with easy access to transit and dining.',
    estimatedPrice: { amount: 1500, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [3, 4, 10, 11], loyaltyPointsEarned: 3000,
  },
  {
    id: 'inv_012', destination: 'Bali', region: 'Asia-Pacific', bookingType: 'package',
    title: 'Bali Wellness Retreat', description: '10-day wellness retreat with yoga, meditation, and spa treatments.',
    estimatedPrice: { amount: 1900, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [4, 5, 6, 7, 8, 9], loyaltyPointsEarned: 3800,
  },
  {
    id: 'inv_013', destination: 'Maldives', region: 'Asia-Pacific', bookingType: 'hotel',
    title: 'Maldives Overwater Villa', description: 'Private overwater villa with personal butler and infinity pool.',
    estimatedPrice: { amount: 5500, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 4, 11, 12], loyaltyPointsEarned: 11000, tierMinimum: 'Platinum',
  },
  {
    id: 'inv_014', destination: 'Bangkok', region: 'Asia-Pacific', bookingType: 'flight',
    title: 'Flights to Bangkok', description: 'Round-trip economy flights to Bangkok with one-stop routing.',
    estimatedPrice: { amount: 600, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [11, 12, 1, 2, 3], loyaltyPointsEarned: 1200,
  },
  {
    id: 'inv_015', destination: 'Singapore', region: 'Asia-Pacific', bookingType: 'hotel',
    title: 'Singapore Business Hotel', description: 'Premium business hotel in Marina Bay with executive lounge.',
    estimatedPrice: { amount: 2200, currency: 'USD' }, travelStyle: 'business', seasonalMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], loyaltyPointsEarned: 4400, tierMinimum: 'Gold',
  },

  // --- US Domestic ---
  {
    id: 'inv_016', destination: 'New York', region: 'US Domestic', bookingType: 'hotel',
    title: 'Manhattan Midtown Hotel', description: 'Centrally located hotel near Times Square and Central Park.',
    estimatedPrice: { amount: 1200, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [4, 5, 6, 9, 10, 11, 12], loyaltyPointsEarned: 2400,
  },
  {
    id: 'inv_017', destination: 'Las Vegas', region: 'US Domestic', bookingType: 'hotel',
    title: 'Las Vegas Strip Resort', description: '3-night stay at a major Strip resort with pool access and shows.',
    estimatedPrice: { amount: 600, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 4, 5, 10, 11, 12], loyaltyPointsEarned: 1200,
  },
  {
    id: 'inv_018', destination: 'Grand Canyon', region: 'US Domestic', bookingType: 'rental_car',
    title: 'Grand Canyon Road Trip', description: '5-day SUV rental for a Grand Canyon and Sedona road trip.',
    estimatedPrice: { amount: 350, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [3, 4, 5, 9, 10], loyaltyPointsEarned: 700,
  },
  {
    id: 'inv_019', destination: 'Orlando', region: 'US Domestic', bookingType: 'package',
    title: 'Orlando Theme Park Package', description: 'Hotel + theme park tickets for the whole family.',
    estimatedPrice: { amount: 1800, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [3, 6, 7, 8, 12], loyaltyPointsEarned: 3600,
  },
  {
    id: 'inv_020', destination: 'Miami', region: 'US Domestic', bookingType: 'flight',
    title: 'Flights to Miami', description: 'Non-stop round-trip flights to Miami from major US airports.',
    estimatedPrice: { amount: 250, currency: 'USD' }, travelStyle: 'relaxation', seasonalMonths: [1, 2, 3, 11, 12], loyaltyPointsEarned: 500,
  },
  {
    id: 'inv_021', destination: 'Alaska', region: 'US Domestic', bookingType: 'cruise',
    title: 'Alaska Inside Passage Cruise', description: '7-day cruise through the Inside Passage with glacier viewing.',
    estimatedPrice: { amount: 2100, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [5, 6, 7, 8, 9], loyaltyPointsEarned: 4200,
  },
  {
    id: 'inv_022', destination: 'Yellowstone', region: 'US Domestic', bookingType: 'rental_car',
    title: 'Yellowstone National Park Road Trip', description: '7-day vehicle rental with camping gear for a Yellowstone adventure.',
    estimatedPrice: { amount: 400, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [5, 6, 7, 8, 9], loyaltyPointsEarned: 800,
  },

  // --- South America ---
  {
    id: 'inv_023', destination: 'Patagonia', region: 'South America', bookingType: 'package',
    title: 'Patagonia Trekking Adventure', description: '10-day guided trek through Torres del Paine with lodge stays.',
    estimatedPrice: { amount: 3000, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [11, 12, 1, 2, 3], loyaltyPointsEarned: 6000,
  },
  {
    id: 'inv_024', destination: 'Rio de Janeiro', region: 'South America', bookingType: 'hotel',
    title: 'Copacabana Beachfront Hotel', description: 'Beachfront hotel in Copacabana with ocean views and rooftop pool.',
    estimatedPrice: { amount: 900, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [1, 2, 6, 7, 8], loyaltyPointsEarned: 1800,
  },
  {
    id: 'inv_025', destination: 'Bogotá', region: 'South America', bookingType: 'flight',
    title: 'Flights to Bogotá', description: 'Budget-friendly round-trip flights to Colombia capital.',
    estimatedPrice: { amount: 320, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [1, 2, 3, 6, 7, 8, 12], loyaltyPointsEarned: 640,
  },

  // --- Africa ---
  {
    id: 'inv_026', destination: 'Cape Town', region: 'Africa', bookingType: 'package',
    title: 'Cape Town Explorer Package', description: 'Table Mountain, Cape Winelands, and coastal drives — 8-day adventure.',
    estimatedPrice: { amount: 2400, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [10, 11, 12, 1, 2, 3], loyaltyPointsEarned: 4800,
  },
  {
    id: 'inv_027', destination: 'Marrakech', region: 'Africa', bookingType: 'hotel',
    title: 'Marrakech Riad Experience', description: 'Traditional riad in the medina with rooftop terrace and cooking classes.',
    estimatedPrice: { amount: 700, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [3, 4, 5, 9, 10, 11], loyaltyPointsEarned: 1400,
  },
  {
    id: 'inv_028', destination: 'Serengeti', region: 'Africa', bookingType: 'package',
    title: 'Serengeti Safari Experience', description: '7-day luxury safari with guided game drives and lodge stays.',
    estimatedPrice: { amount: 4800, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [6, 7, 8, 9, 1, 2], loyaltyPointsEarned: 9600, tierMinimum: 'Gold',
  },

  // --- Mixed / Additional ---
  {
    id: 'inv_029', destination: 'Honolulu', region: 'Caribbean', bookingType: 'rental_car',
    title: 'Hawaii Island Hopping Car Rental', description: '7-day convertible rental for exploring Oahu and the North Shore.',
    estimatedPrice: { amount: 500, currency: 'USD' }, travelStyle: 'adventure', seasonalMonths: [1, 2, 3, 6, 7, 8, 11, 12], loyaltyPointsEarned: 1000,
  },
  {
    id: 'inv_030', destination: 'Nashville', region: 'US Domestic', bookingType: 'hotel',
    title: 'Nashville Music City Weekend', description: '3-night hotel near Broadway with live music venue passes.',
    estimatedPrice: { amount: 450, currency: 'USD' }, travelStyle: 'cultural', seasonalMonths: [3, 4, 5, 9, 10], loyaltyPointsEarned: 900,
  },
];
