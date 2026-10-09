import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { guard, planActions } from "./plans";

/* ───────────────────────── Tipos e dados ───────────────────────── */

type Status = "Ativo" | "Inativo";
type Tab = "Visão geral" | "Ensaios" | "Galerias" | "Conversas" | "Contratos";
type SortKey = "recentes" | "antigos" | "az" | "za" | "ensaio";
type LoadState = "loading" | "ready" | "error";

type Client = {
  id: string;
  name: string;
  socialName: string;
  cpf: string;
  birth: string;
  email: string;
  phone: string;
  phone2: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  source: string;
  company: string;
  role: string;
  prefs: string;
  notes: string;
  status: Status;
  createdAt: string;
  lastSession: { type: string; date: string } | null;
  sessionsCount: number;
  photo?: string;
};

type FormValues = Omit<Client, "id" | "status" | "createdAt" | "lastSession" | "sessionsCount" | "photo">;
type Errors = Partial<Record<keyof FormValues, string>>;

const TODAY = "2026-10-07";
const MONTH_START = "2026-10-01";
const PAGE_SIZE = 10;

const portraits = [
  "https://images.unsplash.com/photo-1708737749033-aa9b7bd00507?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1723189038268-3ef8fd518ad9?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1757348665310-0b68ed0ebc30?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1760552069633-c05f246a5d8c?auto=format&fit=crop&w=120&q=80",
];

const states = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const sources = ["Instagram", "Indicação de cliente", "Google", "Facebook", "Site do fotógrafo", "Evento ou feira", "Outro"];

// nome, e-mail, telefone, nascimento, último ensaio, data, status, cadastro, nº ensaios, cidade, UF
const seed: Array<[string, string, string, string, string, string, Status, string, number, string, string]> = [
  ["Ana Carolina Silva", "ana@email.com", "(11) 98765-4321", "1990-05-14", "Casamento - Ana e Lucas", "2026-10-05", "Ativo", "2026-10-03", 3, "São Paulo", "SP"],
  ["João Pedro Costa", "joao@email.com", "(11) 98866-7777", "1988-11-22", "Ensaio família", "2026-10-01", "Ativo", "2026-10-02", 2, "São Paulo", "SP"],
  ["Maria Clara Souza", "maria@email.com", "(11) 97777-5656", "1995-03-08", "Ensaio externo", "2026-09-28", "Ativo", "2026-09-21", 4, "Sorocaba", "SP"],
  ["Carlos Eduardo Lima", "carlos@email.com", "(11) 96666-3030", "1985-07-17", "Casamento - Carla e Eduardo", "2026-09-20", "Ativo", "2026-09-10", 1, "Campinas", "SP"],
  ["Juliana Martins", "juliana@email.com", "(11) 95555-4545", "1992-12-02", "Ensaio de Gestante", "2026-09-12", "Ativo", "2026-10-04", 2, "São Paulo", "SP"],
  ["Roberto Almeida", "roberto@email.com", "(11) 94444-9999", "1979-01-30", "Evento Corporativo", "2026-09-05", "Ativo", "2026-08-18", 5, "Jundiaí", "SP"],
  ["Fernanda Oliveira", "fernanda@email.com", "(11) 93333-2222", "1998-09-09", "Formatura", "2026-03-18", "Inativo", "2026-02-02", 1, "Sorocaba", "SP"],
  ["Lucas Ferreira", "lucas@email.com", "(11) 92222-1111", "1993-04-25", "Ensaio Casual", "2026-08-22", "Ativo", "2026-07-14", 2, "Votorantim", "SP"],
  ["Beatriz Santos", "beatriz@email.com", "(11) 91111-0000", "2000-06-19", "Ensaio Pré-wedding", "2026-08-10", "Ativo", "2026-10-05", 1, "São Paulo", "SP"],
  ["Felipe Rodrigues", "felipe@email.com", "(11) 90000-8888", "1987-10-11", "Casamento - Júlia e Felipe", "2026-07-30", "Ativo", "2026-06-02", 2, "Itu", "SP"],
  ["Camila Duarte", "camila@email.com", "(11) 98123-4567", "1996-02-14", "Newborn", "2026-07-12", "Ativo", "2026-10-06", 1, "São Paulo", "SP"],
  ["Rafael Andrade", "rafael@email.com", "(11) 98234-5678", "1991-08-03", "Ensaio externo", "2026-06-28", "Inativo", "2026-01-12", 2, "Campinas", "SP"],
  ["Helena Martins", "helena@email.com", "(11) 98345-6789", "1994-05-27", "Casamento", "2026-06-14", "Ativo", "2026-05-20", 3, "São Paulo", "SP"],
  ["Gabriel Nunes", "gabriel@email.com", "(11) 98456-7890", "1989-12-20", "Ensaio individual", "2026-05-30", "Ativo", "2026-04-08", 1, "Sorocaba", "SP"],
  ["Larissa Barros", "larissa@email.com", "(11) 98567-8901", "1997-07-07", "Aniversário", "2026-05-09", "Inativo", "2025-12-15", 1, "Piedade", "SP"],
  ["Thiago Moreira", "thiago@email.com", "(11) 98678-9012", "1983-03-16", "Evento Corporativo", "2026-04-22", "Ativo", "2025-11-30", 6, "São Paulo", "SP"],
  ["Patrícia Gomes", "patricia@email.com", "(11) 98789-0123", "1986-09-29", "Ensaio família", "2026-04-03", "Ativo", "2025-10-21", 3, "Jundiaí", "SP"],
  ["Diego Carvalho", "diego@email.com", "(11) 98890-1234", "1999-11-05", "Formatura", "2026-03-11", "Inativo", "2025-09-09", 1, "Campinas", "SP"],
  ["Mariana Ribeiro", "mariana@email.com", "(11) 98901-2345", "1993-01-18", "Ensaio de Gestante", "2026-02-24", "Ativo", "2025-08-14", 2, "São Paulo", "SP"],
  ["Bruno Teixeira", "bruno@email.com", "(11) 97012-3456", "1990-06-12", "Casamento", "2026-02-07", "Ativo", "2025-07-01", 2, "Itu", "SP"],
  ["Isabela Castro", "isabela@email.com", "(11) 97123-4567", "2001-04-04", "Ensaio Casual", "2025-12-13", "Inativo", "2025-05-17", 1, "Sorocaba", "SP"],
  ["Rodrigo Pires", "rodrigo@email.com", "(11) 97234-5678", "1984-10-26", "Produto e publicidade", "2025-11-19", "Ativo", "2025-04-02", 4, "São Paulo", "SP"],
  ["Vanessa Lopes", "vanessa@email.com", "(11) 97345-6789", "1992-08-21", "Newborn", "2025-10-30", "Inativo", "2025-02-20", 1, "Votorantim", "SP"],
  ["André Fonseca", "andre@email.com", "(11) 97456-7890", "1980-02-09", "Ensaio individual", "2025-09-15", "Ativo", "2025-01-10", 2, "Campinas", "SP"],
];

const streets = ["Rua das Acácias", "Av. Paulista", "Rua Augusta", "Rua Quinze de Novembro", "Av. Dom Aguirre", "Rua Voluntários"];

const initialClients: Client[] = seed.map((s, i) => ({
  id: `c${i + 1}`,
  name: s[0],
  socialName: "",
  cpf: "",
  birth: s[3],
  email: s[1],
  phone: s[2],
  phone2: "",
  cep: "18000-000",
  street: streets[i % streets.length],
  number: String(100 + i * 37),
  complement: i % 3 === 0 ? "Apto 4" : "",
  district: ["Centro", "Jardim Europa", "Vila Mariana", "Campolim"][i % 4],
  city: s[9],
  state: s[10],
  source: sources[i % sources.length],
  company: i % 4 === 1 ? "Studio Arte & Cia" : "",
  role: i % 4 === 1 ? "Diretor criativo" : "",
  prefs: i % 2 === 0 ? "Prefere luz natural e registros espontâneos." : "Gosta de fotos em locais externos, ao pôr do sol.",
  notes: i === 0 ? "Cliente indicada por uma noiva de 2025. Prefere contato por WhatsApp." : "",
  status: s[6],
  createdAt: s[7],
  lastSession: { type: s[4], date: s[5] },
  sessionsCount: s[8],
  photo: portraits[i] ,
}));

const emptyForm: FormValues = {
  name: "", socialName: "", cpf: "", birth: "", email: "", phone: "", phone2: "",
  cep: "", street: "", number: "", complement: "", district: "", city: "", state: "",
  source: "", company: "", role: "", prefs: "", notes: "",
};

/* ───────────────────────── Utilidades ───────────────────────── */

const digits = (v: string) => v.replace(/\D/g, "");
const fmtDate = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const maskCpf = (v: string) => digits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCep = (v: string) => digits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

function validCpf(raw: string) {
  const d = digits(raw);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

function validate(v: FormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Informe o nome completo.";
  else if (v.name.trim().split(/\s+/).length < 2) e.name = "Digite nome e sobrenome.";
  if (v.cpf && !validCpf(v.cpf)) e.cpf = "CPF inválido. Confira os 11 dígitos.";
  if (!v.birth) e.birth = "Informe a data de nascimento.";
  else if (v.birth > TODAY) e.birth = "A data não pode estar no futuro.";
  else if (v.birth < "1900-01-01") e.birth = "Data de nascimento inválida.";
  if (!v.email.trim()) e.email = "Informe o e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Digite um e-mail válido, como nome@email.com.";
  if (!v.phone.trim()) e.phone = "Informe o telefone principal.";
  else if (![10, 11].includes(digits(v.phone).length)) e.phone = "Digite DDD + número. Ex.: (11) 98765-4321.";
  if (v.phone2 && ![10, 11].includes(digits(v.phone2).length)) e.phone2 = "Digite DDD + número.";
  if (!v.cep.trim()) e.cep = "Informe o CEP.";
  else if (digits(v.cep).length !== 8) e.cep = "O CEP tem 8 dígitos.";
  if (!v.street.trim()) e.street = "Informe a rua.";
  if (!v.number.trim()) e.number = "Informe o número.";
  if (!v.district.trim()) e.district = "Informe o bairro.";
  if (!v.city.trim()) e.city = "Informe a cidade.";
  if (!v.state) e.state = "Selecione o estado.";
  return e;
}

/* Dados relacionados ao cliente (histórico, galerias, conversas, contratos) */
function related(c: Client) {
  const types = c.lastSession ? [c.lastSession.type, "Ensaio externo", "Ensaio família", "Ensaio individual"] : [];
  const n = Math.min(c.sessionsCount, 4);
  const base = c.lastSession ? new Date(c.lastSession.date + "T12:00:00") : new Date();
  const sessions = Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i * 4);
    const iso = d.toISOString().slice(0, 10);
    return { id: `${c.id}-s${i}`, title: types[i] ?? "Ensaio", date: iso, place: ["Estúdio", "Parque Ibirapuera", "Jardim Botânico", "Casa do cliente"][i % 4], value: 900 + i * 650 + (c.name.length % 5) * 100 };
  });
  const galleries = sessions.map((s, i) => ({ id: `${s.id}-g`, title: s.title, date: s.date, photos: 48 + ((c.name.length * (i + 3)) % 90), status: i === 0 && c.status === "Ativo" && c.createdAt >= MONTH_START ? "Em edição" : "Entregue" }));
  const contracts = sessions.slice(0, 2).map((s, i) => ({ id: `#${String(1000 + c.name.length * 7 + i)}`, title: s.title, date: s.date, value: s.value, status: i === 0 && c.createdAt >= MONTH_START ? "Pendente" : "Assinado" }));
  const first = c.name.split(" ")[0];
  const messages = c.sessionsCount === 0 ? [] : [
    { id: 1, from: "client", text: `Oi! Adorei o resultado, muito obrigada por tudo.`, when: fmtDate(sessions[0]?.date ?? TODAY) + " · 18:42" },
    { id: 2, from: "you", text: `Que bom, ${first}! Qualquer coisa que precisar, é só chamar.`, when: fmtDate(sessions[0]?.date ?? TODAY) + " · 19:05" },
    { id: 3, from: "client", text: "Posso reservar uma nova data para o próximo ano?", when: fmtDate(sessions[0]?.date ?? TODAY) + " · 19:20" },
  ];
  return { sessions, galleries, contracts, messages };
}

/* ───────────────────────── Ícones ───────────────────────── */

function CI({ name, size = 16 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
    userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M16 11h6" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4" />,
    more: <><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    cake: <><path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" /><path d="M12 11V7M12 3v1M4 16c2 2 4 2 8 0s6-2 8 0" /></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
    chat: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
    back: <path d="M19 12H5M11 6l-6 6 6 6" />,
    chev: <path d="m9 18 6-6-6-6" />,
    chevL: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>,
    power: <><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />,
    refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
    sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

function Avatar({ c, size = 36 }: { c: Pick<Client, "name" | "photo">; size?: number }) {
  return c.photo
    ? <img className="cl-avatar" style={{ width: size, height: size }} src={c.photo} alt="" />
    : <span className="cl-avatar cl-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials(c.name)}</span>;
}

/* ───────────────────────── Campo de formulário ───────────────────────── */

function Field({ label, required, error, hint, span, children }: { label: string; required?: boolean; error?: string; hint?: string; span?: boolean; children: ReactNode }) {
  return (
    <label className={`cl-field ${span ? "span2" : ""} ${error ? "has-error" : ""}`}>
      <span className="cl-label">{label}{required && <b aria-hidden="true"> *</b>}{required && <i className="sr-only"> (obrigatório)</i>}</span>
      {children}
      {error ? <small className="cl-error" role="alert"><CI name="alert" size={12} />{error}</small> : hint ? <small className="cl-hint">{hint}</small> : null}
    </label>
  );
}

/* ───────────────────────── Drawer de cadastro/edição ───────────────────────── */

function ClientDrawer({ editing, existingEmails, onClose, onSave }: {
  editing: Client | null;
  existingEmails: string[];
  onClose: () => void;
  onSave: (values: FormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(() => editing ? { ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).map((k) => [k, (editing as unknown as Record<string, string>)[k] ?? ""])) } as FormValues : emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  const errors = useMemo(() => {
    const e = validate(values);
    const mail = values.email.trim().toLowerCase();
    if (!e.email && existingEmails.includes(mail)) e.email = "Já existe um cliente cadastrado com este e-mail.";
    return e;
  }, [values, existingEmails]);

  const errorCount = Object.keys(errors).length;
  const show = (k: keyof FormValues) => (touched[k] || submitted ? errors[k] : undefined);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, saving]);

  const set = (k: keyof FormValues, mask?: (v: string) => string) => ({
    value: values[k],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setServerError("");
      setValues((v) => ({ ...v, [k]: mask ? mask(ev.target.value) : ev.target.value }));
    },
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    "aria-invalid": !!show(k),
  });

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    if (errorCount > 0) {
      const first = bodyRef.current?.querySelector<HTMLElement>(".has-error input, .has-error select");
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSaving(true);
    setServerError("");
    try {
      await onSave(values);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  };

  const title = editing ? "Editar cliente" : "Novo cliente";

  return (
    <div className="cl-drawer-layer" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="cl-drawer" role="dialog" aria-modal="true" aria-labelledby="cl-drawer-title" noValidate onSubmit={submit}>
        <header className="cl-drawer-head">
          <div>
            <h2 id="cl-drawer-title">{title}</h2>
            <p>{editing ? "Atualize os dados do cliente." : "Preencha os dados do cliente para cadastrá-lo no sistema."}</p>
          </div>
          <button type="button" className="cl-icon-btn" onClick={onClose} disabled={saving} aria-label="Fechar painel"><CI name="x" size={17} /></button>
        </header>

        <div className="cl-drawer-body" ref={bodyRef}>
          {submitted && errorCount > 0 && (
            <div className="cl-banner danger" role="alert"><CI name="alert" size={16} /><div><strong>Revise {errorCount === 1 ? "1 campo" : `${errorCount} campos`}</strong><span>Corrija os campos destacados para continuar.</span></div></div>
          )}
          {serverError && <div className="cl-banner danger" role="alert"><CI name="alert" size={16} /><div><strong>Não foi possível cadastrar</strong><span>{serverError}</span></div></div>}

          <section className="cl-section">
            <h3><CI name="users" size={15} /> Informações pessoais</h3>
            <div className="cl-grid">
              <Field label="Nome completo" required error={show("name")}><input ref={firstRef} placeholder="Digite o nome completo" autoComplete="off" {...set("name")} /></Field>
              <Field label="Nome social" hint="Opcional. Usado para se dirigir ao cliente."><input placeholder="Como prefere ser chamado(a)" {...set("socialName")} /></Field>
              <Field label="CPF" error={show("cpf")}><input inputMode="numeric" placeholder="000.000.000-00" {...set("cpf", maskCpf)} /></Field>
              <Field label="Data de nascimento" required error={show("birth")}><input type="date" max={TODAY} {...set("birth")} /></Field>
              <Field label="E-mail" required error={show("email")}><input type="email" placeholder="exemplo@email.com" autoComplete="off" {...set("email")} /></Field>
              <Field label="Telefone principal" required error={show("phone")}><input inputMode="tel" placeholder="(00) 00000-0000" {...set("phone", maskPhone)} /></Field>
              <Field label="Telefone secundário" error={show("phone2")}><input inputMode="tel" placeholder="(00) 00000-0000" {...set("phone2", maskPhone)} /></Field>
            </div>
          </section>

          <section className="cl-section">
            <h3><CI name="pin" size={15} /> Endereço</h3>
            <div className="cl-grid">
              <Field label="CEP" required error={show("cep")}><input inputMode="numeric" placeholder="00000-000" {...set("cep", maskCep)} /></Field>
              <Field label="Rua" required error={show("street")}><input placeholder="Digite a rua" {...set("street")} /></Field>
              <Field label="Número" required error={show("number")}><input placeholder="Ex.: 123" {...set("number")} /></Field>
              <Field label="Complemento"><input placeholder="Apto, bloco, sala..." {...set("complement")} /></Field>
              <Field label="Bairro" required error={show("district")}><input placeholder="Digite o bairro" {...set("district")} /></Field>
              <Field label="Cidade" required error={show("city")}><input placeholder="Digite a cidade" {...set("city")} /></Field>
              <Field label="Estado" required error={show("state")}>
                <select {...set("state")}><option value="">Selecione</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
            </div>
          </section>

          <section className="cl-section">
            <h3><CI name="note" size={15} /> Informações adicionais</h3>
            <div className="cl-grid">
              <Field label="Como conheceu o fotógrafo?">
                <select {...set("source")}><option value="">Selecione uma opção</option>{sources.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="Empresa"><input placeholder="Nome da empresa" {...set("company")} /></Field>
              <Field label="Cargo"><input placeholder="Cargo ou função" {...set("role")} /></Field>
              <Field label="Preferências do cliente" span hint={`${values.prefs.length}/300`}>
                <textarea maxLength={300} rows={3} placeholder="Estilo de foto, locais, horários e referências favoritas" {...(set("prefs") as object)} />
              </Field>
              <Field label="Observações" span hint={`${values.notes.length}/500`}>
                <textarea maxLength={500} rows={3} placeholder="Anotações internas sobre o cliente" {...(set("notes") as object)} />
              </Field>
            </div>
          </section>
        </div>

        <footer className="cl-drawer-foot">
          <p><b>*</b> Campos obrigatórios</p>
          <div>
            <button type="button" className="cl-btn ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="cl-btn primary" disabled={saving}>
              {saving ? <><span className="cl-spinner" /> Salvando…</> : <><CI name={editing ? "check" : "userPlus"} size={15} /> {editing ? "Salvar alterações" : "Cadastrar cliente"}</>}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

/* ───────────────────────── Detalhes do cliente ───────────────────────── */

function ClientDetail({ client, onBack, onEdit, onToggle }: { client: Client; onBack: () => void; onEdit: () => void; onToggle: () => void }) {
  const [tab, setTab] = useState<Tab>("Visão geral");
  const rel = useMemo(() => related(client), [client]);
  const tabs: Array<[Tab, number | null]> = [["Visão geral", null], ["Ensaios", rel.sessions.length], ["Galerias", rel.galleries.length], ["Conversas", rel.messages.length], ["Contratos", rel.contracts.length]];
  const address = [`${client.street}, ${client.number}`, client.complement, client.district, `${client.city} - ${client.state}`, client.cep].filter(Boolean);

  const Info = ({ label, value }: { label: string; value?: string }) => <div className="cl-info"><small>{label}</small><strong>{value || "Não informado"}</strong></div>;

  return (
    <div className="cl-detail">
      <button className="cl-back" onClick={onBack}><CI name="back" size={15} /> Voltar para clientes</button>

      <section className="cl-card cl-hero">
        <Avatar c={client} size={76} />
        <div className="cl-hero-main">
          <div className="cl-hero-title"><h1>{client.name}</h1><span className={`cl-status ${client.status === "Ativo" ? "on" : "off"}`}>{client.status}</span></div>
          {client.socialName && <p className="cl-social">Nome social: {client.socialName}</p>}
          <ul className="cl-contacts">
            <li><CI name="mail" size={14} /><a href={`mailto:${client.email}`}>{client.email}</a></li>
            <li><CI name="phone" size={14} />{client.phone}</li>
            <li><CI name="cake" size={14} />{fmtDate(client.birth)}</li>
          </ul>
        </div>
        <div className="cl-hero-actions">
          <button className="cl-btn ghost" onClick={onToggle}><CI name="power" size={15} /> {client.status === "Ativo" ? "Inativar" : "Reativar"}</button>
          <button className="cl-btn primary" onClick={onEdit}><CI name="edit" size={15} /> Editar cliente</button>
        </div>
      </section>

      <div className="cl-kpis">
        <div><small>Ensaios realizados</small><strong>{client.sessionsCount}</strong></div>
        <div><small>Galerias</small><strong>{rel.galleries.length}</strong></div>
        <div><small>Contratos</small><strong>{rel.contracts.length}</strong></div>
        <div><small>Cliente desde</small><strong>{fmtDate(client.createdAt)}</strong></div>
      </div>

      <div className="cl-tabs" role="tablist">
        {tabs.map(([t, n]) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}{n !== null && <span>{n}</span>}</button>)}
      </div>

      {tab === "Visão geral" && (
        <div className="cl-overview">
          <section className="cl-card cl-panel">
            <h2><CI name="users" size={15} /> Informações pessoais</h2>
            <div className="cl-info-grid">
              <Info label="Nome completo" value={client.name} /><Info label="Nome social" value={client.socialName} />
              <Info label="CPF" value={client.cpf} /><Info label="Data de nascimento" value={fmtDate(client.birth)} />
              <Info label="E-mail" value={client.email} /><Info label="Telefone principal" value={client.phone} />
              <Info label="Telefone secundário" value={client.phone2} />
            </div>
          </section>
          <section className="cl-card cl-panel">
            <h2><CI name="pin" size={15} /> Endereço</h2>
            <div className="cl-info-grid">
              <Info label="Rua" value={`${client.street}, ${client.number}`} /><Info label="Complemento" value={client.complement} />
              <Info label="Bairro" value={client.district} /><Info label="Cidade / Estado" value={`${client.city} - ${client.state}`} />
              <Info label="CEP" value={client.cep} />
            </div>
            <p className="cl-address-line">{address.join(" · ")}</p>
          </section>
          <section className="cl-card cl-panel">
            <h2><CI name="briefcase" size={15} /> Informações adicionais</h2>
            <div className="cl-info-grid">
              <Info label="Como conheceu" value={client.source} /><Info label="Empresa" value={client.company} />
              <Info label="Cargo" value={client.role} />
            </div>
            <div className="cl-info wide"><small>Preferências</small><strong>{client.prefs || "Não informado"}</strong></div>
          </section>
          <section className="cl-card cl-panel">
            <h2><CI name="note" size={15} /> Observações</h2>
            <p className="cl-notes">{client.notes || "Nenhuma observação registrada."}</p>
          </section>
        </div>
      )}

      {tab === "Ensaios" && (
        <section className="cl-card cl-panel">
          <h2><CI name="camera" size={15} /> Histórico de ensaios</h2>
          {rel.sessions.length === 0 ? <TabEmpty icon="camera" text="Nenhum ensaio realizado com este cliente." /> : (
            <ul className="cl-timeline">
              {rel.sessions.map((s) => (
                <li key={s.id}><i /><div><strong>{s.title}</strong><small>{fmtDate(s.date)} · {s.place}</small></div><b>R$ {s.value.toLocaleString("pt-BR")},00</b><span className="cl-status on">Realizado</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Galerias" && (
        <section className="cl-card cl-panel">
          <h2><CI name="image" size={15} /> Galerias associadas</h2>
          {rel.galleries.length === 0 ? <TabEmpty icon="image" text="Este cliente ainda não tem galerias." /> : (
            <div className="cl-galleries">
              {rel.galleries.map((g, i) => (
                <article key={g.id}>
                  <div className={`cl-cover cover-${i % 4}`}><CI name="image" size={22} /></div>
                  <strong>{g.title}</strong><small>{g.photos} fotos · {fmtDate(g.date)}</small>
                  <span className={`cl-status ${g.status === "Entregue" ? "on" : "warn"}`}>{g.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "Conversas" && (
        <section className="cl-card cl-panel">
          <div className="cl-panel-head"><h2><CI name="chat" size={15} /> Conversas</h2><a className="cl-btn ghost" href={`mailto:${client.email}`}><CI name="mail" size={14} /> Enviar e-mail</a></div>
          {rel.messages.length === 0 ? <TabEmpty icon="chat" text="Nenhuma conversa registrada com este cliente." /> : (
            <div className="cl-chat">{rel.messages.map((m) => <div key={m.id} className={`cl-msg ${m.from}`}><p>{m.text}</p><small>{m.when}</small></div>)}</div>
          )}
        </section>
      )}

      {tab === "Contratos" && (
        <section className="cl-card cl-panel">
          <h2><CI name="note" size={15} /> Contratos</h2>
          {rel.contracts.length === 0 ? <TabEmpty icon="note" text="Nenhum contrato vinculado a este cliente." /> : (
            <ul className="cl-timeline">
              {rel.contracts.map((c) => (
                <li key={c.id}><i /><div><strong>{c.title}</strong><small>{c.id} · {fmtDate(c.date)}</small></div><b>R$ {c.value.toLocaleString("pt-BR")},00</b><span className={`cl-status ${c.status === "Assinado" ? "on" : "warn"}`}>{c.status}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TabEmpty({ icon, text }: { icon: string; text: string }) {
  return <div className="cl-tab-empty"><CI name={icon} size={22} /><p>{text}</p></div>;
}

/* ───────────────────────── Página principal ───────────────────────── */

export default function ClientsView({ lightMode, onToggleTheme, onNotice }: { lightMode: boolean; onToggleTheme: () => void; onNotice: (m: string) => void }) {
  // ?estado=erro | vazio | carregando permite pré-visualizar os estados da lista
  const demo = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("estado") : null;

  const [clients, setClients] = useState<Client[]>(demo === "vazio" ? [] : initialClients);
  const [load, setLoad] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<null | { editing: Client | null }>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    if (load !== "loading" || demo === "carregando") return;
    const t = window.setTimeout(() => setLoad(demo === "erro" ? "error" : "ready"), 900);
    return () => window.clearTimeout(t);
  }, [load, demo]);

  useEffect(() => { setPage(1); }, [query, filter, sort]);
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  useEffect(() => { planActions.reportUsage("clients", clients.length); }, [clients.length]);
  const openNew = () => { if (guard("clients", clients.length)) setDrawer({ editing: null }); };

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === "Ativo").length,
    fresh: clients.filter((c) => c.createdAt >= MONTH_START).length,
    sessions: clients.reduce((n, c) => n + c.sessionsCount, 0),
  }), [clients]);

  const visible = useMemo(() => {
    const q = norm(query.trim());
    const qd = digits(query);
    const list = clients.filter((c) => {
      if (filter === "ativos" && c.status !== "Ativo") return false;
      if (filter === "inativos" && c.status !== "Inativo") return false;
      if (!q) return true;
      return norm(c.name).includes(q) || norm(c.socialName).includes(q) || norm(c.email).includes(q) || (qd.length > 1 && digits(c.phone).includes(qd));
    });
    const by: Record<SortKey, (a: Client, b: Client) => number> = {
      recentes: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id, undefined, { numeric: true }),
      antigos: (a, b) => a.createdAt.localeCompare(b.createdAt),
      az: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      za: (a, b) => b.name.localeCompare(a.name, "pt-BR"),
      ensaio: (a, b) => (b.lastSession?.date ?? "").localeCompare(a.lastSession?.date ?? ""),
    };
    return [...list].sort(by[sort]);
  }, [clients, query, filter, sort]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const detail = clients.find((c) => c.id === detailId) ?? null;
  const hasFilters = query.trim() !== "" || filter !== "todos";

  const saveClient = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 900));
    const editing = drawer?.editing;
    if (!editing && !guard("clients", clients.length)) throw new Error("Limite de clientes do plano atingido. Faça um upgrade para cadastrar mais clientes.");
    const clean: FormValues = { ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() };
    if (editing) {
      setClients((list) => list.map((c) => (c.id === editing.id ? { ...c, ...clean } : c)));
      onNotice("Cliente atualizado com sucesso");
    } else {
      const id = `c${Date.now()}`;
      setClients((list) => [{ ...clean, id, status: "Ativo", createdAt: TODAY, lastSession: null, sessionsCount: 0 }, ...list]);
      setFresh(id);
      window.setTimeout(() => setFresh(null), 4000);
      setQuery(""); setFilter("todos"); setSort("recentes"); setPage(1);
      onNotice("Cliente cadastrado com sucesso");
    }
    setDrawer(null);
  };

  const toggleStatus = (c: Client) => {
    setClients((list) => list.map((x) => (x.id === c.id ? { ...x, status: x.status === "Ativo" ? "Inativo" : "Ativo" } : x)));
    onNotice(c.status === "Ativo" ? `${c.name} foi inativado` : `${c.name} foi reativado`);
  };

  const existingEmails = clients.filter((c) => c.id !== drawer?.editing?.id).map((c) => c.email.toLowerCase());

  const drawerNode = drawer && <ClientDrawer editing={drawer.editing} existingEmails={existingEmails} onClose={() => setDrawer(null)} onSave={saveClient} />;

  /* Página de detalhes */
  if (detail) {
    return (
      <div className="clients-view">
        <ClientDetail client={detail} onBack={() => setDetailId(null)} onEdit={() => setDrawer({ editing: detail })} onToggle={() => toggleStatus(detail)} />
        {drawerNode}
      </div>
    );
  }

  const loading = load === "loading";

  return (
    <div className="clients-view">
      <header className="cl-header">
        <div><h1>Clientes</h1><p>Cadastre e gerencie seus clientes.</p></div>
        <div className="cl-header-actions">
          <button className="theme-toggle" onClick={onToggleTheme} aria-label={lightMode ? "Ativar modo escuro" : "Ativar modo claro"}><CI name={lightMode ? "moon" : "sun"} size={17} /><span>{lightMode ? "Escuro" : "Claro"}</span></button>
          <button className="cl-btn primary lg" onClick={openNew}><CI name="plus" size={16} /> Adicionar cliente</button>
        </div>
      </header>

      <section className="cl-stats" aria-label="Resumo de clientes">
        {([
          ["users", "Total de clientes", stats.total, "Cadastrados no sistema"],
          ["userCheck", "Clientes ativos", stats.active, `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% do total`],
          ["userPlus", "Novos clientes", stats.fresh, "Cadastrados neste mês"],
          ["camera", "Ensaios realizados", stats.sessions, "Somando todos os clientes"],
        ] as const).map(([icon, label, value, note], i) => (
          <article className={`cl-stat tone-${i}`} key={label}>
            <span className="cl-stat-icon"><CI name={icon} size={18} /></span>
            <div><small>{label}</small>{loading ? <i className="cl-skel w40" /> : <strong>{load === "error" ? "—" : value}</strong>}<em>{note}</em></div>
          </article>
        ))}
      </section>

      <div className="cl-toolbar">
        <label className="cl-search">
          <CI name="search" size={16} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" aria-label="Buscar clientes" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca"><CI name="x" size={14} /></button>}
        </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filtrar clientes">
          <option value="todos">Todos os clientes</option><option value="ativos">Somente ativos</option><option value="inativos">Somente inativos</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Ordenar clientes">
          <option value="recentes">Mais recentes</option><option value="antigos">Mais antigos</option><option value="az">Nome (A–Z)</option><option value="za">Nome (Z–A)</option><option value="ensaio">Último ensaio</option>
        </select>
      </div>

      <section className="cl-card cl-table-card">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead><tr><th>Cliente</th><th>E-mail</th><th>Telefone</th><th>Data de nascimento</th><th>Último ensaio</th><th>Status</th><th className="right">Ações</th></tr></thead>
            <tbody>
              {loading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="cl-skel-row" aria-hidden="true">
                  <td><div className="cl-person"><i className="cl-skel circle" /><span><i className="cl-skel w80" /><i className="cl-skel w50" /></span></div></td>
                  <td><i className="cl-skel w80" /></td><td><i className="cl-skel w70" /></td><td><i className="cl-skel w50" /></td><td><i className="cl-skel w80" /></td><td><i className="cl-skel w40" /></td><td />
                </tr>
              ))}
              {!loading && load === "ready" && rows.map((c) => (
                <tr key={c.id} className={`cl-row ${fresh === c.id ? "is-new" : ""}`} onClick={() => setDetailId(c.id)}>
                  <td>
                    <div className="cl-person">
                      <Avatar c={c} />
                      <span><button className="cl-name" onClick={(e) => { e.stopPropagation(); setDetailId(c.id); }}>{c.name}</button><small>Cliente desde {fmtDate(c.createdAt)}</small></span>
                    </div>
                  </td>
                  <td className="muted">{c.email}</td>
                  <td className="muted">{c.phone}</td>
                  <td className="muted">{fmtDate(c.birth)}</td>
                  <td>{c.lastSession ? <><span className="cl-last">{c.lastSession.type}</span><small className="cl-sub">{fmtDate(c.lastSession.date)}</small></> : <span className="muted">Nenhum ensaio ainda</span>}</td>
                  <td><span className={`cl-status ${c.status === "Ativo" ? "on" : "off"}`}>{c.status}</span></td>
                  <td className="right" onClick={(e) => e.stopPropagation()}>
                    <div className="cl-actions">
                      <button className="cl-icon-btn" onClick={() => setDetailId(c.id)} aria-label={`Ver detalhes de ${c.name}`} title="Ver detalhes"><CI name="eye" /></button>
                      <button className="cl-icon-btn" onClick={() => setDrawer({ editing: c })} aria-label={`Editar ${c.name}`} title="Editar"><CI name="edit" /></button>
                      <div className="cl-more">
                        <button className="cl-icon-btn" aria-label={`Mais ações para ${c.name}`} aria-haspopup="menu" aria-expanded={menuId === c.id} onClick={(e) => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }}><CI name="more" /></button>
                        {menuId === c.id && (
                          <div className="cl-menu" role="menu">
                            <a role="menuitem" href={`mailto:${c.email}`}><CI name="mail" size={14} /> Enviar e-mail</a>
                            <button role="menuitem" onClick={() => { navigator.clipboard?.writeText(c.email); onNotice("E-mail copiado"); setMenuId(null); }}><CI name="copy" size={14} /> Copiar e-mail</button>
                            <button role="menuitem" onClick={() => { toggleStatus(c); setMenuId(null); }}><CI name="power" size={14} /> {c.status === "Ativo" ? "Inativar cliente" : "Reativar cliente"}</button>
                            <button role="menuitem" className="danger" onClick={() => { setToDelete(c); setMenuId(null); }}><CI name="trash" size={14} /> Excluir cliente</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {load === "error" && (
          <div className="cl-state" role="alert">
            <span className="cl-state-icon danger"><CI name="alert" size={24} /></span>
            <h3>Não foi possível carregar os clientes</h3>
            <p>Verifique sua conexão e tente novamente. Seus dados continuam salvos.</p>
            <button className="cl-btn primary" onClick={() => setLoad("loading")}><CI name="refresh" size={15} /> Tentar novamente</button>
          </div>
        )}
        {load === "ready" && clients.length === 0 && (
          <div className="cl-state">
            <span className="cl-state-icon"><CI name="users" size={24} /></span>
            <h3>Você ainda não tem clientes</h3>
            <p>Cadastre seu primeiro cliente para começar a organizar ensaios, contratos e conversas em um só lugar.</p>
            <button className="cl-btn primary" onClick={openNew}><CI name="plus" size={15} /> Adicionar cliente</button>
          </div>
        )}
        {load === "ready" && clients.length > 0 && visible.length === 0 && (
          <div className="cl-state">
            <span className="cl-state-icon"><CI name="search" size={24} /></span>
            <h3>Nenhum cliente encontrado</h3>
            <p>{query.trim() ? <>Não encontramos resultados para “{query.trim()}”. Confira a grafia ou tente outro termo.</> : "Nenhum cliente corresponde ao filtro selecionado."}</p>
            {hasFilters && <button className="cl-btn ghost" onClick={() => { setQuery(""); setFilter("todos"); }}>Limpar busca e filtros</button>}
          </div>
        )}

        {load === "ready" && visible.length > 0 && (
          <footer className="cl-pager">
            <span>Mostrando {(current - 1) * PAGE_SIZE + 1} a {Math.min(current * PAGE_SIZE, visible.length)} de {visible.length} {visible.length === 1 ? "cliente" : "clientes"}</span>
            {pages > 1 && (
              <nav aria-label="Paginação">
                <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Página anterior"><CI name="chevL" size={14} /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} className={n === current ? "active" : ""} aria-current={n === current ? "page" : undefined} onClick={() => setPage(n)}>{n}</button>)}
                <button onClick={() => setPage(current + 1)} disabled={current === pages} aria-label="Próxima página"><CI name="chev" size={14} /></button>
              </nav>
            )}
          </footer>
        )}
      </section>

      {drawerNode}

      {toDelete && (
        <div className="cl-modal-layer" onMouseDown={(e) => e.target === e.currentTarget && setToDelete(null)}>
          <div className="cl-confirm" role="alertdialog" aria-labelledby="cl-del-title">
            <span className="cl-state-icon danger"><CI name="trash" size={22} /></span>
            <h2 id="cl-del-title">Excluir {toDelete.name}?</h2>
            <p>O cadastro será removido da lista. Essa ação não pode ser desfeita.</p>
            <div><button className="cl-btn ghost" onClick={() => setToDelete(null)}>Cancelar</button>
              <button className="cl-btn danger" onClick={() => { setClients((l) => l.filter((c) => c.id !== toDelete.id)); onNotice("Cliente excluído"); setToDelete(null); }}>Excluir cliente</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
