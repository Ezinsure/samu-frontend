import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  /** Id of the control, so the label is clickable. */
  htmlFor?: string;
  /** Extra classes, e.g. `md:col-span-2` for full-width fields. */
  className?: string;
  children: React.ReactNode;
}

/** Label + control wrapper used by form grids. */
export function FormField({ label, htmlFor, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
