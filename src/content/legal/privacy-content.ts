import { legalMeta, legalPrivacyParagraphs } from "@/config/legal";
import type { LegalSection } from "@/config/legal";

export const privacyIntro = `Esta Política de Privacidad explica qué datos personales recogemos en ${legalMeta.brand}, para qué los usamos, con quién los compartimos, durante cuánto tiempo y qué derechos puedes ejercer. Se aplica a visitantes, Usuarios registrados, Creadores y compradores. Al usar la Plataforma aceptas este tratamiento conforme a lo aquí descrito y a la normativa aplicable, incluido el Reglamento (UE) 2016/679 ("RGPD") cuando corresponda.`;

export const privacySections: LegalSection[] = [
  {
    id: "responsable",
    title: "Responsable del tratamiento",
    blocks: [
      {
        paragraphs: legalPrivacyParagraphs(),
      },
    ],
  },
  {
    id: "datos",
    title: "Datos personales que tratamos",
    blocks: [
      {
        paragraphs: ["Recogemos únicamente los datos necesarios para prestar el servicio. Según tu uso, podemos tratar:"],
        list: [
          "Datos identificativos: nombre visible (displayName), nombre de usuario (@username), email, imagen de perfil (si la subes o vinculas con Google).",
          "Datos de acceso: contraseña almacenada de forma cifrada (hash), tokens de sesión, fecha de último acceso.",
          "Datos de registro: idioma (locale), zona horaria, aceptación de términos (marca temporal lógica).",
          "Datos de perfil y actividad social: biografía, publicaciones, comentarios, likes, seguidores, membresías de comunidad.",
          "Contenido multimedia: videos, miniaturas, materiales de cursos y archivos subidos a la Plataforma.",
          "Datos comerciales: historial de pedidos, productos adquiridos o vendidos, importes, moneda, estado de pago, movimientos de monedero, solicitudes de retiro.",
          "Datos técnicos: dirección IP, identificadores de dispositivo/navegador, logs de servidor, cookies esenciales (ver Política de Cookies).",
          "Datos de verificación: información KYC o bancaria si solicitas retiros o superas umbrales de riesgo (cuando se active).",
          "Comunicaciones: mensajes que nos envíes a soporte o por email.",
        ],
      },
      {
        paragraphs: [
          "No recogemos categorías especiales de datos (salud, ideología, etc.) salvo que tú los incluyas voluntariamente en contenido público, bajo tu exclusiva responsabilidad.",
        ],
      },
    ],
  },
  {
    id: "origen",
    title: "Origen de los datos",
    blocks: [
      {
        list: [
          "Directamente de ti, al registrarte, editar tu perfil, publicar, comprar o contactarnos.",
          "Automáticamente, mediante cookies técnicas, logs y eventos de uso necesarios para seguridad y funcionamiento.",
          "De terceros autorizados por ti, p. ej. Google si eliges iniciar sesión con Google OAuth.",
          "De otros Usuarios, p. ej. cuando te mencionan, te siguen o interactúan con tu contenido.",
        ],
      },
    ],
  },
  {
    id: "finalidades",
    title: "Finalidades y bases jurídicas",
    blocks: [
      {
        paragraphs: ["Tratamos tus datos para las siguientes finalidades, amparadas en estas bases legales:"],
        list: [
          "Crear y gestionar tu Cuenta, autenticarte y mantener la sesión — ejecución del contrato (art. 6.1.b RGPD).",
          "Operar el feed, comunidad, academia, checkout y monedero — ejecución del contrato.",
          "Calcular y abonar importes de ventas (93/7 o plan mensual), aplicar retenciones de 14 días y procesar retiros — ejecución del contrato e interés legítimo en prevenir fraude.",
          "Procesar pagos por transferencia bancaria y cumplir obligaciones contables/fiscales — ejecución del contrato y obligación legal.",
          "Enviar comunicaciones operativas (confirmaciones, seguridad, cambios legales) — ejecución del contrato e interés legítimo.",
          "Enviar comunicaciones comerciales propias — consentimiento o interés legítimo conforme a la LSSI, con opción de baja en todo momento.",
          "Moderar contenido, investigar abusos y proteger la Plataforma — interés legítimo en seguridad.",
          "Cumplir requerimientos de autoridades — obligación legal.",
          "Elaborar estadísticas agregadas y anónimas de uso — interés legítimo, sin identificarte cuando sea posible.",
        ],
      },
    ],
  },
  {
    id: "decisiones",
    title: "Decisiones automatizadas y elaboración de perfiles",
    blocks: [
      {
        paragraphs: [
          "Podemos aplicar reglas automáticas antifraude (p. ej. retener fondos, bloquear retiros o marcar cuentas sospechosas) basadas en patrones de compra, contracargos o comportamiento anómalo.",
          "No adoptamos decisiones automatizadas con efectos jurídicos significativos sobre ti sin intervención humana, salvo medidas de seguridad urgentes. Puedes contactarnos para solicitar revisión.",
          "Las clasificaciones de gamificación (puntos, rankings) son funcionales del producto y no producen efectos legales externos.",
        ],
      },
    ],
  },
  {
    id: "destinatarios",
    title: "Destinatarios y encargados del tratamiento",
    blocks: [
      {
        paragraphs: [
          "No vendemos ni alquilamos tus datos personales. Solo los comunicamos cuando es necesario para operar la Plataforma o cumplir la ley:",
        ],
        list: [
          "Proveedores de infraestructura y hosting (p. ej. Vercel) — alojamiento de la aplicación.",
          "Base de datos PostgreSQL gestionada por el proveedor configurado en el despliegue.",
          "Almacenamiento de comprobantes de pago (Vercel Blob) — conservación de evidencia de transferencias.",
          "Resend u otros proveedores de email transaccional — envío de notificaciones operativas.",
          "Vercel Blob u otros almacenes de archivos — alojamiento de videos e imágenes subidas.",
          "Google — únicamente si activas el inicio de sesión OAuth con tu consentimiento.",
          "Asesores legales, contables o auditores, bajo confidencialidad.",
          "Autoridades públicas, cuando exista obligación legal.",
        ],
      },
      {
        paragraphs: [
          "Exigimos a nuestros encargados contratos que garanticen medidas de seguridad adecuadas y tratamiento conforme a nuestras instrucciones.",
        ],
      },
    ],
  },
  {
    id: "transferencias",
    title: "Transferencias internacionales",
    blocks: [
      {
        paragraphs: [
          "Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo (EEE). En esos casos aplicamos garantías reconocidas por el RGPD, como Cláusulas Contractuales Tipo de la Comisión Europea o decisiones de adecuación, según el proveedor concreto.",
          "Puedes solicitarnos información adicional sobre las garantías aplicables escribiendo a privacidad.",
        ],
      },
    ],
  },
  {
    id: "conservacion",
    title: "Plazos de conservación",
    blocks: [
      {
        list: [
          "Datos de Cuenta activa: mientras mantengas la Cuenta y, tras la baja, el tiempo necesario para gestionar reclamaciones y obligaciones legales (habitualmente hasta 6 años en materia mercantil/fiscal, salvo plazo superior exigido por ley).",
          "Datos de pedidos y pagos: conforme a obligaciones contables y fiscales.",
          "Logs de seguridad: periodo limitado (habitualmente 12 meses, salvo investigación activa).",
          "Cookies: según la Política de Cookies.",
          "Contenido publicado: puede permanecer anonimizado o eliminarse tras la baja, salvo copias de respaldo temporales o conservación legal.",
        ],
      },
    ],
  },
  {
    id: "derechos",
    title: "Tus derechos",
    blocks: [
      {
        paragraphs: [
          "Si resides en el EEE o en territorios con normativa equivalente, puedes ejercer gratuitamente (con identificación razonable) los siguientes derechos:",
        ],
        list: [
          "Acceso — saber qué datos tratamos sobre ti.",
          "Rectificación — corregir datos inexactos o incompletos.",
          "Supresión — solicitar borrado cuando proceda.",
          "Limitación — restringir el tratamiento en supuestos legalmente previstos.",
          "Oposición — oponerte a tratamientos basados en interés legítimo.",
          "Portabilidad — recibir tus datos en formato estructurado cuando el tratamiento se base en contrato o consentimiento y sea automatizado.",
          "Retirar el consentimiento — en cualquier momento, sin afectar a la licitud previa.",
        ],
      },
      {
        paragraphs: [
          `Para ejercerlos escribe a ${legalMeta.privacyEmail} indicando el derecho que deseas ejercer y acreditando tu identidad. Responderemos en un plazo máximo de un mes, prorrogable según RGPD.`,
          "Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (AEPD): https://www.aepd.es",
        ],
      },
    ],
  },
  {
    id: "menores",
    title: "Menores de edad",
    blocks: [
      {
        paragraphs: [
          "La Plataforma no está dirigida a menores de 18 años. No recogemos datos de menores de forma consciente. Si detectamos una Cuenta de menor, la eliminaremos y borraremos los datos asociados salvo conservación legal obligatoria.",
          "Si eres padre, madre o tutor y crees que un menor nos ha facilitado datos, contacta con nosotros de inmediato.",
        ],
      },
    ],
  },
  {
    id: "seguridad",
    title: "Medidas de seguridad",
    blocks: [
      {
        paragraphs: [
          "Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS), contraseñas hasheadas, control de acceso, copias de seguridad y monitorización.",
          "Ningún sistema es 100% seguro. Debes usar contraseñas robustas, activar medidas disponibles en tu dispositivo y notificarnos accesos no autorizados.",
          "En caso de violación de seguridad con riesgo para tus derechos, te informaremos y, si procede, notificaremos a la autoridad de control conforme a la ley.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies y tecnologías similares",
    blocks: [
      {
        paragraphs: [
          "Usamos cookies esenciales de sesión (NextAuth) y, en su caso, cookies analíticas agregadas. Consulta el detalle, tipos y cómo gestionarlas en nuestra Política de Cookies.",
        ],
      },
    ],
  },
  {
    id: "cambios",
    title: "Cambios en esta Política",
    blocks: [
      {
        paragraphs: [
          "Podemos actualizar esta Política para reflejar cambios legales o del servicio. Indicaremos la fecha de la última revisión. Los cambios sustanciales se comunicarán por medios razonables (aviso en la Plataforma o email).",
        ],
      },
    ],
  },
];

export const privacyRelated = [
  { href: "/legal/terms", label: "Términos de Uso" },
  { href: "/legal/cookies", label: "Política de Cookies" },
];
