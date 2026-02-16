import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { ProperlyLoader } from '@/components/properly-loader';
import { apiRequest } from '@/lib/queryClient';

interface PropertyMapProps {
  address: string;
}

export function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const res = await apiRequest('GET', '/api/maps/token');
        if (!res.ok) {
          setMapError(true);
          return;
        }
        const { token } = await res.json();

        if (!window.mapkit) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js';
            script.crossOrigin = 'anonymous';
            script.dataset.libraries = 'map,annotations,services';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load MapKit'));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        if (!mapkit.maps || mapkit.maps.length === 0) {
          mapkit.init({
            authorizationCallback: (done: (token: string) => void) => done(token),
          });
        }

        if (!mapRef.current || cancelled) return;

        const geocoder = new mapkit.Geocoder();
        geocoder.lookup(address, (error: any, data: any) => {
          if (cancelled || !mapRef.current) return;
          if (error || !data?.results?.length) {
            setMapError(true);
            return;
          }

          const place = data.results[0];
          const coordinate = place.coordinate;

          if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
          }

          const map = new mapkit.Map(mapRef.current, {
            center: coordinate,
            cameraDistance: 800,
            mapType: mapkit.Map.MapTypes.Standard,
            showsCompass: mapkit.FeatureVisibility.Hidden,
            showsZoomControl: false,
            showsMapTypeControl: false,
            isScrollEnabled: false,
            isZoomEnabled: false,
            isRotationEnabled: false,
            colorScheme: mapkit.Map.ColorSchemes.Light,
          });

          const marker = new mapkit.MarkerAnnotation(coordinate, {
            color: '#425b58',
            title: address,
          });
          map.addAnnotation(marker);

          mapInstanceRef.current = map;
          setMapLoaded(true);
        });
      } catch {
        if (!cancelled) setMapError(true);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [address]);

  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;

  if (mapError) {
    return (
      <Card className="bg-white shadow-sm border overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-[#e7f6f3] h-40 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">{address}</p>
            </div>
          </div>
          <div className="p-4">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
              data-testid="link-view-on-map"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on Apple Maps
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border overflow-hidden" data-testid="property-map-card">
      <CardContent className="p-0">
        <div ref={mapRef} className="h-48 w-full bg-[#e7f6f3] relative">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ProperlyLoader size="sm" />
            </div>
          )}
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground truncate">{address}</p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
            data-testid="link-view-on-map"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

declare global {
  interface Window {
    mapkit: any;
  }
  var mapkit: any;
}
