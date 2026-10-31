'use client';

import { cn } from '@/utils/cn';

interface SpinnerProps {
  /** Diamètre en pixels (défaut 24). */
  size?: number;
  /** Épaisseur de l'anneau en pixels (défaut 3). */
  thickness?: number;
  className?: string;
}

/**
 * Spinner classique et léger : un anneau dégradé qui tourne.
 * À utiliser partout où il y a un chargement (boutons, cartes, listes…).
 */
export function Spinner({ size = 24, thickness = 3, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn('inline-block animate-spin rounded-full align-middle', className)}
      style={{
        width: size,
        height: size,
        background:
          'conic-gradient(from 90deg at 50% 50%, transparent 0deg, currentColor 300deg)',
        color: 'var(--spinner-color, #f97316)',
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
      }}
    />
  );
}

interface LoadingOverlayProps {
  /** Message optionnel sous le spinner. */
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Voile de chargement léger qui recouvre son parent (à mettre en `relative`).
 * Fond translucide + flou, spinner centré — sans écran sombre plein page.
 */
export function LoadingOverlay({ label, size = 40, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex flex-col items-center justify-center gap-3',
        'bg-white/65 backdrop-blur-[2px] dark:bg-gray-950/60',
        className
      )}
    >
      <Spinner size={size} />
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
