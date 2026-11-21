export function bangkokDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function streakEndingToday(days: Record<string, number>, minSeconds = 60): number {
  const today = bangkokDate();
  let cursor = (days[today] ?? 0) >= minSeconds ? today : addDays(today, -1);
  if ((days[cursor] ?? 0) < minSeconds) return 0;
  let n = 0;
  while ((days[cursor] ?? 0) >= minSeconds) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export const PLAN_BLOCKS = [
  { id: "theory", label: "ทฤษฎี", minutes: 30, detail: "อ่านเป้าหมายและแนวคิดของบทที่กำลังเรียน" },
  { id: "lab", label: "ลงมือเขียน", minutes: 45, detail: "ทำแล็บหรือสนามทดลอง จนกว่าเทสต์จะผ่าน" },
  { id: "exercise", label: "แบบฝึก", minutes: 30, detail: "คำถามระหว่างทาง หรือโจทย์หาบั๊ก" },
  { id: "review", label: "ทบทวน", minutes: 15, detail: "คำศัพท์ ข้อผิดพลาด และบันทึกสิ่งที่พลาด" },
] as const;
