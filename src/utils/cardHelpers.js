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
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 4)}********${digits.slice(-4)}`;
}

export function formatCardNumberForUi(number = '') {
  const digits = String(number).replace(/\D/g, '');
  if (!digits) return '•••• •••• •••• ••••';
  const masked = digits.length >= 16
    ? `${digits.slice(0, 4)} ${digits.slice(4, 8).replace(/./g, '•')} ${digits.slice(8, 12).replace(/./g, '•')} ${digits.slice(12, 16)}`
    : digits;
  return masked;
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
  if (status === CARD_STATUS.DEACTIVATED) return [];

  if (portalType === PORTAL_TYPE.CLIENT) {
    if (status === CARD_STATUS.ACTIVE) {
      return [{ key: 'block', label: 'Blokiraj', tone: 'danger' }];
    }
    return [];
  }

  if (status === CARD_STATUS.ACTIVE) {
    return [
      { key: 'block', label: 'Blokiraj', tone: 'warning' },
      { key: 'deactivate', label: 'Deaktiviraj', tone: 'danger' },
    ];
  }

  if (status === CARD_STATUS.BLOCKED) {
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

export function normalizeCard(apiCard) {
  return {
    id: apiCard.id,
    cardNumber: apiCard.card_number ?? apiCard.cardNumber ?? '',
    holderName: apiCard.holder_name ?? apiCard.holderName ?? '',
    expiresAt: apiCard.expiration_date ?? apiCard.expiresAt ?? '',
    createdAt: apiCard.creation_date ?? apiCard.createdAt ?? '',
    cvv: apiCard.cvv ?? '***',
    type: apiCard.type ?? 'Debitna',
    accountName: apiCard.account_name ?? apiCard.accountName ?? 'Tekući račun',
    accountNumber: apiCard.account_number ?? apiCard.accountNumber ?? '',
    limitDaily: apiCard.limit_daily ?? apiCard.limitDaily ?? 0,
    limitMonthly: apiCard.limit_monthly ?? apiCard.limitMonthly ?? 0,
    limitTotal: apiCard.limit ?? apiCard.limitTotal ?? 0,
    status: apiCard.status ?? CARD_STATUS.ACTIVE,
    transactions: apiCard.transactions ?? [],
  };
}
