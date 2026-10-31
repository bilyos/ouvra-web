import {
  AirVent,
  BookOpen,
  Camera,
  CookingPot,
  Hammer,
  Laptop,
  PaintRoller,
  Scissors,
  SprayCan,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: [RegExp, LucideIcon][] = [
  [/plomb/i, Wrench],
  [/electr/i, Zap],
  [/menage|nettoy/i, SprayCan],
  [/coiff|beaut|esthet/i, Scissors],
  [/menuis|bois|macon|soud|repar/i, Hammer],
  [/peint|decor/i, PaintRoller],
  [/clim|froid/i, AirVent],
  [/inform|tel/i, Laptop],
  [/cours|repet/i, BookOpen],
  [/demen|transp/i, Truck],
  [/photo/i, Camera],
  [/traiteur|cuisin/i, CookingPot],
];

export const iconFor = (id: string) => ICONS.find(([re]) => re.test(id))?.[1] ?? Wrench;

/** Les métiers ouverts au fil de demandes en phase 1 apparaissent en premier. */
export const PILOT_CATEGORIES = ['plomberie', 'electricite', 'climatisation', 'menage'];
