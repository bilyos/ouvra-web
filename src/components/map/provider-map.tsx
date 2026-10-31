'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Loader2,
  Star,
  X,
  ZoomIn,
  ZoomOut,
  Locate,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import type { ProviderCard } from '@/types';

interface ProviderMapProps {
  providers: ProviderCard[];
  userLat?: number;
  userLng?: number;
  isLoading?: boolean;
  onProviderClick?: (provider: ProviderCard) => void;
  className?: string;
}

const MAP_CENTER_LAT = 4.05;
const MAP_CENTER_LNG = 9.7;
const BASE_SCALE = 800;

function latLngToXY(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  const x = (lng - centerLng) * scale + offsetX;
  const y = -(lat - centerLat) * scale + offsetY;
  return { x, y };
}

const gradientColors = [
  'bg-blue-500',
  'bg-brand-500',
  'bg-brand-500',
  'bg-brand-500',
  'bg-brand-500',
  'bg-sun-500',
];

function getProviderColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return gradientColors[Math.abs(hash) % gradientColors.length];
}

export function ProviderMap({
  providers,
  userLat,
  userLng,
  isLoading,
  onProviderClick,
  className,
}: ProviderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<ProviderCard | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const centerLat = userLat ?? MAP_CENTER_LAT;
  const centerLng = userLng ?? MAP_CENTER_LNG;
  const scale = BASE_SCALE * zoom;
  const cx = dimensions.width / 2 + panOffset.x;
  const cy = dimensions.height / 2 + panOffset.y;

  const toXY = useCallback(
    (lat: number, lng: number) => latLngToXY(lat, lng, centerLat, centerLng, scale, cx, cy),
    [centerLat, centerLng, scale, cx, cy],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: panStart.current.ox + (e.clientX - panStart.current.x),
      y: panStart.current.oy + (e.clientY - panStart.current.y),
    });
  };

  const handlePointerUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(5, z - e.deltaY * 0.001)));
  };

  const recenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const userPos = userLat && userLng ? toXY(userLat, userLng) : null;

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border bg-gray-100 dark:bg-gray-900', className)}>
      {/* Map canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Grid pattern background */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />
        </svg>

        {/* Radius circles when user position is known */}
        {userPos && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {[5, 10, 20].map((km) => {
              const r = km * scale * 0.009;
              return (
                <g key={km}>
                  <circle
                    cx={userPos.x}
                    cy={userPos.y}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    className="text-brand-300 dark:text-brand-700"
                    opacity={0.5}
                  />
                  <text
                    x={userPos.x + r + 4}
                    y={userPos.y - 4}
                    className="text-[10px] fill-brand-400 dark:fill-brand-600"
                  >
                    {km} km
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* User position marker */}
        {userPos && (
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: userPos.x, top: userPos.y }}
          >
            <div className="relative">
              <div className="absolute -inset-4 animate-ping rounded-full bg-blue-500/20" />
              <div className="absolute -inset-2 rounded-full bg-blue-500/15" />
              <div className="h-4 w-4 rounded-full border-[3px] border-white bg-blue-500 shadow-lg" />
            </div>
          </div>
        )}

        {/* Provider pins */}
        {providers.map((provider) => {
          if (!provider.distanceKm && provider.distanceKm !== 0) return null;
          const angle = (parseInt(provider.id, 36) % 360) * (Math.PI / 180);
          const dist = (provider.distanceKm || 1) * scale * 0.009;
          const pos = userPos
            ? { x: userPos.x + Math.cos(angle) * dist, y: userPos.y + Math.sin(angle) * dist }
            : toXY(
                centerLat + (Math.sin(angle) * (provider.distanceKm || 5)) / 111,
                centerLng + (Math.cos(angle) * (provider.distanceKm || 5)) / 111,
              );

          const isSelected = selected?.id === provider.id;

          return (
            <div
              key={provider.id}
              data-pin
              className={cn(
                'absolute z-10 -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200',
                isSelected ? 'z-30 scale-110' : 'hover:z-20',
              )}
              style={{ left: pos.x, top: pos.y }}
              onClick={() => {
                setSelected(isSelected ? null : provider);
                onProviderClick?.(provider);
              }}
            >
              {/* Pin shape */}
              <div className="relative">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-[3px] shadow-lg transition-colors',
                  isSelected
                    ? 'border-brand-600 bg-brand-600'
                    : 'border-white bg-white dark:border-gray-700 dark:bg-gray-800',
                )}>
                  {provider.avatarUrl ? (
                    <img loading="lazy" decoding="async" src={provider.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-gray-500')} />
                  )}
                </div>
                {/* Pin tail */}
                <div className={cn(
                  'mx-auto -mt-0.5 h-2 w-2 rotate-45 border-b-[3px] border-r-[3px] shadow-sm',
                  isSelected
                    ? 'border-brand-600 bg-brand-600'
                    : 'border-white bg-white dark:border-gray-700 dark:bg-gray-800',
                )} />
                {/* Online indicator */}
                {provider.online && (
                  <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-gray-800" />
                )}
                {/* Rating badge */}
                <div className="absolute -right-2 top-6 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-0.5 shadow-md dark:bg-gray-800">
                  <Star className="h-2.5 w-2.5 fill-sun-400 text-sun-400" />
                  <span className="text-[9px] font-bold text-foreground/85">{provider.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              <p className="text-sm font-medium text-muted-foreground">
                Recherche des prestataires proches...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && providers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-500">Aucun prestataire trouvé à proximité</p>
              <p className="text-xs text-gray-400 mt-1">Essayez d&apos;élargir votre rayon de recherche</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected provider card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 z-50 rounded-xl border border-border bg-card p-4 shadow-xl sm:left-auto sm:right-4 sm:w-[320px]"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-muted hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br', getProviderColor(selected.id))}>
                {selected.avatarUrl ? (
                  <img loading="lazy" decoding="async" src={selected.avatarUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white">{selected.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-foreground truncate">{selected.name}</h4>
                <p className="text-sm text-gray-500 truncate">{selected.profession}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-sun-400 text-sun-400" />
                    <span className="text-xs font-semibold">{selected.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({selected.reviewCount})</span>
                  </div>
                  {selected.distanceKm != null && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {selected.distanceKm < 1
                        ? `${Math.round(selected.distanceKm * 1000)} m`
                        : `${selected.distanceKm.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-bold text-brand-600">
                À partir de {formatPrice(selected.startingPrice)}
              </p>
              {selected.online && (
                <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  En ligne
                </span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`/providers/${selected.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
              >
                Voir le profil
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map controls */}
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-1.5">
        <button
          onClick={() => setZoom((z) => Math.min(5, z + 0.3))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.3))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={recenter}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Provider count badge */}
      <div className="absolute left-3 top-3 z-30 rounded-xl border border-border bg-white px-3 py-1.5 shadow-sm dark:bg-gray-800">
        <span className="text-xs font-semibold text-foreground/85">
          {providers.length} prestataire{providers.length > 1 ? 's' : ''} à proximité
        </span>
      </div>
    </div>
  );
}
