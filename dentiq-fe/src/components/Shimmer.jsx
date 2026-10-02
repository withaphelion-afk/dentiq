// Skeleton loaders shown while data loads
export const Sk = ({ className = '' }) => <div className={`shimmer rounded-xl ${className}`} />

// Tooth-shaped shimmer used in place of avatars
const ToothSk = () => (
  <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0">
    <defs>
      <linearGradient id="tsk" x1="0" x2="1">
        <stop offset="0" stopColor="var(--sh1)" />
        <stop offset=".5" stopColor="var(--sh2)" />
        <stop offset="1" stopColor="var(--sh1)" />
        <animate attributeName="x1" values="-1;1" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="x2" values="0;2" dur="1.2s" repeatCount="indefinite" />
      </linearGradient>
    </defs>
    <path fill="url(#tsk)" d="M20 14c-6 0-9 5-9 11 0 7 3 10 5 17 1 5 2 9 5 9s3-5 4-10c1-3 2-5 7-5s6 2 7 5c1 5 1 10 4 10s4-4 5-9c2-7 5-10 5-17 0-6-3-11-9-11-5 0-7 3-12 3s-7-3-12-3z" />
  </svg>
)

const Row = () => (
  <div className="flex items-center gap-3 p-2.5">
    <ToothSk />
    <div className="flex-1 space-y-2"><Sk className="h-3 w-2/3" /><Sk className="h-2.5 w-1/3" /></div>
    <Sk className="h-7 w-12" />
  </div>
)

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 pb-8 xl:grid-cols-[1fr_360px]" aria-busy="true" aria-label="Loading">
      <section className="space-y-6">
        <div className="space-y-2"><Sk className="h-8 w-72 max-w-full" /><Sk className="h-4 w-48" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Sk className="h-44 rounded-3xl" /><Sk className="h-44 rounded-3xl" /></div>
        <div className="grid grid-cols-3 gap-3 md:gap-4"><Sk className="h-28 rounded-2xl" /><Sk className="h-28 rounded-2xl" /><Sk className="h-28 rounded-2xl" /></div>
        <div className="rounded-3xl bg-card p-4 xl:hidden"><Row /><Row /><Row /></div>
      </section>
      <aside className="hidden space-y-6 xl:block">
        <Sk className="h-32 rounded-3xl" />
        <div className="rounded-3xl bg-card p-4"><Row /><Row /><Row /><Row /><Row /></div>
      </aside>
    </div>
  )
}
