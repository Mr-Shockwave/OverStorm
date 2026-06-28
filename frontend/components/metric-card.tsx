type MetricCardProps = {
  label: string;
  value: string;
  description: string;
};

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {description}
      </p>
    </article>
  );
}
