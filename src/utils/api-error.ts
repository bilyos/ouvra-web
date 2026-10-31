/** Extrait le message renvoyé par l'API (format axios) ou retourne le texte de secours. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { message?: unknown } } }).response?.data;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  }
  return fallback;
}
