// serverOffsetMs = serverNowMs - clientNowMs
export async function getServerOffsetMs() {
  const t0 = Date.now();

  // /api/health postoji po tvojoj listi endpoint-a
  // HEAD je ok ako backend dozvoli; ako ne, prebaci na GET.
  const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });

  const t1 = Date.now();
  const dateHeader = res.headers.get('Date');

  // Da bi browser uopšte video Date header preko CORS-a,
  // backend mora da pošalje: Access-Control-Expose-Headers: Date
  if (!dateHeader) {
    // fallback: bez sinhronizacije
    return 0;
  }

  const serverDateMs = new Date(dateHeader).getTime();
  const clientMidMs = (t0 + t1) / 2;

  return serverDateMs - clientMidMs;
}