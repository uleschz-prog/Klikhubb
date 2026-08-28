import { legalMeta } from "@/config/legal";
import type { LegalSection } from "@/config/legal";

export const cookiesIntro = `Esta Política de Cookies explica qué cookies y tecnologías similares utiliza ${legalMeta.brand}, para qué sirven y cómo puedes gestionarlas. Complementa la Política de Privacidad.`;

export const cookiesSections: LegalSection[] = [
  {
    id: "que-son",
    title: "Qué son las cookies",
    blocks: [
      {
        paragraphs: [
          "Las cookies son pequeños archivos de texto que un sitio web almacena en tu navegador. Permiten recordar preferencias, mantener la sesión iniciada o medir el uso agregado del servicio.",
          "También podemos usar almacenamiento local o tecnologías equivalentes con fines similares.",
        ],
      },
    ],
  },
  {
    id: "tipos",
    title: "Cookies que utilizamos",
    blocks: [
      {
        paragraphs: ["Según su finalidad:"],
        list: [
          "Cookies técnicas o esenciales (necesarias): imprescindibles para autenticación (NextAuth), seguridad CSRF y funcionamiento básico. No requieren consentimiento en la UE.",
          "Cookies de preferencia: recuerdan opciones de interfaz cuando existan.",
          "Cookies analíticas agregadas: nos ayudan a entender uso general del feed y rendimiento, preferiblemente de forma anonimizada. Si no son estrictamente necesarias, solo se activarán con tu consentimiento cuando implementemos un banner de cookies.",
        ],
      },
      {
        paragraphs: ["Cookies concretas habituales en la Plataforma:"],
        list: [
          "Cookies de sesión NextAuth — mantener tu inicio de sesión — duración: sesión / según configuración — esenciales.",
          "Cookies de proveedor de pago (Stripe) — prevención de fraude en checkout — pueden activarse al pagar — esenciales para la transacción.",
        ],
      },
    ],
  },
  {
    id: "terceros",
    title: "Cookies de terceros",
    blocks: [
      {
        paragraphs: [
          "Si inicias sesión con Google, Google puede instalar sus propias cookies conforme a su política: https://policies.google.com/privacy",
          "Los enlaces a redes sociales en el pie de página pueden redirigir a sitios de terceros con sus propias políticas.",
        ],
      },
    ],
  },
  {
    id: "gestion",
    title: "Cómo gestionar o rechazar cookies",
    blocks: [
      {
        paragraphs: [
          "Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que bloquear cookies esenciales puede impedir iniciar sesión o usar funciones críticas.",
          "Consulta la ayuda de tu navegador: Chrome, Firefox, Safari, Edge u otros.",
          "Para cookies analíticas no esenciales, cuando exista panel de preferencias podrás aceptar o rechazarlas sin afectar al núcleo del servicio.",
        ],
      },
    ],
  },
  {
    id: "actualizacion",
    title: "Actualizaciones",
    blocks: [
      {
        paragraphs: [
          `Última actualización: ${legalMeta.lastUpdated}. Podemos modificar esta Política cuando incorporemos nuevas herramientas. Revisa esta página periódicamente.`,
        ],
      },
    ],
  },
];

export const cookiesRelated = [
  { href: "/legal/privacy", label: "Política de Privacidad" },
  { href: "/legal/terms", label: "Términos de Uso" },
];
