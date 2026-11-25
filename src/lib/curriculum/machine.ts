export type MachineTool = "shell" | "git" | "sql";

export type MachineTask = {
  id: string;
  tool: MachineTool;
  title: string;
  command: string;
  mode: "exact" | "contains";
  expect: string;
  note: string;
};

/** คำสั่งเหล่านี้ไม่ได้ถูกรันในแอป ผู้เรียนวางผลจากเครื่อง Ubuntu ของตน */
export const MACHINE_TASKS: MachineTask[] = [
  {
    id: "sh-echo",
    tool: "shell",
    title: "เชลล์พิมพ์ข้อความที่กำหนด",
    command: "printf '%s\\n' praxis",
    mode: "exact",
    expect: "praxis",
    note: "ผลที่ได้ต้องเป็นคำว่า praxis บรรทัดเดียว แอปไม่ได้สั่งเชลล์นี้",
  },
  {
    id: "sh-uname",
    tool: "shell",
    title: "ชื่อระบบของเครื่อง",
    command: "uname",
    mode: "contains",
    expect: "Linux",
    note: "ใบงานนี้สำหรับ Ubuntu ถ้าผลไม่ใช่ Linux แสดงว่ายังไม่ได้รันบนเครื่องนั้น",
  },
  {
    id: "git-version",
    tool: "git",
    title: "Git ที่ติดตั้งอยู่",
    command: "git --version",
    mode: "contains",
    expect: "git version",
    note: "ถ้าคำสั่งไม่พบ แปลว่ายังไม่มี Git บนเครื่อง อย่าพิมพ์คำว่า git version เองเพื่อให้ผ่าน",
  },
  {
    id: "sql-add",
    tool: "sql",
    title: "SQLite ตอบเลขจากนิพจน์",
    command: "sqlite3 :memory: \"SELECT 2+2;\"",
    mode: "exact",
    expect: "4",
    note: "ต้องมีคำสั่ง sqlite3 บน Ubuntu ถ้ายังไม่มี ให้ติดตั้งก่อน แอปไม่ได้เปิดฐานข้อมูล",
  },
  {
    id: "sql-sum",
    tool: "sql",
    title: "รวมแถวในตารางชั่วคราว",
    command: "sqlite3 :memory: \"CREATE TABLE n(v INT); INSERT INTO n VALUES (3); INSERT INTO n VALUES (4); SELECT SUM(v) FROM n;\"",
    mode: "exact",
    expect: "7",
    note: "ฐานอยู่ในความจำของ sqlite3 แล้วหายเมื่อคำสั่งจบ ไม่ได้ถูกสร้างโดยแอปนี้",
  },
];

export function matchMachineOutput(mode: MachineTask["mode"], expect: string, actual: string): boolean {
  const got = actual.replace(/\r\n/g, "\n").trim();
  if (mode === "exact") return got === expect.trim();
  return got.toLowerCase().includes(expect.trim().toLowerCase());
}
