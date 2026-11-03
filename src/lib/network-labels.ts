import type { AgentStatus } from "@/types";

export function networkRoleLabel(
  status: AgentStatus | string,
): "Agent candidate" | "Irembo agent" {
  return status === "Certified" ? "Irembo agent" : "Agent candidate";
}

export function lifecycleStatusLabel(status: AgentStatus | string): string {
  switch (status) {
    case "Candidate":
      return "Candidate";
    case "InTraining":
      return "In training";
    case "ExamPending":
      return "Exam pending";
    case "Certified":
      return "Certified";
    case "Inactive":
      return "Inactive";
    default:
      return String(status);
  }
}

export function networkRoleTone(status: AgentStatus | string) {
  return status === "Certified" ? ("success" as const) : ("info" as const);
}
