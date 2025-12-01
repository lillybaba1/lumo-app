"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, X, Loader2 } from 'lucide-react';

const LOCATION_CONSENT_KEY = 'lumo-location-consent';
const LOCATION_DATA_KEY = 'lumo-location-data';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  timestamp: string;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasConsent: boolean | null;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check existing consent and location
    const consent = localStorage.getItem(LOCATION_CONSENT_KEY);
    if (consent === 'granted') {
      setHasConsent(true);
      const savedLocation = localStorage.getItem(LOCATION_DATA_KEY);
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          // Check if location is less than 24 hours old
          const age = Date.now() - new Date(parsed.timestamp).getTime();
          if (age < 24 * 60 * 60 * 1000) {
            setLocation(parsed);
          } else {
            // Refresh location
            fetchLocation();
          }
        } catch (e) {
          fetchLocation();
        }
      } else {
        fetchLocation();
      }
    } else if (consent === 'denied') {
      setHasConsent(false);
    } else {
      // Show prompt after delay if no decision made
      const timer = setTimeout(() => {
        // Only show if cookie consent is done
        if (localStorage.getItem('lumo-cookie-consent')) {
          setShowPrompt(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try browser geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Try to get city/country from coordinates using free API
      let locationData: LocationData = {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      };

      try {
        const geoResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          locationData = {
            ...locationData,
            city: geoData.city || geoData.locality,
            region: geoData.principalSubdivision,
            country: geoData.countryName,
            countryCode: geoData.countryCode,
          };
        }
      } catch (e) {
        // Geocoding failed, but we still have coordinates
        console.log('Geocoding failed, using coordinates only');
      }

      setLocation(locationData);
      localStorage.setItem(LOCATION_DATA_KEY, JSON.stringify(locationData));
      localStorage.setItem(LOCATION_CONSENT_KEY, 'granted');
      setHasConsent(true);
    } catch (err: any) {
      console.error('Location error:', err);
      if (err.code === 1) {
        setError('Location access denied');
        localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
        setHasConsent(false);
      } else if (err.code === 2) {
        setError('Location unavailable');
      } else if (err.code === 3) {
        setError('Location request timed out');
      } else {
        setError('Failed to get location');
      }
    } finally {
      setLoading(false);
      setShowPrompt(false);
    }
  };

  const requestLocation = async () => {
    await fetchLocation();
  };

  const clearLocation = () => {
    localStorage.removeItem(LOCATION_DATA_KEY);
    localStorage.removeItem(LOCATION_CONSENT_KEY);
    setLocation(null);
    setHasConsent(null);
    setError(null);
  };

  const handleDeny = () => {
    localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
    setHasConsent(false);
    setShowPrompt(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        hasConsent,
        requestLocation,
        clearLocation,
      }}
    >
      {children}

      {/* Location Prompt */}
      {showPrompt && (
        <div className="fixed bottom-24 right-4 z-40 max-w-sm">
          <Card className="shadow-xl border-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm">Enable Location</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1 -mr-1"
                      onClick={handleDeny}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow location access for local shipping rates and nearby store features.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={requestLocation}
                      disabled={loading}
                      className="text-xs"
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-1" />
                      )}
                      Allow
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDeny} className="text-xs">
                      Not Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Simple component to display current location
export function LocationDisplay() {
  const { location, loading, requestLocation, hasConsent } = useLocation();

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Getting location...</span>
      </div>
    );
  }

  if (location) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <MapPin className="h-3 w-3 text-primary" />
        <span>{location.city || location.country || 'Location detected'}</span>
      </div>
    );
  }

  if (hasConsent === false) {
    return (
      <button
        onClick={requestLocation}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <MapPin className="h-3 w-3" />
        <span>Set location</span>
      </button>
    );
  }

  return null;
}
