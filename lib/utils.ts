export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00',
];

export const DURATION_OPTIONS = [
  { value: 1, label: '1 Hour' },
  { value: 2, label: '2 Hours' },
  { value: 3, label: '3 Hours' },
  { value: 4, label: '4 Hours' },
];

export const BOOKING_STATUSES = {
  PENDING: { label: 'Pending', color: '#f59e0b' },
  CONFIRMED: { label: 'Confirmed', color: '#10b981' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444' },
  COMPLETED: { label: 'Completed', color: '#6366f1' },
};

export function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newH = h + hours;
  if (newH >= 24) return '00:00'; // overflow guard
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isSlotAvailable(
  startTime: string,
  duration: number,
  bookedSlots: Array<{ startTime: string; endTime: string; status: string }>
): boolean {
  const endTime = addHours(startTime, duration);
  const [startH] = startTime.split(':').map(Number);
  const [endH] = endTime.split(':').map(Number);

  for (const booked of bookedSlots) {
    if (booked.status === 'CANCELLED') continue;
    const [bookedStartH] = booked.startTime.split(':').map(Number);
    const [bookedEndH] = booked.endTime.split(':').map(Number);
    // Check overlap
    if (startH < bookedEndH && endH > bookedStartH) {
      return false;
    }
  }
  return true;
}
