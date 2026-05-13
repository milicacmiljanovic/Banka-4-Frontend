function extractFundsList(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.funds)) return body.funds;
  return [];
}

function deriveApiBaseFromRequestUrl(url: string): string {
  const marker = '/investment-funds';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return url.slice(0, idx);
}

function normalizeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

module.exports = {
  extractFundsList,
  deriveApiBaseFromRequestUrl,
  normalizeNumber,
};
