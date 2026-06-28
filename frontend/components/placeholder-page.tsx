import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <svg
          className="h-7 w-7 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-slate-400">
        Coming Soon
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center text-sm font-medium text-sky-600 transition-colors hover:text-sky-700"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
