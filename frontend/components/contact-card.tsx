import { CopyButton } from "@/components/copy-button";

type ContactCardProps = {
  company: string;
  contactName: string;
  contactTitle: string;
  email?: string;
  phone?: string;
};

export function ContactCard({
  company,
  contactName,
  contactTitle,
  email,
  phone,
}: ContactCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Contact Details</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Decision maker discovered via Fiber
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        <ContactRow label="Company" value={company} />
        <ContactRow
          label="Contact"
          value={contactName}
          subvalue={contactTitle}
        />
        {email && (
          <ContactRow label="Email" value={email} copyable />
        )}
        {phone && (
          <ContactRow label="Phone" value={phone} copyable />
        )}
      </div>
    </section>
  );
}

function ContactRow({
  label,
  value,
  subvalue,
  copyable = false,
}: {
  label: string;
  value: string;
  subvalue?: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
        {subvalue && (
          <p className="mt-0.5 text-sm text-slate-500">{subvalue}</p>
        )}
      </div>
      {copyable && <CopyButton value={value} />}
    </div>
  );
}
