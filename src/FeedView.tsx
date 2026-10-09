import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import ProfileView from "./ProfileView";
import { guard } from "./plans";
import { actions, CATEGORIES, Chips, CURRENT_USER_ID, demoParam, fmtSize, isImageFile, MAX_MB, PostCard, PostPanel, SI, SocialToast, useSocial, type Category, type Photographer } from "./social";

type Filter = "Todos" | Category;
type Draft = { id: string; url: string; name: string };
const MAX_IMAGES = 10;

/* ───────── Publicar no Feed ───────── */
function PublishModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const demo = demoParam(); const own = useSocial().posts.filter((p) => p.authorId === CURRENT_USER_ID).length;
  const [imgs, setImgs] = useState<Draft[]>([]); const [caption, setCaption] = useState(""); const [cat, setCat] = useState<Category | "">("");
  const [drag, setDrag] = useState(false); const [msg, setMsg] = useState(""); const [submitted, setSubmitted] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle"); const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  const add = (list: FileList | File[]) => {
    const ok: Draft[] = []; const bad: string[] = [];
    Array.from(list).forEach((f) => {
      if (!isImageFile(f)) return bad.push(`${f.name}: use JPG, JPEG ou PNG`);
      if (f.size > MAX_MB * 1048576) return bad.push(`${f.name}: maior que ${MAX_MB} MB (${fmtSize(f.size)})`);
      ok.push({ id: Math.random().toString(36).slice(2, 9), url: URL.createObjectURL(f), name: f.name });
    });
    const room = MAX_IMAGES - imgs.length;
    if (ok.length > room) bad.push(`Máximo de ${MAX_IMAGES} imagens por publicação`);
    setImgs((x) => [...x, ...ok.slice(0, room)]); setMsg(bad.join(" · "));
  };
  const move = (i: number, d: number) => setImgs((x) => { const n = [...x]; const j = i + d; if (j < 0 || j >= n.length) return x; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); };

  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && state !== "sending" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [state, onClose]);

  const errors = { imgs: imgs.length ? "" : "Selecione pelo menos uma imagem.", cat: cat ? "" : "Escolha uma categoria.", caption: caption.trim() ? "" : "Escreva uma legenda." };
  const publish = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    if (!guard("posts", own)) return;
    setState("sending"); setProgress(0);
    let p = 0;
    const t = window.setInterval(() => {
      p += 12 + Math.random() * 14; setProgress(Math.min(100, p));
      if (p >= 100) {
        window.clearInterval(t);
        if (demo === "erro-publicar") return setState("error");
        actions.addPost({ authorId: CURRENT_USER_ID, category: cat as Category, caption: caption.trim(), images: imgs.map((i) => ({ src: i.url })) });
        actions.notify("Publicação criada com sucesso"); onDone();
      }
    }, 220);
  };

  return (
    <div className="sx-layer center" onMouseDown={(e) => e.target === e.currentTarget && state !== "sending" && onClose()}>
      <div className="sx-modal" role="dialog" aria-modal="true" aria-labelledby="sx-pub-title">
        <header><div><h2 id="sx-pub-title">Nova publicação</h2><p>Compartilhe seu trabalho com outros fotógrafos e clientes.</p></div><button className="sx-icon-btn" onClick={onClose} disabled={state === "sending"} aria-label="Fechar"><SI name="x" size={17} /></button></header>
        <div className="sx-modal-body">
          {state === "error" && <div className="sx-banner danger" role="alert"><SI name="alert" size={15} /><div><strong>Não foi possível publicar</strong><span>Houve um problema de conexão. Suas imagens e legenda foram mantidas. Tente novamente.</span></div></div>}
          <input ref={ref} type="file" hidden multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
          <div className={`sx-drop compact ${drag ? "over" : ""} ${submitted && errors.imgs ? "err" : ""}`} role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ref.current?.click())} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop} aria-label="Selecionar imagens">
            <span><SI name="upload" size={20} /></span><strong>Arraste imagens ou clique para selecionar</strong><small>JPG, JPEG ou PNG · até {MAX_IMAGES} imagens · {MAX_MB} MB cada</small>
          </div>
          {submitted && errors.imgs && <small className="sx-err"><SI name="alert" size={12} />{errors.imgs}</small>}
          {msg && <small className="sx-err"><SI name="alert" size={12} />{msg}</small>}
          {imgs.length > 0 && (
            <ul className="sx-order" aria-label="Imagens da publicação (a primeira é a capa do carrossel)">
              {imgs.map((im, i) => (
                <li key={im.id}><img src={im.url} alt={im.name} /><span className="n">{i + 1}</span>
                  <div><button onClick={() => move(i, -1)} disabled={i === 0 || state === "sending"} aria-label={`Mover ${im.name} para antes`}><SI name="chevL" size={13} /></button><button onClick={() => move(i, 1)} disabled={i === imgs.length - 1 || state === "sending"} aria-label={`Mover ${im.name} para depois`}><SI name="chev" size={13} /></button><button className="x" onClick={() => setImgs((x) => x.filter((y) => y.id !== im.id))} disabled={state === "sending"} aria-label={`Remover ${im.name}`}><SI name="x" size={13} /></button></div></li>
              ))}
            </ul>
          )}
          <label className={`sx-field ${submitted && errors.caption ? "err" : ""}`}><span>Legenda <b>*</b></span><textarea rows={3} maxLength={500} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Conte a história por trás dessas fotos" />{submitted && errors.caption ? <small className="sx-err"><SI name="alert" size={12} />{errors.caption}</small> : <small className="sx-hint right">{caption.length}/500</small>}</label>
          <label className={`sx-field ${submitted && errors.cat ? "err" : ""}`}><span>Categoria <b>*</b></span><select value={cat} onChange={(e) => setCat(e.target.value as Category)}><option value="">Selecione uma categoria</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>{submitted && errors.cat && <small className="sx-err"><SI name="alert" size={12} />{errors.cat}</small>}</label>
          {state === "sending" && <div className="sx-bar big" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Publicando"><i style={{ width: `${progress}%` }} /></div>}
        </div>
        <footer><small>{imgs.length} {imgs.length === 1 ? "imagem" : "imagens"}</small>
          <div><button className="sx-btn ghost" onClick={onClose} disabled={state === "sending"}>Cancelar</button>
            <button className="sx-btn primary" onClick={publish} disabled={state === "sending"}>{state === "sending" ? <><span className="sx-spinner" /> Publicando…</> : state === "error" ? <><SI name="refresh" size={15} /> Tentar novamente</> : "Publicar"}</button></div></footer>
      </div>
    </div>
  );
}

/* ───────── Feed + roteamento para o perfil ───────── */
export default function FeedView({ onNavigate, chatAvailable = false }: { onNavigate?: (label: string) => void; chatAvailable?: boolean }) {
  const s = useSocial(); const demo = demoParam();
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState<Filter>("Todos"); const [openId, setOpenId] = useState<string | null>(null); const [publish, setPublish] = useState(false);

  useEffect(() => { if (load !== "loading" || demo === "carregando") return; const t = window.setTimeout(() => setLoad(demo === "erro" ? "error" : "ready"), 900); return () => window.clearTimeout(t); }, [load, demo]);
  useEffect(() => () => actions.openProfile(null), []);

  const all = demo === "vazio" ? [] : s.posts;
  const posts = useMemo(() => [...all].sort((a, b) => b.at - a.at).filter((p) => filter === "Todos" || p.category === filter), [all, filter]);
  const openPost = openId && s.posts.some((p) => p.id === openId) ? openId : null;

  const goChat = (p: Photographer) => {
    if (chatAvailable && onNavigate) { actions.openChat(p.id); onNavigate("Chat"); }
    else actions.notify(`Chat indisponível neste projeto. Conversa com ${p.name} será aberta no Chat existente.`);
  };

  if (s.profileId) return <><ProfileView profileId={s.profileId} onBack={() => actions.openProfile(null)} onChat={goChat} /><SocialToast /></>;

  return (
    <div className="social-view">
      <header className="sx-header">
        <div><h1>Feed</h1><p>Veja as publicações dos fotógrafos e fique por dentro das novidades.</p></div>
        <div className="sx-header-actions"><button className="sx-btn primary lg" onClick={() => guard("posts", s.posts.filter((p) => p.authorId === CURRENT_USER_ID).length) && setPublish(true)}><SI name="plus" size={16} /> Nova publicação</button></div>
      </header>
      <Chips items={["Todos", ...CATEGORIES] as Filter[]} value={filter} onChange={(f) => { setFilter(f); setOpenId(null); }} label="Filtrar por categoria" />

      <div className={`sx-feed-layout ${openPost ? "with-panel" : ""}`}>
        <div className="sx-feed-list" aria-busy={load === "loading"}>
          {load === "loading" && [0, 1, 2].map((i) => (
            <div key={i} className="sx-post row sx-post-skel" aria-hidden="true"><div className="sx-post-body"><i className="sx-skel circle" /><i className="sx-skel w50" /><i className="sx-skel w80" /><i className="sx-skel w70" /></div><div className="sx-post-media"><i className="sx-skel fill" /></div></div>
          ))}
          {load === "error" && (
            <div className="sx-card sx-empty" role="alert"><span className="danger"><SI name="alert" size={24} /></span><h3>Não foi possível carregar o feed</h3><p>Verifique sua conexão e tente novamente.</p><button className="sx-btn primary" onClick={() => setLoad("loading")}><SI name="refresh" size={15} /> Tentar novamente</button></div>
          )}
          {load === "ready" && all.length === 0 && (
            <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Nenhuma publicação encontrada</h3><p>Quando fotógrafos publicarem, as novidades aparecerão aqui. Que tal ser o primeiro?</p><button className="sx-btn primary" onClick={() => setPublish(true)}><SI name="plus" size={15} /> Nova publicação</button></div>
          )}
          {load === "ready" && all.length > 0 && posts.length === 0 && (
            <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Nenhuma publicação em {filter}</h3><p>Não há publicações nesta categoria por enquanto.</p><button className="sx-btn ghost" onClick={() => setFilter("Todos")}>Ver todas as categorias</button></div>
          )}
          {load === "ready" && posts.map((p) => <PostCard key={p.id} post={p} onOpen={setOpenId} onProfile={actions.openProfile} />)}
        </div>
        {openPost && <PostPanel postId={openPost} onClose={() => setOpenId(null)} onProfile={actions.openProfile} />}
      </div>

      {publish && <PublishModal onClose={() => setPublish(false)} onDone={() => { setPublish(false); setFilter("Todos"); }} />}
      <SocialToast />
    </div>
  );
}
