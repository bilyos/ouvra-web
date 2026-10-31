// Module neutre (ni client ni serveur) : importable par le layout serveur et par le ThemeProvider client.

export const THEME_STORAGE_KEY = 'alloservice-theme';

/** Exécuté avant le premier rendu pour poser la classe `dark` sans flash. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
