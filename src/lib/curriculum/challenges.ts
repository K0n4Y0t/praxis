import type { Challenge } from "./types";
import { CORE_CHALLENGES } from "./challenges-core.ts";
import { MORE_CHALLENGES } from "./challenges-more.ts";

const CHALLENGE_BASE: Challenge[] = [
  {
    id: "c-debug-total",
    semester: 1,
    title: "ผลรวมที่เหลือแค่ตัวสุดท้าย",
    level: "beginner",
    kind: "debug",
    prompt: "ฟังก์ชันควรคืนผลรวมทั้งลิสต์ แต่ตอนนี้ให้ค่าผิด จงแก้เฉพาะจุดที่ทำให้ความจำระหว่างวนหายไป",
    code: "def total(nums):\n    for n in nums:\n        acc = 0\n        acc = acc + n\n    return acc\n",
    tests: [{ name: "1+2+3", expected: "6", harness: "print(total([1, 2, 3]))\n" }],
    hints: [
      "ดูว่า acc เกิดใหม่ทุกครั้งที่วนหรือไม่",
      "ตัวสะสมต้องอยู่ก่อน for",
      "ข้างในลูปควรบวกเพิ่ม ไม่ใช่ตั้งต้นใหม่",
      "หลังย้ายบรรทัด สมาชิกทุกตัวต้องถูกบวกเข้าก้อนเดิม",
    ],
    solution: "def total(nums):\n    acc = 0\n    for n in nums:\n        acc = acc + n\n    return acc\n",
    why: "การสร้าง acc ในลูปทิ้งค่าของรอบก่อนทุกครั้ง จึงเหลือเพียงตัวสุดท้าย",
  },
  {
    id: "c-find-index",
    semester: 1,
    title: "หาบั๊กโดยไม่มีธง",
    level: "beginner",
    kind: "find",
    prompt:
      "โปรแกรมนี้ตั้งใจพิมพ์ตัวแรกของลิสต์แต่กลับหยุดหรือให้ค่าผิด หาบรรทัดสาเหตุ แก้ และอธิบายในใจก่อนเปิดเฉลยว่าดัชนีเริ่มที่เท่าไร",
    code: "items = [\"กาแฟ\", \"ชา\", \"น้ำ\"]\nprint(items[1])\n",
    tests: [{ name: "ตัวแรก", expected: "กาแฟ" }],
    hints: [
      "โจทย์อยากได้ตัวแรก ไม่ใช่ตัวที่สอง",
      "ตำแหน่งในลิสต์ไม่ได้เริ่มที่ 1",
      "ลองพิมพ์ len และสมาชิกทีละช่อง",
      "ช่องของกาแฟคือ 0",
    ],
    solution: "items = [\"กาแฟ\", \"ชา\", \"น้ำ\"]\nprint(items[0])\n",
    why: "ดัชนี 1 คือชา ซึ่งเป็นตัวที่สอง ความเข้าใจผิดเรื่องจุดเริ่มทำให้ดูเหมือนข้อมูลหาย",
  },
  {
    id: "c-predict-branch",
    semester: 1,
    title: "ทายผลก่อนรัน",
    level: "beginner",
    kind: "predict",
    prompt: "อย่ารันทันที ทายว่าคอนโซลจะพิมพ์อะไรทั้งก้อน รวมการขึ้นบรรทัด แล้วค่อยปลดล็อกรันเพื่อเทียบ",
    code: "x = 5\nif x > 5:\n    print(\"high\")\nelif x == 5:\n    print(\"mid\")\nelse:\n    print(\"low\")\nprint(\"done\")\n",
    accept: ["mid\ndone", "mid\ndone\n"],
    hints: [
      "มี print นอกเงื่อนไขหนึ่งครั้งเสมอ",
      "x เท่ากับ 5 พอดี ไม่เกิน",
      "elif ที่ตรวจความเท่าจะถูกเลือก",
      "ดังนั้นสองบรรทัดคือ mid แล้ว done",
    ],
    solution: "mid\ndone",
    why: "เงื่อนไขแรกเท็จ เงื่อนไขที่สองจริง และบรรทัดท้ายอยู่นอกบล็อกจึงทำงานเสมอ",
  },
  {
    id: "c-reverse-count",
    semester: 1,
    title: "ย้อนจากผลลัพธ์",
    level: "intermediate",
    kind: "reverse",
    prompt: "จงเขียนโปรแกรมที่พิมพ์ 3 แล้ว 2 แล้ว 1 แล้ว go โดยใช้ลูป ไม่พิมพ์สี่บรรทัดแยกโดยไม่มีลูป",
    code: "# พิมพ์\n# 3\n# 2\n# 1\n# go\n",
    tests: [{ name: "นับถอยหลัง", expected: "3\n2\n1\ngo" }],
    hints: [
      "range ใส่จุดเริ่ม จุดหยุด และก้าวติดลบได้",
      "จุดหยุดไม่ถูกรวมเหมือน range ปกติ",
      "หลังลูปค่อยพิมพ์ go",
      "range(3, 0, -1) ให้ 3, 2, 1",
    ],
    solution: "for n in range(3, 0, -1):\n    print(n)\nprint(\"go\")\n",
    why: "ก้าวติดลบเดินถอยหลังและหยุดก่อน 0 จากนั้นงานคนละชนิดคือคำว่า go อยู่ถัดจากลูป",
  },
  {
    id: "c-design-guard",
    semester: 1,
    title: "เลือกทางที่กันความเสียหาย",
    level: "intermediate",
    kind: "design",
    prompt:
      "มีสองแบบในใจ: ถอนเงินแล้วค่อยตรวจยอด หรือตรวจยอดก่อนแล้วค่อยถอน จงเขียน withdraw(balance, amount) ที่คืนยอดใหม่เฉพาะเมื่อพอ ไม่งั้นคืนยอดเดิม แบบที่ตรวจทีหลังไม่ผ่านเจตนานี้",
    code: "def withdraw(balance, amount):\n    return balance - amount\n",
    tests: [
      {
        name: "พอและไม่พอ",
        expected: "70\n40",
        harness: "print(withdraw(100, 30))\nprint(withdraw(40, 50))\n",
      },
    ],
    hints: [
      "ฟังก์ชันนี้คืนยอด ไม่ได้แก้ dict",
      "ถ้า amount มากกว่า balance ห้ามคืนค่าที่ติดลบ",
      "ใช้เงื่อนไขก่อนลบ",
      "กรณีไม่พอให้ return balance เดิม",
    ],
    solution:
      "def withdraw(balance, amount):\n    if amount > balance:\n        return balance\n    return balance - amount\n",
    why: "การตรวจก่อนเปลี่ยนค่ากันสถานะเสีย ส่วนการลบก่อนแล้วค่อยแก้กลับทำให้มีจังหวะที่ข้อมูลผิดและพลาดได้ง่าย",
  },
  {
    id: "c-debug-key",
    semester: 1,
    title: "คีย์คนละชนิด",
    level: "advanced",
    kind: "debug",
    prompt: "dict นี้มีข้อมูล แต่บรรทัดพิมพ์กลับล้ม จงทำให้พิมพ์ 2 ได้โดยเข้าใจว่าคีย์เป็นข้อความหรือตัวเลข",
    code: "scores = {\"1\": 2}\nprint(scores[1])\n",
    tests: [{ name: "ได้ค่า", expected: "2" }],
    hints: [
      "ดูชนิดของคีย์ในวงเล็บปีกกา",
      "1 กับ \"1\" ไม่ใช่คีย์เดียวกัน",
      "KeyError แปลว่าไม่มีคีย์นั้น ไม่ใช่ว่าค่าหาย",
      "ถามด้วย \"1\" หรือเก็บคีย์เป็นตัวเลขตั้งแต่ต้น ให้เลือกอย่างใดอย่างหนึ่งให้ตรงกัน",
    ],
    solution: "scores = {\"1\": 2}\nprint(scores[\"1\"])\n",
    why: "ชนิดของคีย์เป็นส่วนหนึ่งของตัวตนคีย์ ตัวเลข 1 จึงไปคนละช่องกับข้อความ \"1\"",
  },
];

export const CHALLENGES: Challenge[] = [...CHALLENGE_BASE, ...CORE_CHALLENGES, ...MORE_CHALLENGES];
