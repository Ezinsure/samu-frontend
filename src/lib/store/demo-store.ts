import {
  ACTION_ITEMS,
  AGENTS,
  AUDIT_LOGS,
  DEFAULT_SETTINGS,
  FRAUD_FLAGS,
  MEETINGS,
  MONTHLY_REPORTS,
  SENSITIZATIONS,
  TRAININGS,
  VISITS,
} from "@data/index";
import type {
  ActionItem,
  Agent,
  AuditLog,
  FraudFlag,
  Meeting,
  MonthlyReport,
  SensitizationEvent,
  SystemSettings,
  TrainingSession,
  Visit,
} from "@/types";

const STORE_KEY = "samu.demo.store.v1";

export interface DemoStoreState {
  agents: Agent[];
  visits: Visit[];
  sensitizations: SensitizationEvent[];
  trainings: TrainingSession[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  monthlyReports: MonthlyReport[];
  fraudFlags: FraudFlag[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

function seedState(): DemoStoreState {
  return {
    agents: structuredClone(AGENTS),
    visits: structuredClone(VISITS),
    sensitizations: structuredClone(SENSITIZATIONS),
    trainings: structuredClone(TRAININGS),
    meetings: structuredClone(MEETINGS),
    actionItems: structuredClone(ACTION_ITEMS),
    monthlyReports: structuredClone(MONTHLY_REPORTS),
    fraudFlags: structuredClone(FRAUD_FLAGS),
    auditLogs: structuredClone(AUDIT_LOGS),
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readDemoStore(): DemoStoreState {
  if (!canUseStorage()) return seedState();

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedState();
      window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DemoStoreState;
    return {
      ...seedState(),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    const seeded = seedState();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeDemoStore(state: DemoStoreState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function updateDemoStore(
  updater: (state: DemoStoreState) => DemoStoreState,
): DemoStoreState {
  const next = updater(readDemoStore());
  writeDemoStore(next);
  return next;
}

export function resetDemoStore(): DemoStoreState {
  const seeded = seedState();
  writeDemoStore(seeded);
  return seeded;
}

export function appendAuditLog(
  entry: Omit<AuditLog, "id" | "timestamp"> & { id?: string; timestamp?: string },
) {
  updateDemoStore((state) => ({
    ...state,
    auditLogs: [
      {
        id: entry.id ?? `audit-${Date.now()}`,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        actorUserId: entry.actorUserId,
        action: entry.action,
        objectType: entry.objectType,
        objectId: entry.objectId,
        summary: entry.summary,
      },
      ...state.auditLogs,
    ],
  }));
}
