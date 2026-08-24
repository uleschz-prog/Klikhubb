import type { FeedVideo } from "@/lib/video/types";

export type MockProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
};

export const mockVideos: FeedVideo[] = [
  {
    id: "v1",
    creatorName: "Maya Chen",
    handle: "mayaclose",
    caption: "Empaqué mi curso en 18 segundos. El botón vende. Yo cobro sin salir del feed.",
    title: "De view a cliente",
    videoUrl: "/videos/maya-cierre.mp4",
    playbackId: null,
    thumbnailUrl: null,
    product: { slug: "cierre-elite", title: "Academia Cierre Élite", price: 497, currency: "USD" },
    likes: 18240,
    comments: 612,
    gradient: "from-emerald-950 via-neutral-950 to-cyan-950",
  },
  {
    id: "v2",
    creatorName: "Leo Vargas",
    handle: "leov",
    caption: "Mi comunidad no es un chat suelto. Quien compra, se queda. Así se siente tener audiencia propia.",
    title: "Inner Circle",
    videoUrl: "/videos/leo-inner.mp4",
    playbackId: null,
    thumbnailUrl: null,
    product: { slug: "inner-circle", title: "Membresía Inner Circle", price: 49, currency: "USD" },
    likes: 9402,
    comments: 301,
    gradient: "from-cyan-950 via-neutral-950 to-neutral-900",
  },
  {
    id: "v3",
    creatorName: "Amina Rahim",
    handle: "amina",
    caption: "Dejé de pedir likes. Ahora pido un clic. El feed paga a quien crea.",
    title: "Un clic",
    videoUrl: "/videos/amina-clic.mp4",
    playbackId: null,
    thumbnailUrl: null,
    product: null,
    likes: 22119,
    comments: 880,
    gradient: "from-neutral-900 via-emerald-950 to-black",
  },
];

export const mockLeaderboard = [
  { rank: 1, name: "Maya Chen", handle: "mayaclose", points: 18420, earnings: 12840 },
  { rank: 2, name: "Leo Vargas", handle: "leov", points: 15110, earnings: 9102 },
  { rank: 3, name: "Amina Rahim", handle: "amina", points: 12990, earnings: 7740 },
  { rank: 4, name: "Rafa Díaz", handle: "rafa", points: 9800, earnings: 4300 },
  { rank: 5, name: "Sofi K.", handle: "sofik", points: 8640, earnings: 3910 },
];

export const mockCourses = [
  { slug: "cierre-elite", title: "Academia Cierre Élite", price: 497, students: 1280 },
  { slug: "inner-circle", title: "Inner Circle", price: 49, students: 4200 },
  { slug: "red-binaria", title: "De view a cliente", price: 197, students: 860 },
];

export const mockPosts = [
  { id: "c1", author: "Maya Chen", title: "¿Cómo estructuran el CTA en videos de 15s?", replies: 34 },
  { id: "c2", author: "Leo Vargas", title: "Lo que cambió cuando mi audiencia dejó de ser un número", replies: 18 },
  { id: "c3", author: "Amina Rahim", title: "Plantilla de bienvenida para quien acaba de comprar", replies: 22 },
];
