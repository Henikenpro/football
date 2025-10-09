// lib/i18n.ts
export type FormatOptions = {
  timeOnly?: boolean;
  shortTime?: boolean;
  fullDate?: boolean;
  locale?: string;
  timeZone?: string;
};

const DEFAULT_LOCALE = 'vi-VN';
const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

export function translateStatus(longStatus?: string, shortStatus?: string) {
  if (!longStatus && !shortStatus) return '';

  const s = (longStatus || shortStatus || '').toLowerCase();

  const map: Record<string, string> = {
    'first half': 'Hiệp 1',
    'second half': 'Hiệp 2',
    'half time': 'Nghỉ giữa hiệp',
    'full time': 'Hết giờ',
    'extra time': 'Hiệp phụ',
    'penalties': 'Luân lưu',
    'postponed': 'Hoãn',
    'cancelled': 'Hủy',
    'abandoned': 'Bị dừng',
    'not started': 'Chưa bắt đầu',
    'scheduled': 'Lịch thi đấu',
    'live': 'Trực tiếp',
    '1h': 'Hiệp 1',
    '2h': 'Hiệp 2',
    'ht': 'Nghỉ giữa hiệp',
    'ft': 'Hết giờ',
    'et': 'Hiệp phụ',
  };

  // try exact match on longStatus
  const keyLong = (longStatus || '').trim().toLowerCase();
  if (map[keyLong]) return map[keyLong];

  // try short
  const keyShort = (shortStatus || '').trim().toLowerCase();
  if (map[keyShort]) return map[keyShort];

  // fallback: capitalize original longStatus
  if (longStatus) {
    return longStatus;
  }
  return shortStatus ?? '';
}

export function translateBadgeText(shortStatus?: string, longStatus?: string) {
  // badge text often shorter, prefer:
  if (!shortStatus && !longStatus) return '';
  const shortLower = (shortStatus || '').toLowerCase();
  if (shortLower === 'live' || shortLower === '1h' || shortLower === '2h' || shortLower === 'ht') {
    return 'Trực tiếp';
  }
  if (shortLower === 'ft') return 'Kết thúc';
  return translateStatus(longStatus, shortStatus);
}

export function formatDateTime(isoOrDate: string | Date, opts: FormatOptions = {}) {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const timeZone = opts.timeZone ?? DEFAULT_TZ;

  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;

  if (opts.timeOnly || opts.shortTime) {
    const formatOptions: Intl.DateTimeFormatOptions = opts.shortTime
      ? { hour: '2-digit', minute: '2-digit', timeZone }
      : { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone };
    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  }

  if (opts.fullDate) {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(date);
  }

  // default: date + time (short)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}