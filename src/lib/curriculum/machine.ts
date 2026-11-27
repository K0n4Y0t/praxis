export type MachineTool = "shell" | "git" | "sql";

export type MachineTask = {
  id: string;
  tool: MachineTool;
  title: string;
  command: string;
  mode: "exact" | "contains";
  expect: string;
  note: string;
  /** ลำดับที่คนทำบน Ubuntu แอปไม่รันขั้นเหล่านี้ */
  steps?: string[];
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
  {
    id: "sh-count",
    tool: "shell",
    title: "ใบงานเชลล์ นับบรรทัดที่เครื่องคุณสร้าง",
    command: "mkdir -p \"$HOME/praxis-lab\" && printf '%s\\n' one two three | awk 'END{print NR}' > \"$HOME/praxis-lab/count.txt\" && cat \"$HOME/praxis-lab/count.txt\"",
    mode: "exact",
    expect: "3",
    steps: [
      "เปิดเทอร์มินัลบน Ubuntu ไม่ใช่ช่องรันของหน้าบทเรียน",
      "คัดลอกคำสั่งทั้งก้อน มันสร้างโฟลเดอร์ praxis-lab ในบ้านคุณ แล้วนับสามบรรทัด",
      "วางสิ่งที่เทอร์มินัลพิมพ์กลับมาในช่องด้านล่าง",
    ],
    note: "คำตอบที่ถูกคือเลข 3 บรรทัดเดียว ถ้าคุณพิมพ์ 3 เองโดยไม่รัน แอปแยกไม่ออก แต่มันก็ไม่ได้รันเชลล์ให้",
  },
  {
    id: "git-subject",
    tool: "git",
    title: "ใบงาน Git สร้างคอมมิตแล้วอ่านหัวเรื่อง",
    command: "mkdir -p \"$HOME/praxis-lab\" && cd \"$HOME/praxis-lab\" && git init -q && printf '%s\\n' one > nums.txt && git add nums.txt && git -c user.email=praxis@example.com -c user.name=Praxis commit -q -m start --allow-empty && git log -1 --format=%s",
    mode: "exact",
    expect: "start",
    steps: [
      "รันบน Ubuntu เครื่องที่มี Git แล้ว ถ้าคำสั่งไม่พบ แปลว่ายังไม่ได้ติดตั้ง",
      "คัดลอกทั้งก้อน คำสั่งตั้งชื่อและอีเมลเฉพาะตอนคอมมิตนี้ ไม่ได้เปลี่ยนค่า Git ทั้งเครื่อง",
      "วางบรรทัดที่ git log พิมพ์ ต้องเป็นหัวเรื่องคอมมิต ไม่ใช่ประโยคว่าคุณรันแล้ว",
    ],
    note: "ผลที่ตรงคือคำว่า start แอปไม่เห็นโฟลเดอร์ของคุณและไม่ได้เป็นฝ่ายคอมมิต",
  },
  {
    id: "sql-where",
    tool: "sql",
    title: "ใบงาน SQL คัดแถวที่มากกว่าเกณฑ์",
    command: "sqlite3 :memory: \"CREATE TABLE item(name TEXT, n INT); INSERT INTO item VALUES ('pen', 2); INSERT INTO item VALUES ('book', 9); SELECT name FROM item WHERE n > 3;\"",
    mode: "exact",
    expect: "book",
    steps: [
      "บน Ubuntu ต้องมีคำสั่ง sqlite3 ถ้าไม่มี ให้ติดตั้งแพ็กเกจ sqlite3 ก่อน",
      "คัดลอกคำสั่งไปรัน ฐานนี้เกิดในความจำแล้วหาย ไม่มีไฟล์ให้แอปเปิด",
      "วางชื่อที่ถูกคัดไว้ หนึ่งบรรทัด",
    ],
    note: "ผลที่ตรงคือ book เพราะ 9 มากกว่า 3 ส่วน pen ถูกทิ้ง แอปไม่ได้เปิดฐานข้อมูล",
  },
];

export function matchMachineOutput(mode: MachineTask["mode"], expect: string, actual: string): boolean {
  const got = actual.replace(/\r\n/g, "\n").trim();
  if (mode === "exact") return got === expect.trim();
  return got.toLowerCase().includes(expect.trim().toLowerCase());
}
