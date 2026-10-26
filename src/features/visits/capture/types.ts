import type {
  UploadedVisitPhoto,
} from "@/lib/api";
import type {
  AgentServices,
  Coordinates,
  ServiceLine,
  VisitPurpose,
} from "@/types";

export const CAPTURE_STEPS = [
  "Agent",
  "GPS",
  "Checklist",
  "Evidence",
  "Review",
] as const;

/** A photo that has already been uploaded; `previewUrl` is a local blob URL. */
export interface PhotoDraft {
  id: string;
  previewUrl: string;
  upload: UploadedVisitPhoto;
}

/** Form state shared by all wizard steps. */
export interface VisitDraft {
  agentId: string;
  purpose: VisitPurpose;
  serviceLines: ServiceLine[];
  /** `null` until edited — the agent's current services are used as the default. */
  checklist: AgentServices | null;
  activities: string;
  outcome: string;
  challenges: string;
  supportNeeded: string;
  photos: PhotoDraft[];
}

export const INITIAL_VISIT_DRAFT: VisitDraft = {
  agentId: "",
  purpose: "Ezinsure Support",
  serviceLines: [],
  checklist: null,
  activities: "",
  outcome: "",
  challenges: "",
  supportNeeded: "",
  photos: [],
};

/** Updates part of the draft. */
export type DraftChange = (patch: Partial<VisitDraft>) => void;

export type GpsStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "simulated";

export interface GpsCapture {
  status: GpsStatus;
  error?: string;
  location: Coordinates | null;
  captureDevice: () => void;
  setSimulated: (location: Coordinates) => void;
}
