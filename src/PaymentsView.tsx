import { useMemo, useState, type FormEvent, type ReactNode } from "react";

type PaymentStatus = "Pago" | "Pendente" | "Atrasado";

type Payment = {
  id: number;
  name: string;
  email: string;
  session: string;
  total: number;
  paid: number;
  type: "Sinal" | "Parcela" | "Integral" | "Restante";
  status: PaymentStatus;
  photo: string;
  due?: string;
  overdue?: string;
  history: Array<{ date: string; type: string; value: number; method: string }>;
};

const photos = [
  "https://images.unsplash.com/photo-1708737749033-aa9b7bd00507?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1723189038268-3ef8fd518ad9?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1757348665310-0b68ed0ebc30?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1760552069633-c05f246a5d8c?auto=format&fit=crop&w=100&q=80",
];

const initialPayments: Payment[] = [
  { id: 1, name: "Ana Carolina Silva", email: "ana@email.com", session: "Casamento - Ana e Lucas", total: 5000, paid: 2000, type: "Sinal", status: "Pendente", photo: photos[0], due: "15/10/2026", history: [{ date: "05/10/2026", type: "Sinal", value: 2000, method: "PIX" }] },
  { id: 2, name: "João Pedro Costa", email: "joao@email.com", session: "Ensaio Família", total: 1200, paid: 1200, type: "Integral", status: "Pago", photo: photos[1], history: [{ date: "02/10/2026", type: "Integral", value: 1200, method: "Cartão" }] },
  { id: 3, name: "Maria Clara Souza", email: "maria@email.com", session: "Ensaio Externo", total: 900, paid: 450, type: "Sinal", status: "Pendente", photo: photos[2], due: "22/10/2026", history: [{ date: "30/09/2026", type: "Sinal", value: 450, method: "Dinheiro" }] },
  { id: 4, name: "Carlos Eduardo Lima", email: "carlos@email.com", session: "Casamento - Carla e Eduardo", total: 4800, paid: 4800, type: "Integral", status: "Pago", photo: photos[3], history: [{ date: "25/09/2026", type: "Integral", value: 4800, method: "Transferência" }] },
  { id: 5, name: "Beatriz Martins", email: "beatriz@email.com", session: "Formatura - Turma 2026", total: 6600, paid: 2750, type: "Parcela", status: "Atrasado", photo: photos[0], due: "05/10/2026", overdue: "Vencido em 3 dias", history: [{ date: "05/09/2026", type: "Sinal", value: 2750, method: "PIX" }] },
];

function PIcon({ name, size = 16 }: { name: string; size?: number }) {
  const icons: Record<string, ReactNode> = {
    money: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M7 9H6v1M17 15h1v-1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <path d="M4 19V9M10 19V5M16 19v-8M22 19V3" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" /><path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    empty: <><path d="M4 7h16v12H4zM7 7V4h10v3" /><path d="M8 13h8" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PaymentsView({ lightMode, onToggleTheme, onNotice }: { lightMode: boolean; onToggleTheme: () => void; onNotice: (message: string) => void }) {
  const [payments, setPayments] = useState(initialPayments);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [type, setType] = useState("Todos");
  const [period, setPeriod] = useState("Este mês");
  const [expanded, setExpanded] = useState<number | null>(1);
  const [modalPayment, setModalPayment] = useState<Payment | null>(null);
  const [amount, setAmount] = useState("");
  const [newType, setNewType] = useState("Restante");
  const [method, setMethod] = useState("PIX");
  const [date, setDate] = useState("2026-10-08");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => payments.reduce((result, payment) => ({ total: result.total + payment.total, paid: result.paid + payment.paid }), { total: 0, paid: 0 }), [payments]);
  const filtered = useMemo(() => payments.filter((payment) => {
    const term = search.toLowerCase();
    return (!term || `${payment.name} ${payment.session}`.toLowerCase().includes(term))
      && (status === "Todos" || payment.status === status)
      && (type === "Todos" || payment.type === type);
  }), [payments, search, status, type]);

  const clearFilters = () => {
    setSearch("");
    setStatus("Todos");
    setType("Todos");
    setPeriod("Este mês");
  };

  const addPayment = (event: FormEvent) => {
    event.preventDefault();
    if (!modalPayment) return;
    const numericAmount = Number(amount.replace(",", "."));
    if (!numericAmount || numericAmount <= 0 || numericAmount > modalPayment.total - modalPayment.paid) return;
    setLoading(true);
    window.setTimeout(() => {
      setPayments((items) => items.map((item) => {
        if (item.id !== modalPayment.id) return item;
        const nextPaid = Math.min(item.total, item.paid + numericAmount);
        return {
          ...item,
          paid: nextPaid,
          status: nextPaid >= item.total ? "Pago" : "Pendente",
          type: newType as Payment["type"],
          overdue: undefined,
          history: [...item.history, { date: date.split("-").reverse().join("/"), type: newType, value: numericAmount, method }],
        };
      }));
      setLoading(false);
      setModalPayment(null);
      setAmount("");
      setNotes("");
      onNotice("Pagamento registrado com sucesso");
    }, 550);
  };

  return (
    <div className="payments-view">
      <header className="payments-header">
        <div><span><PIcon name="wallet" size={22} /></span><div><h1>Pagamentos</h1><p>Controle seus recebimentos e acompanhe o que ainda falta receber.</p></div></div>
        <button className="payments-theme" onClick={onToggleTheme}>{lightMode ? "Modo escuro" : "Modo claro"}</button>
      </header>

      <section className="payment-metrics">
        <PaymentMetric icon="money" title="Total contratado" value={currency(totals.total)} text="Valor total dos contratos ativos" tone="purple" />
        <PaymentMetric icon="check" title="Total recebido" value={currency(totals.paid)} text="Valor já recebido" tone="green" />
        <PaymentMetric icon="clock" title="A receber" value={currency(totals.total - totals.paid)} text="Valor ainda pendente" tone="yellow" />
        <PaymentMetric icon="chart" title="Recebido este mês" value="R$ 5.000,00" text="Outubro de 2026" tone="purple" />
      </section>

      <section className="payment-filters">
        <label><PIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente ou ensaio..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option>Pago</option><option>Pendente</option><option>Atrasado</option></select>
        <select value={type} onChange={(event) => setType(event.target.value)}><option>Todos</option><option>Sinal</option><option>Parcela</option><option>Integral</option><option>Restante</option></select>
        <select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Este mês</option><option>Últimos 30 dias</option><option>Este ano</option><option>Personalizado</option></select>
        <button title="Aplicar filtros"><PIcon name="filter" /></button>
        {(search || status !== "Todos" || type !== "Todos" || period !== "Este mês") && <button className="payment-clear" onClick={clearFilters}>Limpar filtros</button>}
      </section>

      <section className="card payment-table-card">
        <div className="payment-table-title"><div><h2>Acompanhamento financeiro</h2><p>Veja quanto cada cliente já pagou e quanto ainda falta.</p></div><span>{filtered.length} pagamentos</span></div>
        {filtered.length > 0 ? (
          <>
            <div className="payment-table-scroll">
              <table className="payment-table">
                <thead><tr><th>Cliente</th><th>Ensaio</th><th>Valor total</th><th>Pago</th><th>Restante</th><th>Tipo</th><th>Status</th><th>Progresso</th></tr></thead>
                <tbody>
                  {filtered.map((payment) => {
                    const percentage = Math.round((payment.paid / payment.total) * 100);
                    const isOpen = expanded === payment.id;
                    return [
                      <tr className={`payment-row ${isOpen ? "expanded" : ""}`} key={`row-${payment.id}`} onClick={() => setExpanded(isOpen ? null : payment.id)}>
                        <td><div className="payment-client"><img src={payment.photo} alt="" /><span><strong>{payment.name}</strong><small>{payment.email}</small></span></div></td>
                        <td><strong>{payment.session}</strong></td>
                        <td><strong className="money-value">{currency(payment.total)}</strong></td>
                        <td><strong className="paid-value">{currency(payment.paid)}</strong></td>
                        <td><strong className={payment.status === "Atrasado" ? "overdue-value" : ""}>{currency(payment.total - payment.paid)}</strong>{payment.overdue && <small className="overdue-copy">{payment.overdue}</small>}</td>
                        <td><span className="payment-type">{payment.type}</span></td>
                        <td><span className={`payment-status ${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                        <td><div className="progress-cell"><div className="mini-donut" style={{ "--progress": `${percentage * 3.6}deg` } as React.CSSProperties}><span>{percentage}%</span></div><small>{currency(payment.paid)} / {currency(payment.total)}</small><PIcon name="chevron" size={13} /></div></td>
                      </tr>,
                      isOpen && <tr className="payment-detail-row" key={`detail-${payment.id}`}><td colSpan={8}><PaymentDetails payment={payment} onAdd={() => { setModalPayment(payment); setNewType(payment.paid === 0 ? "Sinal" : "Restante"); }} /></td></tr>,
                    ];
                  })}
                </tbody>
              </table>
            </div>
            <footer className="payment-pagination"><span>Mostrando 1–10 de 24 pagamentos</span><div><button>←</button><button className="active">1</button><button>2</button><button>3</button><button>→</button></div></footer>
          </>
        ) : (
          <div className="payments-empty"><span><PIcon name="empty" size={25} /></span><h3>Nenhum pagamento encontrado</h3><p>Quando seus ensaios começarem a gerar pagamentos, eles aparecerão aqui.</p></div>
        )}
      </section>

      {modalPayment && (
        <div className="payment-modal-layer" onMouseDown={(event) => event.target === event.currentTarget && setModalPayment(null)}>
          <form className="payment-modal" onSubmit={addPayment}>
            <div className="payment-modal-head"><div><span><PIcon name="plus" /></span><div><h2>Adicionar pagamento</h2><p>Registre um novo recebimento.</p></div></div><button type="button" onClick={() => setModalPayment(null)}><PIcon name="x" /></button></div>
            <div className="payment-auto-data"><div><small>Cliente</small><strong>{modalPayment.name}</strong></div><div><small>Ensaio</small><strong>{modalPayment.session}</strong></div><div><small>Valor restante</small><strong>{currency(modalPayment.total - modalPayment.paid)}</strong></div></div>
            <div className="payment-form-grid">
              <label><span>Valor pago <b>*</b></span><div className="currency-input"><i>R$</i><input required min="0.01" max={modalPayment.total - modalPayment.paid} step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" /></div></label>
              <label><span>Tipo</span><select value={newType} onChange={(event) => setNewType(event.target.value)}><option>Sinal</option><option>Parcela</option><option>Restante</option><option>Integral</option></select></label>
              <label><span>Método</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option><option>Outro</option></select></label>
              <label><span>Data do pagamento</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            </div>
            <label className="payment-note"><span>Observações</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pagamento referente à segunda parcela." /></label>
            <div className="payment-modal-actions"><button type="button" onClick={() => setModalPayment(null)}>Cancelar</button><button type="submit" disabled={loading || !amount}>{loading ? <i /> : <PIcon name="check" />}{loading ? "Registrando..." : "Confirmar pagamento"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function PaymentMetric({ icon, title, value, text, tone }: { icon: string; title: string; value: string; text: string; tone: string }) {
  return <article className="payment-metric"><span className={tone}><PIcon name={icon} /></span><div><small>{title}</small><strong>{value}</strong><p>{text}</p></div></article>;
}

function PaymentDetails({ payment, onAdd }: { payment: Payment; onAdd: () => void }) {
  const percentage = Math.round((payment.paid / payment.total) * 100);
  return (
    <div className="payment-details">
      <div className="payment-detail-summary"><h3>Resumo</h3><div>{[["Valor do contrato", currency(payment.total)], ["Valor pago", currency(payment.paid)], ["Valor restante", currency(payment.total - payment.paid)], ["Progresso", `${percentage}%`]].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div></div>
      <div className="payment-history"><h3>Histórico de pagamentos</h3>{payment.history.map((item, index) => <div key={`${item.date}-${index}`}><span><PIcon name="check" size={12} /></span><div><strong>{item.type}</strong><small>{item.date} · {item.method}</small></div><b>{currency(item.value)}</b><em>Pago</em></div>)}</div>
      {payment.paid < payment.total && <div className="next-payment"><h3>Próximo pagamento</h3><div><span><small>{payment.type === "Sinal" ? "Restante" : "Parcela"}</small><strong>{currency(payment.total - payment.paid)}</strong></span><span><small>Vencimento</small><strong>{payment.due || "A definir"}</strong></span><span><small>Status</small><strong className={payment.status === "Atrasado" ? "late" : ""}>{payment.status}</strong></span></div><button onClick={onAdd}><PIcon name="plus" /> Adicionar pagamento</button></div>}
    </div>
  );
}
