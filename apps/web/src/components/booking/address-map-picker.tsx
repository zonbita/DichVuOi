import { useEffect, useRef, useState } from 'react';
import {
  defaultMapCenter,
  geocodeAddress,
  getGoogleMapsApiKey,
  loadGoogleMaps,
  reverseGeocode,
} from '../../lib/google-maps';

type Props = {
  id?: string;
  value: string;
  onChange: (address: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function AddressMapPicker({
  id = 'address-map-picker',
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'Địa chỉ thực hiện',
  disabled = false,
}: Props) {
  const apiKey = getGoogleMapsApiKey();
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocodeTimerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>(
    apiKey ? 'idle' : 'unavailable',
  );

  function setMarkerPosition(position: google.maps.LatLngLiteral, pan = true) {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position,
        draggable: !disabled,
      });
      markerRef.current.addListener('dragend', async () => {
        const latLng = markerRef.current?.getPosition();
        if (!latLng) return;
        const address = await reverseGeocode(latLng.lat(), latLng.lng());
        if (address) onChangeRef.current(address);
      });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setDraggable(!disabled);
    }

    if (pan) map.panTo(position);
  }

  useEffect(() => {
    if (!apiKey || disabled) return;

    let cancelled = false;
    setMapStatus('loading');

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !inputRef.current) return;

        const center = defaultMapCenter();
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapInstanceRef.current = map;

        map.addListener('click', async (event: google.maps.MapMouseEvent) => {
          const latLng = event.latLng;
          if (!latLng) return;
          setMarkerPosition({ lat: latLng.lat(), lng: latLng.lng() });
          const address = await reverseGeocode(latLng.lat(), latLng.lng());
          if (address) onChangeRef.current(address);
        });

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'vn' },
          fields: ['formatted_address', 'geometry'],
        });
        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) onChangeRef.current(place.formatted_address);
          const location = place.geometry?.location;
          if (location) {
            setMarkerPosition({ lat: location.lat(), lng: location.lng() });
          }
        });

        setMapStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setMapStatus('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, disabled]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !value.trim()) return;

    if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = window.setTimeout(async () => {
      const location = await geocodeAddress(value.trim());
      if (!location) return;
      setMarkerPosition({ lat: location.lat(), lng: location.lng() }, false);
    }, 700);

    return () => {
      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current);
    };
  }, [mapStatus, value]);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        Địa chỉ thực hiện
      </label>
      <input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="field-input"
      />
      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        Gõ địa chỉ thủ công hoặc chọn trên bản đồ — hệ thống tự điền ô trên.
      </p>

      {apiKey ? (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-[var(--color-line)]">
          <div ref={mapRef} className="h-56 w-full bg-[var(--color-canvas)]" aria-hidden />
          {mapStatus === 'loading' ? (
            <p className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-[var(--color-muted)]">
              Đang tải bản đồ...
            </p>
          ) : null}
          {mapStatus === 'unavailable' ? (
            <p className="absolute inset-0 flex items-center justify-center bg-white/90 px-4 text-center text-sm text-[var(--color-muted)]">
              Không tải được Google Maps — bạn vẫn có thể gõ địa chỉ thủ công.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Chưa cấu hình Google Maps API — nhập địa chỉ thủ công.
        </p>
      )}

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
