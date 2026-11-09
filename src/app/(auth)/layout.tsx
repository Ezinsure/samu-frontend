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
          <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
            {/* Full-bleed brand plane */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(145deg,#0b1f33_0%,#172b4d_42%,#1e3a5f_72%,#2563eb_140%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.35) 0%, transparent 42%), radial-gradient(circle at 88% 78%, rgba(37,99,235,0.55) 0%, transparent 36%), repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)",
              }}
            />
            <div
              aria-hidden
              className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary-600/20 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
            />

            <div className="relative z-10 flex h-full flex-col justify-between px-10 py-12 text-foreground-on-navy xl:px-14">
              <div>
                <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight xl:text-6xl">
                  SAMU
                </p>
                <p className="mt-2 text-sm tracking-[0.14em] text-sidebar-muted uppercase">
                  Solektra Agent Monitoring Utility
                </p>
                <h1 className="mt-14 max-w-lg font-[family-name:var(--font-display)] text-4xl leading-[1.15] font-semibold tracking-tight xl:text-[2.75rem]">
                  Field operations, under control.
                </h1>
                <p className="mt-5 max-w-md text-base leading-relaxed text-sidebar-foreground/90">
                  One workspace to monitor agents, coordinate territories, and
                  measure performance across Rwanda.
                </p>
              </div>
              <p className="text-xs tracking-wide text-sidebar-muted">
                Authorised Solektra personnel only
              </p>
            </div>
          </aside>

          <div className="relative flex items-center justify-center px-4 py-10 sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_55%)]"
            />
            <div className="relative w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
