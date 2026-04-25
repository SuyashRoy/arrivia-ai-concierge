import { Member } from '../types';

/**
 * Mock member data — 10 realistic members across different partners and tiers.
 *
 * Each member has a distinct travel pattern so the recommendation engine
 * can produce meaningfully different results for demo purposes.
 *
 * In production these would come from the member service via HTTP.
 */
export const MOCK_MEMBERS: Record<string, Member> = {
  // Beach person — always books Caribbean/Hawaii
  mem_001: {
    memberId: 'mem_001',
    loyaltyTier: 'Gold',
    partnerId: 'partner_luxbank',
    travelHistory: [
      { destination: 'Cancún', region: 'Caribbean', dates: { start: '2025-01-10', end: '2025-01-17' }, bookingType: 'package', rating: 5 },
      { destination: 'Honolulu', region: 'Caribbean', dates: { start: '2024-12-20', end: '2024-12-28' }, bookingType: 'hotel', rating: 4 },
      { destination: 'Punta Cana', region: 'Caribbean', dates: { start: '2024-06-05', end: '2024-06-12' }, bookingType: 'package', rating: 5 },
      { destination: 'Aruba', region: 'Caribbean', dates: { start: '2024-02-14', end: '2024-02-21' }, bookingType: 'flight', rating: 4 },
      { destination: 'St. Lucia', region: 'Caribbean', dates: { start: '2023-07-01', end: '2023-07-08' }, bookingType: 'cruise', rating: 5 },
    ],
    preferences: { preferredRegions: ['Caribbean'], budgetLevel: 'mid-range', travelStyle: 'relaxation' },
  },

  // Business traveler — city destinations midweek
  mem_002: {
    memberId: 'mem_002',
    loyaltyTier: 'Platinum',
    partnerId: 'partner_luxbank',
    travelHistory: [
      { destination: 'New York', region: 'US Domestic', dates: { start: '2025-03-03', end: '2025-03-05' }, bookingType: 'hotel', rating: 4 },
      { destination: 'London', region: 'Europe', dates: { start: '2025-01-13', end: '2025-01-16' }, bookingType: 'flight', rating: 5 },
      { destination: 'Singapore', region: 'Asia-Pacific', dates: { start: '2024-11-04', end: '2024-11-07' }, bookingType: 'hotel', rating: 4 },
      { destination: 'Chicago', region: 'US Domestic', dates: { start: '2024-09-09', end: '2024-09-11' }, bookingType: 'flight', rating: 3 },
      { destination: 'Tokyo', region: 'Asia-Pacific', dates: { start: '2024-06-17', end: '2024-06-20' }, bookingType: 'hotel', rating: 5 },
      { destination: 'San Francisco', region: 'US Domestic', dates: { start: '2024-04-01', end: '2024-04-03' }, bookingType: 'flight', rating: 4 },
    ],
    preferences: { preferredRegions: ['US Domestic', 'Europe'], budgetLevel: 'luxury', travelStyle: 'business' },
  },

  // Family vacationer — packages during school breaks
  mem_003: {
    memberId: 'mem_003',
    loyaltyTier: 'Gold',
    partnerId: 'partner_valuemiles',
    travelHistory: [
      { destination: 'Orlando', region: 'US Domestic', dates: { start: '2025-03-15', end: '2025-03-22' }, bookingType: 'package', rating: 5 },
      { destination: 'Cancún', region: 'Caribbean', dates: { start: '2024-12-22', end: '2024-12-29' }, bookingType: 'package', rating: 4 },
      { destination: 'San Diego', region: 'US Domestic', dates: { start: '2024-06-15', end: '2024-06-22' }, bookingType: 'rental_car', rating: 4 },
      { destination: 'Maui', region: 'Caribbean', dates: { start: '2023-12-23', end: '2023-12-30' }, bookingType: 'package', rating: 5 },
    ],
    preferences: { preferredRegions: ['US Domestic', 'Caribbean'], budgetLevel: 'mid-range', travelStyle: 'relaxation' },
  },

  // Luxury traveler — Platinum, high-end destinations
  mem_004: {
    memberId: 'mem_004',
    loyaltyTier: 'Platinum',
    partnerId: 'partner_globalexplorer',
    travelHistory: [
      { destination: 'Maldives', region: 'Asia-Pacific', dates: { start: '2025-02-10', end: '2025-02-20' }, bookingType: 'package', rating: 5 },
      { destination: 'Santorini', region: 'Europe', dates: { start: '2024-09-01', end: '2024-09-10' }, bookingType: 'hotel', rating: 5 },
      { destination: 'Bora Bora', region: 'Asia-Pacific', dates: { start: '2024-05-15', end: '2024-05-25' }, bookingType: 'cruise', rating: 5 },
      { destination: 'Swiss Alps', region: 'Europe', dates: { start: '2024-01-05', end: '2024-01-12' }, bookingType: 'hotel', rating: 4 },
      { destination: 'Dubai', region: 'Asia-Pacific', dates: { start: '2023-11-20', end: '2023-11-28' }, bookingType: 'flight', rating: 5 },
    ],
    preferences: { preferredRegions: ['Europe', 'Asia-Pacific'], budgetLevel: 'luxury', travelStyle: 'relaxation' },
  },

  // Budget explorer — Silver, economy flights, varied destinations
  mem_005: {
    memberId: 'mem_005',
    loyaltyTier: 'Silver',
    partnerId: 'partner_valuemiles',
    travelHistory: [
      { destination: 'Mexico City', region: 'South America', dates: { start: '2025-01-05', end: '2025-01-12' }, bookingType: 'flight', rating: 4 },
      { destination: 'Lisbon', region: 'Europe', dates: { start: '2024-09-10', end: '2024-09-17' }, bookingType: 'flight', rating: 5 },
      { destination: 'Bangkok', region: 'Asia-Pacific', dates: { start: '2024-04-20', end: '2024-04-30' }, bookingType: 'flight', rating: 4 },
      { destination: 'Bogotá', region: 'South America', dates: { start: '2023-11-01', end: '2023-11-08' }, bookingType: 'flight', rating: 3 },
    ],
    preferences: { preferredRegions: ['South America', 'Europe'], budgetLevel: 'economy', travelStyle: 'cultural' },
  },

  // Adventure seeker — unusual destinations
  mem_006: {
    memberId: 'mem_006',
    loyaltyTier: 'Gold',
    partnerId: 'partner_globalexplorer',
    travelHistory: [
      { destination: 'Reykjavik', region: 'Europe', dates: { start: '2025-02-01', end: '2025-02-08' }, bookingType: 'package', rating: 5 },
      { destination: 'Cape Town', region: 'Africa', dates: { start: '2024-10-10', end: '2024-10-20' }, bookingType: 'flight', rating: 5 },
      { destination: 'Queenstown', region: 'Asia-Pacific', dates: { start: '2024-06-01', end: '2024-06-10' }, bookingType: 'package', rating: 5 },
      { destination: 'Patagonia', region: 'South America', dates: { start: '2024-01-15', end: '2024-01-25' }, bookingType: 'flight', rating: 4 },
      { destination: 'Marrakech', region: 'Africa', dates: { start: '2023-09-05', end: '2023-09-12' }, bookingType: 'hotel', rating: 4 },
    ],
    preferences: { preferredRegions: ['Africa', 'South America'], budgetLevel: 'mid-range', travelStyle: 'adventure' },
  },

  // Cruise enthusiast — tests cruise exclusion rules
  mem_007: {
    memberId: 'mem_007',
    loyaltyTier: 'Gold',
    partnerId: 'partner_valuemiles',
    travelHistory: [
      { destination: 'Mediterranean', region: 'Europe', dates: { start: '2025-03-01', end: '2025-03-12' }, bookingType: 'cruise', rating: 5 },
      { destination: 'Alaska', region: 'US Domestic', dates: { start: '2024-07-10', end: '2024-07-20' }, bookingType: 'cruise', rating: 5 },
      { destination: 'Caribbean Islands', region: 'Caribbean', dates: { start: '2024-01-05', end: '2024-01-15' }, bookingType: 'cruise', rating: 4 },
      { destination: 'Norway Fjords', region: 'Europe', dates: { start: '2023-08-01', end: '2023-08-12' }, bookingType: 'cruise', rating: 5 },
    ],
    preferences: { preferredRegions: ['Europe', 'Caribbean'], budgetLevel: 'mid-range', travelStyle: 'relaxation' },
  },

  // Sparse history — only 1 booking
  mem_008: {
    memberId: 'mem_008',
    loyaltyTier: 'Silver',
    partnerId: 'partner_coastalcu',
    travelHistory: [
      { destination: 'Las Vegas', region: 'US Domestic', dates: { start: '2024-11-15', end: '2024-11-18' }, bookingType: 'hotel', rating: 3 },
    ],
    preferences: undefined,
  },

  // Domestic road-tripper — Coastal CU member (US Domestic only partner)
  mem_009: {
    memberId: 'mem_009',
    loyaltyTier: 'Gold',
    partnerId: 'partner_coastalcu',
    travelHistory: [
      { destination: 'Grand Canyon', region: 'US Domestic', dates: { start: '2025-03-01', end: '2025-03-05' }, bookingType: 'rental_car', rating: 5 },
      { destination: 'Nashville', region: 'US Domestic', dates: { start: '2024-10-10', end: '2024-10-14' }, bookingType: 'hotel', rating: 4 },
      { destination: 'Yellowstone', region: 'US Domestic', dates: { start: '2024-06-20', end: '2024-06-27' }, bookingType: 'rental_car', rating: 5 },
      { destination: 'Miami', region: 'US Domestic', dates: { start: '2024-02-14', end: '2024-02-18' }, bookingType: 'flight', rating: 4 },
    ],
    preferences: { preferredRegions: ['US Domestic'], budgetLevel: 'economy', travelStyle: 'adventure' },
  },

  // New Platinum member — sparse history but high tier (2 bookings)
  mem_010: {
    memberId: 'mem_010',
    loyaltyTier: 'Platinum',
    partnerId: 'partner_luxbank',
    travelHistory: [
      { destination: 'Paris', region: 'Europe', dates: { start: '2025-02-14', end: '2025-02-21' }, bookingType: 'hotel', rating: 5 },
      { destination: 'Tokyo', region: 'Asia-Pacific', dates: { start: '2024-10-01', end: '2024-10-08' }, bookingType: 'flight', rating: 4 },
    ],
    preferences: { preferredRegions: ['Europe'], budgetLevel: 'luxury', travelStyle: 'cultural' },
  },
};
