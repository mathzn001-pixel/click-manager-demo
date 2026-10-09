import { useSyncExternalStore } from "react";

/* ═════════ Configuração central dos planos (ALTERE AQUI) ═════════
   Valores PROVISÓRIOS, usados apenas para testes. null = ilimitado. */
export type PlanId = "free" | "pro" | "studio";
export type Resource = "clients" | "galleries" | "posts";
export type Plan = {
  id: PlanId; name: string; price: number; description: string; badge?: string;
  limits: { clients: number | null; galleries: number | null; storageGB: number | null; portfolios: number | null; posts: number | null };
  contracts: "basic" | "full"; payments: "basic" | "full"; reports: "none" | "standard" | "advanced"; chat: true; priority: boolean;
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "studio"];
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", price: 0, description: "Ideal para fotógrafos que estão começando e querem organizar seu trabalho.",
    limits: { clients: 50, galleries: 5, storageGB: 100, portfolios: 1, posts: 10 }, contracts: "basic", payments: "basic", reports: "none", chat: true, priority: false },
  pro: { id: "pro", name: "Pro", price: 49.9, badge: "Mais popular", description: "Para fotógrafos que precisam de mais recursos para administrar seus trabalhos.",
    limits: { clients: 200, galleries: 20, storageGB: 500, portfolios: 3, posts: 50 }, contracts: "full", payments: "full", reports: "standard", chat: true, priority: false },
  studio: { id: "studio", name: "Studio", price: 79.9, description: "Para fotógrafos que precisam de uma estrutura completa para administrar o negócio.",
    limits: { clients: null, galleries: null, storageGB: 2048, portfolios: null, posts: null }, contracts: "full", payments: "full", reports: "advanced", chat: true, priority: true },
};

export const RESOURCE_TEXT: Record<Resource, { plural: string; action: string }> = {
  clients: { plural: "clientes", action: "cadastrar mais clientes" },
  galleries: { plural: "galerias", action: "criar mais galerias" },
  posts: { plural: "publicações no Feed", action: "publicar mais" },
};

export const fmtLimit = (n: number | null) => (n === null ? "Ilimitado" : n.toLocaleString("pt-BR"));
export const fmtStorage = (gb: number | null) => (gb === null ? "Ilimitado" : gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`);
export const fmtPrice = (p: number) => (p === 0 ? "R$ 0,00" : `R$ ${p.toFixed(2).replace(".", ",")}`);
export type UsageStatus = "ok" | "near" | "reached" | "unlimited" | "unknown";
export function usageStatus(count: number | undefined, limit: number | null): UsageStatus {
  if (limit === null) return "unlimited"; if (count === undefined) return "unknown";
  return count >= limit ? "reached" : count >= limit * 0.8 ? "near" : "ok";
}

/* ═════════ Store ═════════ */
export const IS_DEV = import.meta.env.DEV; // modo de teste só existe em desenvolvimento
const KEY = "clickmanager.devPlan";
const readPlan = (): PlanId => { if (!IS_DEV) return "free"; try { const v = localStorage.getItem(KEY); if (v === "free" || v === "pro" || v === "studio") return v; } catch { /* sem storage */ } return "free"; };

type State = { planId: PlanId; usage: { clients?: number; galleries?: number }; limitNotice: Resource | null; navRequest: { page: string; tab?: string } | null };
let state: State = { planId: readPlan(), usage: {}, limitNotice: null, navRequest: null };
const listeners = new Set<() => void>();
const set = (fn: (s: State) => State) => { const n = fn(state); if (n === state) return; state = n; listeners.forEach((l) => l()); };
export const usePlanState = () => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => state);
export const usePlan = () => { const s = usePlanState(); return { ...s, plan: PLANS[s.planId] }; };

export const planActions = {
  /** Apenas ambiente de desenvolvimento. Não há cobrança nem alteração de assinatura real. */
  setTestPlan(id: PlanId) { if (!IS_DEV) return; try { localStorage.setItem(KEY, id); } catch { /* sem storage */ } set((s) => ({ ...s, planId: id })); },
  reportUsage(key: "clients" | "galleries", n: number) { set((s) => (s.usage[key] === n ? s : { ...s, usage: { ...s.usage, [key]: n } })); },
  dismissLimit() { set((s) => ({ ...s, limitNotice: null })); },
  navigate(page: string, tab?: string) { set((s) => ({ ...s, limitNotice: null, navRequest: { page, tab } })); },
  clearNav() { set((s) => (s.navRequest ? { ...s, navRequest: null } : s)); },
};

/** Verificação central de limite. Chame dentro da AÇÃO que cria o dado (não só no botão). */
export function guard(resource: Resource, currentCount: number): boolean {
  const limit = PLANS[state.planId].limits[resource];
  if (limit !== null && currentCount >= limit) { set((s) => ({ ...s, limitNotice: resource })); return false; }
  return true;
}
export const limitMessage = (resource: Resource, planName: string) => `Você atingiu o limite de ${RESOURCE_TEXT[resource].plural} do seu plano ${planName}. Faça um upgrade para ${RESOURCE_TEXT[resource].action}.`;

/* ═════════ Aviso global de limite ═════════ */
export function PlanLimitHost() {
  const { plan, limitNotice } = usePlan();
  if (!limitNotice) return null;
  const limit = plan.limits[limitNotice]; const canUpgrade = plan.id !== "studio";
  return (
    <div className="pl-layer" onMouseDown={(e) => e.target === e.currentTarget && planActions.dismissLimit()}>
      <div className="pl-modal" role="alertdialog" aria-modal="true" aria-labelledby="pl-title">
        <span className="pl-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
        <h2 id="pl-title">Limite do plano atingido</h2>
        <p>{limitMessage(limitNotice, plan.name)}</p>
        <small>Plano {plan.name}: até {fmtLimit(limit)} {RESOURCE_TEXT[limitNotice].plural}. Seus dados existentes foram mantidos.</small>
        <div>
          <button className="pl-btn ghost" onClick={planActions.dismissLimit}>Agora não</button>
          {canUpgrade && <button className="pl-btn primary" onClick={() => planActions.navigate("Configurações", "Planos")}>Ver planos</button>}
        </div>
      </div>
    </div>
  );
}
