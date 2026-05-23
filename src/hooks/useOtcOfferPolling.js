import { useEffect, useRef } from 'react';
import { otcApi } from '../api/endpoints/otc';
import { diffOffers, summarizeEvents } from '../pages/otc/utils/otcNotifications';
import { useOtcNotifStore } from '../store/otcNotificationsStore';
import { useAuthStore } from '../store/authStore';

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function getMyId(user) {
  return toNum(user?.id ?? user?.sub);
}

function isSeller(offer, user) {
  const myId = getMyId(user);
  if (!myId) return false;
  return toNum(offer?.seller_id) === myId;
}

function isBuyer(offer, user) {
  const myId = getMyId(user);
  if (!myId) return false;
  return toNum(offer?.buyer_id) === myId;
}

/**
 * NEW: seller dobija notif (spec)
 * STATUS/MODIFIED: dobija "druga strana" (ne onaj ko je modified_by)
 */
function shouldNotify(event, user) {
  const offer = event?.offer;
  if (!offer || !user) return false;

  // samo učesnici dobijaju
  const participant = isSeller(offer, user) || isBuyer(offer, user);
  if (!participant) return false;

  const myId = getMyId(user);
  const modifiedBy = toNum(offer?.modified_by);

  if (event.type === 'NEW') {
    // Spec: prodavac vidi obaveštenje za novu ponudu
    return isSeller(offer, user);
  }

  // STATUS/MODIFIED: pošalji drugoj strani
  // Ako nemamo modified_by, fallback na seller-only (da ne spamuje oba)
  if (!myId || !modifiedBy) return isSeller(offer, user);

  // ja sam menjao -> ne obaveštavaj mene
  if (modifiedBy === myId) return false;

  // neko drugi je menjao -> obavesti mene (drugu stranu)
  return true;
}

export function useOtcOfferPolling({ intervalMs = 5000 } = {}) {
  const user = useAuthStore(s => s.user);
  const bump = useOtcNotifStore(s => s.bump);

  const prevOffersRef = useRef([]);
  const timerRef = useRef(null);
  const initialDoneRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await otcApi.getMyNegotiations();
        const list = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);

        if (cancelled) return;

        // prvi load: snapshot bez notif
        if (!initialDoneRef.current) {
          initialDoneRef.current = true;
          prevOffersRef.current = list;
          return;
        }

        const events = diffOffers(prevOffersRef.current, list);

        const filtered = events.filter(e => shouldNotify(e, user));

        if (filtered.length > 0) {
          bump(filtered.length, summarizeEvents(filtered) ?? 'Imate nove OTC promene.');
        }

        prevOffersRef.current = list;
      } catch {
        // silent
      }
    }

    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, intervalMs, bump]);
}