// utils/formatters/date.ts
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatDateISO(dateIso: string, pattern = "HH:mm dd/MM/yyyy") {
  try {
    const dt = parseISO(dateIso);
    return format(dt, pattern, { locale: vi });
  } catch {
    return dateIso;
  }
}