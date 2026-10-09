import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { actions, Avatar, CURRENT_USER_ID, demoParam, SI, useSocial, Verified } from "./social";

/* ═════════ Store de conversas ═════════
   LIMITAÇÃO: o projeto não possui backend de mensagens. As conversas ficam em memória
   (valem enquanto a página não for recarregada) e nenhuma mensagem é entregue a outra pessoa.
   Para ligar a um backend, troque as funções de `chat` abaixo (ensure/send/retry). */
type Msg = { id: string; from: "me" | "them"; text: string; at: number; status: "sending" | "sent" | "failed" };
type Conv = { id: string; contactId: string; messages: Msg[]; unread: number; updatedAt: number };
let cs: { convs: Conv[] } = { convs: [] };
const cl = new Set<() => void>();
const cset = (fn: (c: Conv[]) => Conv[]) => { cs = { convs: fn(cs.convs) }; cl.forEach((l) => l()); };
const useConvs = () => useSyncExternalStore((l) => { cl.add(l); return () => { cl.delete(l); }; }, () => cs).convs;
const uid = () => Math.random().toString(36).slice(2, 9);
const patchMsg = (cid: string, mid: string, p: Partial<Msg>) => cset((cs2) => cs2.map((c) => (c.id === cid ? { ...c, messages: c.messages.map((m) => (m.id === mid ? { ...m, ...p } : m)) } : c)));

const chat = {
  /** Retorna a conversa existente com o contato ou cria uma única (sem duplicar). */
  ensure(contactId: string): string {
    const found = cs.convs.find((c) => c.contactId === contactId); if (found) return found.id;
    const id = `conv-${contactId}`; cset((l) => [...l, { id, contactId, messages: [], unread: 0, updatedAt: Date.now() }]); return id;
  },
  deliver(cid: string, mid: string) {
    patchMsg(cid, mid, { status: "sending" });
    window.setTimeout(() => patchMsg(cid, mid, { status: demoParam() === "erro-envio" ? "failed" : "sent" }), 400);
  },
  send(cid: string, text: string) {
    const m: Msg = { id: uid(), from: "me", text, at: Date.now(), status: "sending" };
    cset((l) => l.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, m], updatedAt: m.at } : c))); chat.deliver(cid, m.id);
  },
  markRead: (cid: string) => cset((l) => l.map((c) => (c.id === cid && c.unread ? { ...c, unread: 0 } : c))),
};

/* ═════════ Utilidades ═════════ */
function CHI({ name, size = 16 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
const hhmm = (t: number) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const listTime = (t: number) => (sameDay(t, Date.now()) ? hhmm(t) : new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
const dayLabel = (t: number) => {
  if (sameDay(t, Date.now())) return "Hoje"; if (sameDay(t, Date.now() - 864e5)) return "Ontem";
  return new Date(t).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
};

/* ═════════ Página ═════════ */
export default function ChatView({ onNavigate }: { onNavigate?: (label: string) => void }) {
  const s = useSocial(); const convs = useConvs(); const demo = demoParam();
  const [selId, setSelId] = useState<string | null>(null);
  const [q, setQ] = useState(""); const [newOpen, setNewOpen] = useState(false); const [newQ, setNewQ] = useState("");
  const [load, setLoad] = useState<"ready" | "loading" | "error">("ready");
  const [info, setInfo] = useState(true); const [mobile, setMobile] = useState<"list" | "chat" | "info">("list");
  const [menu, setMenu] = useState(false); const [msgQ, setMsgQ] = useState<string | null>(null);
  const [text, setText] = useState(""); const [notice, setNotice] = useState(true);
  const endRef = useRef<HTMLDivElement>(null); const taRef = useRef<HTMLTextAreaElement>(null);

  const open = (cid: string) => {
    setSelId(cid); setMobile("chat"); setMsgQ(null); setText(""); setLoad("loading"); chat.markRead(cid);
    window.setTimeout(() => setLoad(demo === "erro-chat" ? "error" : "ready"), 350);
  };
  /* Entrada vinda do perfil do fotógrafo: abre (ou cria uma única vez) a conversa do contato escolhido */
  useEffect(() => { if (s.chatWith) { const id = chat.ensure(s.chatWith); actions.openChat(null); open(id); } }, [s.chatWith]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!menu) return; const c = () => setMenu(false); document.addEventListener("click", c); return () => document.removeEventListener("click", c); }, [menu]);

  const conv = convs.find((c) => c.id === selId) ?? null;
  const contact = conv ? s.photographers[conv.contactId] : null;
  const list = useMemo(() => convs.filter((c) => (s.photographers[c.contactId]?.name ?? "").toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt), [convs, q, s.photographers]);
  const contacts = Object.values(s.photographers).filter((p) => p.id !== CURRENT_USER_ID && p.name.toLowerCase().includes(newQ.trim().toLowerCase()));
  const shown = useMemo(() => (conv ? conv.messages.filter((m) => msgQ === null || !msgQ.trim() || m.text.toLowerCase().includes(msgQ.trim().toLowerCase())) : []), [conv, msgQ]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [conv?.messages.length, load, selId]);

  const send = () => { const t = text.trim(); if (!t || !conv) return; chat.send(conv.id, t); setText(""); taRef.current?.focus(); };
  const goProfile = (id: string) => { actions.openProfile(id); onNavigate?.("Feed"); };
  const posts = contact ? s.posts.filter((p) => p.authorId === contact.id) : [];
  const likes = posts.reduce((n, p) => n + p.likes, 0);

  return (
    <div className="chat-view">
      {/* A. Conversas */}
      <aside className={`ch-list ${mobile === "list" ? "show" : ""}`} aria-label="Conversas">
        <header><h1>Conversas</h1><button className="ch-icon-btn" onClick={() => { setNewOpen(true); setNewQ(""); }} aria-label="Nova conversa" title="Nova conversa"><SI name="plus" size={16} /></button></header>
        <label className="ch-search"><CHI name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversas..." aria-label="Buscar conversas por nome" />{q && <button onClick={() => setQ("")} aria-label="Limpar busca"><SI name="x" size={13} /></button>}</label>
        <ul>
          {list.map((c) => {
            const p = s.photographers[c.contactId]; const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id}>
                <button className={`ch-row ${c.id === selId ? "active" : ""}`} onClick={() => open(c.id)} aria-current={c.id === selId}>
                  <Avatar id={c.contactId} size={42} />
                  <span className="ch-row-main"><strong>{p.name}{p.verified && <Verified />}</strong><small>{last ? `${last.from === "me" ? "Você: " : ""}${last.text}` : "Nenhuma mensagem ainda"}</small></span>
                  <span className="ch-row-meta">{last && <time>{listTime(last.at)}</time>}{c.unread > 0 && <b aria-label={`${c.unread} não lidas`}>{c.unread}</b>}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {convs.length === 0 && <div className="ch-empty sm"><span><SI name="comment" size={22} /></span><h3>Nenhuma conversa ainda</h3><p>Inicie uma conversa com um fotógrafo ou abra o perfil dele e clique em “Enviar mensagem”.</p><button className="ch-btn primary" onClick={() => setNewOpen(true)}><SI name="plus" size={14} /> Nova conversa</button></div>}
        {convs.length > 0 && list.length === 0 && <div className="ch-empty sm"><span><CHI name="search" size={22} /></span><h3>Nenhuma conversa encontrada</h3><p>Não há conversas com “{q}”.</p><button className="ch-btn ghost" onClick={() => setQ("")}>Limpar busca</button></div>}
      </aside>

      {/* B. Conversa aberta */}
      <section className={`ch-main ${mobile === "chat" ? "show" : ""}`} aria-label="Conversa">
        {!conv || !contact ? (
          <div className="ch-empty"><span><SI name="comment" size={26} /></span><h3>Selecione uma conversa para começar</h3><p>Escolha uma conversa na lista ou inicie uma nova com um fotógrafo.</p><button className="ch-btn primary" onClick={() => setNewOpen(true)}><SI name="plus" size={14} /> Nova conversa</button></div>
        ) : (
          <>
            <header className="ch-head">
              <button className="ch-icon-btn back" onClick={() => setMobile("list")} aria-label="Voltar para a lista de conversas"><SI name="back" size={16} /></button>
              <button className="ch-who" onClick={() => { setInfo(true); setMobile("info"); }} aria-label={`Informações de ${contact.name}`}>
                <Avatar id={contact.id} size={42} />
                <span><strong>{contact.name}{contact.verified && <Verified />}</strong><small><SI name="pin" size={11} /> {contact.city}, {contact.state}</small></span>
              </button>
              <div className="ch-head-actions">
                <button className="ch-icon-btn" onClick={() => goProfile(contact.id)} aria-label="Ver perfil" title="Ver perfil"><SI name="user" size={16} /></button>
                <button className={`ch-icon-btn desk ${info ? "on" : ""}`} onClick={() => setInfo((v) => !v)} aria-pressed={info} aria-label={info ? "Ocultar informações" : "Mostrar informações"} title="Informações da conversa"><CHI name="panel" size={16} /></button>
                <button className="ch-icon-btn mob" onClick={() => setMobile("info")} aria-label="Informações do contato"><CHI name="info" size={16} /></button>
                <div className="ch-pop-wrap" onClick={(e) => e.stopPropagation()}>
                  <button className="ch-icon-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)} aria-label="Opções da conversa"><SI name="more" size={16} /></button>
                  {menu && <div className="ch-pop" role="menu">
                    <button role="menuitem" onClick={() => { goProfile(contact.id); setMenu(false); }}><SI name="user" size={14} /> Ver perfil</button>
                    <button role="menuitem" onClick={() => { setMsgQ(msgQ === null ? "" : null); setMenu(false); }}><CHI name="search" size={14} /> {msgQ === null ? "Buscar mensagens" : "Fechar busca"}</button>
                    <button role="menuitem" className="mob" onClick={() => { setMobile("list"); setMenu(false); }}><SI name="back" size={14} /> Voltar à lista</button>
                  </div>}
                </div>
              </div>
            </header>
            {msgQ !== null && <div className="ch-msgsearch"><CHI name="search" size={14} /><input autoFocus value={msgQ} onChange={(e) => setMsgQ(e.target.value)} placeholder="Buscar nesta conversa" aria-label="Buscar mensagens na conversa" /><small>{msgQ.trim() ? `${shown.length} ${shown.length === 1 ? "resultado" : "resultados"}` : ""}</small><button onClick={() => setMsgQ(null)} aria-label="Fechar busca"><SI name="x" size={13} /></button></div>}
            {notice && <div className="ch-notice" role="note"><CHI name="info" size={14} /><span>O envio ao servidor ainda não está implementado: as mensagens ficam apenas nesta sessão e não chegam ao contato.</span><button onClick={() => setNotice(false)} aria-label="Dispensar aviso"><SI name="x" size={13} /></button></div>}

            <div className="ch-msgs" aria-live="polite" aria-busy={load === "loading"}>
              {load === "loading" && <div className="ch-skels" aria-label="Carregando mensagens">{[60, 40, 55].map((w, i) => <i key={i} className={`ch-skel ${i % 2 ? "me" : ""}`} style={{ width: `${w}%` }} />)}</div>}
              {load === "error" && <div className="ch-empty sm" role="alert"><span className="danger"><SI name="alert" size={22} /></span><h3>Não foi possível carregar as mensagens</h3><p>Verifique sua conexão e tente novamente.</p><button className="ch-btn primary" onClick={() => open(conv.id)}><SI name="refresh" size={14} /> Tentar novamente</button></div>}
              {load === "ready" && conv.messages.length === 0 && <div className="ch-empty sm"><span><SI name="comment" size={22} /></span><h3>Nenhuma mensagem ainda</h3><p>Envie a primeira mensagem para {contact.name}.</p></div>}
              {load === "ready" && conv.messages.length > 0 && shown.length === 0 && <div className="ch-empty sm"><h3>Nenhuma mensagem encontrada</h3></div>}
              {load === "ready" && shown.map((m, i) => (
                <div key={m.id}>
                  {(i === 0 || !sameDay(shown[i - 1].at, m.at)) && <div className="ch-day"><span>{dayLabel(m.at)}</span></div>}
                  <div className={`ch-msg ${m.from}`}>
                    {m.from === "them" && <Avatar id={contact.id} size={30} />}
                    <div className="ch-bubble"><p>{m.text}</p>
                      <footer><time>{hhmm(m.at)}</time>{m.from === "me" && (m.status === "sending" ? <em>Enviando…</em> : m.status === "sent" ? <em title="Enviada">✓ Enviada</em> : <em className="fail">Falha ao enviar <button onClick={() => chat.deliver(conv.id, m.id)}>Tentar novamente</button></em>)}</footer></div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form className="ch-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <textarea ref={taRef} rows={1} value={text} maxLength={2000} placeholder="Digite sua mensagem..." aria-label="Mensagem" disabled={load !== "ready"}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <button type="submit" className="ch-send" disabled={!text.trim() || load !== "ready"} aria-label="Enviar mensagem"><SI name="send" size={17} /></button>
            </form>
          </>
        )}
      </section>

      {/* C. Informações */}
      {conv && contact && (
        <aside className={`ch-info ${info ? "open" : ""} ${mobile === "info" ? "show" : ""}`} aria-label="Informações da conversa">
          <header><strong>Informações</strong><button className="ch-icon-btn" onClick={() => { setInfo(false); setMobile("chat"); }} aria-label="Fechar informações"><SI name="x" size={15} /></button></header>
          <div className="ch-info-body">
            <Avatar id={contact.id} size={84} />
            <h2>{contact.name}{contact.verified && <Verified />}</h2>
            <p className="loc"><SI name="pin" size={13} /> {contact.city}, {contact.state}</p>
            <div className="ch-stats"><div><strong>{posts.length}</strong><small>Publicações</small></div><div><strong>{contact.followers.toLocaleString("pt-BR")}</strong><small>Seguidores</small></div><div><strong>{likes.toLocaleString("pt-BR")}</strong><small>Curtidas</small></div></div>
            {contact.specialties.length > 0 && <><h3>Especialidades</h3><div className="ch-tags">{contact.specialties.map((t) => <span key={t}>{t}</span>)}</div></>}
            {contact.bio && <><h3>Sobre</h3><p className="bio">{contact.bio}</p></>}
            <button className="ch-btn primary full" onClick={() => goProfile(contact.id)}>Ver perfil completo</button>
          </div>
        </aside>
      )}

      {newOpen && (
        <div className="ch-layer" onMouseDown={(e) => e.target === e.currentTarget && setNewOpen(false)}>
          <div className="ch-modal" role="dialog" aria-modal="true" aria-labelledby="ch-new-title">
            <header><h2 id="ch-new-title">Nova conversa</h2><button className="ch-icon-btn" onClick={() => setNewOpen(false)} aria-label="Fechar"><SI name="x" size={15} /></button></header>
            <label className="ch-search"><CHI name="search" size={15} /><input autoFocus value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Buscar fotógrafo" aria-label="Buscar fotógrafo" /></label>
            <ul>
              {contacts.map((p) => { const exists = convs.some((c) => c.contactId === p.id); return (
                <li key={p.id}><button className="ch-row" onClick={() => { const id = chat.ensure(p.id); setNewOpen(false); open(id); }}>
                  <Avatar id={p.id} size={38} /><span className="ch-row-main"><strong>{p.name}{p.verified && <Verified />}</strong><small>{p.city}, {p.state}</small></span>{exists && <span className="ch-row-meta"><time>Conversa existente</time></span>}
                </button></li>
              ); })}
              {contacts.length === 0 && <li className="ch-none">Nenhum fotógrafo encontrado.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
