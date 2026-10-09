import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { guard, planActions } from "./plans";

/* ───────────────────────── Tipos e dados de exemplo ───────────────────────── */

type Photo = { id: string; name: string; sizeLabel: string; res: string; addedAt: number; seed?: number; src?: string };
type Settings = { allowDownload: boolean; allowSelection: boolean; isPublic: boolean; expires: string; passwordOn: boolean; password: string };
type Gallery = { name: string; description: string; coverId: string | null; photos: Photo[]; settings: Settings };
type Upload = { id: string; sessionId: string; name: string; size: number; progress: number; status: "uploading" | "done" | "error"; error?: string };
type SortKey = "recentes" | "antigas" | "nome";
type Density = "grande" | "media" | "pequena";
type Session = { id: string; title: string; type: string; date: string };
type ClientRow = { id: string; name: string; sessions: Session[] };

const PHOTOGRAPHER = "Matheus Silva";
const TODAY = "2026-10-07";
const MAX_MB = 20;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const CLIENTS: ClientRow[] = [
  { id: "c1", name: "Ana Carolina Silva", sessions: [
    { id: "s1", title: "Casamento - Ana e Lucas", type: "Casamento", date: "2026-10-05" },
    { id: "s2", title: "Ensaio gestante", type: "Ensaio gestante", date: "2026-06-12" },
  ] },
  { id: "c2", name: "João Pedro Costa", sessions: [{ id: "s3", title: "Ensaio família", type: "Ensaio família", date: "2026-10-01" }] },
  { id: "c3", name: "Maria Clara Souza", sessions: [{ id: "s4", title: "Ensaio externo", type: "Ensaio externo", date: "2026-09-28" }] },
  { id: "c4", name: "Carlos Eduardo Lima", sessions: [{ id: "s5", title: "Casamento - Carla e Eduardo", type: "Casamento", date: "2026-09-20" }] },
  { id: "c5", name: "Juliana Martins", sessions: [{ id: "s6", title: "Ensaio de gestante", type: "Ensaio gestante", date: "2026-09-12" }] },
];
const ALL_SESSIONS = CLIENTS.flatMap((c) => c.sessions);
const PHOTO_COUNT: Record<string, number> = { s1: 36, s2: 18, s3: 24, s4: 0, s5: 30, s6: 14 };

/* Fotos de exemplo geradas localmente (sem depender de imagens externas) */
const palettes = [
  ["#2b1b5a", "#8b5cf6", "#f5bd5d"], ["#1b2a5a", "#61bce7", "#f0a8d0"], ["#3a1a40", "#ed6a9e", "#f5bd5d"],
  ["#12283a", "#54d6a1", "#8dcfec"], ["#40251a", "#f5bd5d", "#ed6a9e"], ["#201a4a", "#a78bfa", "#54d6a1"],
];
const artCache = new Map<number, string>();
function art(seed: number) {
  const hit = artCache.get(seed);
  if (hit) return hit;
  const p = palettes[seed % palettes.length];
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const sx = 120 + r(1) * 660, sy = 90 + r(2) * 150;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="${sx}" cy="${sy}" r="${40 + r(3) * 40}" fill="${p[2]}" opacity=".85"/><path d="M0 ${380 + r(4) * 60} Q ${200 + r(5) * 200} ${280 + r(6) * 80} 480 ${400 + r(7) * 40} T 900 ${360 + r(8) * 60} V600 H0Z" fill="#0b0716" opacity=".45"/><path d="M0 ${470 + r(9) * 40} Q 300 ${400 + r(10) * 60} 600 ${480 + r(11) * 30} T 900 ${450 + r(12) * 40} V600 H0Z" fill="#0b0716" opacity=".7"/></svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  artCache.set(seed, uri);
  return uri;
}
const src = (p: Photo) => p.src ?? art(p.seed ?? 0);

function makeGallery(s: Session): Gallery {
  const n = PHOTO_COUNT[s.id] ?? 0;
  const base = Number(s.id.slice(1)) * 7;
  const photos: Photo[] = Array.from({ length: n }, (_, i) => ({
    id: `${s.id}-p${i}`, name: `IMG_${2400 + i}.jpg`, sizeLabel: `${(2.1 + ((i * 7) % 28) / 10).toFixed(1).replace(".", ",")} MB`,
    res: "6000 × 4000", addedAt: 1000 - i, seed: base + i,
  }));
  return {
    name: s.title, description: n ? `Galeria de ${s.title.toLowerCase()}. Fotos do grande dia!` : "", coverId: photos[0]?.id ?? null, photos,
    settings: { allowDownload: true, allowSelection: true, isPublic: false, expires: s.id === "s1" ? "2026-12-18" : "", passwordOn: s.id === "s1", password: s.id === "s1" ? "ana2026" : "" },
  };
}

/* ───────────────────────── Utilidades ───────────────────────── */

const fmtDate = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");
const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const slug = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const pluralFotos = (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`;

function GI({ name, size = 16 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    more: <><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.7M6.3 6.3C3.7 8 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.2-1" /></>,
    trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
    star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
    chev: <path d="m9 18 6-6-6-6" />, chevL: <path d="m15 18-6-6 6-6" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    gridL: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>,
    gridM: <><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="9.5" y="3" width="5" height="5" rx="1" /><rect x="16" y="3" width="5" height="5" rx="1" /><rect x="3" y="9.5" width="5" height="5" rx="1" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><rect x="16" y="9.5" width="5" height="5" rx="1" /><rect x="3" y="16" width="5" height="5" rx="1" /><rect x="9.5" y="16" width="5" height="5" rx="1" /><rect x="16" y="16" width="5" height="5" rx="1" /></>,
    gridS: <><rect x="3" y="3" width="3.5" height="3.5" /><rect x="8" y="3" width="3.5" height="3.5" /><rect x="13" y="3" width="3.5" height="3.5" /><rect x="18" y="3" width="3.5" height="3.5" /><rect x="3" y="8" width="3.5" height="3.5" /><rect x="8" y="8" width="3.5" height="3.5" /><rect x="13" y="8" width="3.5" height="3.5" /><rect x="18" y="8" width="3.5" height="3.5" /><rect x="3" y="13" width="3.5" height="3.5" /><rect x="8" y="13" width="3.5" height="3.5" /><rect x="13" y="13" width="3.5" height="3.5" /><rect x="18" y="13" width="3.5" height="3.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

/* ───────────────────────── Painel lateral: configurações ───────────────────────── */

function SettingsDrawer({ gallery, onClose, onSave }: { gallery: Gallery; onClose: () => void; onSave: (g: Gallery) => void }) {
  const [name, setName] = useState(gallery.name);
  const [description, setDescription] = useState(gallery.description);
  const [coverId, setCoverId] = useState(gallery.coverId);
  const [s, setS] = useState<Settings>(gallery.settings);
  const [pickCover, setPickCover] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const errors = {
    name: name.trim() ? "" : "Informe o nome da galeria.",
    expires: s.expires && s.expires < TODAY ? "A data de expiração não pode estar no passado." : "",
    password: s.passwordOn && s.password.length < 6 ? "Use pelo menos 6 caracteres." : "",
  };
  const invalid = Object.values(errors).some(Boolean);
  const cover = gallery.photos.find((p) => p.id === coverId);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    onSave({ ...gallery, name: name.trim(), description, coverId, settings: s });
  };

  const Toggle = ({ k, title, hint }: { k: "allowDownload" | "allowSelection" | "isPublic"; title: string; hint: string }) => (
    <div className="gl-toggle-row">
      <div><strong>{title}</strong><small>{hint}</small></div>
      <button type="button" role="switch" aria-checked={s[k]} aria-label={title} className={`gl-switch ${s[k] ? "on" : ""}`} onClick={() => setS({ ...s, [k]: !s[k] })}><i /></button>
    </div>
  );

  return (
    <div className="gl-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="gl-drawer" role="dialog" aria-modal="true" aria-labelledby="gl-set-title">
        <header className="gl-drawer-head">
          <div><h2 id="gl-set-title">Configurações da galeria</h2><p>Personalize as opções de compartilhamento e acesso da galeria.</p></div>
          <button className="gl-icon-btn" onClick={onClose} aria-label="Fechar painel"><GI name="x" size={17} /></button>
        </header>

        <div className="gl-drawer-body">
          <section>
            <h3>Informações básicas</h3>
            <label className={`gl-field ${submitted && errors.name ? "err" : ""}`}>
              <span>Nome da galeria <b>*</b></span>
              <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Casamento - Ana e Lucas" maxLength={80} />
              {submitted && errors.name && <small className="gl-err"><GI name="alert" size={12} />{errors.name}</small>}
            </label>
            <label className="gl-field">
              <span>Descrição</span>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Escreva uma mensagem para o cliente ver ao abrir a galeria" />
              <small className="gl-hint right">{description.length}/200</small>
            </label>
            <div className="gl-field">
              <span>Foto de capa</span>
              <div className="gl-cover-row">
                <div className="gl-cover-thumb">{cover ? <img src={src(cover)} alt="Capa atual" /> : <GI name="image" size={20} />}</div>
                <button type="button" className="gl-btn ghost" onClick={() => setPickCover((v) => !v)} disabled={!gallery.photos.length}><GI name="image" size={15} /> {pickCover ? "Fechar seleção" : "Alterar capa"}</button>
              </div>
              {pickCover && (
                <div className="gl-cover-picker" role="listbox" aria-label="Escolher capa">
                  {gallery.photos.map((p) => (
                    <button type="button" role="option" aria-selected={coverId === p.id} key={p.id} className={coverId === p.id ? "sel" : ""} onClick={() => setCoverId(p.id)} title={p.name}><img src={src(p)} alt={p.name} loading="lazy" /></button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3>Permissões</h3>
            <Toggle k="allowDownload" title="Permitir download" hint="O cliente poderá baixar as fotos da galeria." />
            <Toggle k="allowSelection" title="Permitir seleção de fotos" hint="O cliente poderá selecionar fotos da galeria." />
            <Toggle k="isPublic" title="Galeria pública" hint="A galeria poderá ser acessada por qualquer pessoa com o link." />
          </section>

          <section>
            <h3>Segurança</h3>
            <label className={`gl-field ${errors.expires ? "err" : ""}`}>
              <span>Data de expiração</span>
              <input type="date" min={TODAY} value={s.expires} onChange={(e) => setS({ ...s, expires: e.target.value })} />
              {errors.expires ? <small className="gl-err"><GI name="alert" size={12} />{errors.expires}</small> : <small className="gl-hint">Depois dessa data, o link deixa de funcionar. Deixe em branco para não expirar.</small>}
            </label>
            <div className="gl-toggle-row">
              <div><strong>Ativar senha da galeria</strong><small>Peça uma senha para abrir a galeria.</small></div>
              <button type="button" role="switch" aria-checked={s.passwordOn} aria-label="Ativar senha da galeria" className={`gl-switch ${s.passwordOn ? "on" : ""}`} onClick={() => setS({ ...s, passwordOn: !s.passwordOn })}><i /></button>
            </div>
            <label className={`gl-field ${s.passwordOn && errors.password ? "err" : ""}`}>
              <span>Senha da galeria</span>
              <div className="gl-pass">
                <input type={showPass ? "text" : "password"} value={s.password} disabled={!s.passwordOn} onChange={(e) => setS({ ...s, password: e.target.value })} placeholder="Digite uma senha" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Ocultar senha" : "Mostrar senha"} disabled={!s.passwordOn}><GI name={showPass ? "eyeOff" : "eye"} size={16} /></button>
              </div>
              {s.passwordOn && errors.password ? <small className="gl-err"><GI name="alert" size={12} />{errors.password}</small> : <small className="gl-hint">O cliente precisará desta senha para acessar a galeria.</small>}
            </label>
          </section>
        </div>

        <footer className="gl-drawer-foot">
          <button className="gl-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="gl-btn primary" onClick={submit}>Salvar alterações</button>
        </footer>
      </aside>
    </div>
  );
}

/* ───────────────────────── Página ───────────────────────── */

export default function GalleryView() {
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  const [sessionId, setSessionId] = useState(CLIENTS[0].sessions[0].id);
  const [galleries, setGalleries] = useState<Record<string, Gallery>>(() => Object.fromEntries(ALL_SESSIONS.map((s) => [s.id, makeGallery(s)])));
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("recentes");
  const [density, setDensity] = useState<Density>("media");
  const [drag, setDrag] = useState(false);
  const [menu, setMenu] = useState<"actions" | "share" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<Upload[]>([]);
  const resRef = useRef<Record<string, { url: string; res: string }>>({});
  uploadsRef.current = uploads;

  const client = CLIENTS.find((c) => c.id === clientId)!;
  const session = ALL_SESSIONS.find((s) => s.id === sessionId)!;
  const gallery = galleries[sessionId];
  const link = `https://clickmanager.app/galeria/${slug(gallery.name)}-${sessionId}`;

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2400); };
  const patch = (id: string, fn: (g: Gallery) => Gallery) => setGalleries((all) => ({ ...all, [id]: fn(all[id]) }));

  useEffect(() => { setSelected(new Set()); setMenu(null); }, [sessionId]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  /* Simulação do envio (progresso) */
  const hasActive = uploads.some((u) => u.status === "uploading");
  useEffect(() => {
    if (!hasActive) return;
    const t = window.setInterval(() => {
      const finished: Upload[] = [];
      const next = uploadsRef.current.map((u) => {
        if (u.status !== "uploading") return u;
        const progress = Math.min(100, u.progress + 6 + Math.random() * 14);
        if (progress >= 100) { const d = { ...u, progress: 100, status: "done" as const }; finished.push(d); return d; }
        return { ...u, progress };
      });
      setUploads(next);
      finished.forEach((u) => {
        const meta = resRef.current[u.id];
        patch(u.sessionId, (g) => {
          const photo: Photo = { id: u.id, name: u.name, sizeLabel: fmtSize(u.size), res: meta?.res ?? "—", addedAt: Date.now(), src: meta?.url };
          return { ...g, photos: [photo, ...g.photos], coverId: g.coverId ?? photo.id };
        });
      });
      if (finished.length) notify(finished.length === 1 ? "Foto enviada com sucesso" : `${finished.length} fotos enviadas com sucesso`);
    }, 260);
    return () => window.clearInterval(t);
  }, [hasActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const populated = Object.values(galleries).filter((g) => g.photos.length > 0).length;
  useEffect(() => { planActions.reportUsage("galleries", populated); }, [populated]);

  const addFiles = (list: FileList | File[]) => {
    // Uma galeria "nasce" ao receber a primeira foto: respeita o limite de galerias do plano
    if (gallery.photos.length === 0 && !uploads.some((u) => u.sessionId === sessionId && u.status !== "error") && !guard("galleries", populated)) return;
    const items: Upload[] = [];
    Array.from(list).forEach((f, i) => {
      const id = `u${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const okType = /^image\/(jpe?g|png)$/i.test(f.type) || /\.(jpe?g|png)$/i.test(f.name);
      if (!okType) return items.push({ id, sessionId, name: f.name, size: f.size, progress: 0, status: "error", error: "Formato não aceito. Use JPG, JPEG ou PNG." });
      if (f.size > MAX_BYTES) return items.push({ id, sessionId, name: f.name, size: f.size, progress: 0, status: "error", error: `Arquivo maior que ${MAX_MB} MB.` });
      const url = URL.createObjectURL(f);
      resRef.current[id] = { url, res: "—" };
      const img = new Image();
      img.onload = () => { resRef.current[id].res = `${img.naturalWidth} × ${img.naturalHeight}`; };
      img.src = url;
      items.push({ id, sessionId, name: f.name, size: f.size, progress: 0, status: "uploading" });
    });
    if (items.length) setUploads((u) => [...items, ...u]);
    if (items.some((i) => i.status === "error")) notify("Alguns arquivos não foram aceitos");
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); };

  const photos = useMemo(() => {
    const list = [...gallery.photos];
    if (sort === "recentes") list.sort((a, b) => b.addedAt - a.addedAt);
    if (sort === "antigas") list.sort((a, b) => a.addedAt - b.addedAt);
    if (sort === "nome") list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
    return list;
  }, [gallery.photos, sort]);

  const allSelected = photos.length > 0 && selected.size === photos.length;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const cover = gallery.photos.find((p) => p.id === gallery.coverId);

  const setCover = (p: Photo) => { patch(sessionId, (g) => ({ ...g, coverId: p.id })); notify("Capa da galeria atualizada"); };
  const confirmDelete = () => {
    if (!toDelete) return;
    const ids = new Set(toDelete);
    patch(sessionId, (g) => {
      const left = g.photos.filter((p) => !ids.has(p.id));
      return { ...g, photos: left, coverId: g.coverId && ids.has(g.coverId) ? left[0]?.id ?? null : g.coverId };
    });
    setSelected((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; });
    if (viewer && ids.has(viewer)) setViewer(null);
    notify(ids.size === 1 ? "Foto excluída" : `${ids.size} fotos excluídas`);
    setToDelete(null);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); notify("Link da galeria copiado"); }
    catch { notify("Não foi possível copiar. Selecione o link e copie manualmente."); }
    setMenu(null);
  };

  const changeClient = (id: string) => { setClientId(id); setSessionId(CLIENTS.find((c) => c.id === id)!.sessions[0].id); };

  /* Visualizador */
  const viewIndex = viewer ? photos.findIndex((p) => p.id === viewer) : -1;
  const viewPhoto = viewIndex >= 0 ? photos[viewIndex] : null;
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") setViewer(photos[(viewIndex + 1) % photos.length]?.id ?? null);
      if (e.key === "ArrowLeft") setViewer(photos[(viewIndex - 1 + photos.length) % photos.length]?.id ?? null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer, viewIndex, photos]);

  const sessionUploads = uploads.filter((u) => u.sessionId === sessionId);
  const hasFinished = sessionUploads.some((u) => u.status !== "uploading");

  return (
    <div className="gallery-view">
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple hidden onChange={onPick} />

      {/* 1. Cabeçalho */}
      <header className="gl-header">
        <div><h1>Galeria</h1><p>Organize e gerencie as fotos dos seus clientes e ensaios.</p></div>
      </header>
      <div className="gl-selectors">
        <label className="gl-select"><GI name="user" size={16} /><span className="sr-only">Cliente</span>
          <select value={clientId} onChange={(e) => changeClient(e.target.value)} aria-label="Selecionar cliente">{CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label className="gl-select"><GI name="camera" size={16} /><span className="sr-only">Ensaio</span>
          <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} aria-label="Selecionar ensaio">{client.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        </label>
        <button className="gl-btn primary lg" onClick={() => fileRef.current?.click()}><GI name="plus" size={16} /> Adicionar fotos</button>
      </div>

      {/* 2. Informações da galeria */}
      <section className="gl-card gl-info">
        <div className="gl-info-cover">{cover ? <img src={src(cover)} alt={`Capa de ${gallery.name}`} /> : <span><GI name="image" size={26} /></span>}</div>
        <div className="gl-info-main">
          <h2>{gallery.name}</h2>
          <span className="gl-chip">{session.type}</span>
          {gallery.description && <p className="gl-desc">{gallery.description}</p>}
          <ul className="gl-meta">
            <li><GI name="calendar" size={14} />{fmtDate(session.date)}</li>
            <li><GI name="image" size={14} />{pluralFotos(gallery.photos.length)}</li>
            <li><GI name="camera" size={14} />{PHOTOGRAPHER}</li>
          </ul>
        </div>
        <div className="gl-info-actions" onClick={(e) => e.stopPropagation()}>
          <div className="gl-pop-wrap">
            <button className="gl-btn ghost" aria-haspopup="dialog" aria-expanded={menu === "share"} onClick={() => setMenu(menu === "share" ? null : "share")}><GI name="share" size={15} /> Compartilhar</button>
            {menu === "share" && (
              <div className="gl-pop share" role="dialog" aria-label="Compartilhar galeria">
                <strong>Compartilhar galeria</strong>
                <div className="gl-linkbox"><input readOnly value={link} aria-label="Link da galeria" onFocus={(e) => e.target.select()} /><button className="gl-btn primary" onClick={copyLink}>Copiar</button></div>
                <div className="gl-share-opts">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Suas fotos estão prontas: ${link}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  <a href={`mailto:?subject=${encodeURIComponent(gallery.name)}&body=${encodeURIComponent(`Suas fotos estão prontas: ${link}`)}`}><GI name="mail" size={14} /> E-mail</a>
                </div>
                {gallery.settings.passwordOn && <small><GI name="alert" size={12} /> A galeria tem senha. Envie a senha separadamente.</small>}
              </div>
            )}
          </div>
          <button className="gl-btn ghost" onClick={copyLink}><GI name="link" size={15} /> Copiar link</button>
          <div className="gl-pop-wrap">
            <button className="gl-icon-btn lg" aria-label="Mais ações da galeria" aria-haspopup="menu" aria-expanded={menu === "actions"} onClick={() => setMenu(menu === "actions" ? null : "actions")}><GI name="more" /></button>
            {menu === "actions" && (
              <div className="gl-pop menu" role="menu">
                <button role="menuitem" onClick={() => { setSettingsOpen(true); setMenu(null); }}><GI name="settings" size={14} /> Configurações da galeria</button>
                <button role="menuitem" onClick={() => { fileRef.current?.click(); setMenu(null); }}><GI name="upload" size={14} /> Adicionar fotos</button>
                <button role="menuitem" disabled={!photos.length} onClick={() => { setSelected(new Set(photos.map((p) => p.id))); setMenu(null); }}><GI name="check" size={14} /> Selecionar todas</button>
                <button role="menuitem" onClick={copyLink}><GI name="link" size={14} /> Copiar link</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Upload */}
      <section className={`gl-upload ${sessionUploads.length ? "with-progress" : ""}`}>
        <div
          className={`gl-drop ${drag ? "over" : ""}`} role="button" tabIndex={0} aria-label="Enviar fotos: arraste ou clique para selecionar"
          onClick={() => fileRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileRef.current?.click())}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
        >
          <span className="gl-drop-icon"><GI name="upload" size={26} /></span>
          <strong>Arraste suas fotos aqui ou clique para selecionar</strong>
          <small>Formatos aceitos: JPG, JPEG e PNG · Múltiplos arquivos · Até {MAX_MB} MB por imagem</small>
        </div>
        {sessionUploads.length > 0 && (
          <div className="gl-card gl-progress" aria-live="polite">
            <div className="gl-progress-head"><h3>{hasActive ? "Enviando fotos" : "Envios"}</h3>{hasFinished && <button onClick={() => setUploads((u) => u.filter((x) => x.sessionId !== sessionId || x.status === "uploading"))}>Limpar</button>}</div>
            <ul>
              {sessionUploads.map((u) => (
                <li key={u.id} className={u.status}>
                  <div className="gl-up-top"><strong title={u.name}>{u.name}</strong><span className="gl-up-status">{u.status === "uploading" ? "Enviando" : u.status === "done" ? "Concluído" : "Erro"}</span></div>
                  <div className="gl-up-bar"><div role="progressbar" aria-valuenow={Math.round(u.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso de ${u.name}`}><i style={{ width: `${u.status === "error" ? 100 : u.progress}%` }} /></div><b>{u.status === "error" ? "—" : `${Math.round(u.progress)}%`}</b></div>
                  <small>{fmtSize(u.size)}{u.error ? ` · ${u.error}` : ""}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 4. Fotos */}
      <section aria-label="Fotos da galeria">
        <div className="gl-toolbar">
          <label className="gl-check"><input type="checkbox" checked={allSelected} disabled={!photos.length} onChange={() => setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)))} /> Selecionar tudo</label>
          {selected.size > 0 && (
            <div className="gl-bulk"><span>{selected.size} {selected.size === 1 ? "selecionada" : "selecionadas"}</span><button onClick={() => setToDelete([...selected])}><GI name="trash" size={14} /> Excluir</button><button onClick={() => setSelected(new Set())}>Limpar seleção</button></div>
          )}
          <div className="gl-toolbar-right">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ordenar fotos"><option value="recentes">Mais recentes</option><option value="antigas">Mais antigas</option><option value="nome">Nome do arquivo</option></select>
            <div className="gl-density" role="group" aria-label="Tamanho da grade">
              {([["grande", "gridL", "Miniaturas grandes"], ["media", "gridM", "Miniaturas médias"], ["pequena", "gridS", "Miniaturas pequenas"]] as const).map(([k, ic, label]) => (
                <button key={k} className={density === k ? "active" : ""} aria-pressed={density === k} aria-label={label} title={label} onClick={() => setDensity(k)}><GI name={ic} size={16} /></button>
              ))}
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="gl-card gl-empty">
            <span><GI name="image" size={24} /></span>
            <h3>Esta galeria ainda não tem fotos</h3>
            <p>Envie as fotos de {session.title} para começar. Você poderá definir a capa e compartilhar o link depois.</p>
            <button className="gl-btn primary" onClick={() => fileRef.current?.click()}><GI name="upload" size={15} /> Adicionar fotos</button>
          </div>
        ) : (
          <div className={`gl-grid ${density}`}>
            {photos.map((p) => {
              const isCover = p.id === gallery.coverId;
              return (
                <article key={p.id} className={`gl-photo ${selected.has(p.id) ? "sel" : ""}`}>
                  <div className="gl-thumb">
                    <button className="gl-open" onClick={() => setViewer(p.id)} aria-label={`Visualizar ${p.name}`}><img src={src(p)} alt={p.name} loading="lazy" /></button>
                    <input type="checkbox" className="gl-pick" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Selecionar ${p.name}`} />
                    {isCover && <span className="gl-cover-badge"><GI name="star" size={11} /> Capa</span>}
                    <div className="gl-photo-actions">
                      <button className={isCover ? "on" : ""} onClick={() => setCover(p)} disabled={isCover} aria-label={isCover ? `${p.name} é a capa` : `Definir ${p.name} como capa`} title={isCover ? "Capa atual" : "Definir como capa"}><GI name="star" size={14} /></button>
                      <button onClick={() => setViewer(p.id)} aria-label={`Visualizar ${p.name}`} title="Visualizar"><GI name="eye" size={14} /></button>
                      <button className="danger" onClick={() => setToDelete([p.id])} aria-label={`Excluir ${p.name}`} title="Excluir"><GI name="trash" size={14} /></button>
                    </div>
                  </div>
                  <div className="gl-caption"><strong title={p.name}>{p.name}</strong><small>{p.sizeLabel} · {p.res}</small></div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Visualizador */}
      {viewPhoto && (
        <div className="gl-layer viewer" onMouseDown={(e) => e.target === e.currentTarget && setViewer(null)}>
          <div className="gl-viewer" role="dialog" aria-modal="true" aria-label={`Visualizando ${viewPhoto.name}`}>
            <button className="gl-icon-btn close" onClick={() => setViewer(null)} aria-label="Fechar visualização"><GI name="x" size={18} /></button>
            {photos.length > 1 && <button className="gl-nav prev" onClick={() => setViewer(photos[(viewIndex - 1 + photos.length) % photos.length].id)} aria-label="Foto anterior"><GI name="chevL" size={22} /></button>}
            <img src={src(viewPhoto)} alt={viewPhoto.name} />
            {photos.length > 1 && <button className="gl-nav next" onClick={() => setViewer(photos[(viewIndex + 1) % photos.length].id)} aria-label="Próxima foto"><GI name="chev" size={22} /></button>}
            <footer>
              <div><strong>{viewPhoto.name}</strong><small>{viewPhoto.sizeLabel} · {viewPhoto.res} · {viewIndex + 1} de {photos.length}</small></div>
              <div className="gl-viewer-actions">
                <button className="gl-btn ghost" disabled={viewPhoto.id === gallery.coverId} onClick={() => setCover(viewPhoto)}><GI name="star" size={14} /> {viewPhoto.id === gallery.coverId ? "É a capa" : "Definir como capa"}</button>
                <button className="gl-btn ghost danger-text" onClick={() => setToDelete([viewPhoto.id])}><GI name="trash" size={14} /> Excluir</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {toDelete && (
        <div className="gl-layer center" onMouseDown={(e) => e.target === e.currentTarget && setToDelete(null)}>
          <div className="gl-confirm" role="alertdialog" aria-labelledby="gl-del">
            <span><GI name="trash" size={22} /></span>
            <h2 id="gl-del">{toDelete.length === 1 ? "Excluir esta foto?" : `Excluir ${toDelete.length} fotos?`}</h2>
            <p>{toDelete.length === 1 ? "A foto será removida da galeria." : "As fotos selecionadas serão removidas da galeria."} Essa ação não pode ser desfeita.</p>
            <div><button className="gl-btn ghost" onClick={() => setToDelete(null)}>Cancelar</button><button className="gl-btn danger" onClick={confirmDelete}>Excluir</button></div>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsDrawer gallery={gallery} onClose={() => setSettingsOpen(false)} onSave={(g) => { patch(sessionId, () => g); setSettingsOpen(false); notify("Configurações salvas"); }} />}

      {toast && <div className="gl-toast" role="status"><GI name="check" size={16} />{toast}</div>}
    </div>
  );
}
