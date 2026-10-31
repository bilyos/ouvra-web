/**
 * Quartiers et villes du Cameroun, avec un point central approximatif (à ~1 km près).
 * Suffisant pour chercher des prestataires dans un rayon de 15 à 20 km quand le GPS
 * est refusé ou imprécis. Pour ajouter un quartier : nom usuel, ville, coordonnées.
 */
export interface Place {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

const q = (city: string, list: [string, number, number][]): Place[] => list.map(([name, lat, lng]) => ({ name, city, lat, lng }));

export const PLACES: Place[] = [
  ...q('Douala', [
    ['Akwa', 4.0483, 9.6996],
    ['Akwa Nord', 4.06, 9.72],
    ['Bonanjo', 4.0436, 9.689],
    ['Bonapriso', 4.031, 9.696],
    ['Bali', 4.04, 9.702],
    ['Deïdo', 4.064, 9.709],
    ['Bépanda', 4.064, 9.728],
    ['New Bell', 4.038, 9.715],
    ['Mboppi', 4.042, 9.708],
    ['Ndokoti', 4.045, 9.739],
    ['Ndogbong', 4.056, 9.748],
    ['Cité des Palmiers', 4.058, 9.755],
    ['Kotto', 4.07, 9.76],
    ['Makepe', 4.085, 9.755],
    ['Bonamoussadi', 4.095, 9.74],
    ['Logpom', 4.087, 9.77],
    ['Logbaba', 4.03, 9.77],
    ['Bassa', 4.038, 9.762],
    ['Village', 4.015, 9.742],
    ['Yassa', 4.005, 9.795],
    ['Japoma', 4.005, 9.81],
    ['Bonabéri', 4.075, 9.663],
  ]),
  ...q('Yaoundé', [
    ['Centre-ville', 3.8667, 11.5167],
    ['Bastos', 3.893, 11.508],
    ['Tsinga', 3.885, 11.508],
    ['Nlongkak', 3.885, 11.523],
    ['Elig-Edzoa', 3.893, 11.53],
    ['Omnisport', 3.885, 11.542],
    ['Essos', 3.873, 11.539],
    ['Mimboman', 3.87, 11.565],
    ['Ngousso', 3.895, 11.55],
    ['Emana', 3.92, 11.515],
    ['Etoudi', 3.915, 11.525],
    ['Mokolo', 3.875, 11.502],
    ['Melen', 3.865, 11.493],
    ['Obili', 3.858, 11.497],
    ['Mvog-Mbi', 3.855, 11.523],
    ['Ekounou', 3.838, 11.542],
    ['Biyem-Assi', 3.84, 11.48],
    ['Mendong', 3.832, 11.463],
    ['Nkolbisson', 3.873, 11.45],
    ['Mvan', 3.818, 11.525],
    ['Odza', 3.8, 11.535],
    ['Ahala', 3.79, 11.51],
  ]),
  // Autres villes : centre-ville seulement, en attendant les quartiers
  ...(
    [
      ['Bafoussam', 5.4778, 10.4176],
      ['Bamenda', 5.9631, 10.1591],
      ['Garoua', 9.3019, 13.3921],
      ['Maroua', 10.5956, 14.3247],
      ['Ngaoundéré', 7.3167, 13.5833],
      ['Bertoua', 4.577, 13.6846],
      ['Ebolowa', 2.9, 11.15],
      ['Kribi', 2.9406, 9.91],
      ['Limbé', 4.0167, 9.2167],
      ['Buea', 4.1527, 9.241],
      ['Kumba', 4.6363, 9.4469],
      ['Edéa', 3.8, 10.1333],
      ['Nkongsamba', 4.9547, 9.9404],
      ['Dschang', 5.45, 10.05],
    ] as [string, number, number][]
  ).map(([city, lat, lng]) => ({ name: 'Centre-ville', city, lat, lng })),
];

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const placeLabel = (p: Place) => (p.name === 'Centre-ville' ? p.city : `${p.name}, ${p.city}`);

/** « akwa », « Akwa Douala », « yaounde bastos », « deido » : sans accents ni ordre imposé. */
export function searchPlaces(query: string, limit = 8): Place[] {
  const words = fold(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const scored: { p: Place; score: number }[] = [];
  for (const p of PLACES) {
    const name = fold(p.name);
    const hay = `${name} ${fold(p.city)}`;
    if (!words.every((w) => hay.includes(w))) continue;
    // Le quartier qui commence par la saisie passe devant
    const score = (name.startsWith(words[0]) ? 0 : 1) + (p.name === 'Centre-ville' ? 0.5 : 0);
    scored.push({ p, score });
  }
  return scored.sort((a, b) => a.score - b.score || placeLabel(a.p).localeCompare(placeLabel(b.p))).slice(0, limit).map((s) => s.p);
}

/** Quartier connu le plus proche d'un point GPS, pour afficher « près de Bastos » plutôt que des coordonnées. */
export function nearestPlace(lat: number, lng: number): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of PLACES) {
    const d = (p.lat - lat) ** 2 + ((p.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  // Au-delà d'environ 25 km, le quartier le plus proche ne veut plus rien dire
  return bestD < 0.05 ? best : null;
}
