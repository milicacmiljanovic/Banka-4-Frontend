export const CARD_STATUS = {
  ACTIVE: 'AKTIVNA',
  BLOCKED: 'BLOKIRANA',
  DEACTIVATED: 'DEAKTIVIRANA',
};

export const PORTAL_TYPE = {
  CLIENT: 'client',
  ADMIN: 'admin',
};

export function maskCardNumber(number = '') {
  const digits = String(number).replace(/\D/g, '');
  if (!digits || digits.length < 8) return '••••••••••••••••';
  const masked = digits.length - 8;
  return `${digits.slice(0, 4)}${'*'.repeat(masked || 8)}${digits.slice(-4)}`;
}

export function formatCardNumberForUi(number = '') {
  const digits = String(number).replace(/\D/g, '');
  if (!digits) return '•••• •••• •••• ••••';
  if (digits.length >= 16) {
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function getCardBrand(cardNumber = '') {
  const digits = String(cardNumber).replace(/\D/g, '');

  if (/^4/.test(digits)) {
    return { key: 'visa', label: 'Visa' };
  }

  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));

  if ((firstTwo >= 51 && firstTwo <= 55) || (firstFour >= 2221 && firstFour <= 2720)) {
    return { key: 'mastercard', label: 'MasterCard' };
  }

  if (/^9891/.test(digits)) {
    return { key: 'dina', label: 'Dina' };
  }

  if (/^3[47]/.test(digits)) {
    return { key: 'amex', label: 'American Express' };
  }

  return { key: 'generic', label: 'Kartica' };
}

export function getStatusMeta(status = '') {
  switch (status) {
    case CARD_STATUS.ACTIVE:
      return { label: 'Aktivna', tone: 'success' };
    case CARD_STATUS.BLOCKED:
      return { label: 'Blokirana', tone: 'warning' };
    case CARD_STATUS.DEACTIVATED:
      return { label: 'Deaktivirana', tone: 'danger' };
    default:
      return { label: status || 'Nepoznato', tone: 'neutral' };
  }
}

export function getAllowedActions(status, portalType = PORTAL_TYPE.CLIENT) {
  // Normalize possible backend status values into UI constants.
  const normalizedStatus = (() => {
    if (typeof status !== 'string') return status;
    const normalized = status.trim().toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
      case 'AKTIVNA':
        return CARD_STATUS.ACTIVE;
      case 'BLOCKED':
      case 'BLOKIRANA':
        return CARD_STATUS.BLOCKED;
      case 'DEACTIVATED':
      case 'DEAKTIVIRANA':
        return CARD_STATUS.DEACTIVATED;
      default:
        return status;
    }
  })();

  if (normalizedStatus === CARD_STATUS.DEACTIVATED) return [];

  if (portalType === PORTAL_TYPE.CLIENT) {
    if (normalizedStatus === CARD_STATUS.ACTIVE) {
      return [{ key: 'block', label: 'Blokiraj', tone: 'danger' }];
    }
    return [];
  }

  if (normalizedStatus === CARD_STATUS.ACTIVE) {
    return [
      { key: 'block', label: 'Blokiraj', tone: 'warning' },
      { key: 'deactivate', label: 'Deaktiviraj', tone: 'danger' },
    ];
  }

  if (normalizedStatus === CARD_STATUS.BLOCKED) {
    return [{ key: 'unblock', label: 'Odblokiraj', tone: 'primary' }];
  }

  return [];
}

export function formatLimit(value) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('sr-RS').format(date);
}

const STATUS_NORMALIZE = {
  'ACTIVE': CARD_STATUS.ACTIVE,
  'BLOCKED': CARD_STATUS.BLOCKED,
  'DEACTIVATED': CARD_STATUS.DEACTIVATED,
  'AKTIVNA': CARD_STATUS.ACTIVE,
  'BLOKIRANA': CARD_STATUS.BLOCKED,
  'DEAKTIVIRANA': CARD_STATUS.DEACTIVATED,
  [CARD_STATUS.ACTIVE]: CARD_STATUS.ACTIVE,
  [CARD_STATUS.BLOCKED]: CARD_STATUS.BLOCKED,
  [CARD_STATUS.DEACTIVATED]: CARD_STATUS.DEACTIVATED,
};

export function normalizeCard(apiCard) {
  const rawStatus = apiCard?.status;
  const statusKey = typeof rawStatus === 'string' ? rawStatus.trim().toUpperCase() : rawStatus;
  return {
    id: apiCard.id,
    cardNumber: apiCard.card_number ?? apiCard.cardNumber ?? '',
    holderName: apiCard.holder_name ?? apiCard.holderName ?? apiCard.name ?? '',
    expiresAt: apiCard.expires_at ?? apiCard.expiration_date ?? apiCard.expiresAt ?? '',
    createdAt: apiCard.creation_date ?? apiCard.createdAt ?? '',
    brand: apiCard.card_brand ?? apiCard.brand ?? '',
    cvv: apiCard.cvv ?? '***',
    type: apiCard.card_type ?? apiCard.type ?? 'Debitna',
    accountName: apiCard.account_name ?? apiCard.accountName ?? 'Tekući račun',
    accountNumber: apiCard.account_number ?? apiCard.accountNumber ?? '',
    limitDaily: apiCard.limit_daily ?? apiCard.limitDaily ?? 0,
    limitMonthly: apiCard.limit_monthly ?? apiCard.limitMonthly ?? 0,
    limitTotal: apiCard.limit ?? apiCard.limitTotal ?? 0,
    status: STATUS_NORMALIZE[statusKey] ?? rawStatus ?? CARD_STATUS.ACTIVE,
    transactions: apiCard.transactions ?? [],
  };
}
