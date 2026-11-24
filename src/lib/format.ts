export function formatIDR(amount: number, hide = false): string {
  if (hide) return 'Rp ••••••';
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rp${Math.abs(Math.round(amount)).toLocaleString('id-ID')}`;
}

export function formatTimeInTZ(isoString: string, timezone: string): string {
  if (!isoString) return 'Belum dicatat';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(d);
  } catch {
    return isoString.slice(11, 16);
  }
}

export function formatDateInTZ(isoString: string, timezone: string): string {
  if (!isoString) return '-';
  try {
    const normalized = isoString.length === 10 ? `${isoString}T00:00:00+07:00` : isoString;
    const d = new Date(normalized);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: timezone,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function addMinutesToIso(dateStr: string, timeStr: string, minutes: number): string {
  const d = new Date(`${dateStr}T${timeStr}:00+07:00`);
  d.setMinutes(d.getMinutes() + (Number(minutes) || 30));
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:00+07:00`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
