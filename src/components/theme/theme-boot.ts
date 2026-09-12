export const THEME_STORAGE_KEY = "qlyk-theme";
export const LEGACY_THEME_STORAGE_KEY = "qlyk-landing-theme";

/** Aplica el tema antes de pintar. Por defecto: claro. */
export const THEME_BOOT_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('theme');var t=(q==='dark'||q==='light')?q:localStorage.getItem('${THEME_STORAGE_KEY}')||localStorage.getItem('${LEGACY_THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t='light'}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;
