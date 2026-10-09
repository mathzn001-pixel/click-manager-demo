import { useEffect, useMemo, useState } from "react";
import ProfileEditor from "./ProfileEditor";
import { actions, art, Avatar, CATEGORIES, copyText, CURRENT_USER_ID, demoParam, imgSrc, Lightbox, PostCard, PostPanel, SI, useSocial, Verified, type Category, type Photographer } from "./social";

type Tab = "Feed" | "Portfólio";
const PREVIEW = 6;

export default function ProfileView({ profileId, onBack, onChat }: { profileId: string; onBack: () => void; onChat: (p: Photographer) => void }) {
  const s = useSocial(); const demo = demoParam();
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("Feed"); const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null); const [openPost, setOpenPost] = useState<string | null>(null);
  const [editing, setEditing] = useState(false); const [menu, setMenu] = useState(false);

  useEffect(() => { setLoad("loading"); setTab("Feed"); setExpanded(false); setOpenPost(null); const t = window.setTimeout(() => setLoad(demo === "erro-perfil" ? "error" : "ready"), 800); return () => window.clearTimeout(t); }, [profileId, demo]);
  useEffect(() => { if (!menu) return; const c = () => setMenu(false); document.addEventListener("click", c); return () => document.removeEventListener("click", c); }, [menu]);

  const p = s.photographers[profileId];
  const posts = useMemo(() => s.posts.filter((x) => x.authorId === profileId).sort((a, b) => b.at - a.at), [s.posts, profileId]);
  const items = useMemo(() => s.portfolio.filter((i) => i.ownerId === profileId).sort((a, b) => Number(b.featured) - Number(a.featured) || b.addedAt - a.addedAt), [s.portfolio, profileId]);
  const byCat = useMemo(() => CATEGORIES.map((c) => ({ c, list: items.filter((i) => i.category === c) })).filter((x) => x.list.length), [items]);
  const shown = useMemo(() => byCat.flatMap((x) => (expanded ? x.list : x.list.slice(0, PREVIEW))), [byCat, expanded]);
  const hasMore = byCat.some((x) => x.list.length > PREVIEW);

  const Back = <button className="sx-back" onClick={onBack}><SI name="back" size={15} /> Voltar ao feed</button>;

  if (load === "loading") return (
    <div className="social-view" aria-busy="true">{Back}
      <div className="sx-card sx-prof-skel"><i className="sx-skel banner" /><div><i className="sx-skel circle" /><span><i className="sx-skel w50" /><i className="sx-skel w80" /></span></div></div>
    </div>
  );
  if (load === "error") return (
    <div className="social-view">{Back}
      <div className="sx-card sx-empty" role="alert"><span className="danger"><SI name="alert" size={24} /></span><h3>Não foi possível carregar o perfil</h3><p>Verifique sua conexão e tente novamente.</p><button className="sx-btn primary" onClick={() => { setLoad("loading"); window.setTimeout(() => setLoad("ready"), 600); }}><SI name="refresh" size={15} /> Tentar novamente</button></div>
    </div>
  );
  if (!p) return (
    <div className="social-view">{Back}
      <div className="sx-card sx-empty"><span><SI name="user" size={24} /></span><h3>Perfil não encontrado</h3><p>Este fotógrafo não existe ou o perfil foi removido.</p><button className="sx-btn primary" onClick={onBack}>Voltar ao feed</button></div>
    </div>
  );

  const own = p.id === CURRENT_USER_ID; const following = s.following.includes(p.id);
  const likes = posts.reduce((n, x) => n + x.likes, 0);
  const lb = shown.map((i) => ({ src: imgSrc(i), title: i.title || i.name, sub: i.category }));
  const link = `https://clickmanager.app/fotografo/${p.id}`;
  const open = (id: string) => setOpenPost(id);

  const About = (
    <section className="sx-card sx-side-card">
      <h2>Sobre o fotógrafo</h2>
      {p.bio && <p className="sx-bio">{p.bio}</p>}
      <ul className="sx-about">
        <li><SI name="pin" size={15} /><span>{p.city}, {p.state}</span></li>
        <li><SI name="camera" size={15} /><span>{p.specialties.join(", ") || "Não informado"}</span></li>
        {p.email && <li><SI name="mail" size={15} /><a href={`mailto:${p.email}`}>{p.email}</a></li>}
        {p.phone && <li><SI name="phone" size={15} /><a href={`tel:${p.phone.replace(/\D/g, "")}`}>{p.phone}</a></li>}
        {p.site && <li><SI name="globe" size={15} /><a href={`https://${p.site.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer">{p.site}</a></li>}
        {p.instagram && <li><SI name="insta" size={15} /><span>{p.instagram}</span></li>}
        {p.others.map((o) => <li key={o}><SI name="link" size={15} /><span>{o}</span></li>)}
      </ul>
    </section>
  );
  const Cta = !own && (
    <section className="sx-cta"><span><SI name="camera" size={20} /></span><h3>Vamos registrar sua história?</h3><button className="sx-btn primary" onClick={() => onChat(p)}>Entrar em contato</button></section>
  );

  return (
    <div className="social-view">
      {Back}
      <section className="sx-card sx-hero">
        <div className="sx-banner-img" style={{ backgroundImage: `linear-gradient(180deg, rgba(10,6,24,.1), rgba(10,6,24,.75)), url("${art(items[0]?.seed ?? 777)}")` }} />
        <div className="sx-hero-row">
          <div className="sx-hero-avatar"><Avatar id={p.id} size={104} /></div>
          <div className="sx-hero-main">
            <h1>{p.name}{p.verified && <Verified />}</h1>
            <p className="sx-loc"><SI name="pin" size={13} /> {p.city}, {p.state}</p>
            <p className="sx-hero-bio">{p.bio}</p>
            <div className="sx-tags">{p.specialties.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
          <div className="sx-hero-side">
            <dl className="sx-stats">
              <div><dt>Publicações</dt><dd><SI name="image" size={14} /> {posts.length}</dd></div>
              <div><dt>Seguidores</dt><dd><SI name="user" size={14} /> {(p.followers + (following ? 1 : 0)).toLocaleString("pt-BR")}</dd></div>
              <div><dt>Curtidas</dt><dd><SI name="heart" size={14} /> {likes.toLocaleString("pt-BR")}</dd></div>
            </dl>
            <div className="sx-hero-actions">
              {own ? <button className="sx-btn primary" onClick={() => setEditing(true)}><SI name="edit" size={15} /> Editar perfil</button> : <>
                <button className={`sx-btn ${following ? "ghost" : "primary"}`} aria-pressed={following} onClick={() => { actions.toggleFollow(p.id); actions.notify(following ? `Você deixou de seguir ${p.name}` : `Você está seguindo ${p.name}`); }}><SI name={following ? "userCheck" : "userPlus"} size={15} /> {following ? "Seguindo" : "Seguir"}</button>
                <button className="sx-btn ghost" onClick={() => onChat(p)}><SI name="mail" size={15} /> Enviar mensagem</button></>}
              <div className="sx-pop-wrap" onClick={(e) => e.stopPropagation()}>
                <button className="sx-icon-btn lg" aria-label="Mais ações" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><SI name="more" /></button>
                {menu && <div className="sx-pop menu" role="menu"><button role="menuitem" onClick={() => { copyText(link); setMenu(false); }}><SI name="link" size={14} /> Copiar link do perfil</button></div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sx-tabs" role="tablist">{(["Feed", "Portfólio"] as Tab[]).map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>

      <div className="sx-prof-grid">
        <div className="sx-prof-main">
          {tab === "Feed" && (posts.length === 0
            ? <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Nenhuma publicação ainda</h3><p>{own ? "Publique no Feed para aparecer aqui." : `${p.name} ainda não fez publicações.`}</p></div>
            : posts.map((x) => <PostCard key={x.id} post={x} layout="stack" onOpen={open} onProfile={() => {}} />))}

          {tab === "Portfólio" && (items.length === 0
            ? <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Portfólio vazio</h3><p>{own ? "Adicione trabalhos no módulo de Portfólio." : `${p.name} ainda não adicionou trabalhos ao portfólio.`}</p></div>
            : <>
              {byCat.map(({ c, list }) => (
                <section key={c} className="sx-card sx-cat-section">
                  <header><h2>{c}</h2><small>{list.length} {list.length === 1 ? "foto" : "fotos"}</small></header>
                  <div className="sx-tiles">{(expanded ? list : list.slice(0, PREVIEW)).map((i) => {
                    const idx = shown.findIndex((x) => x.id === i.id);
                    return <button key={i.id} onClick={() => setViewer(idx)} aria-label={`Ampliar ${i.title || i.name}`}><img src={imgSrc(i)} alt={i.title || i.name} loading="lazy" />{i.featured && <span className="sx-feat"><SI name="star" size={10} fill /> Destaque</span>}</button>;
                  })}</div>
                </section>
              ))}
              {hasMore && <button className="sx-btn ghost center" onClick={() => setExpanded((v) => !v)}>{expanded ? "Mostrar menos" : "Ver portfólio completo"}</button>}
            </>)}
        </div>

        <aside className="sx-prof-side">
          {tab === "Feed" && items.length > 0 && (
            <section className="sx-card sx-side-card">
              <header className="sx-side-head"><div><h2>Portfólio</h2><small>Alguns dos melhores trabalhos</small></div><button onClick={() => setTab("Portfólio")}>Ver tudo</button></header>
              <div className="sx-cat-tiles">{byCat.slice(0, 6).map(({ c, list }) => <button key={c} onClick={() => setTab("Portfólio")}><img src={imgSrc(list[0])} alt="" loading="lazy" /><span><strong>{c}</strong><small>{list.length} {list.length === 1 ? "foto" : "fotos"}</small></span></button>)}</div>
            </section>
          )}
          {About}
          {Cta}
        </aside>
      </div>

      {viewer !== null && lb[viewer] && <Lightbox items={lb} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />}
      {openPost && <PostPanel postId={openPost} overlay onClose={() => setOpenPost(null)} onProfile={() => setOpenPost(null)} />}
      {editing && <ProfileEditor id={p.id} onClose={() => setEditing(false)} />}
    </div>
  );
}
export type { Category };
