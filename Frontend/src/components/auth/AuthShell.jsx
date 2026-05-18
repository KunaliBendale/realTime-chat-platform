export function AuthShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-[#172033] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden border border-[#d9dee8] bg-white shadow-sm md:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden bg-[#172033] px-10 py-12 text-white md:flex md:flex-col md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3c7]">
                RealTime Chat
              </p>
              <h1 className="mt-8 max-w-sm text-4xl font-semibold leading-tight">
                Secure access for fast, focused conversations.
              </h1>
            </div>
            <div className="space-y-4 text-sm text-[#d9dee8]">
              <div className="border-l-2 border-[#7dd3c7] pl-4">
                JWT-based sessions, protected routes, and persistent auth state.
              </div>
              <div className="border-l-2 border-[#f59e0b] pl-4">
                Built to plug directly into direct and group chat screens.
              </div>
            </div>
          </div>

          <div className="flex min-h-[620px] items-center justify-center px-5 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Account
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#172033]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#5d6b82]">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
