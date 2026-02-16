import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect?: (result: { address: string; coordinate?: { latitude: number; longitude: number } }) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  'data-testid'?: string;
}

interface AutocompleteResult {
  displayLines: string[];
  coordinate?: { latitude: number; longitude: number };
}

let mapkitInitState: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
let mapkitInitPromise: Promise<void> | null = null;

function loadMapKitScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="apple-mapkit"]')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MapKit JS'));
    document.head.appendChild(script);
  });
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function initMapKit(): Promise<void> {
  if (mapkitInitState === 'ready') return;
  if (mapkitInitState === 'failed') throw new Error('MapKit init failed');
  if (mapkitInitPromise) return mapkitInitPromise;

  mapkitInitPromise = (async () => {
    mapkitInitState = 'loading';
    try {
      await loadMapKitScript();

      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');

      const res = await fetch('/api/maps/token', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Token fetch failed');
      const data = await res.json();

      await new Promise<void>((resolve, reject) => {
        try {
          (window as any).mapkit.init({
            authorizationCallback: (done: (token: string) => void) => {
              done(data.token);
            },
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      mapkitInitState = 'ready';
    } catch (e) {
      mapkitInitState = 'failed';
      mapkitInitPromise = null;
      throw e;
    }
  })();

  return mapkitInitPromise;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  id,
  'data-testid': testId,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mapkitReady, setMapkitReady] = useState(false);
  const [initFailed, setInitFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<any>(null);

  useEffect(() => {
    initMapKit()
      .then(() => {
        setMapkitReady(true);
        const mk = (window as any).mapkit;
        searchRef.current = new mk.Search({
          region: new mk.CoordinateRegion(
            new mk.Coordinate(-25.2744, 133.7751),
            new mk.CoordinateSpan(40, 40)
          ),
        });
      })
      .catch(() => {
        setInitFailed(true);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doAutocomplete = useCallback((query: string) => {
    if (!searchRef.current || !query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchRef.current.autocomplete(query, (error: any, data: any) => {
      if (error || !data?.results) {
        setSuggestions([]);
        return;
      }
      const results: AutocompleteResult[] = data.results.map((r: any) => ({
        displayLines: r.displayLines || [r.completionUrl || ''],
        coordinate: r.coordinate ? {
          latitude: r.coordinate.latitude,
          longitude: r.coordinate.longitude,
        } : undefined,
      }));
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!mapkitReady) return;

    debounceRef.current = setTimeout(() => {
      doAutocomplete(val);
    }, 300);
  };

  const handleSelect = (result: AutocompleteResult) => {
    const address = result.displayLines.join(', ');
    onChange(address);
    onSelect?.({ address, coordinate: result.coordinate });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const inputClasses = className || 'w-full border border-[#d5d7da] rounded-[8px] px-[14px] py-[10px] text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-[#425b58]/20 focus:border-[#425b58]';

  if (initFailed || (!mapkitReady && mapkitInitState === 'failed')) {
    return (
      <input
        type="text"
        id={id}
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClasses}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={id}
        data-testid={testId}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder}
        className={inputClasses}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#d5d7da] rounded-[8px] shadow-lg max-h-[240px] overflow-y-auto" data-testid={testId ? `${testId}-dropdown` : 'address-dropdown'}>
          {suggestions.map((result, index) => (
            <div
              key={index}
              onClick={() => handleSelect(result)}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[#e7f6f3] cursor-pointer text-sm"
              data-testid={testId ? `${testId}-suggestion-${index}` : `address-suggestion-${index}`}
            >
              <MapPin className="h-4 w-4 text-[#717680] mt-0.5 shrink-0" />
              <span className="text-[#414651]">{result.displayLines.join(', ')}</span>
            </div>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-[#a0a4ab] text-center border-t border-[#f0f0f0]">
            Powered by Apple Maps
          </div>
        </div>
      )}
    </div>
  );
}
