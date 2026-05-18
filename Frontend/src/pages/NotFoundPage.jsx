import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-4 text-[#172033]">
      <section className="w-full max-w-md border border-[#d9dee8] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#5d6b82]">
          The page you are looking for is not available.
        </p>
        <Link
          className="mt-6 inline-flex bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          to="/dashboard"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
