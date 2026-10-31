/**
 * Même règle que le backend (PhoneNumbers.java) : numéro camerounais à 9 chiffres,
 * commençant par 6 (mobile) ou 2 (fixe), avec ou sans +237 / 00237 / espaces.
 * Renvoie « +2376XXXXXXXX », ou null si le numéro n'est pas valide.
 */
export function normalizeCameroonPhone(raw: string): string | null {
  let d = raw.replace(/[\s.\-()]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  if (!/^\d+$/.test(d)) return null;
  if (d.length === 12 && d.startsWith('237')) d = d.slice(3);
  return /^[26]\d{8}$/.test(d) ? `+237${d}` : null;
}
