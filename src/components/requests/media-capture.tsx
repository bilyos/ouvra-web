'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mic, Square, Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const MAX_PHOTOS = 4;
export const MAX_VOICE_SECONDS = 60;

const SENDABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
/** Windows ne donne pas toujours de type aux fichiers HEIC : on regarde aussi l'extension. */
const IMAGE_NAME = /\.(jpe?g|jfif|png|webp|gif|heic|heif|avif|bmp)$/i;

/**
 * Réduit une photo de téléphone (souvent 3 à 6 Mo) à environ 250 Ko avant l'envoi :
 * 1600 px au plus, WebP. Redessiner l'image retire aussi ses métadonnées, dont la position GPS.
 */
export async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Le serveur n'accepte que ces formats : une photo HEIC d'iPhone que Chrome ne sait pas lire finirait refusée
    if (SENDABLE.includes(file.type)) return file;
    throw new Error(`unreadable:${file.name}`);
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.75));
  if (!blob) return file;
  // Safari ancien : pas de WebP en sortie, il renvoie du PNG souvent plus lourd que l'original
  if (blob.type !== 'image/webp' && blob.size > file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.png'), { type: blob.type });
}

export interface LocalPhoto {
  id: string;
  file: File;
  preview: string;
}

/** Jusqu'à 4 photos : l'appareil photo s'ouvre directement sur téléphone. */
export function PhotoPicker({ photos, onChange, busy }: { photos: LocalPhoto[]; onChange: (p: LocalPhoto[]) => void; busy?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setCompressing(true);
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/') || IMAGE_NAME.test(f.name)).slice(0, room);
    const results = await Promise.allSettled(picked.map(compressPhoto));
    const ready = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    setRejected(picked.filter((_, i) => results[i].status === 'rejected').map((f) => f.name));
    onChange([...photos, ...ready.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    setCompressing(false);
    if (input.current) input.current.value = '';
  };

  const remove = (id: string) => {
    const p = photos.find((x) => x.id === id);
    if (p) URL.revokeObjectURL(p.preview);
    onChange(photos.filter((x) => x.id !== id));
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {photos.map((p) => (
        <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.preview} alt="" className="h-full w-full object-cover" />
          {!busy && (
            <button
              type="button"
              onClick={() => remove(p.id)}
              aria-label="Retirer la photo"
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-950/70 text-white hover:bg-gray-950"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {photos.length < MAX_PHOTOS && (
        <button
          type="button"
          disabled={busy || compressing}
          onClick={() => input.current?.click()}
          className={cn(
            'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-brand-600 hover:text-brand-800 dark:border-gray-700 dark:hover:border-brand-300 dark:hover:text-brand-200',
            photos.length === 0 && 'col-span-2 aspect-[2/1]'
          )}
        >
          {compressing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
          {photos.length === 0 ? 'Prendre une photo' : 'Ajouter'}
        </button>
      )}
      <input ref={input} type="file" accept="image/*,.heic,.heif" capture="environment" multiple hidden onChange={(e) => void add(e.target.files)} />
      {rejected.length > 0 && (
        <p className="col-span-4 text-[13px] text-red-700 dark:text-red-300" role="alert">
          {rejected.length === 1 ? `« ${rejected[0]} » n’a pas pu être lue` : `${rejected.length} photos n’ont pas pu être lues`} par ce navigateur. Le format HEIC
          de l’iPhone n’est lu que par Safari : prenez la photo depuis le site, ou envoyez-la en JPEG.
        </p>
      )}
    </div>
  );
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

export interface LocalVoice {
  blob: Blob;
  url: string;
  seconds: number;
}

/**
 * Note vocale d'une minute au plus. Pratique pour expliquer en français, en anglais ou en pidgin
 * sans avoir à écrire. Opus à 24 kbit/s : une minute pèse moins de 200 Ko.
 */
export function VoiceRecorder({ value, onChange, busy }: { value: LocalVoice | null; onChange: (v: LocalVoice | null) => void; busy?: boolean }) {
  const [state, setState] = useState<'idle' | 'recording' | 'denied' | 'unsupported'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<() => void>(() => {});

  useEffect(() => () => stopTimer.current(), []);

  const start = async () => {
    const mime = pickMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setState('denied');
      return;
    }
    const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24_000 });
    const chunks: Blob[] = [];
    const startedAt = Date.now();

    // Niveau du micro : montre que l'enregistrement entend bien quelque chose
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      setLevel(buf.reduce((a, b) => a + b, 0) / buf.length / 128);
      const elapsed = (Date.now() - startedAt) / 1000;
      setSeconds(Math.floor(elapsed));
      if (elapsed >= MAX_VOICE_SECONDS) rec.stop();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    stopTimer.current = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    };
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopTimer.current();
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      const secs = Math.max(1, Math.min(MAX_VOICE_SECONDS, Math.round((Date.now() - startedAt) / 1000)));
      onChange({ blob, url: URL.createObjectURL(blob), seconds: secs });
      setState('idle');
      setLevel(0);
    };
    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setState('recording');
  };

  const stop = () => recorder.current?.state === 'recording' && recorder.current.stop();

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 pl-3">
        <Mic className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" />
        <audio src={value.url} controls preload="metadata" className="h-9 min-w-0 flex-1" />
        {!busy && (
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(value.url);
              onChange(null);
            }}
            aria-label="Supprimer la note vocale"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (state === 'recording') {
    const left = MAX_VOICE_SECONDS - seconds;
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-2 pl-3 dark:border-red-500/40 dark:bg-red-500/10" role="status">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className="tabular text-sm font-semibold">0:{String(seconds).padStart(2, '0')}</span>
        <span className="flex h-6 flex-1 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-red-500/70 transition-[height] duration-100"
              style={{ height: `${Math.max(12, Math.min(100, level * 100 * (0.55 + 0.45 * Math.sin(i * 1.7 + seconds))))}%` }}
            />
          ))}
        </span>
        <span className="hidden text-[12px] text-muted-foreground sm:inline">{left} s</span>
        <button type="button" onClick={stop} className="flex h-9 items-center gap-1.5 rounded-md bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700">
          <Square className="h-3.5 w-3.5 fill-current" />
          Arrêter
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void start()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card text-[15px] font-semibold transition-colors hover:border-brand-600 hover:text-brand-800 dark:hover:border-brand-300 dark:hover:text-brand-200"
      >
        <Mic className="h-5 w-5" />
        Expliquer par une note vocale
      </button>
      {state === 'denied' && <p className="mt-2 text-[13px] text-red-700 dark:text-red-300">Le micro est bloqué. Autorisez-le dans votre navigateur, ou écrivez quelques mots.</p>}
      {state === 'unsupported' && <p className="mt-2 text-[13px] text-muted-foreground">Ce navigateur ne sait pas enregistrer. Écrivez quelques mots à la place.</p>}
    </div>
  );
}
