"use client";

import { useState } from "react";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { useAuth } from "@/lib/auth/auth-context";

export interface CoordinatorChoice {
  /** Admin / Ops must pick the owning coordinator; TCs own their own records. */
  required: boolean;
  /** Value to send as `tcUserId` (undefined when not required). */
  tcUserId: string | undefined;
  selected: string;
  setSelected: (id: string) => void;
}

/**
 * Tracks which coordinator a new COAP record belongs to.
 * Defaults to the first coordinator once the list has loaded.
 */
export function useCoordinatorChoice(
  coordinators: Array<{ id: string; name: string }> | undefined,
): CoordinatorChoice {
  const { user } = useAuth();
  const [picked, setPicked] = useState("");
  const required =
    user?.role === "ADMIN" || user?.role === "OPERATIONS_MANAGER";
  const selected = picked || coordinators?.[0]?.id || "";

  return {
    required,
    tcUserId: required ? selected || undefined : undefined,
    selected,
    setSelected: setPicked,
  };
}

interface CoordinatorFieldProps {
  choice: CoordinatorChoice;
  coordinators: Array<{ id: string; name: string }>;
}

/** "Coordinator" select — rendered only for Admin / Ops users. */
export function CoordinatorField({ choice, coordinators }: CoordinatorFieldProps) {
  if (!choice.required) return null;

  return (
    <FormField label="Coordinator">
      <OptionSelect
        value={choice.selected}
        onChange={choice.setSelected}
        placeholder="Select coordinator"
        options={coordinators.map((item) => ({ value: item.id, label: item.name }))}
      />
    </FormField>
  );
}
