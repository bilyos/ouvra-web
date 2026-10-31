'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { nearestPlace, placeLabel, searchPlaces, type Place } from '@/data/places';
import { cn } from '@/utils/cn';

export interface PickedPlace {
  label: string;
  lat: number;
  lng: number;
  source: 'list' | 'gps';
}

const STORAGE_KEY = 'ouvra-place';

/** Dernier lieu choisi, gardé sur cet appareil pour ne pas le ressaisir à chaque page. */
export function loadSavedPlace(): PickedPlace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PickedPlace) : null;
  } catch {
    return null;
  }
}

function savePlace(p: PickedPlace | null) {
  try {
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : on garde juste la valeur en mémoire */
  }
}

/**
 * Saisie d'un quartier (« Akwa, Douala ») avec suggestions, et le GPS en option.
 * Au Cameroun, le GPS est souvent refusé ou imprécis : le quartier est le chemin principal.
 */
export function PlacePicker({
  value,
  onChange,
  className,
  inputClassName,
  placeholder,
  autoFocus,
}: {
  value: PickedPlace | null;
  onChange: (p: PickedPlace | null) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const t = useTranslations('place');
  const id = useId();
  const [text, setText] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // La valeur peut changer de l'extérieur (lieu mémorisé, effacement)
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value?.label ?? '');
  }

  const results = open && text.trim() && text !== value?.label ? searchPlaces(text) : [];
  // Première ligne : « Ma position », puis les quartiers
  const options: ({ kind: 'gps' } | { kind: 'place'; place: Place })[] = [{ kind: 'gps' }, ...results.map((place) => ({ kind: 'place' as const, place }))];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (p: PickedPlace | null) => {
    savePlace(p);
    onChange(p);
    setText(p?.label ?? '');
    setOpen(false);
    setGpsError(null);
  };

  const locate = () => {
    setOpen(false);
    if (!navigator.geolocation) {
      setGpsError(t('gpsUnavailable'));
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const near = nearestPlace(pos.coords.latitude, pos.coords.longitude);
        pick({ label: near ? t('near', { place: placeLabel(near) }) : t('myPosition'), lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' });
      },
      (err) => {
        setLocating(false);
        setGpsError(err.code === err.PERMISSION_DENIED ? t('gpsDenied') : t('gpsFailed'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60_000 }
    );
  };

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    if (o.kind === 'gps') locate();
    else pick({ label: placeLabel(o.place), lat: o.place.lat, lng: o.place.lng, source: 'list' });
  };

  const listId = `${id}-list`;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-label={t('label')}
        autoComplete="off"
        autoFocus={autoFocus}
        value={text}
        placeholder={placeholder ?? t('placeholder')}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(e.target.value.trim() ? 1 : 0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(options.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && open) {
            e.preventDefault();
            choose(active);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        className={cn(
          'h-12 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-base outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-gray-300 focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/15 dark:hover:border-gray-700',
          inputClassName
        )}
      />
      {locating ? (
        <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label={t('locating')} />
      ) : value ? (
        <button type="button" onClick={() => pick(null)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={t('clear')}>
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {open && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-80 overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)]">
          {options.map((o, i) => (
            <li
              key={o.kind === 'gps' ? 'gps' : `${o.place.city}-${o.place.name}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(i);
              }}
              className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px]', active === i && 'bg-muted')}
            >
              {o.kind === 'gps' ? (
                <>
                  <LocateFixed className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
                  <span className="font-semibold">{t('useGps')}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    {o.place.name === 'Centre-ville' ? (
                      <span className="font-medium">{o.place.city}</span>
                    ) : (
                      <>
                        <span className="font-medium">{o.place.name}</span>
                        <span className="text-muted-foreground">, {o.place.city}</span>
                      </>
                    )}
                  </span>
                </>
              )}
            </li>
          ))}
          {text.trim() && text !== value?.label && results.length === 0 && <li className="px-3 py-2.5 text-sm text-muted-foreground">{t('noMatch')}</li>}
        </ul>
      )}
      {gpsError && (
        <p role="alert" className="mt-1.5 text-[13px] text-red-600 dark:text-red-300">
          {gpsError}
        </p>
      )}
    </div>
  );
}
