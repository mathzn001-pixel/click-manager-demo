import { useMemo, useState, type FormEvent, type ReactNode } from "react";

type ContractStatus = "Assinado" | "Pendente" | "Expirado" | "Cancelado";
type ViewMode = "list" | "builder" | "review" | "detail" | "public" | "signed";

const clients = [
  "https://images.unsplash.com/photo-1708737749033-aa9b7bd00507?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1723189038268-3ef8fd518ad9?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1757348665310-0b68ed0ebc30?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1760552069633-c05f246a5d8c?auto=format&fit=crop&w=100&q=80",
];

const initialContracts = [
  { id: "#0008", date: "19/10/2026", name: "Ana Carolina Silva", email: "ana@email.com", session: "Casamento - Ana e Lucas", type: "Casamento", value: "R$ 3.500,00", status: "Assinado" as ContractStatus, sent: "05/10/2026 17:42", photo: clients[0] },
  { id: "#0007", date: "15/10/2026", name: "João Pedro Costa", email: "joao@email.com", session: "Ensaio família", type: "Ensaio", value: "R$ 1.200,00", status: "Pendente" as ContractStatus, sent: "02/10/2026 14:20", photo: clients[1] },
  { id: "#0006", date: "12/10/2026", name: "Maria Clara Souza", email: "maria@email.com", session: "Ensaio externo", type: "Ensaio", value: "R$ 900,00", status: "Assinado" as ContractStatus, sent: "30/09/2026 11:03", photo: clients[2] },
  { id: "#0005", date: "08/10/2026", name: "Carlos Eduardo Lima", email: "carlos@email.com", session: "Casamento - Carla e Eduardo", type: "Casamento", value: "R$ 4.800,00", status: "Expirado" as ContractStatus, sent: "25/09/2026 09:17", photo: clients[3] },
];

function CIcon({ name, size = 16 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <><path d="m4 16-1 5 5-1L19 9l-4-4zM13 7l4 4" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    arrow: <path d="M19 12H5M11 6l-6 6 6 6" />,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return <label className="contract-field"><span>{label}{required && <b> *</b>}</span>{children}</label>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" className={`contract-toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}><i /><span>{value ? "Sim" : "Não"}</span></button>;
}

function Accordion({ index, title, summary, open, onClick, children }: { index: number; title: string; summary: string; open: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <section className={`terms-accordion ${open ? "open" : ""}`}>
      <button type="button" className="accordion-head" onClick={onClick}>
        <span>{index}</span><div><strong>{title}</strong><small>{summary}</small></div><CIcon name="chevron" size={14} />
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </section>
  );
}

function ContractDocument() {
  return (
    <article className="contract-document">
      <header><div><span><CIcon name="file" size={18} /></span><strong>Click Manager</strong><small>Fotografia & Produções</small></div><b>CONTRATO DE PRESTAÇÃO<br />DE SERVIÇOS FOTOGRÁFICOS</b></header>
      <h4>1. PARTES</h4><p><b>Contratante:</b> Ana Carolina Silva, CPF 123.456.789-00.<br /><b>Contratado:</b> Matheus Fotografia, CNPJ 12.345.678/0001-00.</p>
      <h4>2. OBJETO DO CONTRATO</h4><p>Prestação de serviços fotográficos para o casamento de Ana e Lucas, incluindo cobertura da cerimônia e recepção.</p>
      <h4>3. VALOR E FORMA DE PAGAMENTO</h4><p>Valor total de R$ 3.500,00, pago via PIX em duas parcelas conforme condições acordadas.</p>
      <h4>4. PRAZO E ENTREGA</h4><p>As fotografias serão entregues em até 30 dias por galeria online, em formato JPG de alta resolução.</p>
      <h4>5. CANCELAMENTO E REMARCAÇÃO</h4><p>Cancelamentos deverão ser comunicados com antecedência mínima de 7 dias. A remarcação está sujeita à disponibilidade.</p>
      <h4>6. USO DAS IMAGENS</h4><p>O cliente autoriza o uso das imagens em site, Instagram e portfólio profissional do contratado.</p>
      <h4>7. RESPONSABILIDADES</h4><p>As partes comprometem-se a fornecer condições adequadas para a execução dos serviços aqui descritos.</p>
      <h4>8. FORÇA MAIOR</h4><p>As partes não serão responsabilizadas por eventos imprevisíveis ou inevitáveis que impeçam a execução dos serviços.</p>
      <h4>9. FORO</h4><p>Fica eleito o foro da comarca de Sorocaba, SP, para dirimir quaisquer questões deste contrato.</p>
      <footer><div><i />Ana Carolina Silva<small>Contratante</small></div><div><i />Matheus Fotografia<small>Contratado</small></div></footer>
    </article>
  );
}

export default function ContractsView({ lightMode, onToggleTheme, onNotice }: { lightMode: boolean; onToggleTheme: () => void; onNotice: (message: string) => void }) {
  const [contracts, setContracts] = useState(initialContracts);
  const [mode, setMode] = useState<ViewMode>("list");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [moreId, setMoreId] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [builderStep, setBuilderStep] = useState(1);
  const [openTerm, setOpenTerm] = useState(0);
  const [paymentCondition, setPaymentCondition] = useState("Entrada + restante");
  const [standardCancel, setStandardCancel] = useState(true);
  const [hasFine, setHasFine] = useState(true);
  const [reschedule, setReschedule] = useState(true);
  const [imageUse, setImageUse] = useState(true);
  const [commercialUse, setCommercialUse] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("Resumo");
  const [signed, setSigned] = useState(false);

  const filtered = useMemo(() => contracts.filter((contract) => {
    const term = search.toLowerCase();
    return (!term || `${contract.id} ${contract.name} ${contract.session}`.toLowerCase().includes(term))
      && (statusFilter === "Todos" || contract.status === statusFilter)
      && (typeFilter === "Todos" || contract.type === typeFilter);
  }), [contracts, search, statusFilter, typeFilter]);

  const runLoading = (next: () => void) => {
    setLoading(true);
    window.setTimeout(() => { setLoading(false); next(); }, 550);
  };

  const startBuilder = () => {
    if (!selectedSession) return;
    setNewOpen(false);
    setMode("builder");
    setBuilderStep(1);
  };

  const cancelContract = () => {
    if (!cancelReason.trim()) return;
    setContracts((items) => items.map((item) => item.id === cancelId ? { ...item, status: "Cancelado" as ContractStatus } : item));
    setCancelId("");
    setCancelReason("");
    onNotice("Contrato cancelado");
  };

  if (mode === "public" || mode === "signed") {
    return (
      <div className="public-contract">
        <header><div><CIcon name="file" size={21} /><strong>Click Manager</strong></div><span>Ambiente seguro de assinatura</span></header>
        {mode === "signed" ? (
          <section className="signature-success"><span><CIcon name="check" size={28} /></span><h1>Contrato assinado com sucesso</h1><p>Uma cópia assinada foi enviada para o seu e-mail.</p><div><small>Cliente</small><strong>Ana Carolina Silva</strong><small>Assinado em</small><strong>05/10/2026 às 18:15</strong><small>Número do contrato</small><strong>#0008</strong></div><button><CIcon name="download" /> Baixar contrato assinado</button></section>
        ) : (
          <main className="public-contract-content">
            <div className="public-title"><span>Contrato #0008</span><h1>Contrato de Prestação de Serviços Fotográficos</h1><p>Revise todos os termos antes de assinar.</p></div>
            <div className="public-data">{[["Fotógrafo", "Matheus Fotografia"], ["Cliente", "Ana Carolina Silva"], ["Ensaio", "Casamento - Ana e Lucas"], ["Data", "19/10/2026"], ["Local", "Parque do Ibirapuera"], ["Valor", "R$ 3.500,00"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
            <ContractDocument />
            <form className="signature-form" onSubmit={(event) => { event.preventDefault(); setSigned(true); setMode("signed"); setContracts((items) => items.map((item) => item.id === "#0008" ? { ...item, status: "Assinado" as ContractStatus } : item)); }}>
              <label className="signature-agree"><input required type="checkbox" /> <span>Li e concordo com todos os termos deste contrato.</span></label>
              <div><Field label="Nome completo" required><input required defaultValue="Ana Carolina Silva" /></Field><Field label="CPF" required><input required placeholder="000.000.000-00" /></Field></div>
              <button type="submit">Assinar contrato</button>
            </form>
          </main>
        )}
        <button className="exit-public" onClick={() => setMode("list")}>Voltar ao painel</button>
      </div>
    );
  }

  if (mode === "detail") {
    return (
      <div className="contract-detail">
        <button className="back-link" onClick={() => setMode("list")}><CIcon name="arrow" /> Voltar para contratos</button>
        <header><div><span>Contrato #0008</span><h1>Casamento - Ana e Lucas</h1><p>Ana Carolina Silva · 19/10/2026</p></div><span className="contract-status signed">Assinado</span></header>
        <div className="detail-summary">{[["Cliente", "Ana Carolina Silva"], ["Ensaio", "Casamento - Ana e Lucas"], ["Valor", "R$ 3.500,00"], ["Data", "19/10/2026"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
        <nav className="detail-tabs">{["Resumo", "Documento", "Assinatura", "Histórico"].map((tab) => <button className={detailTab === tab ? "active" : ""} onClick={() => setDetailTab(tab)} key={tab}>{tab}</button>)}</nav>
        <section className="card detail-panel">
          {detailTab === "Resumo" && <div className="detail-overview"><h2>Resumo do contrato</h2><p>Contrato de prestação de serviços fotográficos para cobertura de casamento, com entrega em galeria online no prazo de 30 dias.</p><div className="legal-lock"><CIcon name="check" /><span>Documento assinado e protegido. As cláusulas não podem mais ser editadas.</span></div></div>}
          {detailTab === "Documento" && <div className="document-detail"><ContractDocument /></div>}
          {detailTab === "Assinatura" && <div className="signature-info">{[["Quem assinou", "Ana Carolina Silva"], ["Data", "05/10/2026"], ["Horário", "18:15"], ["Status", "Assinatura validada"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>}
          {detailTab === "Histórico" && <Timeline />}
        </section>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="contract-builder">
        <BuilderHeader step={3} onBack={() => { setMode("builder"); setBuilderStep(2); }} />
        <div className="review-layout">
          <div className="pdf-preview"><div className="pdf-toolbar"><span>Prévia do contrato</span><button><CIcon name="download" /> PDF</button></div><ContractDocument /></div>
          <aside className="card review-summary"><h2>Resumo do contrato</h2>{[["Cliente", "Ana Carolina Silva"], ["Ensaio", "Casamento - Ana e Lucas"], ["Data", "19/10/2026"], ["Valor", "R$ 3.500,00"], ["Pagamento", "Entrada + restante"], ["Prazo de entrega", "30 dias"], ["Uso de imagem", "Autorizado"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}<span className="ready-status"><CIcon name="check" /> Pronto para envio</span><button className="review-button secondary" onClick={() => { setMode("builder"); setBuilderStep(2); }}>Voltar e editar</button><button className="review-button secondary"><CIcon name="download" /> Baixar PDF</button><button className="review-button secondary" onClick={() => onNotice("Contrato salvo")}>Salvar contrato</button><button className="review-button primary" onClick={() => setSendOpen(true)}><CIcon name="mail" /> Salvar e enviar</button></aside>
        </div>
        {sendOpen && <SendModal onClose={() => { setSendOpen(false); setMode("list"); }} onPublic={() => { setSendOpen(false); setMode("public"); }} onNotice={onNotice} />}
      </div>
    );
  }

  if (mode === "builder") {
    return (
      <div className="contract-builder">
        <BuilderHeader step={builderStep} onBack={() => builderStep === 1 ? setMode("list") : setBuilderStep(1)} />
        {builderStep === 1 ? (
          <div className="builder-narrow">
            <section className="card builder-data-card">
              <h2>Dados do contrato</h2><p>As informações abaixo foram preenchidas a partir do ensaio.</p>
              <div className="autofill-grid">{[["Cliente", "Ana Carolina Silva"], ["Ensaio", "Casamento - Ana e Lucas"], ["Data", "19/10/2026"], ["Horário", "14:00"], ["Local", "Parque do Ibirapuera"], ["Valor", "R$ 3.500,00"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
              <Field label="Título do contrato" required><input className="contract-input filled" defaultValue="Contrato de Prestação de Serviços Fotográficos" /></Field>
              <div className="builder-actions"><button onClick={() => setMode("list")}>Cancelar</button><button className="primary" onClick={() => runLoading(() => setBuilderStep(2))}>{loading ? <i className="loader" /> : "Continuar"}<CIcon name="chevron" /></button></div>
            </section>
          </div>
        ) : (
          <div className="terms-layout">
            <div className="terms-column">
              <Accordion index={1} title="Condições do serviço" summary="Tipo, descrição, data, horário e local" open={openTerm === 0} onClick={() => setOpenTerm(openTerm === 0 ? -1 : 0)}>
                <div className="contract-form-grid"><Field label="Tipo de serviço"><select defaultValue="Casamento"><option>Casamento</option><option>Ensaio</option><option>Aniversário</option><option>Formatura</option><option>Evento</option><option>Corporativo</option><option>Outro</option></select></Field><Field label="Data do serviço"><input type="date" defaultValue="2026-10-19" /></Field><Field label="Descrição do serviço"><textarea defaultValue="Cobertura fotográfica do casamento, incluindo cerimônia e recepção." /></Field><div className="contract-form-grid compact"><Field label="Horário de início"><input type="time" defaultValue="14:00" /></Field><Field label="Duração"><input defaultValue="6 horas" /></Field></div><Field label="Local"><input defaultValue="Parque do Ibirapuera - São Paulo" /></Field></div>
              </Accordion>
              <Accordion index={2} title="Entrega das fotografias" summary="30 dias · Galeria online · 500 fotos" open={openTerm === 1} onClick={() => setOpenTerm(openTerm === 1 ? -1 : 1)}>
                <div className="contract-form-grid compact"><Field label="Prazo de entrega"><input type="number" defaultValue="30" /></Field><Field label="Forma de entrega"><select><option>Galeria online</option><option>Pen drive</option><option>Galeria online + Pen drive</option></select></Field><Field label="Quantidade de fotos"><input type="number" defaultValue="500" /></Field><Field label="Formato"><select><option>JPG</option><option>JPG + RAW</option><option>Outro</option></select></Field></div><label className="contract-check"><input type="checkbox" /> Quantidade não definida</label><Field label="Observações sobre a entrega"><textarea placeholder="Informações adicionais sobre a entrega..." /></Field>
              </Accordion>
              <Accordion index={3} title="Pagamento" summary="R$ 3.500,00 · Entrada + restante" open={openTerm === 2} onClick={() => setOpenTerm(openTerm === 2 ? -1 : 2)}>
                <div className="contract-form-grid compact"><Field label="Valor total"><input value="R$ 3.500,00" readOnly /></Field><Field label="Forma de pagamento"><select><option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão</option><option>Outro</option></select></Field><Field label="Condição de pagamento"><select value={paymentCondition} onChange={(event) => setPaymentCondition(event.target.value)}><option>À vista</option><option>Entrada + restante</option><option>Parcelado</option></select></Field></div>
                {paymentCondition === "Entrada + restante" && <div className="contract-form-grid compact four"><Field label="Valor da entrada"><input defaultValue="R$ 1.750,00" /></Field><Field label="Data da entrada"><input type="date" defaultValue="2026-10-05" /></Field><Field label="Valor restante"><input defaultValue="R$ 1.750,00" /></Field><Field label="Pagamento restante"><input type="date" defaultValue="2026-10-19" /></Field></div>}
                {paymentCondition === "Parcelado" && <div className="contract-form-grid compact"><Field label="Quantidade de parcelas"><input type="number" defaultValue="2" /></Field><Field label="Valor de cada parcela"><input defaultValue="R$ 1.750,00" /></Field><Field label="Primeiro vencimento"><input type="date" /></Field></div>}
                <div className="payment-summary">R$ 3.500,00 em 2 pagamentos</div>
              </Accordion>
              <Accordion index={4} title="Cancelamento" summary="Cláusula padrão · Multa de 20%" open={openTerm === 3} onClick={() => setOpenTerm(openTerm === 3 ? -1 : 3)}>
                <div className="inline-setting"><span>Usar cláusula padrão</span><Toggle value={standardCancel} onChange={setStandardCancel} /></div><Field label="Política de cancelamento"><textarea defaultValue="Em caso de cancelamento pelo CONTRATANTE, os valores pagos a título de reserva não serão reembolsados." /></Field><div className="contract-form-grid compact"><Field label="Prazo para cancelamento"><input defaultValue="7 dias" /></Field><div className="inline-setting"><span>Existe multa?</span><Toggle value={hasFine} onChange={setHasFine} /></div>{hasFine && <Field label="Percentual da multa"><input type="number" defaultValue="20" /></Field>}</div><div className="legal-warning">As cláusulas podem possuir implicações jurídicas. Revise o conteúdo antes de enviar.</div>
              </Accordion>
              <Accordion index={5} title="Remarcação" summary="Permitida · Mínimo de 7 dias" open={openTerm === 4} onClick={() => setOpenTerm(openTerm === 4 ? -1 : 4)}>
                <div className="inline-setting"><span>Permite remarcação?</span><Toggle value={reschedule} onChange={setReschedule} /></div>{reschedule && <><div className="contract-form-grid compact"><Field label="Prazo mínimo"><input defaultValue="7 dias" /></Field><Field label="Remarcações permitidas"><input type="number" defaultValue="1" /></Field><Field label="Taxa de remarcação"><input placeholder="R$ ou %" /></Field></div><Field label="Condições para remarcação"><textarea defaultValue="A remarcação está sujeita à disponibilidade de agenda do fotógrafo." /></Field><label className="contract-check"><input type="checkbox" defaultChecked /> Usar cláusula padrão</label></>}
              </Accordion>
              <Accordion index={6} title="Uso das imagens" summary="Portfólio e redes sociais autorizados" open={openTerm === 5} onClick={() => setOpenTerm(openTerm === 5 ? -1 : 5)}>
                <div className="inline-setting"><span>O fotógrafo poderá utilizar as imagens?</span><Toggle value={imageUse} onChange={setImageUse} /></div>{imageUse && <div className="image-options">{["Site", "Instagram", "Facebook", "Portfólio", "Material publicitário"].map((item) => <label key={item}><input type="checkbox" defaultChecked={item !== "Material publicitário"} /> {item}</label>)}</div>}<div className="inline-setting"><span>Permitir uso comercial?</span><Toggle value={commercialUse} onChange={setCommercialUse} /></div><Field label="Observações"><textarea placeholder="Condições específicas de uso..." /></Field>
              </Accordion>
              <Accordion index={7} title="Responsabilidades" summary="Cláusulas de fotógrafo e cliente" open={openTerm === 6} onClick={() => setOpenTerm(openTerm === 6 ? -1 : 6)}>
                <Field label="Responsabilidades do fotógrafo"><textarea defaultValue="O fotógrafo compromete-se a executar os serviços com qualidade técnica, zelo e pontualidade." /></Field><Field label="Responsabilidades do cliente"><textarea defaultValue="O cliente compromete-se a fornecer todas as informações e condições necessárias para a execução do serviço." /></Field><button className="restore-button">Restaurar cláusula padrão</button>
              </Accordion>
              <Accordion index={8} title="Situações imprevistas" summary="Força maior e eventos inevitáveis" open={openTerm === 7} onClick={() => setOpenTerm(openTerm === 7 ? -1 : 7)}>
                <Field label="Força maior e situações imprevistas"><textarea defaultValue="Nenhuma das partes será responsabilizada pelo descumprimento decorrente de caso fortuito, força maior ou situação comprovadamente imprevisível." /></Field><button className="restore-button">Restaurar cláusula padrão</button>
              </Accordion>
              <Accordion index={9} title="Foro" summary="Sorocaba · SP" open={openTerm === 8} onClick={() => setOpenTerm(openTerm === 8 ? -1 : 8)}>
                <div className="contract-form-grid compact"><Field label="Cidade" required><input defaultValue="Sorocaba" /></Field><Field label="Estado" required><select defaultValue="SP"><option>SP</option><option>RJ</option><option>MG</option><option>PR</option><option>SC</option></select></Field></div><p className="forum-preview">Fica eleito o foro da comarca de Sorocaba, SP, para dirimir questões decorrentes deste contrato.</p>
              </Accordion>
              <div className="builder-actions sticky"><button onClick={() => setBuilderStep(1)}>Voltar</button><button className="primary" onClick={() => runLoading(() => setMode("review"))}>{loading ? <i className="loader" /> : "Continuar para revisão"}<CIcon name="chevron" /></button></div>
            </div>
            <aside className="card terms-summary"><h2>Resumo do contrato</h2><div className="session-mini"><img src={clients[0]} alt="" /><span><strong>Casamento - Ana e Lucas</strong><small>19/10/2026 · 14:00</small></span></div>{[["Cliente", "Ana Carolina Silva"], ["Valor total", "R$ 3.500,00"], ["Entrega", "30 dias"], ["Pagamento", "2 pagamentos"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}<span className="ready-status"><CIcon name="check" /> Todas as seções configuradas</span></aside>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="contracts-view">
      <header className="contracts-header"><div><span><CIcon name="file" size={22} /></span><div><h1>Contratos</h1><p>Gerencie seus contratos e acompanhe as assinaturas.</p></div></div><div><button className="contract-theme" onClick={onToggleTheme}>{lightMode ? "Modo escuro" : "Modo claro"}</button><button className="new-contract" onClick={() => setNewOpen(true)}><CIcon name="plus" /> Novo contrato</button></div></header>
      <section className="contract-metrics">{[["file", "12", "Total de contratos", "Todos os contratos cadastrados", "purple"], ["check", "8", "Assinados", "Contratos concluídos", "green"], ["clock", "3", "Pendentes", "Aguardando assinatura", "yellow"], ["x", "1", "Expirados", "Contratos que perderam a validade", "red"]].map(([icon, value, title, text, tone]) => <article className="contract-metric" key={title}><span className={tone}><CIcon name={icon} /></span><div><strong>{value}</strong><b>{title}</b><small>{text}</small></div></article>)}</section>
      <section className="contract-filters"><label><CIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, ensaio ou número do contrato..." /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option><option>Assinado</option><option>Pendente</option><option>Expirado</option><option>Cancelado</option></select><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>Todos</option><option>Casamento</option><option>Ensaio</option><option>Aniversário</option><option>Formatura</option><option>Evento</option><option>Corporativo</option><option>Outro</option></select><button><CIcon name="filter" /> Aplicar filtros</button>{(search || statusFilter !== "Todos" || typeFilter !== "Todos") && <button className="clear-filter" onClick={() => { setSearch(""); setStatusFilter("Todos"); setTypeFilter("Todos"); }}>Limpar</button>}</section>
      <section className="card contracts-table-wrap"><table className="contracts-table"><thead><tr><th>Contrato</th><th>Cliente</th><th>Ensaio</th><th>Valor</th><th>Status</th><th>Data de envio</th><th>Ações</th></tr></thead><tbody>{filtered.map((contract) => <tr key={contract.id}><td><strong>{contract.id}</strong><small>{contract.date}</small></td><td><div className="table-client"><img src={contract.photo} alt="" /><span><strong>{contract.name}</strong><small>{contract.email}</small></span></div></td><td><strong>{contract.session}</strong><small>{contract.date}</small></td><td><strong>{contract.value}</strong></td><td><span className={`contract-status ${contract.status.toLowerCase()}`}>{contract.status}</span></td><td><strong>{contract.sent}</strong><small>Enviado ao cliente</small></td><td><div className="row-actions"><button title="Visualizar contrato" onClick={() => setMode("detail")}><CIcon name="eye" /></button><button title={contract.status === "Assinado" ? "Contrato assinado não pode ser editado" : "Editar contrato"} disabled={contract.status === "Assinado"}><CIcon name="edit" /></button><button title="Mais opções" onClick={() => setMoreId(moreId === contract.id ? "" : contract.id)}><CIcon name="more" /></button>{moreId === contract.id && <div className="more-menu">{["Visualizar contrato", "Editar contrato", "Reenviar para cliente", "Copiar link de assinatura", "Baixar PDF", "Cancelar contrato"].map((action) => <button disabled={action === "Editar contrato" && contract.status === "Assinado"} key={action} onClick={() => { setMoreId(""); if (action === "Visualizar contrato") setMode("detail"); else if (action === "Cancelar contrato") setCancelId(contract.id); else onNotice(action); }}>{action}</button>)}</div>}</div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="contracts-empty">Nenhum contrato encontrado.</div>}</section>

      {newOpen && <div className="contract-modal-layer"><div className="new-contract-modal"><div className="modal-heading"><div><span><CIcon name="file" /></span><div><h2>Novo contrato</h2><p>Crie um contrato a partir de um ensaio existente.</p></div></div><button onClick={() => setNewOpen(false)}>×</button></div><Field label="Ensaio vinculado" required><select className={!selectedSession ? "empty" : "filled"} value={selectedSession} onChange={(event) => setSelectedSession(event.target.value)}><option value="">Selecione ou pesquise um ensaio...</option><option>Casamento - Ana e Lucas</option><option>Ensaio família - João Pedro</option><option>Ensaio externo - Maria Clara</option></select></Field>{selectedSession && <div className="linked-session">{[["Cliente", "Ana Carolina Silva"], ["Data", "19/10/2026"], ["Local", "Parque do Ibirapuera"], ["Valor", "R$ 3.500,00"]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>}<div className="modal-actions"><button onClick={() => setNewOpen(false)}>Cancelar</button><button className="primary" disabled={!selectedSession} onClick={startBuilder}>Continuar <CIcon name="chevron" /></button></div></div></div>}
      {cancelId && <div className="contract-modal-layer"><div className="cancel-contract-modal"><span><CIcon name="x" size={20} /></span><h2>Cancelar contrato</h2><p>Tem certeza que deseja cancelar este contrato?</p><Field label="Motivo do cancelamento" required><textarea className={!cancelReason ? "error" : "filled"} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Informe o motivo..." /></Field><div className="modal-actions"><button onClick={() => setCancelId("")}>Voltar</button><button className="danger" disabled={!cancelReason.trim()} onClick={cancelContract}>Confirmar cancelamento</button></div></div></div>}
    </div>
  );
}

function BuilderHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return <><header className="builder-header"><button onClick={onBack}><CIcon name="arrow" /></button><div><h1>Novo contrato</h1><p>Preencha as informações e revise antes de enviar.</p></div></header><div className="builder-steps">{["Dados do contrato", "Termos e condições", "Revisão", "Enviar ao cliente"].map((label, index) => <div className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} key={label}><span>{step > index + 1 ? <CIcon name="check" size={11} /> : index + 1}</span><b>{label}</b>{index < 3 && <i />}</div>)}</div></>;
}

function Timeline() {
  return <div className="contract-timeline">{[["05/10/2026 17:30", "Contrato criado"], ["05/10/2026 17:42", "Contrato enviado para Ana Carolina"], ["05/10/2026 18:12", "Contrato visualizado pelo cliente"], ["05/10/2026 18:15", "Contrato assinado"]].map(([date, event]) => <div key={event}><i /><span><strong>{event}</strong><small>{date}</small></span></div>)}</div>;
}

function SendModal({ onClose, onPublic, onNotice }: { onClose: () => void; onPublic: () => void; onNotice: (message: string) => void }) {
  return <div className="contract-modal-layer"><div className="send-contract-modal"><span className="send-success"><CIcon name="check" size={24} /></span><h2>Contrato pronto para assinatura</h2><p>O contrato foi salvo e está aguardando a assinatura do cliente.</p><div className="send-client"><small>Cliente</small><strong>Ana Carolina Silva</strong><small>E-mail</small><strong>ana@email.com</strong></div><label>Link de assinatura<div><input readOnly value="clickmanager.com/contrato/8f3a..." /><button onClick={() => onNotice("Link copiado")}><CIcon name="copy" /></button></div></label><button className="send-email" onClick={() => onNotice("Contrato enviado por e-mail")}><CIcon name="mail" /> Enviar por e-mail</button><button className="client-preview" onClick={onPublic}>Visualizar como cliente</button><button className="close-send" onClick={onClose}>Fechar</button></div></div>;
}
