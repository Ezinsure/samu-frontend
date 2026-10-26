import type { SmsConfirmationStatus, VisitPurpose, VisitValidation } from "@/types";

/** Must match the API's `VISIT_PURPOSES` enum. */
export const VISIT_PURPOSES: VisitPurpose[] = [
  "Ezinsure Support",
  "Performance Review",
  "Problem Solving",
  "COAP Education",
  "COAP Onboarding Support",
  "COAP Sales Follow-up",
  "Community Feedback",
];

export const INTERNET_TYPES = [
  "Solektra Telecom",
  "MTN",
  "Airtel",
  "Mango",
  "Other",
];

export function validationTone(validation: VisitValidation) {
  if (validation === "accepted") return "success" as const;
  if (validation === "flagged") return "warning" as const;
  return "danger" as const;
}

export function validationLabel(validation: VisitValidation) {
  if (validation === "accepted") return "Accepted";
  if (validation === "flagged") return "Flagged";
  return "Rejected";
}

export function confirmationTone(status: SmsConfirmationStatus) {
  if (status === "confirmed") return "success" as const;
  if (status === "pending") return "info" as const;
  if (status === "disputed") return "warning" as const;
  if (status === "delivery_failed") return "danger" as const;
  return "neutral" as const;
}

export function confirmationLabel(status: SmsConfirmationStatus) {
  if (status === "confirmed") return "Confirmed";
  if (status === "pending") return "Pending SMS";
  if (status === "disputed") return "Disputed";
  if (status === "delivery_failed") return "Delivery failed";
  return "Expired";
}
