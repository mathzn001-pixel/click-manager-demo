import { useEffect, useRef, useState, type ReactNode } from "react";
import { fmtLimit, fmtPrice, fmtStorage, IS_DEV, PLAN_ORDER, PLANS, planActions, usePlan, usePlanState, usageStatus, type Plan, type PlanId, type UsageStatus } from "./plans";
import { actions, AvatarView, CURRENT_USER_ID, SI, useSocial } from "./social";

type Tab = "Conta e perfil" | "Preferências" | "Privacidade e segurança" | "Assinatura e plano" | "Planos";
const TABS: { id: Tab; icon: string }[] = [
  { id: "Conta e perfil", icon: "user" }, { id: "Preferências", icon: "bell" }, { id: "Privacidade e segurança", icon: "shield" }, { id: "Assinatura e plano", icon: "card" }, { id: "Planos", icon: "crown" },
];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function CFI({ name, size = 16 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
    crown: <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z" />,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />, minus: <path d="M6 12h12" />, alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>,
    wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="4" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />, edit: <path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4" />, mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

const STATUS_TEXT: Record<UsageStatus, string> = { ok: "Disponível", near: "Próximo do limite", reached: "Limite atingido", unlimited: "Ilimitado", unknown: "Não medido" };
const Switch = ({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} className={`cfg-switch ${on ? "on" : ""}`} onClick={() => onChange(!on)}><i /></button>
);
const Row = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div className="cfg-row"><div><strong>{title}</strong>{hint && <small>{hint}</small>}</div>{children}</div>
);

/* ───────── Aba: Conta e perfil ───────── */
function AccountTab({ notify }: { notify: (m: string) => void }) {
  const s = useSocial(); const p = s.photographers[CURRENT_USER_ID];
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ fullName: p.fullName, name: p.name, email: p.email, phone: p.phone, city: p.city, state: p.state, bio: p.bio, photo: p.photo });
  const [sent, setSent] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  const reset = () => { setD({ fullName: p.fullName, name: p.name, email: p.email, phone: p.phone, city: p.city, state: p.state, bio: p.bio, photo: p.photo }); setSent(false); };
  useEffect(() => { if (!editing) reset(); }, [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const err = { fullName: d.fullName.trim() ? "" : "Informe o nome completo.", email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) ? "" : "Digite um e-mail válido.", name: d.name.trim() ? "" : "Informe o nome profissional.", city: d.city.trim() ? "" : "Informe a cidade.", state: d.state ? "" : "Selecione o estado." };
  const save = () => { setSent(true); if (Object.values(err).some(Boolean)) return; actions.updateProfile(CURRENT_USER_ID, d); setEditing(false); setSent(false); notify("Informações salvas. O perfil profissional foi atualizado."); };
  const up = (k: keyof typeof d, v: string) => setD((x) => ({ ...x, [k]: v }));
  const field = (k: "fullName" | "name" | "email" | "phone" | "city", label: string, ph: string, type = "text") => (
    <label className={`cfg-field ${sent && (err as Record<string, string>)[k] ? "err" : ""}`}><span>{label}</span>
      <input type={type} value={d[k]} disabled={!editing} placeholder={ph} onChange={(e) => up(k, e.target.value)} />
      {sent && (err as Record<string, string>)[k] && <small className="cfg-err"><CFI name="alert" size={12} />{(err as Record<string, string>)[k]}</small>}</label>
  );
  return (
    <section className="cfg-card">
      <header className="cfg-card-head"><div><h2>Conta e perfil</h2><p>Estes dados são os mesmos do seu perfil profissional.</p></div>{!editing && <button className="cfg-btn ghost" onClick={() => setEditing(true)}><CFI name="edit" size={14} /> Editar informações</button>}</header>
      <div className="cfg-photo"><AvatarView name={d.name} photo={d.photo} size={72} />
        <div><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) up("photo", URL.createObjectURL(f)); e.target.value = ""; }} />
          <button className="cfg-btn ghost" disabled={!editing} onClick={() => fileRef.current?.click()}><CFI name="camera" size={14} /> Alterar foto</button><small>A foto selecionada vale só nesta sessão (upload ainda não implementado).</small></div></div>
      <div className="cfg-grid">
        {field("fullName", "Nome completo", "Seu nome completo")}{field("name", "Nome profissional", "Ex.: Lucas Almeida Fotografia")}
        {field("email", "E-mail", "voce@email.com", "email")}{field("phone", "Telefone", "(00) 00000-0000")}
        {field("city", "Cidade", "Sua cidade")}
        <label className={`cfg-field ${sent && err.state ? "err" : ""}`}><span>Estado</span><select value={d.state} disabled={!editing} onChange={(e) => up("state", e.target.value)}><option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>{sent && err.state && <small className="cfg-err"><CFI name="alert" size={12} />{err.state}</small>}</label>
        <label className="cfg-field span2"><span>Biografia profissional</span><textarea rows={3} maxLength={300} value={d.bio} disabled={!editing} onChange={(e) => up("bio", e.target.value)} /></label>
      </div>
      {editing && <footer className="cfg-actions"><button className="cfg-btn ghost" onClick={() => { reset(); setEditing(false); }}>Cancelar</button><button className="cfg-btn primary" onClick={save}>Salvar alterações</button></footer>}
      <p className="cfg-note">Persistência: as alterações atualizam o perfil em toda a interface, mas ficam em memória até existir backend.</p>
    </section>
  );
}

/* ───────── Aba: Preferências ───────── */
const PREF_KEY = "clickmanager.prefs";
function PrefsTab({ lightMode, onToggleTheme, notify }: { lightMode: boolean; onToggleTheme: () => void; notify: (m: string) => void }) {
  const [prefs, setPrefs] = useState(() => { try { return { messages: true, comments: true, account: true, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") }; } catch { return { messages: true, comments: true, account: true }; } });
  const set = (k: "messages" | "comments" | "account", v: boolean) => { const n = { ...prefs, [k]: v }; setPrefs(n); try { localStorage.setItem(PREF_KEY, JSON.stringify(n)); notify("Preferência salva neste navegador"); } catch { notify("Não foi possível salvar a preferência"); } };
  return (
    <>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Notificações</h2><p>As preferências são guardadas neste navegador. O envio de notificações ainda depende de backend.</p></div></header>
        <Row title="Mensagens" hint="Avisar sobre novas mensagens no Chat."><Switch on={prefs.messages} onChange={(v) => set("messages", v)} label="Notificações de mensagens" /></Row>
        <Row title="Comentários e interações" hint="Avisar sobre curtidas e comentários nas suas publicações."><Switch on={prefs.comments} onChange={(v) => set("comments", v)} label="Notificações de comentários e interações" /></Row>
        <Row title="Atualizações da conta" hint="Avisos sobre plano e segurança."><Switch on={prefs.account} onChange={(v) => set("account", v)} label="Notificações de atualizações da conta" /></Row>
        <Row title="Notificações por e-mail" hint="Indisponível: o envio de e-mails ainda não foi implementado."><Switch on={false} onChange={() => {}} disabled label="Notificações por e-mail (indisponível)" /></Row>
      </section>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Aparência</h2><p>Tema da interface.</p></div></header>
        <Row title="Tema" hint="Escuro é o padrão do Click Manager."><div className="cfg-seg" role="group" aria-label="Tema"><button className={!lightMode ? "active" : ""} aria-pressed={!lightMode} onClick={() => lightMode && onToggleTheme()}>Escuro</button><button className={lightMode ? "active" : ""} aria-pressed={lightMode} onClick={() => !lightMode && onToggleTheme()}>Claro</button></div></Row>
      </section>
    </>
  );
}

/* ───────── Aba: Privacidade e segurança ───────── */
function PrivacyTab({ notify }: { notify: (m: string) => void }) {
  const s = useSocial(); const p = s.photographers[CURRENT_USER_ID]; const [del, setDel] = useState(false); const [word, setWord] = useState("");
  return (
    <>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Segurança da conta</h2></div></header>
        <Row title="Informações da conta" hint={`E-mail: ${p.email} · Identificador: ${p.id}`}><span className="cfg-pill">Conta ativa</span></Row>
        <Row title="Alterar senha" hint="Indisponível: o projeto ainda não possui autenticação."><button className="cfg-btn ghost" disabled><CFI name="lock" size={14} /> Alterar senha</button></Row>
        <Row title="Sessões ativas" hint="Indisponível: depende de autenticação e backend."><button className="cfg-btn ghost" disabled>Gerenciar sessões</button></Row>
      </section>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Privacidade</h2></div></header>
        <Row title="Visibilidade do perfil" hint="Indisponível: o perfil profissional hoje é público dentro do Click Manager."><span className="cfg-pill muted">Público</span></Row>
        <p className="cfg-note">Seus dados profissionais (nome, cidade, especialidades, bio e contatos informados no perfil) ficam visíveis para outros usuários no Feed e no perfil. Dados de clientes, contratos e pagamentos não são exibidos publicamente.</p>
      </section>
      <section className="cfg-card danger"><header className="cfg-card-head"><div><h2>Ações da conta</h2><p>Ações destrutivas exigem confirmação explícita.</p></div></header>
        <Row title="Solicitar exclusão da conta" hint="Todos os seus dados seriam removidos e a ação não poderia ser desfeita."><button className="cfg-btn danger-ghost" onClick={() => { setDel(true); setWord(""); }}>Solicitar exclusão</button></Row>
      </section>
      {del && (
        <div className="cfg-layer" onMouseDown={(e) => e.target === e.currentTarget && setDel(false)}>
          <div className="cfg-modal" role="alertdialog" aria-modal="true" aria-labelledby="cfg-del"><span className="cfg-icon-danger"><CFI name="alert" size={22} /></span>
            <h2 id="cfg-del">Excluir conta?</h2>
            <p>Ao confirmar, seus clientes, galerias, portfólio, publicações, contratos e pagamentos seriam removidos permanentemente, sem possibilidade de recuperação.</p>
            <label className="cfg-field"><span>Digite EXCLUIR para confirmar</span><input value={word} onChange={(e) => setWord(e.target.value)} autoFocus /></label>
            <div><button className="cfg-btn ghost" onClick={() => setDel(false)}>Cancelar</button>
              <button className="cfg-btn danger" disabled={word !== "EXCLUIR"} onClick={() => { setDel(false); notify("Nenhum dado foi removido: a exclusão de conta depende do backend, ainda não implementado."); }}>Confirmar exclusão</button></div></div>
        </div>
      )}
    </>
  );
}

/* ───────── Painel de teste (somente desenvolvimento) ───────── */
function DevPanel({ notify }: { notify: (m: string) => void }) {
  const { plan, usage } = usePlan(); const s = useSocial();
  const [pick, setPick] = useState<PlanId>(plan.id);
  useEffect(() => setPick(plan.id), [plan.id]);
  const posts = s.posts.filter((p) => p.authorId === CURRENT_USER_ID).length;
  const rows: { label: string; count: number | undefined; limit: number | null; note?: string }[] = [
    { label: "Clientes", count: usage.clients, limit: plan.limits.clients, note: usage.clients === undefined ? "abra a página Clientes para medir" : undefined },
    { label: "Galerias (com fotos)", count: usage.galleries, limit: plan.limits.galleries, note: usage.galleries === undefined ? "abra a página Galeria para medir" : undefined },
    { label: "Publicações no Feed", count: posts, limit: plan.limits.posts },
    { label: "Portfólios", count: 1, limit: plan.limits.portfolios, note: "o sistema tem um único portfólio por fotógrafo" },
  ];
  return (
    <section className="cfg-card dev" aria-label="Modo de teste de planos">
      <header className="cfg-card-head"><div><h2><CFI name="wrench" size={16} /> Modo de teste de planos <span className="cfg-dev-tag">DESENVOLVIMENTO</span></h2><p>Recurso temporário. Não há cobrança nem assinatura real; o plano de teste é guardado só neste navegador.</p></div><span className={`cfg-plan-badge ${plan.id}`}>Plano ativo: {plan.name}</span></header>
      <div className="cfg-dev-row">
        <label className="cfg-field"><span>Plano de teste</span><select value={pick} onChange={(e) => setPick(e.target.value as PlanId)}>{PLAN_ORDER.map((id) => <option key={id} value={id}>{PLANS[id].name}</option>)}</select></label>
        <button className="cfg-btn primary" disabled={pick === plan.id} onClick={() => { planActions.setTestPlan(pick); notify(`Plano de teste aplicado: ${PLANS[pick].name}. Dados existentes foram mantidos.`); }}>Aplicar plano de teste</button>
      </div>
      <p className="cfg-confirm" role="status"><CFI name="check" size={14} /> Usando o plano <b>{plan.name}</b> para testes.</p>
      <div className="cfg-table-wrap"><table className="cfg-diag"><thead><tr><th>Recurso</th><th>Uso atual</th><th>Limite</th><th>Status</th></tr></thead><tbody>
        {rows.map((r) => { const st = usageStatus(r.count, r.limit); return <tr key={r.label}><td>{r.label}{r.note && <small>{r.note}</small>}</td><td>{r.count ?? "—"}</td><td>{fmtLimit(r.limit)}</td><td><span className={`cfg-st ${st}`}>{STATUS_TEXT[st]}</span></td></tr>; })}
        <tr><td>Armazenamento<small>sem medição: não há upload real para servidor</small></td><td>—</td><td>{fmtStorage(plan.limits.storageGB)}</td><td><span className="cfg-st unknown">Não medido</span></td></tr>
      </tbody></table></div>
    </section>
  );
}

/* ───────── Dados dos planos ───────── */
const featureList = (p: Plan) => [
  `${p.limits.clients === null ? "Clientes ilimitados" : `Até ${p.limits.clients} clientes cadastrados`}`,
  `${p.limits.galleries === null ? "Galerias ilimitadas" : `Até ${p.limits.galleries} galerias de fotos`}`,
  `${fmtStorage(p.limits.storageGB)} de armazenamento`,
  `${p.limits.portfolios === null ? "Portfólios ilimitados" : p.limits.portfolios === 1 ? "1 portfólio profissional" : `Até ${p.limits.portfolios} portfólios profissionais`}`,
  `${p.limits.posts === null ? "Publicações ilimitadas no Feed" : `Até ${p.limits.posts} publicações no Feed`}`,
  "Chat com clientes",
  `Gestão ${p.contracts === "full" ? "completa" : "básica"} de contratos`,
  `Gestão ${p.payments === "full" ? "completa" : "básica"} de pagamentos`,
  ...(p.reports === "none" ? [] : [p.reports === "advanced" ? "Relatórios avançados" : "Relatórios e estatísticas"]),
  ...(p.priority ? ["Suporte prioritário"] : []),
];

/* ───────── Aba: Assinatura e plano ───────── */
function SubscriptionTab({ goPlans, notify }: { goPlans: () => void; notify: (m: string) => void }) {
  const { plan } = usePlan();
  return (
    <>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Assinatura atual</h2><p>Resumo do seu plano no Click Manager.</p></div><button className="cfg-btn primary" onClick={goPlans}>Ver todos os planos</button></header>
        <div className="cfg-sub"><div className="cfg-sub-main"><span className={`cfg-plan-badge ${plan.id}`}>{plan.name}</span><strong>{fmtPrice(plan.price)}<small>/mês</small></strong><em>valor provisório</em></div>
          <dl><div><dt>Status</dt><dd>{plan.id === "free" ? "Gratuito" : "Plano de teste"}</dd></div><div><dt>Renovação</dt><dd>Não se aplica: sem cobrança implementada</dd></div></dl></div>
        <h3 className="cfg-h3">Recursos do plano</h3>
        <ul className="cfg-features">{featureList(plan).map((f) => <li key={f}><CFI name="check" size={14} />{f}</li>)}</ul>
        {plan.id === "free" && <div className="cfg-callout">Você está no plano Free. Conheça os planos pagos para ter mais clientes, galerias e relatórios. Nenhuma funcionalidade gratuita é bloqueada por isso.</div>}
        <p className="cfg-note">A contratação e a cobrança ainda não estão implementadas, então nenhuma mudança de plano real pode ser feita por aqui.</p>
      </section>
      {IS_DEV && <DevPanel notify={notify} />}
    </>
  );
}

/* ───────── Aba: Planos ───────── */
const cell = (v: string | boolean) => (v === true ? <CFI name="check" size={15} /> : v === false ? <CFI name="minus" size={15} /> : v);
function PlansTab({ notify }: { notify: (m: string) => void }) {
  const { plan: current } = usePlan();
  const rows: { label: string; v: (p: Plan) => string | boolean }[] = [
    { label: "Gestão de clientes", v: (p) => fmtLimit(p.limits.clients) }, { label: "Quantidade de galerias", v: (p) => fmtLimit(p.limits.galleries) },
    { label: "Armazenamento", v: (p) => fmtStorage(p.limits.storageGB) }, { label: "Portfólio profissional", v: (p) => fmtLimit(p.limits.portfolios) },
    { label: "Publicações no Feed", v: (p) => fmtLimit(p.limits.posts) }, { label: "Chat com clientes", v: () => true },
    { label: "Gestão de contratos", v: (p) => (p.contracts === "full" ? "Completo" : "Básico") }, { label: "Gestão de pagamentos", v: (p) => (p.payments === "full" ? "Completo" : "Básico") },
    { label: "Relatórios e estatísticas", v: (p) => (p.reports === "none" ? false : p.reports === "advanced" ? "Avançados" : "Padrão") }, { label: "Suporte prioritário", v: (p) => p.priority },
  ];
  const btn = (p: Plan) => p.id === current.id ? { t: "Plano atual", cur: true } : { t: p.id === "free" ? "Começar gratuitamente" : `Assinar ${p.name}`, cur: false };
  return (
    <>
      <div className="cfg-plans-head"><h2>Nossos planos</h2><p>Escolha o plano ideal para o seu momento e tenha acesso a mais recursos para o seu trabalho.</p><small>Valores e limites provisórios, definidos em <code>plans.tsx</code>.</small></div>
      <div className="cfg-plans">
        {PLAN_ORDER.map((id) => { const p = PLANS[id]; const b = btn(p); return (
          <article key={id} className={`cfg-plan ${id} ${current.id === id ? "current" : ""}`}>
            {p.badge && <span className="cfg-popular">{p.badge}</span>}
            <h3>{p.name}</h3><p className="d">{p.description}</p>
            <div className="price"><strong>{fmtPrice(p.price)}</strong><small>/mês</small></div>
            <button className={`cfg-btn ${b.cur ? "ghost" : id === "pro" ? "primary" : "ghost"} full`} disabled={b.cur} aria-current={b.cur}
              onClick={() => notify("A contratação ainda não está implementada. Nenhuma cobrança ou mudança de plano foi feita. Para validar permissões, use o Modo de teste em Assinatura e plano.")}>{b.t}</button>
            <ul>{featureList(p).map((f) => <li key={f}><CFI name="check" size={14} />{f}</li>)}</ul>
          </article>
        ); })}
      </div>
      <section className="cfg-card"><header className="cfg-card-head"><div><h2>Comparação de recursos</h2><p>Veja rapidamente o que cada plano oferece.</p></div></header>
        <div className="cfg-table-wrap"><table className="cfg-compare"><thead><tr><th>Recurso</th>{PLAN_ORDER.map((id) => <th key={id} className={current.id === id ? "cur" : ""}>{PLANS[id].name}{current.id === id && <small>seu plano</small>}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td>{PLAN_ORDER.map((id) => <td key={id} className={current.id === id ? "cur" : ""}>{cell(r.v(PLANS[id]))}</td>)}</tr>)}</tbody></table></div>
      </section>
    </>
  );
}

/* ───────── Página ───────── */
export default function SettingsView({ lightMode, onToggleTheme }: { lightMode: boolean; onToggleTheme: () => void }) {
  const { plan } = usePlan(); const nav = usePlanState().navRequest;
  const [tab, setTab] = useState<Tab>("Conta e perfil"); const [toast, setToast] = useState("");
  useEffect(() => { if (nav?.page === "Configurações") { if (nav.tab && TABS.some((t) => t.id === nav.tab)) setTab(nav.tab as Tab); planActions.clearNav(); } }, [nav]);
  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3800); };
  return (
    <div className="settings-view">
      <header className="cfg-header">
        <div><h1>Configurações</h1><p>Gerencie suas informações, preferências e configurações da sua conta.</p></div>
        <div className="cfg-plan-card"><span className="ic"><CFI name="crown" size={16} /></span><div><small>Plano atual</small><strong>{plan.name}</strong></div><button onClick={() => setTab("Planos")}>Ver detalhes</button></div>
      </header>
      <div className="cfg-tabs" role="tablist" aria-label="Seções de configurações">{TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}><CFI name={t.icon} size={15} /><span>{t.id}</span></button>)}</div>
      <div className="cfg-content" role="tabpanel">
        {tab === "Conta e perfil" && <AccountTab notify={notify} />}
        {tab === "Preferências" && <PrefsTab lightMode={lightMode} onToggleTheme={onToggleTheme} notify={notify} />}
        {tab === "Privacidade e segurança" && <PrivacyTab notify={notify} />}
        {tab === "Assinatura e plano" && <SubscriptionTab goPlans={() => setTab("Planos")} notify={notify} />}
        {tab === "Planos" && <PlansTab notify={notify} />}
      </div>
      {toast && <div className="cfg-toast" role="status"><CFI name="check" size={15} />{toast}</div>}
    </div>
  );
}
