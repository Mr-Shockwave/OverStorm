export function OutreachSection() {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Outreach</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Personalized outreach via Orange Slice
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Waiting
          </span>
        </div>
      </div>

      <div className="px-5 py-6">
        <p className="text-sm text-slate-500">
          Generate personalized email outreach once contact discovery is
          complete. This will connect to Orange Slice in a future release.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25V6.75m9 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          Generate Outreach
        </button>
      </div>
    </section>
  );
}
