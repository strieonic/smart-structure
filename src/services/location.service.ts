import axios from 'axios';
import prisma from '../config/database';
import logger from '../config/logger';

interface GeocodeResult {
  country: string;
  state: string;
  city: string;
  district?: string;
  pincode?: string;
  locality?: string;
  formattedAddress: string;
  zoneType: 'RURAL' | 'URBAN' | 'SEMI_URBAN' | 'INDUSTRIAL' | 'AGRICULTURAL';
  isMetro: boolean;
}

class LocationService {
  // Using OpenStreetMap Nominatim API (FREE!)
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';

  // Metro cities in India
  private metroCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 
    'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'
  ];

  /**
   * Reverse geocode coordinates to get location details using OpenStreetMap
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    try {
      logger.info(`Reverse geocoding with OpenStreetMap: ${latitude}, ${longitude}`);

      const response = await axios.get(`${this.nominatimBaseUrl}/reverse`, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'SmartLoadAnalyzer/1.0' // Required by Nominatim
        }
      });

      if (!response.data || !response.data.address) {
        throw new Error('No geocoding results found');
      }

      const address = response.data.address;

      // Extract location components from OpenStreetMap response
      const locationData = this.extractLocationComponents(address);
      locationData.formattedAddress = response.data.display_name;

      // Determine zone type
      locationData.zoneType = this.determineZoneType(locationData, address);
      locationData.isMetro = this.metroCities.includes(locationData.city);

      logger.info(`Geocoded to: ${locationData.city}, ${locationData.state}`);
      return locationData;

    } catch (error: any) {
      logger.error('Reverse geocoding error:', error);
      throw new Error(`Failed to geocode location: ${error.message}`);
    }
  }

  /**
   * Get or create location data in database
   */
  async getOrCreateLocation(latitude: number, longitude: number) {
    try {
      // Check if location already exists (within ~100m radius)
      const existing = await prisma.locationData.findFirst({
        where: {
          latitude: {
            gte: latitude - 0.001,
            lte: latitude + 0.001
          },
          longitude: {
            gte: longitude - 0.001,
            lte: longitude + 0.001
          }
        }
      });

      if (existing) {
        logger.info(`Using cached location data: ${existing.id}`);
        return existing;
      }

      // Geocode new location
      const geocoded = await this.reverseGeocode(latitude, longitude);

      // Create location record
      const location = await prisma.locationData.create({
        data: {
          latitude,
          longitude,
          country: geocoded.country,
          state: geocoded.state,
          city: geocoded.city,
          district: geocoded.district,
          pincode: geocoded.pincode,
          locality: geocoded.locality,
          zoneType: geocoded.zoneType,
          isMetro: geocoded.isMetro,
          formattedAddress: geocoded.formattedAddress
        }
      });

      logger.info(`Created new location data: ${location.id}`);
      return location;

    } catch (error: any) {
      logger.error('Error in getOrCreateLocation:', error);
      throw error;
    }
  }

  /**
   * Get applicable government rules for a location
   */
  async getApplicableRules(locationId: string, buildingType?: string) {
    try {
      const location = await prisma.locationData.findUnique({
        where: { id: locationId }
      });

      if (!location) {
        throw new Error('Location not found');
      }

      // Fetch rules applicable to this location
      const rules = await prisma.governmentRule.findMany({
        where: {
          status: 'ACTIVE',
          effectiveFrom: {
            lte: new Date()
          },
          AND: [
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: new Date() } }
              ]
            },
            {
              OR: [
                // State-specific rules
                {
                  state: location.state,
                  city: null,
                  zoneType: location.zoneType
                },
                // City-specific rules
                {
                  state: location.state,
                  city: location.city,
                  zoneType: location.zoneType
                },
                // National rules (apply everywhere)
                {
                  state: 'ALL',
                  zoneType: location.zoneType
                }
              ]
            }
          ]
        },
        orderBy: [
          { ruleCategory: 'asc' },
          { city: 'desc' } // City-specific rules take precedence
        ]
      });

      logger.info(`Found ${rules.length} applicable rules for ${location.city}, ${location.state}`);
      return rules;

    } catch (error: any) {
      logger.error('Error fetching applicable rules:', error);
      throw error;
    }
  }

  /**
   * Extract location components from OpenStreetMap response
   */
  private extractLocationComponents(address: any): GeocodeResult {
    const data: any = {
      country: address.country || 'India',
      state: address.state || address.region || '',
      city: address.city || address.town || address.village || address.municipality || '',
      district: address.county || address.state_district || '',
      pincode: address.postcode || '',
      locality: address.suburb || address.neighbourhood || address.hamlet || ''
    };

    // Fallback: use district as city if city not found
    if (!data.city && data.district) {
      data.city = data.district;
    }

    // If still no city, use state
    if (!data.city) {
      data.city = data.state;
    }

    return data as GeocodeResult;
  }

  /**
   * Determine zone type based on location characteristics
   */
  private determineZoneType(location: Partial<GeocodeResult>, address: any): 'RURAL' | 'URBAN' | 'SEMI_URBAN' | 'INDUSTRIAL' | 'AGRICULTURAL' {
    // Metro cities are always urban
    if (this.metroCities.includes(location.city || '')) {
      return 'URBAN';
    }

    // Check address type from OpenStreetMap
    const addressType = address.type || '';
    
    // Industrial areas
    if (addressType.includes('industrial') || 
        (location.locality || '').toLowerCase().includes('industrial')) {
      return 'INDUSTRIAL';
    }

    // Villages are rural
    if (address.village || addressType === 'village' || addressType === 'hamlet') {
      return 'RURAL';
    }

    // Cities and towns are urban
    if (address.city || address.town || addressType === 'city' || addressType === 'town') {
      return 'URBAN';
    }

    // Check for urban keywords
    const urbanCities = [
      'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
      'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara', 'Ghaziabad',
      'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan'
    ];

    if (urbanCities.includes(location.city || '')) {
      return 'URBAN';
    }

    // Default to semi-urban for other cases
    return 'SEMI_URBAN';
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new LocationService();
