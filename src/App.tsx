import { useEffect, useState, type ReactNode } from "react";
import ContractsView from "./ContractsView";
import PaymentsView from "./PaymentsView";
import GalleryView from "./GalleryView";
import PortfolioView from "./PortfolioView";
import FeedView from "./FeedView";
import ChatView from "./ChatView";
import SettingsView from "./SettingsView";
import { PlanLimitHost, usePlanState } from "./plans";
import ClientsView from "./ClientsView";

type IconName =
  | "menu"
  | "home"
  | "calendar"
  | "users"
  | "camera"
  | "file"
  | "dollar"
  | "settings"
  | "clock"
  | "chart"
  | "plus"
  | "arrow"
  | "bell"
  | "sparkle"
  | "check"
  | "payment"
  | "sun"
  | "moon"
  | "image"
  | "folder"
  | "feed"
  | "chat";

const iconPaths: Record<IconName, ReactNode> = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" /><circle cx="12" cy="13" r="4" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  dollar: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.38.37.72.6 1 .29.34.68.54 1.1.6h.1v4h-.1c-.42.06-.81.26-1.1.6-.23.28-.44.62-.6 1Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-8M22 19V3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  payment: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>,
  moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  chat: <><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  feed: <><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" /></>,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const nav = [
  { icon: "home" as IconName, label: "Início" },
  { icon: "calendar" as IconName, label: "Minha agenda" },
  { icon: "users" as IconName, label: "Clientes" },
  { icon: "camera" as IconName, label: "Ensaios" },
  { icon: "image" as IconName, label: "Galeria" },
  { icon: "folder" as IconName, label: "Portfólio" },
  { icon: "feed" as IconName, label: "Feed" },
  { icon: "chat" as IconName, label: "Chat" },
  { icon: "file" as IconName, label: "Contratos" },
  { icon: "payment" as IconName, label: "Pagamentos" },
  { icon: "settings" as IconName, label: "Configurações" },
];

const portraits = [
  "https://images.unsplash.com/photo-1708737749033-aa9b7bd00507?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1723189038268-3ef8fd518ad9?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1757348665310-0b68ed0ebc30?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1760552069633-c05f246a5d8c?auto=format&fit=crop&w=120&q=80",
];

const sessions = [
  { day: "Hoje", time: "14:00", name: "Ana Carolina Silva", type: "Ensaio gestante", status: "Confirmado", photo: portraits[0] },
  { day: "Amanhã", time: "10:30", name: "João Pedro Costa", type: "Ensaio família", status: "Confirmado", photo: portraits[1] },
  { day: "08/10", time: "15:00", name: "Maria Clara Souza", type: "Casamento", status: "Pendente", photo: portraits[2] },
  { day: "12/10", time: "09:00", name: "Carlos Eduardo Lima", type: "Ensaio individual", status: "Confirmado", photo: portraits[3] },
];

function Sparkline({ tone = "blue", shape = "up" }: { tone?: "blue" | "pink"; shape?: "up" | "down" }) {
  const points = shape === "down" ? "1,14 16,11 30,13 45,7 60,9 76,4 99,8" : "1,15 15,12 29,13 43,8 58,10 72,5 84,6 99,1";
  return (
    <svg className={`sparkline ${tone}`} viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true">
      <path className="spark-fill" d={`M${points} L99 18 L1 18Z`} />
      <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MetricCard({ icon, title, value, delta, tone = "blue", shape = "up" }: { icon: IconName; title: string; value: string; delta: string; tone?: "blue" | "pink"; shape?: "up" | "down" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon name={icon} size={16} /></div>
      <p className="metric-title">{title}</p>
      <strong>{value}</strong>
      <span className={shape === "down" ? "negative" : "positive"}>{delta}</span>
      <Sparkline tone={tone} shape={shape} />
    </article>
  );
}

function SectionTitle({ icon, children, action }: { icon: IconName; children: ReactNode; action?: string }) {
  return (
    <div className="section-title">
      <div className="section-heading"><span className="title-icon"><Icon name={icon} size={16} /></span><h2>{children}</h2></div>
      {action && <button className="text-action">{action} <Icon name="arrow" size={13} /></button>}
    </div>
  );
}

const agendaEvents: Record<string, Array<{ name: string; type: string; time: string; photo: string }>> = {
  "2026-10-03": [
    { name: "Ana Carolina Silva", type: "Ensaio externo", time: "10:00", photo: portraits[0] },
    { name: "João Pedro Costa", type: "Ensaio família", time: "17:30", photo: portraits[1] },
  ],
  "2026-10-08": [{ name: "Maria Clara Souza", type: "Ensaio gestante", time: "14:00", photo: portraits[2] }],
  "2026-10-14": [{ name: "Carlos Eduardo Lima", type: "Ensaio individual", time: "09:00", photo: portraits[3] }],
  "2026-10-17": [
    { name: "Helena Martins", type: "Casamento", time: "11:00", photo: portraits[0] },
    { name: "Rafael Andrade", type: "Ensaio externo", time: "16:30", photo: portraits[1] },
  ],
  "2026-10-23": [{ name: "Beatriz e Lucas", type: "Pré-wedding", time: "15:00", photo: portraits[2] }],
};

const weekNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function AgendaView({ lightMode, onToggleTheme, onNotice }: { lightMode: boolean; onToggleTheme: () => void; onNotice: (message: string) => void }) {
  const [cursor, setCursor] = useState(new Date(2026, 9, 1));
  const [view, setView] = useState<"Mês" | "Semana" | "Dia">("Mês");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 9, 3));
  const [workDays, setWorkDays] = useState([false, true, true, true, true, true, false]);
  const [specificOpen, setSpecificOpen] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("18:00");
  const [advanced, setAdvanced] = useState(false);

  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const calendarStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - firstDay.getDay());
  const monthCells = Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index));
  const selectedWeekStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay());
  const visibleDates = view === "Mês"
    ? monthCells
    : view === "Semana"
      ? Array.from({ length: 7 }, (_, index) => new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth(), selectedWeekStart.getDate() + index))
      : [selectedDate];
  const selectedKey = dateKey(selectedDate);
  const selectedEvents = agendaEvents[selectedKey] || [];
  const miniDays = Array.from({ length: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() }, (_, index) => index + 1);

  const moveMonth = (direction: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
    setCursor(next);
    setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div className="agenda-view">
      <header className="agenda-header">
        <div className="agenda-heading">
          <span><Icon name="calendar" size={23} /></span>
          <div><h1>Minha agenda</h1><p>Organize seus ensaios e acompanhe seus horários.</p></div>
        </div>
        <div className="agenda-header-actions">
          <button className="theme-toggle" onClick={onToggleTheme} aria-label={lightMode ? "Ativar modo escuro" : "Ativar modo claro"}>
            <Icon name={lightMode ? "moon" : "sun"} size={17} /><span>{lightMode ? "Escuro" : "Claro"}</span>
          </button>
          <button className="new-session" onClick={() => onNotice("Novo ensaio: pronto para agendar")}><Icon name="plus" size={15} /> Novo ensaio</button>
        </div>
      </header>

      <div className="agenda-layout">
        <section className="card calendar-card">
          <div className="calendar-toolbar">
            <div className="month-navigation">
              <button onClick={() => moveMonth(-1)} aria-label="Mês anterior"><Icon name="arrow" size={15} /></button>
              <strong>{monthNames[cursor.getMonth()]} <span>{cursor.getFullYear()}</span></strong>
              <button onClick={() => moveMonth(1)} aria-label="Próximo mês"><Icon name="arrow" size={15} /></button>
            </div>
            <div className="view-switcher">
              {(["Dia", "Semana", "Mês"] as const).map((option) => <button key={option} className={view === option ? "active" : ""} onClick={() => setView(option)}>{option}</button>)}
            </div>
          </div>
          <div className={`calendar-grid view-${view.toLowerCase()}`}>
            {(view === "Dia" ? [weekNames[selectedDate.getDay()]] : weekNames).map((day) => <span className="weekday" key={day}>{day}</span>)}
            {visibleDates.map((date) => {
              const key = dateKey(date);
              const events = agendaEvents[key] || [];
              const outside = date.getMonth() !== cursor.getMonth();
              const disabled = !workDays[date.getDay()] || blockedDates.includes(key);
              const selected = key === selectedKey;
              return (
                <button
                  className={`calendar-day ${outside ? "outside" : ""} ${disabled ? "unavailable" : ""} ${selected ? "selected" : ""}`}
                  key={key}
                  onClick={() => setSelectedDate(date)}
                >
                  <span>{date.getDate()}</span>
                  {events.length > 0 && <i className="event-dots">{events.map((_, index) => <b key={index} />)}</i>}
                  {selected && events.length > 0 && (
                    <span className="day-popover">
                      <strong>{events.length} {events.length === 1 ? "ensaio" : "ensaios"}</strong>
                      {events.map((event) => <small key={`${event.name}-${event.time}`}><b>{event.time}</b><span>{event.name}<em>{event.type}</em></span></small>)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend"><span><i /> Ensaio agendado</span><span><i /> Dia indisponível</span></div>
        </section>

        <aside className="agenda-side">
          <section className="card config-card">
            <div className="config-title"><span><Icon name="settings" size={17} /></span><div><h2>Configure seu calendário</h2><p>Defina sua disponibilidade</p></div></div>
            <div className="config-section">
              <label>Dias de trabalho</label>
              <div className="weekday-toggles">
                {weekNames.map((day, index) => <button key={day} className={workDays[index] ? "active" : ""} onClick={() => setWorkDays((days) => days.map((value, dayIndex) => dayIndex === index ? !value : value))}>{day.slice(0, 1)}</button>)}
              </div>
              <button className={`specific-toggle ${specificOpen ? "active" : ""}`} onClick={() => setSpecificOpen((value) => !value)}><span>{specificOpen && <Icon name="check" size={12} />}</span> Não trabalhar em dias específicos</button>
              {specificOpen && (
                <div className="mini-calendar">
                  <p>{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</p>
                  <div>{miniDays.map((day) => {
                    const key = dateKey(new Date(cursor.getFullYear(), cursor.getMonth(), day));
                    return <button className={blockedDates.includes(key) ? "blocked" : ""} key={day} onClick={() => setBlockedDates((dates) => dates.includes(key) ? dates.filter((item) => item !== key) : [...dates, key])}>{day}</button>;
                  })}</div>
                </div>
              )}
            </div>
            <div className="config-section">
              <label>Horário de trabalho</label>
              <div className="hours-range">
                <label><span>Início</span><select value={startHour} onChange={(event) => setStartHour(event.target.value)}>{Array.from({ length: 24 }, (_, hour) => <option key={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label>
                <i />
                <label><span>Fim</span><select value={endHour} onChange={(event) => setEndHour(event.target.value)}>{Array.from({ length: 24 }, (_, hour) => <option key={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label>
              </div>
              <div className="hours-preview">{Array.from({ length: 24 }, (_, hour) => {
                const current = `${String(hour).padStart(2, "0")}:00`;
                const enabled = current >= startHour && current <= endHour;
                return <i className={enabled ? "enabled" : ""} key={hour} title={current} />;
              })}</div>
            </div>
            <button className="advanced-toggle" onClick={() => setAdvanced((value) => !value)}>Configurações específicas <Icon name="arrow" size={13} /></button>
            {advanced && <div className="advanced-days">{weekNames.map((day, index) => <div key={day}><span>{day}</span><strong>{workDays[index] ? `${startHour} — ${endHour}` : "Inativo"}</strong><button onClick={() => setWorkDays((days) => days.map((value, dayIndex) => dayIndex === index ? !value : value))}>Editar</button></div>)}</div>}
            <button className="save-config" onClick={() => onNotice("Configurações da agenda salvas")}><Icon name="check" size={15} /> Salvar configurações</button>
          </section>

          <section className="card selected-sessions">
            <div className="selected-title"><div><h2>{String(selectedDate.getDate()).padStart(2, "0")} de {monthNames[selectedDate.getMonth()].toLowerCase()}</h2><p>{selectedEvents.length} {selectedEvents.length === 1 ? "ensaio agendado" : "ensaios agendados"}</p></div><Icon name="calendar" size={17} /></div>
            <div className="selected-list">
              {selectedEvents.length === 0 && <div className="empty-sessions"><Icon name="camera" size={19} /><span>Nenhum ensaio neste dia</span></div>}
              {selectedEvents.map((event) => (
                <button key={`${event.name}-${event.time}`} onClick={() => onNotice(`Exibindo detalhes de ${event.name}`)}>
                  <i /><img src={event.photo} alt="" /><span><strong>{event.name}</strong><small><Icon name="clock" size={11} /> {event.time} · {event.type}</small></span><Icon name="arrow" size={14} />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SessionsView({ lightMode, onToggleTheme, onNotice, onNavigate }: { lightMode: boolean; onToggleTheme: () => void; onNotice: (message: string) => void; onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<{ date: string; time: string; name: string; type: string; photo: string; status: string } | null>(null);
  const [time, setTime] = useState("14:00");
  const [sessionType, setSessionType] = useState("Ensaio externo");
  const [paymentStatus, setPaymentStatus] = useState("Pendente");
  const unavailable = ["12:00", "15:00", "17:00"].includes(time);

  const saveSession = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailable) {
      onNotice("Escolha um horário disponível");
      return;
    }
    setOpen(false);
    onNotice("Ensaio salvo com sucesso");
  };

  return (
    <div className="sessions-view">
      <header className="sessions-page-header">
        <div>
          <h1>Seus ensaios</h1>
          <p>Visualize e organize todos os trabalhos do seu studio.</p>
        </div>
        <div className="sessions-header-actions">
          <button className="theme-toggle" onClick={onToggleTheme} aria-label={lightMode ? "Ativar modo escuro" : "Ativar modo claro"}>
            <Icon name={lightMode ? "moon" : "sun"} size={17} /><span>{lightMode ? "Escuro" : "Claro"}</span>
          </button>
          <button className="new-session" onClick={() => setOpen(true)}><Icon name="plus" size={15} /> Agendar ensaio</button>
        </div>
      </header>

      <section className="card sessions-overview">
        <div className="sessions-overview-title"><div><span><Icon name="camera" size={17} /></span><div><h2>Próximos ensaios</h2><p>3 ensaios agendados</p></div></div><button onClick={() => onNavigate("Minha agenda")}>Ver calendário <Icon name="arrow" size={13} /></button></div>
        <div className="session-overview-list">
          {[
            { date: "08 OUT", time: "14:00", name: "Ana Carolina Silva", type: "Ensaio gestante", photo: portraits[0], status: "Confirmado" },
            { date: "12 OUT", time: "10:30", name: "João Pedro Costa", type: "Ensaio família", photo: portraits[1], status: "Confirmado" },
            { date: "17 OUT", time: "16:00", name: "Maria Clara Souza", type: "Ensaio externo", photo: portraits[2], status: "Pendente" },
          ].map((session) => (
            <button className="session-overview-item" key={session.name} onClick={() => setSelectedSummary(session)}>
              <span className="overview-date"><strong>{session.date}</strong><small>{session.time}</small></span>
              <img src={session.photo} alt="" />
              <span className="overview-client"><strong>{session.name}</strong><small>{session.type}</small></span>
              <span className={`status ${session.status === "Pendente" ? "pending" : ""}`}>{session.status}</span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
        </div>
      </section>

      {selectedSummary && (
        <div className="session-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedSummary(null)}>
          <div className="session-summary-modal">
            <div className="modal-heading"><div><span><Icon name="camera" size={18} /></span><div><h2>Resumo do ensaio</h2><p>Informações principais do agendamento.</p></div></div><button onClick={() => setSelectedSummary(null)}>×</button></div>
            <div className="summary-client"><img src={selectedSummary.photo} alt="" /><div><strong>{selectedSummary.name}</strong><span>{selectedSummary.type}</span></div><span className={`status ${selectedSummary.status === "Pendente" ? "pending" : ""}`}>{selectedSummary.status}</span></div>
            <div className="summary-grid"><div><small>Data</small><strong>{selectedSummary.date}</strong></div><div><small>Horário</small><strong>{selectedSummary.time}</strong></div><div><small>Duração</small><strong>2 horas</strong></div><div><small>Local</small><strong>Parque do Ibirapuera</strong></div></div>
            <div className="summary-note"><strong>Observações</strong><p>Cliente prefere fotos ao pôr do sol e registros espontâneos.</p></div>
            <div className="modal-actions"><button onClick={() => setSelectedSummary(null)}>Fechar</button><button className="primary" onClick={() => onNotice("Abrindo edição do ensaio")}>Editar ensaio</button></div>
          </div>
        </div>
      )}

      {open && (
        <div className="session-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form className="session-modal" onSubmit={saveSession}>
            <div className="modal-heading">
              <div><span><Icon name="calendar" size={18} /></span><div><h2>Agendar ensaio</h2><p>Agende seus ensaios e organize seus horários.</p></div></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </div>

            <div className="form-card">
              <div className="form-card-title"><Icon name="sparkle" size={14} /><h3>Dados do ensaio</h3></div>
              <label className="form-field full"><span>Título do ensaio <b>*</b></span><input required placeholder="Ex.: Casamento — Ana e Lucas" /></label>
              <div className="form-row two">
                <label className="form-field"><span>Cliente <b>*</b></span><input required placeholder="Nome do cliente" /></label>
                <label className="form-field"><span>Tipo do ensaio <b>*</b></span>
                  <select value={sessionType} onChange={(event) => setSessionType(event.target.value)}>
                    {["Ensaio externo", "Casamento", "Ensaio família", "Ensaio gestante", "Newborn", "Pré-wedding", "Ensaio corporativo", "Ensaio individual", "Aniversário", "Formatura", "Produto e publicidade"].map((type) => <option key={type}>{type}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-title"><Icon name="calendar" size={14} /><h3>Data e horário</h3></div>
              <div className="form-row three">
                <label className="form-field"><span>Data <b>*</b></span><input required type="date" defaultValue="2026-10-08" /></label>
                <label className="form-field"><span>Horário <b>*</b></span><input required type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
                <label className="form-field"><span>Tempo estimado de duração</span>
                  <select defaultValue="2 horas">{["30 minutos", "1 hora", "2 horas", "3 horas", "4 horas", "6 horas", "Dia inteiro"].map((duration) => <option key={duration}>{duration}</option>)}</select>
                </label>
              </div>
              <div className={`availability ${unavailable ? "busy" : ""}`}><Icon name={unavailable ? "clock" : "check"} size={13} />{unavailable ? "Horário indisponível — selecione outro horário" : "Horário disponível"}</div>
            </div>

            <div className="form-row location-finance">
              <div className="form-card">
                <div className="form-card-title"><Icon name="home" size={14} /><h3>Local</h3></div>
                <label className="form-field"><span>Local do ensaio <b>*</b></span><input required placeholder="Ex.: Parque do Ibirapuera — São Paulo" /></label>
              </div>
              <div className="form-card">
                <div className="form-card-title"><Icon name="dollar" size={14} /><h3>Financeiro</h3></div>
                <div className="form-row two">
                  <label className="form-field"><span>Valor total</span><input inputMode="decimal" placeholder="R$ 0,00" /></label>
                  <label className="form-field"><span>Status do pagamento</span>
                    <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}>{["Pendente", "Parcialmente pago", "Pago", "Isento"].map((status) => <option key={status}>{status}</option>)}</select>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-title"><Icon name="file" size={14} /><h3>Observações</h3></div>
              <label className="form-field"><span>Informações adicionais</span><textarea maxLength={500} placeholder="Adicione preferências do cliente, referências ou informações importantes..." /></label>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setOpen(false)}>Cancelar</button>
              <button type="submit"><Icon name="check" size={14} /> Salvar ensaio</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function App() {
  const [expanded, setExpanded] = useState(false);
  const [activeNav, setActiveNav] = useState("Início");
  const planNav = usePlanState().navRequest;
  useEffect(() => { if (planNav) setActiveNav(planNav.page); }, [planNav]);
  const [notice, setNotice] = useState("");
  const [lightMode, setLightMode] = useState(false);

  const quickAction = (label: string) => {
    setNotice(`${label}: pronto para começar`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <div className={`app-shell ${lightMode ? "light-mode" : ""} ${activeNav === "Clientes" ? "theme-purple" : ""}`}>
      <aside className={`sidebar ${expanded ? "expanded" : ""}`}>
        <button className="menu-toggle" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Recolher menu" : "Expandir menu"} aria-expanded={expanded}>
          <Icon name="menu" size={21} />
          <span className="brand-mark">M</span>
          <span className="brand-name">Moment</span>
        </button>
        <nav aria-label="Navegação principal">
          {nav.map((item, index) => (
            <button
              key={item.label}
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              onClick={() => setActiveNav(item.label)}
              style={{ "--delay": `${index * 55}ms` } as React.CSSProperties}
              title={!expanded ? item.label : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">MS</div>
          <div className="profile-copy"><strong>Matheus</strong><span>Fotógrafo</span></div>
        </div>
      </aside>

      <main className="dashboard">
        {activeNav === "Configurações" ? (
          <SettingsView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} />
        ) : activeNav === "Chat" ? (
          <ChatView onNavigate={setActiveNav} />
        ) : activeNav === "Portfólio" ? (
          <PortfolioView />
        ) : activeNav === "Feed" ? (
          <FeedView onNavigate={setActiveNav} chatAvailable={nav.some((item) => item.label === "Chat")} />
        ) : activeNav === "Galeria" ? (
          <GalleryView />
        ) : activeNav === "Clientes" ? (
          <ClientsView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} onNotice={quickAction} />
        ) : activeNav === "Minha agenda" ? (
          <AgendaView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} onNotice={quickAction} />
        ) : activeNav === "Ensaios" ? (
          <SessionsView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} onNotice={quickAction} onNavigate={setActiveNav} />
        ) : activeNav === "Contratos" ? (
          <ContractsView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} onNotice={quickAction} />
        ) : activeNav === "Pagamentos" ? (
          <PaymentsView lightMode={lightMode} onToggleTheme={() => setLightMode((value) => !value)} onNotice={quickAction} />
        ) : (
        <>
        <header className="topbar">
          <div className="greeting">
            <span className="sun-icon"><Icon name="sparkle" size={24} /></span>
            <div><h1>Bom dia, Matheus!</h1><p>Aqui está o resumo do seu studio.</p></div>
          </div>
          <div className="topbar-actions">
            <div className="date-block"><Icon name="calendar" size={15} /><span>8 de outubro de 2025<small>Quarta-feira</small></span></div>
            <button className="theme-toggle" onClick={() => setLightMode((value) => !value)} aria-label={lightMode ? "Ativar modo escuro" : "Ativar modo claro"} title={lightMode ? "Modo escuro" : "Modo claro"}>
              <Icon name={lightMode ? "moon" : "sun"} size={17} />
              <span>{lightMode ? "Escuro" : "Claro"}</span>
            </button>
            <button className="circle-button" aria-label="Notificações"><Icon name="bell" size={17} /><i /></button>
            <div className="avatar">MS</div>
          </div>
        </header>

        <div className="content-layout">
          <div className="primary-column">
            <section className="metrics-grid" aria-label="Resumo do studio">
              <MetricCard icon="users" title="Clientes ativos" value="24" delta="+ 4 este mês" />
              <MetricCard icon="camera" title="Ensaios este mês" value="18" delta="+ 12% este mês" />
              <MetricCard icon="dollar" title="Receita este mês" value="R$ 8.420" delta="+ 8% em relação ao mês anterior" />
              <MetricCard icon="clock" title="A receber" value="R$ 1.200" delta="3 pagamentos pendentes" tone="pink" shape="down" />
            </section>
            <div className="sessions-row">
              <section className="card sessions-card">
                <SectionTitle icon="calendar" action="Ver todos">Próximos ensaios</SectionTitle>
                <div className="sessions-list">
                  {sessions.map((session) => (
                    <button className="session-item" key={`${session.day}-${session.name}`} onClick={() => quickAction(`Detalhes de ${session.name}`)}>
                      <span className="session-date"><strong>{session.day}</strong><small>{session.time}</small></span>
                      <img src={session.photo} alt="" />
                      <span className="client-name"><strong>{session.name}</strong><small>{session.type}</small></span>
                      <span className={`status ${session.status === "Pendente" ? "pending" : ""}`}>{session.status}</span>
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              </section>

              <aside className="quote-card">
                <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=86" alt="Câmera fotográfica profissional" />
                <div className="quote-overlay" />
                <div className="quote-copy">
                  <span className="eyebrow">Inspire-se</span>
                  <blockquote>Grandes histórias são feitas de grandes momentos.</blockquote>
                  <i />
                  <p>Organize seu trabalho,<br />valorize seu tempo.</p>
                </div>
              </aside>
            </div>

            <section className="card finance-card">
              <SectionTitle icon="chart">Financeiro</SectionTitle>
              <div className="finance-content">
                <div className="revenue-panel">
                  <div className="finance-summary">
                    <div><strong>R$ 8.420</strong><span>Recebido este mês</span><small className="positive">↑ 5% ao mês anterior</small></div>
                    <div><strong>R$ 1.200</strong><span>Pendente</span><small className="warning">3 pendentes</small></div>
                  </div>
                  <div className="bar-chart" aria-label="Gráfico de ganhos mensais">
                    {[38, 52, 46, 61, 43, 73, 68, 58, 80, 96, 72, 87].map((height, index) => (
                      <div className="bar-column" key={index}><i style={{ height: `${height}%` }} /><span>{["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][index]}</span></div>
                    ))}
                  </div>
                </div>
                <div className="distribution-panel">
                  <p>Distribuição de receitas</p>
                  <div className="donut-wrap">
                    <div className="donut"><div><strong>R$ 8.420</strong><span>total</span></div></div>
                    <ul>
                      <li><i className="legend-a" /><span>Casamento</span><strong>45%</strong></li>
                      <li><i className="legend-b" /><span>Ensaio externo</span><strong>25%</strong></li>
                      <li><i className="legend-c" /><span>Família</span><strong>18%</strong></li>
                      <li><i className="legend-d" /><span>Outros</span><strong>12%</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="right-column">
            <section className="card quick-card">
              <SectionTitle icon="sparkle">Ações rápidas</SectionTitle>
              <div className="quick-list">
                {[["users", "Novo cliente"], ["camera", "Novo ensaio"], ["file", "Novo contrato"], ["payment", "Registrar pagamento"]].map(([icon, label]) => (
                  <button key={label} onClick={() => quickAction(label)}><span><Icon name={icon as IconName} size={16} /></span>{label}<Icon name="plus" size={15} /></button>
                ))}
              </div>
            </section>

            <section className="card activity-card">
              <SectionTitle icon="clock" action="Ver todas">Atividade recente</SectionTitle>
              <div className="activity-list">
                {[
                  ["users", "Novo cliente cadastrado", "Ana Carolina Silva", "08:24"],
                  ["calendar", "Ensaio agendado", "João Pedro Costa · Ensaio família", "09:15"],
                  ["dollar", "Pagamento recebido", "R$ 800,00 · Maria Clara Souza", "Ontem"],
                  ["file", "Contrato enviado", "Carlos Eduardo Lima", "Ontem"],
                ].map(([icon, title, detail, time], index) => (
                  <div className="activity-item" key={title}>
                    <span className={`activity-icon tone-${index}`}><Icon name={icon as IconName} size={15} /></span>
                    <span><strong>{title}</strong><small>{detail}</small></span>
                    <time>{time}</time>
                  </div>
                ))}
              </div>
            </section>

            <section className="promo-card">
              <img src="https://images.unsplash.com/photo-1587090564077-c7b8f2f1249e?auto=format&fit=crop&w=900&q=82" alt="Câmera em um estúdio de fotografia" />
              <div className="promo-overlay" />
              <div><span className="promo-icon"><Icon name="camera" size={17} /></span><strong>Seu studio, mais organizado.</strong><p>Sem burocracia. Mais tempo para o que realmente importa.</p></div>
            </section>
          </aside>
        </div>
        </>
        )}
      </main>
      {notice && <div className="toast"><Icon name="check" size={17} />{notice}</div>}
      <PlanLimitHost />
    </div>
  );
}

export default App;
