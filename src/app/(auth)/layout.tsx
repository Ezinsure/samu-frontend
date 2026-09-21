import { GuestGuard } from "@/components/auth/guest-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="min-h-full bg-background">
        <div className="mx-auto grid min-h-screen lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden bg-primary-900 px-10 py-12 text-foreground-on-navy lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-600 text-base font-bold">
                  S
                </span>
                <div>
                  <p className="text-lg font-bold tracking-tight">SAMU</p>
                  <p className="text-xs text-sidebar-muted">
                    Solektra Agent Monitoring Utility
                  </p>
                </div>
              </div>
              <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight tracking-tight">
                Field operations, under control.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground">
                Monitor agents, coordinate territories, and measure performance
                across Rwanda from one enterprise workspace.
              </p>
            </div>
            <p className="text-xs text-sidebar-muted">
              Demo environment · Seeded accounts only
            </p>
          </aside>
          <div className="flex items-center justify-center px-4 py-10 sm:px-8">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
