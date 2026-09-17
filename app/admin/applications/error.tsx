"use client";

export default function ApplicationsError({ reset }: { reset: () => void }) {
  return (
    <main className="cw-admin">
      <section className="cw-admin-main">
        <div className="cw-admin-panel cw-admin-error-state" role="alert">
          <h1>Applications could not be loaded</h1>
          <p>Please check the connection and try again.</p>
          <button className="cw-admin-primary" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
