import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPasswordChecklist } from "@/lib/auth/password-rules";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

/**
 * Live checklist of password rules. Met rules turn green with a check;
 * unmet rules stay muted with an empty circle.
 */
export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const checklist = getPasswordChecklist(password);

  return (
    <ul className={cn("space-y-1.5", className)} aria-live="polite">
      {checklist.map((rule) => (
        <li
          key={rule.id}
          className={cn(
            "flex items-center gap-2 text-xs",
            rule.met ? "text-success" : "text-foreground-secondary",
          )}
        >
          {rule.met ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
