import { useEffect, useRef, useState } from "react";
import { actions, AvatarView, SI, useSocial, Verified, type Photographer } from "./social";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const SUGGESTED = ["Casamentos", "Ensaios", "Retratos", "Eventos", "Família", "Corporativo"];

export function ProfilePreview({ p }: { p: Photographer }) {
  return (
    <div className="sx-preview" aria-label="Prévia do perfil">
      <AvatarView name={p.name || "Seu nome"} photo={p.photo} size={52} />
      <div>
        <strong>{p.name || "Seu nome profissional"}{p.verified && <Verified />}</strong>
        <small><SI name="pin" size={12} /> {p.city || "Cidade"}{p.state ? `, ${p.state}` : ""}</small>
        <div className="sx-tags">{p.specialties.length ? p.specialties.map((s) => <span key={s}>{s}</span>) : <em>Nenhuma especialidade</em>}</div>
        {p.bio && <p>{p.bio}</p>}
      </div>
    </div>
  );
}

export default function ProfileEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useSocial();
  const [d, setD] = useState<Photographer>(() => ({ ...s.photographers[id], specialties: [...s.photographers[id].specialties], others: [...s.photographers[id].others] }));
  const [spec, setSpec] = useState(""); const [other, setOther] = useState(""); const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null); const nameRef = useRef<HTMLInputElement>(null);
  const up = <K extends keyof Photographer>(k: K, v: Photographer[K]) => setD((x) => ({ ...x, [k]: v }));

  const err = {
    name: d.name.trim() ? "" : "Informe o nome profissional.",
    fullName: d.fullName.trim() ? "" : "Informe o nome completo.",
    state: d.state ? "" : "Selecione o estado.",
    city: d.city.trim() ? "" : "Informe a cidade.",
    email: d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) ? "Digite um e-mail válido." : "",
  };
  const invalid = Object.values(err).some(Boolean);

  useEffect(() => {
    nameRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);

  const addSpec = (v: string) => { const t = v.trim(); if (t && !d.specialties.some((x) => x.toLowerCase() === t.toLowerCase())) up("specialties", [...d.specialties, t]); setSpec(""); };
  const addOther = () => { const t = other.trim(); if (t && !d.others.includes(t)) up("others", [...d.others, t]); setOther(""); };
  const pickPhoto = (f?: File) => { if (!f) return; if (!/^image\//.test(f.type)) return actions.notify("Escolha um arquivo de imagem"); up("photo", URL.createObjectURL(f)); };
  const save = () => { setSent(true); if (invalid) return; actions.updateProfile(id, d); actions.notify("Perfil atualizado"); onClose(); };
  const F = ({ k, label, req, ph, type = "text" }: { k: "name" | "fullName" | "city" | "email" | "phone" | "instagram" | "site"; label: string; req?: boolean; ph: string; type?: string }) => ( // chamado como função (não componente) para não remontar os inputs
    <label className={`sx-field ${sent && (err as Record<string, string>)[k] ? "err" : ""}`}>
      <span>{label}{req && <b> *</b>}</span>
      <input ref={k === "name" ? nameRef : undefined} type={type} value={d[k]} placeholder={ph} onChange={(e) => up(k, e.target.value)} />
      {sent && (err as Record<string, string>)[k] && <small className="sx-err"><SI name="alert" size={12} />{(err as Record<string, string>)[k]}</small>}
    </label>
  );

  return (
    <div className="sx-layer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="sx-drawer" role="dialog" aria-modal="true" aria-labelledby="sx-pe-title">
        <header className="sx-drawer-head"><div><h2 id="sx-pe-title">Editar perfil profissional</h2><p>Gerencie as informações e apresente seu trabalho.</p></div><button className="sx-icon-btn" onClick={onClose} aria-label="Fechar painel"><SI name="x" size={17} /></button></header>
        <div className="sx-drawer-body">
          <section>
            <h3>Foto de perfil</h3>
            <div className="sx-photo-row">
              <AvatarView name={d.name || "?"} photo={d.photo} size={64} />
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
              <button className="sx-btn ghost" onClick={() => fileRef.current?.click()}><SI name="camera" size={15} /> Alterar foto</button>
            </div>
          </section>
          <section>
            <h3>Informações básicas</h3>
            {F({ k: "name", label: "Nome profissional", req: true, ph: "Ex.: Lucas Almeida Fotografia" })}
            {F({ k: "fullName", label: "Nome completo", req: true, ph: "Seu nome completo" })}
            <label className="sx-field"><span>Biografia</span><textarea rows={4} maxLength={300} value={d.bio} onChange={(e) => up("bio", e.target.value)} placeholder="Conte um pouco sobre seu estilo e seu trabalho" /><small className="sx-hint right">{d.bio.length}/300</small></label>
            <div className="sx-two">
              {F({ k: "city", label: "Cidade", req: true, ph: "Sua cidade" })}
              <label className={`sx-field ${sent && err.state ? "err" : ""}`}><span>Estado <b>*</b></span>
                <select value={d.state} onChange={(e) => up("state", e.target.value)}><option value="">UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select>
                {sent && err.state && <small className="sx-err"><SI name="alert" size={12} />{err.state}</small>}
              </label>
            </div>
          </section>
          <section>
            <h3>Especialidades</h3>
            <div className="sx-tags edit">{d.specialties.map((t) => <span key={t}>{t}<button onClick={() => up("specialties", d.specialties.filter((x) => x !== t))} aria-label={`Remover ${t}`}><SI name="x" size={11} /></button></span>)}</div>
            <div className="sx-add-row"><input value={spec} placeholder="Adicionar especialidade" onChange={(e) => setSpec(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec(spec))} aria-label="Nova especialidade" /><button className="sx-btn ghost" onClick={() => addSpec(spec)}><SI name="plus" size={14} /> Adicionar</button></div>
            <div className="sx-suggest">{SUGGESTED.filter((t) => !d.specialties.includes(t)).map((t) => <button key={t} onClick={() => addSpec(t)}>+ {t}</button>)}</div>
          </section>
          <section>
            <h3>Contato e redes sociais</h3>
            <div className="sx-two">{F({ k: "email", label: "E-mail profissional", ph: "contato@seusite.com", type: "email" })}{F({ k: "phone", label: "Telefone profissional", ph: "(00) 00000-0000" })}</div>
            <div className="sx-two">{F({ k: "instagram", label: "Instagram", ph: "@seuusuario" })}{F({ k: "site", label: "Site", ph: "www.seusite.com" })}</div>
            <div className="sx-field"><span>Outras redes sociais</span>
              <div className="sx-tags edit">{d.others.map((t) => <span key={t}>{t}<button onClick={() => up("others", d.others.filter((x) => x !== t))} aria-label={`Remover ${t}`}><SI name="x" size={11} /></button></span>)}</div>
              <div className="sx-add-row"><input value={other} placeholder="Ex.: behance.net/seuusuario" onChange={(e) => setOther(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOther())} aria-label="Outra rede social" /><button className="sx-btn ghost" onClick={addOther}><SI name="plus" size={14} /> Adicionar</button></div>
            </div>
          </section>
          <section><h3>Visualização do perfil</h3><ProfilePreview p={d} /></section>
        </div>
        <footer className="sx-drawer-foot"><button className="sx-btn ghost" onClick={onClose}>Cancelar</button><button className="sx-btn primary" onClick={save}>Salvar alterações</button></footer>
      </aside>
    </div>
  );
}
