export type DurationUnit = 'hours' | 'days' | 'months' | 'perm';

export interface ParsedDuration {
  totalHours: number;
  unit: DurationUnit;
  value: number;
  isPerm: boolean;
  displayText: string;
}

/**
 * Parses any penalty string or explicit numbers into total hours and duration metadata
 */
export function parsePenaltyDuration(
  penalty: string,
  explicitHours?: number,
  explicitDays?: number,
  isPermTier?: boolean
): ParsedDuration {
  if (isPermTier || penalty.includes('بيرم') || penalty.includes('دائم') || penalty.includes('نهائي')) {
    return {
      totalHours: 999999,
      unit: 'perm',
      value: 0,
      isPerm: true,
      displayText: 'باند نهائي (بيرمنتلي)',
    };
  }

  // Check explicit hours
  if (typeof explicitHours === 'number' && !isNaN(explicitHours) && explicitHours >= 0) {
    if (explicitHours === 0) {
      return { totalHours: 0, unit: 'hours', value: 0, isPerm: false, displayText: 'وورن / تحذير' };
    }
    if (explicitHours >= 24 && explicitHours % 24 === 0) {
      const days = explicitHours / 24;
      if (days >= 30 && days % 30 === 0) {
        const months = days / 30;
        return {
          totalHours: explicitHours,
          unit: 'months',
          value: months,
          isPerm: false,
          displayText: months === 1 ? 'شهر واحد' : months === 2 ? 'شهرين' : `${months} أشهر`,
        };
      }
      return {
        totalHours: explicitHours,
        unit: 'days',
        value: days,
        isPerm: false,
        displayText: days === 1 ? 'يوم واحد' : days === 2 ? 'يومين' : `${days} أيام`,
      };
    }
    return {
      totalHours: explicitHours,
      unit: 'hours',
      value: explicitHours,
      isPerm: false,
      displayText: explicitHours === 1 ? 'ساعة واحدة' : explicitHours === 2 ? 'ساعتين' : `${explicitHours} ساعة`,
    };
  }

  // Check explicit days
  if (typeof explicitDays === 'number' && !isNaN(explicitDays) && explicitDays > 0) {
    const totalHours = explicitDays * 24;
    return {
      totalHours,
      unit: 'days',
      value: explicitDays,
      isPerm: false,
      displayText: explicitDays === 1 ? 'يوم واحد' : explicitDays === 2 ? 'يومين' : `${explicitDays} أيام`,
    };
  }

  const p = penalty.toLowerCase();

  // Common phrases in Arabic
  if (p.includes('شهرين')) return { totalHours: 1440, unit: 'months', value: 2, isPerm: false, displayText: 'شهرين (60 يوم)' };
  if (p.includes('شهر')) return { totalHours: 720, unit: 'months', value: 1, isPerm: false, displayText: 'شهر واحد (30 يوم)' };
  if (p.includes('3 اسابيع') || p.includes('ثلاث اسابيع')) return { totalHours: 504, unit: 'days', value: 21, isPerm: false, displayText: '21 يوم (3 أسابيع)' };
  if (p.includes('اسبوعين') || p.includes('أسبوعين')) return { totalHours: 336, unit: 'days', value: 14, isPerm: false, displayText: '14 يوم (أسبوعين)' };
  if (p.includes('اسبوع') || p.includes('أسبوع') || p.includes('7 ايام')) return { totalHours: 168, unit: 'days', value: 7, isPerm: false, displayText: '7 أيام (أسبوع)' };
  if (p.includes('5 ايام') || p.includes('خمس ايام')) return { totalHours: 120, unit: 'days', value: 5, isPerm: false, displayText: '5 أيام' };
  if (p.includes('4 ايام') || p.includes('اربع ايام')) return { totalHours: 96, unit: 'days', value: 4, isPerm: false, displayText: '4 أيام' };
  if (p.includes('3 ايام') || p.includes('ثلاث ايام')) return { totalHours: 72, unit: 'days', value: 3, isPerm: false, displayText: '3 أيام (72 ساعة)' };
  if (p.includes('يومين') || p.includes('48 ساع')) return { totalHours: 48, unit: 'days', value: 2, isPerm: false, displayText: 'يومين (48 ساعة)' };
  if (p.includes('يوم') || p.includes('24 ساع')) return { totalHours: 24, unit: 'days', value: 1, isPerm: false, displayText: '24 ساعة (يوم واحد)' };

  // Hours
  if (p.includes('12 ساع')) return { totalHours: 12, unit: 'hours', value: 12, isPerm: false, displayText: '12 ساعة' };
  if (p.includes('9 ساع')) return { totalHours: 9, unit: 'hours', value: 9, isPerm: false, displayText: '9 ساعات' };
  if (p.includes('7 ساع')) return { totalHours: 7, unit: 'hours', value: 7, isPerm: false, displayText: '7 ساعات' };
  if (p.includes('6 ساع')) return { totalHours: 6, unit: 'hours', value: 6, isPerm: false, displayText: '6 ساعات' };
  if (p.includes('5 ساع')) return { totalHours: 5, unit: 'hours', value: 5, isPerm: false, displayText: '5 ساعات' };
  if (p.includes('4 ساع')) return { totalHours: 4, unit: 'hours', value: 4, isPerm: false, displayText: '4 ساعات' };
  if (p.includes('3 ساع')) return { totalHours: 3, unit: 'hours', value: 3, isPerm: false, displayText: '3 ساعات' };
  if (p.includes('ساعتين') || p.includes('2 ساع')) return { totalHours: 2, unit: 'hours', value: 2, isPerm: false, displayText: 'ساعتين' };
  if (p.includes('ساعه') || p.includes('ساعة') || p.includes('1 ساع')) return { totalHours: 1, unit: 'hours', value: 1, isPerm: false, displayText: 'ساعة واحدة' };

  // Try extracting number with keywords
  const numMatch = penalty.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (p.includes('ساع') || p.includes('hour')) {
      return { totalHours: num, unit: 'hours', value: num, isPerm: false, displayText: `${num} ساعة` };
    }
    if (p.includes('يوم') || p.includes('ايام') || p.includes('أيام') || p.includes('day')) {
      return { totalHours: num * 24, unit: 'days', value: num, isPerm: false, displayText: `${num} يوم` };
    }
    if (p.includes('شهر') || p.includes('شهور') || p.includes('month')) {
      return { totalHours: num * 720, unit: 'months', value: num, isPerm: false, displayText: `${num} شهر` };
    }
    // Default to hours if <= 24, otherwise days
    if (num <= 24) {
      return { totalHours: num, unit: 'hours', value: num, isPerm: false, displayText: `${num} ساعة` };
    }
    return { totalHours: num * 24, unit: 'days', value: num, isPerm: false, displayText: `${num} يوم` };
  }

  return { totalHours: 5, unit: 'hours', value: 5, isPerm: false, displayText: '5 ساعات' };
}

/**
 * Formats total hours into high quality Arabic summary
 */
export function formatDurationArabic(totalHours: number, hasPerm: boolean): string {
  if (hasPerm) {
    return 'باند نهائي (بيرمنتلي)';
  }
  if (totalHours <= 0) {
    return '0 ساعة (تحذير / وورن)';
  }

  if (totalHours < 24) {
    if (totalHours === 1) return 'ساعة واحدة';
    if (totalHours === 2) return 'ساعتين';
    if (totalHours <= 10) return `${totalHours} ساعات`;
    return `${totalHours} ساعة`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  const months = Math.floor(totalDays / 30);
  const daysAfterMonths = totalDays % 30;

  const parts: string[] = [];
  if (months > 0) {
    parts.push(months === 1 ? 'شهر' : months === 2 ? 'شهرين' : `${months} أشهر`);
  }
  if (daysAfterMonths > 0) {
    parts.push(daysAfterMonths === 1 ? 'يوم' : daysAfterMonths === 2 ? 'يومين' : `${daysAfterMonths} أيام`);
  }
  if (remainingHours > 0) {
    parts.push(remainingHours === 1 ? 'ساعة' : remainingHours === 2 ? 'ساعتين' : `${remainingHours} ساعات`);
  }

  const breakdown = parts.join(' و ');

  if (totalHours % 24 === 0) {
    if (totalDays === 1) return `24 ساعة (يوم واحد)`;
    if (totalDays === 2) return `48 ساعة (يومين)`;
    if (totalDays === 7) return `7 أيام (أسبوع كامل)`;
    if (totalDays === 14) return `14 يوم (أسبوعين)`;
    if (totalDays === 30) return `30 يوم (شهر كامل)`;
    return `${totalDays} يوم ${parts.length > 1 ? `(${breakdown})` : ''}`;
  }

  return `${totalHours} ساعة (${breakdown})`;
}

/**
 * Generates the clean /ban command string
 */
export function generateBanCode(totalHours: number, hasPerm: boolean): string {
  if (hasPerm) return '0';
  if (totalHours <= 0) return 'warn';
  if (totalHours >= 24 && totalHours % 24 === 0) {
    return `${totalHours / 24}d`;
  }
  return `${totalHours}h`;
}
