import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  /** Id of the control, so the label is clickable. */
  htmlFor?: string;
  /** Shows a red asterisk after the label. */
  required?: boolean;
  /** Extra classes, e.g. `md:col-span-2` for full-width fields. */
  className?: string;
  children: React.ReactNode;
}

/** Label + control wrapper used by form grids. */
export function FormField({
  label,
  htmlFor,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--samu-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children}
    </div>
  );
}
