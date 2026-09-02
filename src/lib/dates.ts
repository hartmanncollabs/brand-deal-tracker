import { format, parseISO, isValid } from 'date-fns';

// Safe date formatter — never throws on malformed/out-of-range dates (e.g. year 62026).
// Returns the fallback instead of crashing the render tree.
export function safeFormat(dateString: string | null | undefined, fmt: string, fallback = '—'): string {
  if (!dateString) return fallback;
  try {
    const d = parseISO(dateString);
    if (!isValid(d) || d.getFullYear() > 2200 || d.getFullYear() < 1900) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}
