import { legalIdentityParagraphs, legalMeta } from "@/config/legal";
import type { LegalSection } from "@/config/legal";

export const termsIntro = `Estos Términos de Uso ("Términos") regulan el acceso y uso de la plataforma ${legalMeta.brand} ("${legalMeta.brand}", "la Plataforma", "nosotros" o "el Operador"), accesible en ${legalMeta.siteUrl}. Al crear una cuenta, marcar la casilla de aceptación o usar la Plataforma, confirmas que has leído, comprendido y aceptado estos Términos en su totalidad. Si no estás de acuerdo, no debes registrarte ni utilizar el servicio.`;

export const termsSections: LegalSection[] = [
  {
    id: "identificacion",
    title: "Identificación del operador",
    blocks: [
      {
        paragraphs: legalIdentityParagraphs(),
      },
    ],
  },
  {
    id: "definiciones",
    title: "Definiciones",
    blocks: [
      {
        list: [
          '«Usuario»: persona física mayor de edad (o con capacidad legal equivalente) que crea una cuenta.',
          '«Cuenta»: perfil personal identificado por email, nombre de usuario (@usuario) y credenciales de acceso.',
          '«Creador»: Usuario que publica contenido, productos, cursos o membresías en la Plataforma.',
          '«Miembro» o «Estudiante»: Usuario que consume contenido, participa en comunidades o realiza compras.',
          '«Producto»: bien o servicio digital (curso, membresía, contenido descargable u otro activo digital) ofrecido por un Creador.',
          '«Compra»: transacción pagada procesada a través de los medios habilitados en la Plataforma (transferencia bancaria con confirmación manual).',
          '«Monedero»: saldo interno que refleja importes pendientes o disponibles derivados de ventas o ajustes, sujeto a retenciones y verificaciones.',
          '«Hold» o «retención»: periodo de 14 días naturales durante el cual ciertos importes permanecen bloqueados antes de poder retirarse, para gestionar devoluciones, contracargos o incidencias.',
        ],
      },
    ],
  },
  {
    id: "aceptacion",
    title: "Aceptación, elegibilidad y registro",
    blocks: [
      {
        paragraphs: [
          "El registro en la Plataforma es gratuito y directo. No existe lista de espera ni cuota de acceso obligatoria para crear una cuenta básica.",
          "Debes ser mayor de 18 años — o la edad mínima legal en tu país si es superior — y tener capacidad para contratar. No puedes usar la Plataforma si estás suspendido o expulsado previamente.",
          "Te comprometes a facilitar datos veraces, completos y actualizados (nombre, email, usuario, idioma, zona horaria y, en su caso, datos de pago o verificación). Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu Cuenta.",
          "Al registrarte declaras haber leído y aceptado estos Términos y la Política de Privacidad. La casilla de aceptación es obligatoria; sin ella no se crea la cuenta.",
        ],
      },
    ],
  },
  {
    id: "servicio",
    title: "Descripción del servicio",
    blocks: [
      {
        paragraphs: [
          `${legalMeta.brand} es una red social con funciones de feed de video, comunidad, academia y comercio digital. Permite publicar contenido, vender productos digitales, interactuar con audiencias y recibir pagos integrados en la experiencia.`,
          "El Operador actúa como intermediario tecnológico entre Creadores y compradores. Salvo que se indique expresamente lo contrario, el Operador no es vendedor de los Productos de terceros ni empleador de los Creadores.",
          "Podemos modificar, suspender o discontinuar funciones de la Plataforma por mantenimiento, seguridad, cumplimiento legal o mejora del producto, procurando avisar con antelación razonable cuando sea posible.",
        ],
      },
    ],
  },
  {
    id: "cuentas-roles",
    title: "Cuentas y roles",
    blocks: [
      {
        paragraphs: [
          "Al registrarte tu Cuenta recibe acceso completo para publicar y comprar. No hay distinción de modalidad Creador/Miembro en el alta.",
          "No existe sistema de referidos ni comisión por invitación. El registro es individual y no genera recompensas por reclutar a otras personas.",
        ],
      },
    ],
  },
  {
    id: "contenido",
    title: "Contenido del usuario y conducta",
    blocks: [
      {
        paragraphs: [
          "Conservas la titularidad de los contenidos que publiques. Al subirlos, concedes al Operador una licencia no exclusiva, mundial, gratuita y sublicenciable para alojar, reproducir, distribuir, mostrar y promocionar dichos contenidos únicamente en la medida necesaria para operar la Plataforma.",
          "Eres el único responsable de tus publicaciones, Productos, precios, descripciones, cumplimiento fiscal y legalidad del material (derechos de autor, marcas, imagen, consumo, publicidad, sector regulado, etc.).",
        ],
        list: [
          "Está prohibido publicar contenido ilegal, difamatorio, odio, acoso, pornografía no consentida, explotación de menores, malware o estafas.",
          "Está prohibido manipular métricas, crear cuentas falsas o realizar autopagos fraudulentos.",
          "Está prohibido el spam, la suplantación y cualquier conducta que perjudique a otros Usuarios o a la infraestructura.",
        ],
      },
      {
        paragraphs: [
          "Nos reservamos el derecho — sin obligación previa de moderación exhaustiva — de eliminar contenido, pausar Productos o suspender Cuentas que infrinjan estos Términos o la ley aplicable.",
        ],
      },
    ],
  },
  {
    id: "comercio",
    title: "Compras, precios e impuestos",
    blocks: [
      {
        paragraphs: [
          "Los precios de los Productos los fija cada Creador. El importe final puede incluir impuestos según la legislación aplicable y la configuración del checkout.",
          "Al realizar una Compra, celebras un contrato directo con el Creador vendedor. La Plataforma facilita el pago, el acceso digital y el reparto económico descrito en estos Términos.",
          "Los Productos digitales, salvo error técnico imputable al Operador o disposición legal imperativa, pueden no ser reembolsables una vez entregado el acceso. Las solicitudes de devolución se gestionarán conforme a la normativa de consumo aplicable y a la política del Creador, sin perjuicio de los derechos legales irrenunciables del comprador.",
          "Los contracargos, devoluciones o impagos pueden generar ajustes negativos en el Monedero del Creador o del Operador, incluida la recuperación de importes ya acreditados.",
        ],
      },
    ],
  },
  {
    id: "compensacion",
    title: "Modelo de compensación (93 / 7 o plan mensual)",
    blocks: [
      {
        paragraphs: [
          "Este apartado describe con precisión cómo se reparte cada venta. Léelo con atención: no garantiza ingresos, beneficios ni resultados concretos.",
          "Por cada Compra completada con éxito, el importe neto de la venta se distribuye así:",
        ],
        list: [
          "Plan «pago cuando vendo»: 93% para el Creador y 7% de tarifa de plataforma (Qlykadmin).",
          "Plan mensual ($25 USD / 30 días): 100% para el Creador mientras el periodo esté activo (0% de tarifa de plataforma).",
          "El Creador puede cambiar de modalidad en cualquier momento desde su dashboard. Cada venta usa el plan efectivo en el momento del pago.",
        ],
      },
      {
        paragraphs: [
          "No existe sistema de referidos ni comisión por invitación. No hay compensación multinivel, matching, binario ni estructuras piramidales.",
          "Los importes derivados de ventas pueden quedar en estado pendiente durante un hold de 14 días naturales antes de pasar a saldo disponible para retiro. Este plazo permite gestionar devoluciones, disputas de pago y revisiones antifraude.",
          "El Operador puede retener, anular o ajustar importes en casos de fraude, contracargo, incumplimiento grave, error manifiesto o requerimiento legal.",
          "Mostrar ejemplos, simulaciones o testimonios no constituye promesa de rentabilidad. Cada Usuario es responsable de sus obligaciones fiscales y de declarar los ingresos obtenidos conforme a la ley de su país.",
        ],
      },
    ],
  },
  {
    id: "pagos",
    title: "Pagos, monedero y retiros",
    blocks: [
      {
        paragraphs: [
          "Los pagos de los compradores se procesan mediante transferencia bancaria (SPEI u otro método indicado en checkout). El Operador no almacena números completos de tarjeta en sus servidores.",
          "El Monedero muestra saldos pendientes y disponibles con carácter informativo. Un saldo disponible no implica necesariamente que el retiro sea inmediato si faltan verificaciones de identidad (KYC), datos bancarios o revisiones de riesgo.",
          "Las solicitudes de retiro pueden estar sujetas a importes mínimos, comisiones de terceros, plazos de procesamiento y comprobaciones antilavado. Nos reservamos el derecho de rechazar retiros si existen indicios de fraude o incumplimiento.",
          "El Operador no es entidad de crédito ni custodio de depósitos bancarios regulados. Los saldos reflejan derechos económicos internos derivados de la actividad en la Plataforma, convertibles según las reglas vigentes.",
        ],
      },
    ],
  },
  {
    id: "propiedad",
    title: "Propiedad intelectual de la Plataforma",
    blocks: [
      {
        paragraphs: [
          `La marca ${legalMeta.brand}, el diseño, el software, las bases de datos y los elementos distintivos de la Plataforma son propiedad del Operador o de sus licenciantes. No se concede ningún derecho sobre ellos salvo el uso limitado necesario conforme a estos Términos.`,
          "Queda prohibido copiar, descompilar, realizar scraping masivo, eludir medidas técnicas o explotar comercialmente la Plataforma sin autorización escrita.",
        ],
      },
    ],
  },
  {
    id: "suspension",
    title: "Suspensión, cancelación y conservación",
    blocks: [
      {
        paragraphs: [
          "Puedes cerrar tu Cuenta en cualquier momento contactando con soporte, salvo obligaciones pendientes (compras, disputas, retiros en curso o investigaciones).",
          "Podemos suspender o cancelar tu Cuenta, con o sin aviso previo, si incumples estos Términos, la ley, perjudicas a terceros o comprometes la seguridad del servicio.",
          "Tras la baja, podremos conservar determinados datos durante los plazos legalmente exigidos (facturación, prevención de fraude, reclamaciones). Consulta la Política de Privacidad.",
        ],
      },
    ],
  },
  {
    id: "responsabilidad",
    title: "Exclusiones y limitación de responsabilidad",
    blocks: [
      {
        paragraphs: [
          `La Plataforma se ofrece "tal cual" y "según disponibilidad". En la máxima medida permitida por la ley, no garantizamos ausencia de interrupciones, errores o resultados comerciales concretos.`,
          "El Operador no responde por contenidos, Productos, consejos o actuaciones de Creadores o Usuarios, ni por fallos de proveedores externos (pagos, hosting, email, almacenamiento).",
          "En ningún caso la responsabilidad total acumulada del Operador frente a un Usuario por daños derivados del servicio excederá, en los doce meses anteriores al hecho causante, del importe total de tarifas de plataforma abonadas por ese Usuario o, si no hubiera pagado tarifas, de cien euros (100 €).",
          "Nada en estos Términos limita responsabilidades que no puedan excluirse por ley (p. ej. dolo, lesiones personales causadas por negligencia grave cuando la ley lo prohíba).",
        ],
      },
    ],
  },
  {
    id: "indemnizacion",
    title: "Indemnización",
    blocks: [
      {
        paragraphs: [
          "Te comprometes a mantener indemne al Operador, sus administradores y colaboradores frente a reclamaciones, sanciones, daños y costes (incluida asistencia letrada razonable) derivados de: (i) tu contenido o Productos; (ii) tu incumplimiento de estos Términos o de la ley; (iii) infracción de derechos de terceros; o (iv) uso no autorizado de tu Cuenta por negligencia tuya en la custodia de credenciales.",
        ],
      },
    ],
  },
  {
    id: "modificaciones",
    title: "Modificaciones de los Términos",
    blocks: [
      {
        paragraphs: [
          "Podemos actualizar estos Términos para reflejar cambios legales, técnicos o de negocio (incluido el modelo de compensación, con aviso previo razonable salvo cambios exigidos por ley o por seguridad urgente).",
          "Publicaremos la versión vigente en esta página con la fecha de actualización. Si los cambios son sustanciales, te lo comunicaremos por email o aviso destacado en la Plataforma. El uso continuado tras la entrada en vigor implica aceptación, salvo que la ley exija consentimiento expreso adicional.",
        ],
      },
    ],
  },
  {
    id: "ley",
    title: "Ley aplicable, reclamaciones y jurisdicción",
    blocks: [
      {
        paragraphs: [
          "Estos Términos se rigen por la legislación española, sin perjuicio de normas imperativas de protección al consumidor del país en que residas si actúas como consumidor.",
          "Para Usuarios consumidores en la Unión Europea, conservas los derechos irrenunciables reconocidos por la normativa de consumo y puedes acudir a los tribunales de tu domicilio cuando la ley lo permita.",
          "Para controversias mercantiles entre profesionales y el Operador, las partes se someten a los Juzgados y Tribunales del domicilio del Operador, salvo pacto escrito en contrario.",
          "Conforme al Reglamento (UE) 524/2013, los consumidores de la UE pueden utilizar la plataforma de resolución de litigios en línea de la Comisión Europea: https://ec.europa.eu/consumers/odr",
        ],
      },
    ],
  },
];

export const termsRelated = [
  { href: "/legal/privacy", label: "Política de Privacidad" },
  { href: "/legal/cookies", label: "Política de Cookies" },
];
