export default function ApplicationsLoading() {
  return (
    <main className="cw-admin cw-admin-loading" aria-busy="true">
      <section className="cw-admin-main">
        <h1>Applications</h1>
        <p className="cw-admin-kicker">Loading lender applications…</p>
        <div className="cw-admin-panel cw-admin-loading-panel" />
      </section>
    </main>
  );
}
