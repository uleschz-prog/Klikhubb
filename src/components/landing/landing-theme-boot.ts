/** Clave compartida entre script de boot (servidor) y el provider cliente. */
export const LANDING_THEME_STORAGE_KEY = "qlyk-landing-theme";

/** Inline JS: aplica tema antes de pintar la landing. */
export const LANDING_THEME_BOOT_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=(q==='dark'||q==='light')?q:localStorage.getItem('${LANDING_THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-landing-theme',t);}catch(e){}})();`;
