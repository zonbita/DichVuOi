import { useEffect, useRef, useState } from 'react';
import {
  defaultMapCenter,
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
  /** Bản đồ thấp hơn — dùng trong form thuê gọn. */
  compact?: boolean;
};

function MapStatusOverlay({
  status,
}: {
  status: 'loading' | 'unavailable';
}) {
  if (status === 'loading') {
    return (
      <p className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-[var(--color-muted)]">
        Đang tải bản đồ...
      </p>
    );
  }
  return (
    <p className="absolute inset-0 flex items-center justify-center bg-white/90 px-4 text-center text-sm text-[var(--color-muted)]">
      Không tải được Google Maps — hãy nhập địa chỉ bên dưới.
    </p>
  );
}

export function AddressMapPicker({
  id = 'address-map-picker',
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'Số nhà, đường, phường / quận…',
  disabled = false,
  compact = false,
}: Props) {
  const apiKey = getGoogleMapsApiKey();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapStatus, setMapStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>(
    apiKey ? 'idle' : 'unavailable',
  );

  const showFallbackInput = !apiKey || mapStatus === 'unavailable';

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
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: defaultMapCenter(),
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

        setMapStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setMapStatus('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, disabled]);

  return (
    <div>
      <p
        className={`font-semibold text-[var(--color-ink)] ${
          compact ? 'mb-0.5 text-[13px]' : 'mb-1.5 text-sm'
        }`}
      >
        Địa chỉ thực hiện
      </p>
      {compact ? null : (
        <p className="mb-2 text-xs text-[var(--color-muted)]">
          Chọn vị trí trên bản đồ (bấm hoặc kéo ghim).
        </p>
      )}

      {apiKey ? (
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-line)]">
          <div
            ref={mapRef}
            className={`w-full bg-[var(--color-canvas)] ${compact ? 'h-32 sm:h-36' : 'h-56'}`}
            aria-hidden
          />
          {mapStatus === 'loading' || mapStatus === 'unavailable' ? (
            <MapStatusOverlay status={mapStatus} />
          ) : null}
        </div>
      ) : null}

      {value.trim() && mapStatus === 'ready' ? (
        <p
          className={`text-[var(--color-ink)] ${
            compact ? 'mt-1 line-clamp-1 text-xs' : 'mt-2 text-sm'
          }`}
        >
          <span className="font-semibold">Đã chọn:</span> {value}
        </p>
      ) : null}

      {showFallbackInput ? (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="street-address"
          className={`field-input ${apiKey ? 'mt-3' : ''}`}
        />
      ) : null}

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
