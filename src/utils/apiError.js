export function getErrorMessage(err, fallback = 'Došlo je do greške.') {
  if (!err) return fallback;

  // Ako axios interceptor već vraća err.response?.data ili err
  const data = err?.response?.data ?? err;

  if (typeof data === 'string') return data;

  // Tipični backend formati
  if (data?.message && typeof data.message === 'string') return data.message;
  if (data?.error && typeof data.error === 'string') return data.error;

  // Validacije često dolaze kao errors: { field: ["msg"] } ili array
  if (data?.errors) {
    if (Array.isArray(data.errors)) return data.errors.join(', ');
    if (typeof data.errors === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(data.errors)) {
        if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
        else if (typeof v === 'string') parts.push(`${k}: ${v}`);
      }
      if (parts.length) return parts.join(' | ');
    }
  }

  // Go validator format: "Key: 'X' Error:Field validation for 'Y' failed on the 'required' tag"
  if (typeof data?.toString === 'function') {
    const s = String(data);
    if (s.includes("failed on the 'required' tag")) return 'Popunite sva obavezna polja.';
    if (s.startsWith('Key:')) return s.replace(/^Key:\s*/, '');
  }

  return fallback;
}