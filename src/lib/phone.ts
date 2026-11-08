// Phones are stored in international format without "+" (972501234567) so
// they work in wa.me links. Israeli local numbers are converted automatically.

export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    // Already international.
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // Israeli local: 050-1234567 (mobile, 10 digits) or 03-1234567 (landline, 9).
    if (digits.length !== 9 && digits.length !== 10) return null;
    digits = `972${digits.slice(1)}`;
  } else if (/^5\d{8}$/.test(digits)) {
    // Mobile typed without the leading 0.
    digits = `972${digits}`;
  }

  // People often write +972-050-...; the 0 after the country code is dropped.
  if (digits.startsWith("9720")) digits = `972${digits.slice(4)}`;

  // Israeli numbers: 972 + 8 or 9 digits.
  if (digits.startsWith("972")) {
    const local = digits.slice(3);
    return /^[1-9]\d{7,8}$/.test(local) ? digits : null;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

// 972501234567 -> 050-123-4567 for display; other countries -> +<digits>.
export function formatPhone(phone: string): string {
  const m = /^972(5\d)(\d{3})(\d{4})$/.exec(phone);
  if (m) return `0${m[1]}-${m[2]}-${m[3]}`;
  const l = /^972([2-9])(\d{3})(\d{4})$/.exec(phone);
  if (l) return `0${l[1]}-${l[2]}-${l[3]}`;
  return `+${phone}`;
}
