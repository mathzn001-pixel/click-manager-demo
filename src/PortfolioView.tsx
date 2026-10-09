import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import ProfileEditor from "./ProfileEditor";
import { actions, CATEGORIES, CURRENT_USER_ID, Chips, fmtSize, imgSrc, isImageFile, Lightbox, MAX_MB, Pager, SI, SocialToast, useSocial, type Category, type PItem } from "./social";

const PAGE_SIZE = 12;
type Filter = "Todos" | Category;
type QFile = { id: string; file: File; url: string; res: string; progress: number };

/* ───────── Modal: adicionar fotos ───────── */
function AddPhotosModal({ initialCat, onClose }: { initialCat: Category; onClose: () => void }) {
  const [files, setFiles] = useState<QFile[]>([]);
  const [cat, setCat] = useState<Category>(initialCat);
  const [phase, setPhase] = useState<"select" | "sending" | "done">("select");
  const [drag, setDrag] = useState(false); const [rejected, setRejected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | File[]) => {
    const ok: QFile[] = []; const bad: string[] = [];
    Array.from(list).forEach((f) => {
      if (!isImageFile(f)) return bad.push(`${f.name}: use JPG, JPEG ou PNG`);
      if (f.size > MAX_MB * 1048576) return bad.push(`${f.name}: maior que ${MAX_MB} MB`);
      const id = Math.random().toString(36).slice(2, 9), url = URL.createObjectURL(f);
      ok.push({ id, file: f, url, res: "—", progress: 0 });
      const img = new Image(); img.onload = () => setFiles((fs) => fs.map((x) => (x.id === id ? { ...x, res: `${img.naturalWidth}×${img.naturalHeight}` } : x))); img.src = url;
    });
    setFiles((fs) => [...fs, ...ok]); setRejected(bad);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); if (phase === "select") add(e.dataTransfer.files); };

  useEffect(() => {
    if (phase !== "sending") return;
    const t = window.setInterval(() => setFiles((fs) => fs.map((f) => (f.progress >= 100 ? f : { ...f, progress: Math.min(100, f.progress + 6 + Math.random() * 16) }))), 260);
    return () => window.clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase !== "sending" || !files.length || !files.every((f) => f.progress >= 100)) return;
    setPhase("done");
    actions.addPortfolio(files.map((f, i) => ({ id: `${f.id}`, ownerId: CURRENT_USER_ID, name: f.file.name, sizeLabel: fmtSize(f.file.size), res: f.res, category: cat, src: f.url, featured: false, addedAt: Date.now() + i, title: "", description: "" })));
    actions.notify(files.length === 1 ? "Foto adicionada ao portfólio" : `${files.length} fotos adicionadas ao portfólio`);
    const t = window.setTimeout(onClose, 600); return () => window.clearTimeout(t);
  }, [files, phase, cat, onClose]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && phase === "select" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [phase, onClose]);

  return (
    <div className="sx-layer center" onMouseDown={(e) => e.target === e.currentTarget && phase === "select" && onClose()}>
      <div className="sx-modal" role="dialog" aria-modal="true" aria-labelledby="sx-add-title">
        <header><div><h2 id="sx-add-title">Adicionar fotos ao portfólio</h2><p>Escolha as imagens e a categoria em que elas aparecerão.</p></div><button className="sx-icon-btn" onClick={onClose} disabled={phase === "sending"} aria-label="Fechar"><SI name="x" size={17} /></button></header>
        <div className="sx-modal-body">
          <input ref={inputRef} type="file" hidden multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
          {phase === "select" && (
            <div className={`sx-drop ${drag ? "over" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop} aria-label="Arraste fotos ou clique para selecionar">
              <span><SI name="upload" size={24} /></span><strong>Arraste suas fotos aqui ou clique para selecionar</strong><small>JPG, JPEG ou PNG · múltiplos arquivos · até {MAX_MB} MB por imagem</small>
            </div>
          )}
          {rejected.length > 0 && <div className="sx-banner danger" role="alert"><SI name="alert" size={15} /><div><strong>{rejected.length === 1 ? "1 arquivo não foi aceito" : `${rejected.length} arquivos não foram aceitos`}</strong>{rejected.map((r) => <span key={r}>{r}</span>)}</div></div>}
          {files.length > 0 && (
            <>
              <label className="sx-field inline"><span>Categoria das imagens <b>*</b></span><select value={cat} disabled={phase !== "select"} onChange={(e) => setCat(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <ul className="sx-thumbs">
                {files.map((f) => (
                  <li key={f.id}>
                    <img src={f.url} alt={f.file.name} />
                    {phase === "select" && <button className="sx-thumb-x" onClick={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))} aria-label={`Remover ${f.file.name}`}><SI name="x" size={12} /></button>}
                    <div><strong title={f.file.name}>{f.file.name}</strong><small>{fmtSize(f.file.size)}{phase !== "select" && ` · ${f.progress >= 100 ? "Concluído" : "Enviando"}`}</small>
                      {phase !== "select" && <div className="sx-bar" role="progressbar" aria-valuenow={Math.round(f.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso de ${f.file.name}`}><i style={{ width: `${f.progress}%` }} /></div>}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <footer>
          <small>{files.length ? `${files.length} ${files.length === 1 ? "imagem selecionada" : "imagens selecionadas"}` : "Nenhuma imagem selecionada"}</small>
          <div><button className="sx-btn ghost" onClick={onClose} disabled={phase === "sending"}>Cancelar</button>
            <button className="sx-btn primary" disabled={!files.length || phase !== "select"} onClick={() => setPhase("sending")}>{phase === "select" ? <><SI name="upload" size={15} /> Enviar {files.length || ""} {files.length === 1 ? "foto" : "fotos"}</> : <><span className="sx-spinner" /> {phase === "done" ? "Concluído" : "Enviando…"}</>}</button></div>
        </footer>
      </div>
    </div>
  );
}

/* ───────── Modal: editar informações da foto ───────── */
function InfoModal({ item, onClose }: { item: PItem; onClose: () => void }) {
  const [title, setTitle] = useState(item.title); const [description, setDescription] = useState(item.description); const [cat, setCat] = useState(item.category);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="sx-layer center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sx-modal narrow" role="dialog" aria-modal="true" aria-labelledby="sx-info-title">
        <header><div><h2 id="sx-info-title">Editar informações</h2><p>{item.name} · {item.sizeLabel} · {item.res}</p></div><button className="sx-icon-btn" onClick={onClose} aria-label="Fechar"><SI name="x" size={17} /></button></header>
        <div className="sx-modal-body">
          <img className="sx-info-img" src={imgSrc(item)} alt={item.name} />
          <label className="sx-field"><span>Título</span><input autoFocus value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cerimônia ao pôr do sol" /></label>
          <label className="sx-field"><span>Descrição</span><textarea rows={3} maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte o contexto desta foto" /></label>
          <label className="sx-field"><span>Categoria</span><select value={cat} onChange={(e) => setCat(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <footer><span /><div><button className="sx-btn ghost" onClick={onClose}>Cancelar</button><button className="sx-btn primary" onClick={() => { actions.updatePortfolio(item.id, { title: title.trim(), description: description.trim(), category: cat }); actions.notify("Informações atualizadas"); onClose(); }}>Salvar</button></div></footer>
      </div>
    </div>
  );
}

/* ───────── Página ───────── */
export default function PortfolioView() {
  const s = useSocial();
  const [filter, setFilter] = useState<Filter>("Todos"); const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set()); const [menu, setMenu] = useState<string | null>(null); const [catMenu, setCatMenu] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null); const [addOpen, setAddOpen] = useState(false); const [editProfile, setEditProfile] = useState(false);
  const [info, setInfo] = useState<PItem | null>(null); const [del, setDel] = useState<string[] | null>(null);

  const mine = useMemo(() => s.portfolio.filter((i) => i.ownerId === CURRENT_USER_ID).sort((a, b) => Number(b.featured) - Number(a.featured) || b.addedAt - a.addedAt), [s.portfolio]);
  const list = filter === "Todos" ? mine : mine.filter((i) => i.category === filter);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE)); const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const allPage = rows.length > 0 && rows.every((r) => sel.has(r.id));

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => { if (!menu) return; const c = () => { setMenu(null); setCatMenu(false); }; document.addEventListener("click", c); return () => document.removeEventListener("click", c); }, [menu]);

  const toggle = (id: string) => setSel((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const confirmDelete = () => { if (!del) return; actions.removePortfolio(del); setSel((x) => { const n = new Set(x); del.forEach((i) => n.delete(i)); return n; }); actions.notify(del.length === 1 ? "Foto excluída" : `${del.length} fotos excluídas`); setDel(null); setViewer(null); };
  const lbItems = list.map((i) => ({ src: imgSrc(i), title: i.title || i.name, sub: `${i.category} · ${i.sizeLabel} · ${i.res}` }));

  return (
    <div className="social-view">
      <header className="sx-header">
        <div><h1>Meu Portfólio</h1><p>Apresente seu trabalho profissional.</p></div>
        <div className="sx-header-actions">
          <button className="sx-btn primary lg" onClick={() => setAddOpen(true)}><SI name="plus" size={16} /> Adicionar fotos</button>
          <button className="sx-btn ghost lg" onClick={() => setEditProfile(true)}>Editar perfil profissional</button>
        </div>
      </header>

      <Chips items={["Todos", ...CATEGORIES] as Filter[]} value={filter} onChange={setFilter} label="Categorias do portfólio" />

      {sel.size > 0 && <div className="sx-bulk"><span>{sel.size} {sel.size === 1 ? "selecionada" : "selecionadas"}</span><button onClick={() => setDel([...sel])}><SI name="trash" size={14} /> Excluir</button><button onClick={() => setSel(new Set())}>Limpar seleção</button></div>}
      {rows.length > 0 && <label className="sx-check"><input type="checkbox" checked={allPage} onChange={() => setSel((x) => { const n = new Set(x); rows.forEach((r) => (allPage ? n.delete(r.id) : n.add(r.id))); return n; })} /> Selecionar fotos desta página</label>}

      {mine.length === 0 ? (
        <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Seu portfólio ainda está vazio</h3><p>Adicione suas melhores fotos para que clientes conheçam seu trabalho.</p><button className="sx-btn primary" onClick={() => setAddOpen(true)}><SI name="plus" size={15} /> Adicionar fotos</button></div>
      ) : list.length === 0 ? (
        <div className="sx-card sx-empty"><span><SI name="image" size={24} /></span><h3>Nenhuma foto em {filter}</h3><p>Adicione fotos nesta categoria ou mude a categoria de fotos existentes.</p><div className="row"><button className="sx-btn primary" onClick={() => setAddOpen(true)}><SI name="plus" size={15} /> Adicionar fotos</button><button className="sx-btn ghost" onClick={() => setFilter("Todos")}>Ver todas</button></div></div>
      ) : (
        <>
          <div className="sx-pgrid">
            {rows.map((p) => (
              <article key={p.id} className={`sx-pcard ${p.featured ? "featured" : ""} ${sel.has(p.id) ? "sel" : ""}`}>
                <div className="sx-pthumb">
                  <button className="sx-open" onClick={() => setViewer(list.findIndex((x) => x.id === p.id))} aria-label={`Visualizar ${p.name}`}><img src={imgSrc(p)} alt={p.title || p.name} loading="lazy" /></button>
                  <input type="checkbox" className="sx-pick" checked={sel.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Selecionar ${p.name}`} />
                  <button className="sx-zoom" onClick={() => setViewer(list.findIndex((x) => x.id === p.id))} aria-label={`Ampliar ${p.name}`} title="Visualizar"><SI name="expand" size={14} /></button>
                  <span className="sx-cat on-img">{p.category}</span>
                  {p.featured && <span className="sx-feat"><SI name="star" size={11} fill /> Destaque</span>}
                </div>
                <div className="sx-pcap">
                  <div><strong title={p.title || p.name}>{p.title || p.name}</strong><small>{p.sizeLabel} · {p.res}</small></div>
                  <div className="sx-pop-wrap" onClick={(e) => e.stopPropagation()}>
                    <button className="sx-icon-btn" aria-label={`Ações de ${p.name}`} aria-haspopup="menu" aria-expanded={menu === p.id} onClick={() => { setMenu(menu === p.id ? null : p.id); setCatMenu(false); }}><SI name="more" /></button>
                    {menu === p.id && (
                      <div className="sx-pop menu up" role="menu">
                        {!catMenu ? <>
                          <button role="menuitem" onClick={() => setCatMenu(true)}><SI name="image" size={14} /> Alterar categoria</button>
                          <button role="menuitem" disabled={p.featured} onClick={() => { actions.setFeatured(p.id); actions.notify("Foto definida como destaque"); setMenu(null); }}><SI name="star" size={14} /> {p.featured ? "Foto de destaque" : "Definir como destaque"}</button>
                          <button role="menuitem" onClick={() => { setInfo(p); setMenu(null); }}><SI name="edit" size={14} /> Editar informações</button>
                          <button role="menuitem" className="danger" onClick={() => { setDel([p.id]); setMenu(null); }}><SI name="trash" size={14} /> Excluir foto</button>
                        </> : <>
                          <button role="menuitem" onClick={() => setCatMenu(false)}><SI name="chevL" size={14} /> Voltar</button>
                          {CATEGORIES.map((c) => <button key={c} role="menuitemradio" aria-checked={p.category === c} className={p.category === c ? "current" : ""} onClick={() => { actions.updatePortfolio(p.id, { category: c }); actions.notify(`Movida para ${c}`); setMenu(null); setCatMenu(false); }}>{p.category === c && <SI name="check" size={13} />}{c}</button>)}
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pager page={cur} pages={pages} from={(cur - 1) * PAGE_SIZE + 1} to={Math.min(cur * PAGE_SIZE, list.length)} total={list.length} noun={list.length === 1 ? "foto" : "fotos"} onPage={setPage} />
        </>
      )}

      {viewer !== null && lbItems[viewer] && <Lightbox items={lbItems} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />}
      {addOpen && <AddPhotosModal initialCat={filter === "Todos" ? "Casamentos" : filter} onClose={() => setAddOpen(false)} />}
      {info && <InfoModal item={info} onClose={() => setInfo(null)} />}
      {editProfile && <ProfileEditor id={CURRENT_USER_ID} onClose={() => setEditProfile(false)} />}
      {del && (
        <div className="sx-layer center" onMouseDown={(e) => e.target === e.currentTarget && setDel(null)}>
          <div className="sx-confirm" role="alertdialog" aria-labelledby="sx-del"><span><SI name="trash" size={22} /></span><h2 id="sx-del">{del.length === 1 ? "Excluir esta foto?" : `Excluir ${del.length} fotos?`}</h2><p>Elas deixarão de aparecer no seu portfólio e no seu perfil. Essa ação não pode ser desfeita.</p>
            <div><button className="sx-btn ghost" onClick={() => setDel(null)}>Cancelar</button><button className="sx-btn danger" onClick={confirmDelete}>Excluir</button></div></div>
        </div>
      )}
      <SocialToast />
    </div>
  );
}
