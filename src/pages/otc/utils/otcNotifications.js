function normId(id) {
  if (id == null) return null;
  // Map ključ mora biti stabilan: "12" i 12 treba da budu isti
  return String(id);
}

function normStr(x) {
  if (x == null) return '';
  return String(x);
}

export function getOfferId(o) {
  return normId(o?.otc_offer_id ?? o?.id ?? o?.otcOfferId);
}

export function getOfferModified(o) {
  // normalizuj na string; ako je prazno, vrati ''
  const v =
    o?.last_modified ??
    o?.lastModified ??
    o?.updated_at ??
    o?.updatedAt ??
    o?.modified_at ??
    o?.modifiedAt ??
    '';
  return normStr(v);
}

export function getOfferStatus(o) {
  return normStr(o?.status);
}

/**
 * Vraća listu eventova između prev i next liste.
 * Eventovi: NEW, STATUS, MODIFIED
 *
 * Bitno: za isti offer može da vrati i STATUS i MODIFIED u istom ciklusu.
 */
export function diffOffers(prevList = [], nextList = []) {
  const prevMap = new Map(
    (Array.isArray(prevList) ? prevList : [])
      .map(o => [getOfferId(o), o])
      .filter(([id]) => id != null)
  );

  const nextMap = new Map(
    (Array.isArray(nextList) ? nextList : [])
      .map(o => [getOfferId(o), o])
      .filter(([id]) => id != null)
  );

  const events = [];

  for (const [id, next] of nextMap.entries()) {
    const prev = prevMap.get(id);

    // NEW
    if (!prev) {
      events.push({ type: 'NEW', id, offer: next });
      continue;
    }

    // STATUS (ne radi continue, jer može paralelno i MODIFIED)
    const prevStatus = getOfferStatus(prev);
    const nextStatus = getOfferStatus(next);
    if (prevStatus !== nextStatus) {
      events.push({ type: 'STATUS', id, offer: next, prevStatus, nextStatus });
    }

    // MODIFIED
    const prevMod = getOfferModified(prev);
    const nextMod = getOfferModified(next);

    // Ako backend ne šalje last_modified, ali šalje updated_at, i dalje radi
    if (prevMod && nextMod && prevMod !== nextMod) {
      events.push({ type: 'MODIFIED', id, offer: next, prevMod, nextMod });
    }
  }

  // REMOVED
    for (const [id, prev] of prevMap.entries()) {
        if (!nextMap.has(id)) {
            events.push({ type: 'REMOVED', id, offer: prev });
        }
  }

  return events;
}

export function summarizeEvents(events = []) {
  if (!events.length) return null;

  // Ako ima NEW, to je najbitnije da prikažemo
  const newCount = events.filter(e => e.type === 'NEW').length;
  if (newCount > 0) return `Imate ${newCount} novu OTC ponudu.`;

  // STATUS promene
  const statusCount = events.filter(e => e.type === 'STATUS').length;
  if (statusCount > 0) return `Promenjen status za ${statusCount} OTC pregovora.`;

  // Ostalo MODIFIED
  const modCount = events.filter(e => e.type === 'MODIFIED').length;
  if (modCount > 0) return `Ažurirane su ${modCount} OTC ponude.`;

  const removedCount = events.filter(e => e.type === 'REMOVED').length;
  if (removedCount > 0) return `Pregovor je završen za ${removedCount} OTC ponuda.`;

  return 'Imate nove OTC promene.';
}