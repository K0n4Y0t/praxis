import type { Check } from "./types";
import { EXAM_REST } from "./exam-rest.ts";

/** ข้อสอบทฤษฎีภาค 1 ใช้เป็นส่วน theory ของเกณฑ์ ไม่ใช่ข้อสอบทั้งภาค */
export const EXAM_S1: Check[] = [
  {
    id: "ex1-1",
    kind: "mcq",
    prompt: "ข้อใดเกิดก่อนที่โปรแกรมจะเริ่มทำคำสั่งแรก",
    choices: ["NameError", "SyntaxError", "KeyError", "TimeoutError"],
    answer: 0,
    explain: "SyntaxError คือความผิดของโครงสร้าง ประโยคยังไม่ถูกจึงยังไม่เริ่มรัน",
  },
  {
    id: "ex1-2",
    kind: "mcq",
    prompt: "range(1, 4) ให้ค่าใด",
    choices: ["1, 2, 3, 4", "1, 2, 3", "0, 1, 2, 3", "4"],
    answer: 1,
    explain: "ขอบขวาไม่ถูกรวม จึงได้ 1, 2 และ 3",
  },
  {
    id: "ex1-3",
    kind: "short",
    prompt: "คำสั่งที่ส่งค่ากลับจากฟังก์ชันคือคำว่าอะไร",
    accept: ["return"],
    explain: "return ส่งค่าให้ผู้เรียก print ทำหน้าที่คนละอย่าง",
  },
  {
    id: "ex1-4",
    kind: "mcq",
    prompt: "ลิสต์สามช่อง ดัชนีสุดท้ายคือเลขอะไร",
    choices: ["3", "2", "1", "0"],
    answer: 1,
    explain: "ดัชนีคือ 0, 1, 2 จึงสุดที่ 2 ซึ่งเท่ากับความยาวลบหนึ่ง",
  },
  {
    id: "ex1-5",
    kind: "mcq",
    prompt: "input() ในบทเรียนนี้คืนค่าชนิดใด",
    choices: ["int เสมอ", "str เสมอ", "bool", "dict"],
    answer: 1,
    explain: "การอ่านบรรทัดได้ข้อความ แม้ผู้ใช้จะพิมพ์ตัวเลข ต้องแปลงเอง",
  },
  {
    id: "ex1-6",
    kind: "short",
    prompt: "error ที่เกิดเมื่อขอคีย์ที่ไม่มีใน dict ชื่อว่าอะไร",
    accept: ["keyerror", "key error"],
    explain: "KeyError ระบุว่าไม่มีคีย์นั้น",
  },
  {
    id: "ex1-7",
    kind: "mcq",
    prompt: "ข้อใดคือเหตุผลที่ตัวรันบทเรียนไม่ให้เปิดไฟล์ในเครื่อง",
    choices: [
      "เพราะ Python เปิดไฟล์ไม่ได้",
      "เพราะการอ่านไฟล์คือการเข้าถึงข้อมูลนอกโปรแกรม",
      "เพราะไฟล์ใช้ได้เฉพาะภาษาซี",
      "เพราะ print แทน open ได้ทุกกรณี",
    ],
    answer: 1,
    explain: "ตัวรันในหน้าเว็บตัดการเข้าถึงไฟล์เพื่อไม่ให้โค้ดฝึกแตะข้อมูลส่วนตัว",
  },
  {
    id: "ex1-8",
    kind: "mcq",
    prompt: "เทสต์ผ่านแปลว่าอะไรได้ตรงที่สุด",
    choices: [
      "โปรแกรมถูกทุกกรณีในโลก",
      "กรณีที่เทสต์ระบุให้ผลตรงที่คาด",
      "ไม่จำเป็นต้องอ่านโค้ดอีก",
      "ผู้เรียนเข้าใจทุกบทแล้ว",
    ],
    answer: 1,
    explain: "เทสต์จับเฉพาะกรณีที่เขียนไว้ มันมีค่า แต่ไม่ได้แทนความเข้าใจทั้งก้อน",
  },
];

export function examForSemester(semesterId: number): Check[] {
  if (semesterId === 1) return EXAM_S1;
  return EXAM_REST[semesterId] ?? [];
}
