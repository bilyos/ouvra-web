export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
  appName: 'Ouvra',
  /** Coordonnées publiques : rien n'est affiché tant que la variable n'est pas renseignée. */
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
    whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || '',
  },
  social: [
    { label: 'Facebook', href: process.env.NEXT_PUBLIC_FACEBOOK_URL || '' },
    { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '' },
    { label: 'LinkedIn', href: process.env.NEXT_PUBLIC_LINKEDIN_URL || '' },
  ].filter((s) => s.href),
  appDescription: 'Trouvez les meilleurs prestataires de services près de chez vous',
  defaultMapCenter: { lat: 3.848, lng: 11.5021 } as const,
  defaultMapZoom: 13,
  itemsPerPage: 20,
} as const;
