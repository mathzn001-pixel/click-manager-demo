import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/* ═════════ Tipos ═════════ */
export const CATEGORIES = ["Casamentos", "Ensaios", "Eventos", "Família", "Corporativo", "Outros"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CURRENT_USER_ID = "p1"; // usuário logado (dono do perfil editável)

export type Img = { seed?: number; src?: string };
export type Photographer = {
  id: string; name: string; fullName: string; verified: boolean; city: string; state: string; bio: string;
  specialties: string[]; email: string; phone: string; instagram: string; site: string; others: string[];
  photo?: string; followers: number;
};
export type Comment = { id: string; authorId: string; text: string; at: number };
export type Post = { id: string; authorId: string; category: Category; caption: string; images: Img[]; at: number; likes: number; liked: boolean; saved: boolean; comments: Comment[] };
export type PItem = { id: string; ownerId: string; name: string; sizeLabel: string; res: string; category: Category; seed?: number; src?: string; featured: boolean; addedAt: number; title: string; description: string };

type State = { photographers: Record<string, Photographer>; posts: Post[]; portfolio: PItem[]; following: string[]; profileId: string | null; chatWith: string | null; toast: string };

/* ═════════ Dados de exemplo ═════════ */
const H = 3600e3;
const NOW = Date.now();
const portraits = [
  "https://images.unsplash.com/photo-1708737749033-aa9b7bd00507?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1723189038268-3ef8fd518ad9?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1757348665310-0b68ed0ebc30?auto=format&fit=crop&w=160&q=80",
  "https://images.unsplash.com/photo-1760552069633-c05f246a5d8c?auto=format&fit=crop&w=160&q=80",
];
const PEOPLE: Record<string, { name: string; photo?: string }> = {
  u1: { name: "Juliana Santos" }, u2: { name: "Rafael Costa", photo: portraits[1] }, u3: { name: "Camila Ferreira", photo: portraits[2] }, u4: { name: "Bruno Alves" },
};
const ph = (id: string, name: string, fullName: string, verified: boolean, city: string, state: string, specialties: string[], followers: number, photo: string | undefined, bio: string, slugName: string): Photographer => ({
  id, name, fullName, verified, city, state, bio, specialties, photo, followers,
  email: `contato@${slugName}.com`, phone: "(11) 98765-4321", instagram: `@${slugName}.fotografia`, site: `www.${slugName}.com`, others: [],
});
const photographers: Record<string, Photographer> = Object.fromEntries([
  { ...ph("p1", "Lucas Almeida Fotografia", "Lucas Almeida da Silva", true, "São Paulo", "SP", ["Casamentos", "Ensaios", "Retratos", "Eventos", "Família"], 2400, portraits[0], "Fotógrafo especializado em casamentos, ensaios e retratos. Busco capturar momentos reais, com leveza e autenticidade.", "lucasalmeida"), others: ["behance.net/lucasalmeida"] },
  ph("p2", "Marina Costa Photography", "Marina Costa Pereira", true, "Rio de Janeiro", "RJ", ["Ensaios", "Retratos", "Casamentos"], 1800, portraits[2], "Luz natural, cenários abertos e retratos cheios de personalidade.", "marinacosta"),
  ph("p3", "Rafael Martins", "Rafael Martins Duarte", true, "Belo Horizonte", "MG", ["Eventos", "Corporativo"], 960, portraits[3], "Cobertura de eventos corporativos, shows e conferências.", "rafaelmartins"),
  ph("p4", "Ana Beatriz Fotografia", "Ana Beatriz Lemos", false, "Curitiba", "PR", ["Família", "Ensaios"], 540, portraits[1], "Fotografia de família com carinho e naturalidade.", "anabeatriz"),
  ph("p5", "Camila Torres Fotografia", "Camila Torres Nunes", false, "Salvador", "BA", ["Casamentos"], 120, undefined, "Começando a compartilhar meu trabalho por aqui.", "camilatorres"),
  ph("p6", "Diego Ramos Studio", "Diego Ramos Lima", false, "Recife", "PE", ["Corporativo", "Eventos"], 310, undefined, "Estúdio de retratos corporativos e fotos de equipe.", "diegoramos"),
].map((p) => [p.id, p]));

const cm = (id: string, authorId: string, text: string, hoursAgo: number): Comment => ({ id, authorId, text, at: NOW - hoursAgo * H });
const mkPost = (id: string, authorId: string, category: Category, caption: string, seeds: number[], hoursAgo: number, likes: number, comments: Comment[] = []): Post =>
  ({ id, authorId, category, caption, images: seeds.map((seed) => ({ seed })), at: NOW - hoursAgo * H, likes, liked: false, saved: false, comments });
const seedPosts: Post[] = [
  mkPost("f1", "p1", "Casamentos", "Um dia inesquecível, cheio de amor, sorrisos e momentos que ficarão para sempre. 💜\n\nFoi uma honra registrar cada detalhe desse casamento tão especial!", [11, 12, 13, 14, 15], 48, 342, [
    cm("c1", "u1", "Que fotos lindas! Parabéns!", 40), cm("c2", "u2", "A iluminação ficou perfeita!", 30), cm("c3", "u3", "Que casal lindo! Parabéns pelo trabalho!", 20)]),
  mkPost("f2", "p2", "Ensaios", "A beleza está nos detalhes… ✨\n\nAmei criar essas imagens ao entardecer.", [21, 22, 23], 72, 198, [cm("c4", "u4", "Luz incrível!", 60)]),
  mkPost("f3", "p3", "Eventos", "Registro de um evento corporativo que reuniu mais de 500 pessoas. Gratidão a toda a equipe!", [31, 32, 33, 34], 96, 118, []),
  mkPost("f4", "p4", "Família", "Família é a melhor parte da vida. Cada sorriso conta uma história. 🌿", [41, 42], 120, 267, [cm("c5", "u1", "Que fofura!", 100), cm("c6", "u3", "Amei as cores", 90)]),
  mkPost("f5", "p1", "Ensaios", "Ensaio ao pôr do sol: a luz de ouro faz toda a diferença.", [51, 52, 53], 168, 156, [cm("c7", "u2", "Perfeito!", 150)]),
  mkPost("f6", "p6", "Corporativo", "Retratos corporativos para uma equipe inteira em um único dia.", [61, 62], 200, 64, []),
  mkPost("f7", "p1", "Família", "Uma tarde em família no parque. Momentos simples, memórias para sempre.", [71, 72, 73, 74], 260, 210, []),
];
const portfolioCats: Category[] = ["Casamentos", "Ensaios", "Eventos", "Família", "Corporativo", "Outros"];
const pItem = (ownerId: string, i: number, category: Category, seed: number): PItem => ({
  id: `${ownerId}-i${i}`, ownerId, name: `IMG_${2400 + i}.jpg`, sizeLabel: `${(2 + ((i * 7) % 30) / 10).toFixed(1).replace(".", ",")} MB`, res: "1920×1280",
  category, seed, featured: false, addedAt: NOW - i * 6 * H, title: "", description: "",
});
const seedPortfolio: PItem[] = [
  ...Array.from({ length: 40 }, (_, i) => pItem("p1", i, portfolioCats[[0, 0, 1, 2, 3, 0, 4, 1, 5, 2][i % 10]], 100 + i)),
  ...Array.from({ length: 8 }, (_, i) => pItem("p2", i, portfolioCats[[1, 1, 0][i % 3]], 200 + i)),
  ...Array.from({ length: 6 }, (_, i) => pItem("p3", i, portfolioCats[[2, 4][i % 2]], 300 + i)),
  ...Array.from({ length: 5 }, (_, i) => pItem("p4", i, portfolioCats[[3, 1][i % 2]], 400 + i)),
  ...Array.from({ length: 4 }, (_, i) => pItem("p5", i, "Casamentos", 500 + i)),
];
seedPortfolio[0].featured = true;

/* ═════════ Store (fonte única de dados para Portfólio, Feed e Perfil) ═════════ */
let state: State = { photographers, posts: seedPosts, portfolio: seedPortfolio, following: [], profileId: null, chatWith: null, toast: "" };
const listeners = new Set<() => void>();
const set = (fn: (s: State) => State) => { state = fn(state); listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useSocial = () => useSyncExternalStore(subscribe, () => state);
const uid = () => Math.random().toString(36).slice(2, 9);
const mapPost = (id: string, fn: (p: Post) => Post) => set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? fn(p) : p)) }));
let toastTimer = 0;

export const actions = {
  notify(msg: string) { set((s) => ({ ...s, toast: msg })); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => set((s) => ({ ...s, toast: "" })), 2400); },
  openProfile(id: string | null) { set((s) => ({ ...s, profileId: id })); },
  openChat(id: string | null) { set((s) => ({ ...s, chatWith: id })); },
  toggleLike: (id: string) => mapPost(id, (p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) })),
  toggleSave: (id: string) => mapPost(id, (p) => ({ ...p, saved: !p.saved })),
  addComment: (id: string, text: string) => mapPost(id, (p) => ({ ...p, comments: [...p.comments, { id: uid(), authorId: CURRENT_USER_ID, text, at: Date.now() }] })),
  deleteComment: (id: string, cid: string) => mapPost(id, (p) => ({ ...p, comments: p.comments.filter((c) => c.id !== cid) })),
  addPost(p: Omit<Post, "id" | "at" | "likes" | "liked" | "saved" | "comments">) { set((s) => ({ ...s, posts: [{ ...p, id: uid(), at: Date.now(), likes: 0, liked: false, saved: false, comments: [] }, ...s.posts] })); },
  deletePost: (id: string) => set((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) })),
  toggleFollow(id: string) { set((s) => ({ ...s, following: s.following.includes(id) ? s.following.filter((x) => x !== id) : [...s.following, id] })); },
  updateProfile: (id: string, patch: Partial<Photographer>) => set((s) => ({ ...s, photographers: { ...s.photographers, [id]: { ...s.photographers[id], ...patch } } })),
  addPortfolio: (items: PItem[]) => set((s) => ({ ...s, portfolio: [...items, ...s.portfolio] })),
  removePortfolio: (ids: string[]) => set((s) => ({ ...s, portfolio: s.portfolio.filter((i) => !ids.includes(i.id)) })),
  updatePortfolio: (id: string, patch: Partial<PItem>) => set((s) => ({ ...s, portfolio: s.portfolio.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
  setFeatured: (id: string) => set((s) => { const owner = s.portfolio.find((i) => i.id === id)?.ownerId; return { ...s, portfolio: s.portfolio.map((i) => (i.ownerId === owner ? { ...i, featured: i.id === id } : i)) }; }),
};

/* ═════════ Utilidades ═════════ */
export const demoParam = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("estado"));
export const timeAgo = (at: number) => {
  const m = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24); return d < 30 ? `há ${d} ${d === 1 ? "dia" : "dias"}` : new Date(at).toLocaleDateString("pt-BR");
};
export const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
export const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); actions.notify("Link copiado"); } catch { actions.notify("Não foi possível copiar o link"); } };
export const isImageFile = (f: File) => /^image\/(jpe?g|png)$/i.test(f.type) || /\.(jpe?g|png)$/i.test(f.name);
export const MAX_MB = 20;

const palettes = [["#2b1b5a", "#8b5cf6", "#f5bd5d"], ["#1b2a5a", "#61bce7", "#f0a8d0"], ["#3a1a40", "#ed6a9e", "#f5bd5d"], ["#12283a", "#54d6a1", "#8dcfec"], ["#40251a", "#f5bd5d", "#ed6a9e"], ["#201a4a", "#a78bfa", "#54d6a1"]];
const artCache = new Map<number, string>();
export function art(seed: number) {
  const hit = artCache.get(seed); if (hit) return hit;
  const p = palettes[seed % palettes.length];
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="${120 + r(1) * 660}" cy="${90 + r(2) * 150}" r="${40 + r(3) * 40}" fill="${p[2]}" opacity=".85"/><path d="M0 ${380 + r(4) * 60} Q ${200 + r(5) * 200} ${280 + r(6) * 80} 480 ${400 + r(7) * 40} T 900 ${360 + r(8) * 60} V600 H0Z" fill="#0b0716" opacity=".45"/><path d="M0 ${470 + r(9) * 40} Q 300 ${400 + r(10) * 60} 600 ${480 + r(11) * 30} T 900 ${450 + r(12) * 40} V600 H0Z" fill="#0b0716" opacity=".7"/></svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`; artCache.set(seed, uri); return uri;
}
export const imgSrc = (i: { seed?: number; src?: string }) => i.src ?? art(i.seed ?? 0);

/* ═════════ Ícones e peças visuais ═════════ */
export function SI({ name, size = 16, fill = false }: { name: string; size?: number; fill?: boolean }) {
  const p: Record<string, ReactNode> = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
    comment: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    more: <><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>,
    check: <path d="m5 12 4 4L19 6" />, x: <path d="m6 6 12 12M18 6 6 18" />, plus: <path d="M12 5v14M5 12h14" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
    star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
    trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />, edit: <path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    chev: <path d="m9 18 6-6-6-6" />, chevL: <path d="m15 18-6-6 6-6" />, back: <path d="M19 12H5M11 6l-6 6 6 6" />,
    send: <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />, link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>, userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M16 11h6" /></>,
    userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="4" /></>,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>, refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
    insta: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

export const Verified = () => <span className="sx-verified" title="Perfil verificado" aria-label="Perfil verificado"><SI name="check" size={10} /></span>;

export function AvatarView({ name, photo, size = 40 }: { name: string; photo?: string; size?: number }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [photo]);
  return photo && !bad
    ? <img className="sx-avatar" style={{ width: size, height: size }} src={photo} alt="" onError={() => setBad(true)} />
    : <span className="sx-avatar sx-av-fb" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials(name)}</span>;
}
export function Avatar({ id, size = 40 }: { id: string; size?: number }) {
  const s = useSocial(); const p = s.photographers[id] ?? PEOPLE[id] ?? { name: "?" };
  return <AvatarView name={p.name} photo={p.photo} size={size} />;
}
export const personName = (s: State, id: string) => (s.photographers[id] ?? PEOPLE[id])?.name ?? "Usuário";

export function SocialToast() { const s = useSocial(); return s.toast ? <div className="sx-toast" role="status"><SI name="check" size={16} />{s.toast}</div> : null; }

export function Chips<T extends string>({ items, value, onChange, label }: { items: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return <div className="sx-chips" role="tablist" aria-label={label}>{items.map((c) => <button key={c} role="tab" aria-selected={value === c} className={value === c ? "active" : ""} onClick={() => onChange(c)}>{c}</button>)}</div>;
}

export function Pager({ page, pages, from, to, total, noun, onPage }: { page: number; pages: number; from: number; to: number; total: number; noun: string; onPage: (n: number) => void }) {
  return (
    <footer className="sx-pager">
      <span>Mostrando {from}–{to} de {total} {noun}</span>
      {pages > 1 && <nav aria-label="Paginação">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Página anterior"><SI name="chevL" size={14} /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} className={n === page ? "active" : ""} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>{n}</button>)}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Próxima página"><SI name="chev" size={14} /></button>
      </nav>}
    </footer>
  );
}

export function Lightbox({ items, index, onIndex, onClose }: { items: { src: string; title: string; sub?: string }[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const n = items.length; const it = items[index];
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onIndex((index + 1) % n); if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n); };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [index, n, onIndex, onClose]);
  if (!it) return null;
  return (
    <div className="sx-layer viewer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sx-viewer" role="dialog" aria-modal="true" aria-label={it.title}>
        <button className="sx-icon-btn close" onClick={onClose} aria-label="Fechar"><SI name="x" size={18} /></button>
        {n > 1 && <button className="sx-nav prev" onClick={() => onIndex((index - 1 + n) % n)} aria-label="Anterior"><SI name="chevL" size={22} /></button>}
        <img src={it.src} alt={it.title} />
        {n > 1 && <button className="sx-nav next" onClick={() => onIndex((index + 1) % n)} aria-label="Próxima"><SI name="chev" size={22} /></button>}
        <footer><strong>{it.title}</strong><small>{it.sub} {n > 1 && `· ${index + 1} de ${n}`}</small></footer>
      </div>
    </div>
  );
}

/* ═════════ Carrossel, card de publicação e painel de detalhes ═════════ */
export function Carousel({ images, label }: { images: Img[]; label: string }) {
  const [i, setI] = useState(0); const n = images.length; const cur = Math.min(i, n - 1);
  const go = (d: number, e: React.MouseEvent) => { e.stopPropagation(); setI((cur + d + n) % n); };
  return (
    <div className="sx-car">
      <img src={imgSrc(images[cur])} alt={`${label} — imagem ${cur + 1} de ${n}`} loading="lazy" />
      {n > 1 && <>
        <span className="sx-car-count">{cur + 1} / {n}</span>
        <button className="sx-car-nav prev" onClick={(e) => go(-1, e)} aria-label="Imagem anterior"><SI name="chevL" size={16} /></button>
        <button className="sx-car-nav next" onClick={(e) => go(1, e)} aria-label="Próxima imagem"><SI name="chev" size={16} /></button>
      </>}
    </div>
  );
}

function Actions({ post, onComments }: { post: Post; onComments: () => void }) {
  return (
    <div className="sx-actions" onClick={(e) => e.stopPropagation()}>
      <button className={post.liked ? "liked" : ""} aria-pressed={post.liked} onClick={() => actions.toggleLike(post.id)} aria-label={post.liked ? "Remover curtida" : "Curtir"}><SI name="heart" size={17} fill={post.liked} /> {post.likes}</button>
      <button onClick={onComments} aria-label="Ver comentários"><SI name="comment" size={17} /> {post.comments.length}</button>
      <button className={`save ${post.saved ? "saved" : ""}`} aria-pressed={post.saved} onClick={() => { actions.toggleSave(post.id); actions.notify(post.saved ? "Removida dos salvos" : "Publicação salva"); }} aria-label={post.saved ? "Remover dos salvos" : "Salvar publicação"}><SI name="bookmark" size={17} fill={post.saved} /></button>
    </div>
  );
}

export function PostCard({ post, layout = "row", onOpen, onProfile }: { post: Post; layout?: "row" | "stack"; onOpen: (id: string) => void; onProfile: (id: string) => void }) {
  const s = useSocial(); const a = s.photographers[post.authorId];
  const [menu, setMenu] = useState(false); const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (!menu) return; const c = () => setMenu(false); document.addEventListener("click", c); return () => document.removeEventListener("click", c); }, [menu]);
  const link = `https://clickmanager.app/feed/${post.id}`;
  return (
    <article className={`sx-post ${layout}`} onClick={() => onOpen(post.id)}>
      <div className="sx-post-body">
        <header>
          <button className="sx-author" onClick={(e) => { e.stopPropagation(); onProfile(a.id); }} aria-label={`Ver perfil de ${a.name}`}>
            <Avatar id={a.id} size={layout === "row" ? 40 : 36} />
            <span><strong>{a.name}{a.verified && <Verified />}</strong><small>{layout === "row" ? `${a.city}, ${a.state} · ${timeAgo(post.at)}` : `${timeAgo(post.at)} · ${new Date(post.at).toLocaleDateString("pt-BR")}`}</small></span>
          </button>
          <div className="sx-pop-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="sx-icon-btn" aria-label="Ações da publicação" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><SI name="more" /></button>
            {menu && <div className="sx-pop menu" role="menu">
              <button role="menuitem" onClick={() => { onOpen(post.id); setMenu(false); }}><SI name="comment" size={14} /> Abrir publicação</button>
              <button role="menuitem" onClick={() => { actions.toggleSave(post.id); setMenu(false); }}><SI name="bookmark" size={14} /> {post.saved ? "Remover dos salvos" : "Salvar publicação"}</button>
              <button role="menuitem" onClick={() => { copyText(link); setMenu(false); }}><SI name="link" size={14} /> Copiar link</button>
              <button role="menuitem" onClick={() => { onProfile(a.id); setMenu(false); }}><SI name="user" size={14} /> Ver perfil</button>
              {post.authorId === CURRENT_USER_ID && <button role="menuitem" className="danger" onClick={() => { setConfirm(true); setMenu(false); }}><SI name="trash" size={14} /> Excluir publicação</button>}
            </div>}
          </div>
        </header>
        <span className="sx-cat">{post.category}</span>
        <p className="sx-caption">{post.caption}</p>
        <Actions post={post} onComments={() => onOpen(post.id)} />
      </div>
      <div className="sx-post-media"><Carousel images={post.images} label={post.caption.slice(0, 40)} /></div>
      {confirm && (
        <div className="sx-layer center" onClick={(e) => e.stopPropagation()}>
          <div className="sx-confirm" role="alertdialog"><span><SI name="trash" size={22} /></span><h2>Excluir esta publicação?</h2><p>Ela deixará de aparecer no Feed e no seu perfil. Essa ação não pode ser desfeita.</p>
            <div><button className="sx-btn ghost" onClick={() => setConfirm(false)}>Cancelar</button><button className="sx-btn danger" onClick={() => { actions.deletePost(post.id); actions.notify("Publicação excluída"); setConfirm(false); }}>Excluir</button></div></div>
        </div>
      )}
    </article>
  );
}

export function PostPanel({ postId, overlay, onClose, onProfile }: { postId: string; overlay?: boolean; onClose: () => void; onProfile: (id: string) => void }) {
  const s = useSocial(); const post = s.posts.find((p) => p.id === postId); const [text, setText] = useState("");
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  if (!post) return null;
  const a = s.photographers[post.authorId];
  const send = () => { const t = text.trim(); if (!t) return; actions.addComment(post.id, t); setText(""); };
  return (
    <aside className={`sx-panel ${overlay ? "overlay" : ""}`} aria-label="Detalhes da publicação">
      <header className="sx-panel-head">
        <button className="sx-back" onClick={onClose}><SI name="back" size={15} /> Voltar ao feed</button>
        <button className="sx-icon-btn" onClick={onClose} aria-label="Fechar"><SI name="x" size={16} /></button>
      </header>
      <div className="sx-panel-body">
        <div className="sx-panel-author">
          <button className="sx-author" onClick={() => onProfile(a.id)}><Avatar id={a.id} size={40} /><span><strong>{a.name}{a.verified && <Verified />}</strong><small>{a.city}, {a.state} · {timeAgo(post.at)}</small></span></button>
          <span className="sx-cat">{post.category}</span>
        </div>
        <Carousel images={post.images} label={post.caption.slice(0, 40)} />
        <p className="sx-caption full">{post.caption}</p>
        <Actions post={post} onComments={() => document.getElementById("sx-comment-input")?.focus()} />
        <section className="sx-comments" aria-label="Comentários">
          <h3>Comentários ({post.comments.length})</h3>
          {post.comments.length === 0 && <p className="sx-no-comments">Ainda não há comentários. Seja o primeiro a comentar.</p>}
          <ul>{post.comments.map((c) => (
            <li key={c.id}>
              <Avatar id={c.authorId} size={32} />
              <div><strong>{personName(s, c.authorId)}</strong><p>{c.text}</p><small>{timeAgo(c.at)}</small></div>
              {c.authorId === CURRENT_USER_ID && <button className="sx-icon-btn sm" aria-label="Excluir comentário" onClick={() => { actions.deleteComment(post.id, c.id); actions.notify("Comentário excluído"); }}><SI name="trash" size={13} /></button>}
            </li>
          ))}</ul>
        </section>
      </div>
      <footer className="sx-comment-form">
        <input id="sx-comment-input" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva um comentário..." aria-label="Escreva um comentário" />
        <button className="sx-btn primary icon" onClick={send} disabled={!text.trim()} aria-label="Enviar comentário"><SI name="send" size={16} /></button>
      </footer>
    </aside>
  );
}
