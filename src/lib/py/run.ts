/** Teaching Python subset. Runs only in the page, with a step cap and no imports. */

export type RunError = { name: string; message: string; line?: number };

export type RunResult = {
  stdout: string;
  error: RunError | null;
  variables: { name: string; value: string }[];
  steps: number;
};

type Num = { t: "num"; v: number; float: boolean };
type Str = { t: "str"; v: string };
type Bool = { t: "bool"; v: boolean };
type Nil = { t: "none" };
type ListV = { t: "list"; v: Value[] };
type DictV = { t: "dict"; v: Map<string, Value>; keys: Value[] };
type Func = {
  t: "func";
  name: string;
  params: string[];
  body: Stmt[];
  env: Env;
};
type Bound = { t: "bound"; recv: Value; name: string };
type Builtin = { t: "builtin"; name: string };
export type Value = Num | Str | Bool | Nil | ListV | DictV | Func | Bound | Builtin;

type Env = Map<string, Value>;

type Expr =
  | { k: "num"; v: number; float: boolean; line: number }
  | { k: "str"; v: string; line: number }
  | { k: "name"; v: string; line: number }
  | { k: "bool"; v: boolean; line: number }
  | { k: "none"; line: number }
  | { k: "list"; items: Expr[]; line: number }
  | { k: "dict"; pairs: [Expr, Expr][]; line: number }
  | { k: "unary"; op: "+" | "-" | "not"; expr: Expr; line: number }
  | { k: "bin"; op: string; left: Expr; right: Expr; line: number }
  | { k: "cmp"; ops: string[]; items: Expr[]; line: number }
  | { k: "call"; callee: Expr; args: Expr[]; line: number }
  | { k: "index"; target: Expr; index: Expr; line: number }
  | { k: "attr"; target: Expr; name: string; line: number };

type Stmt =
  | { k: "expr"; expr: Expr; line: number }
  | { k: "assign"; name: string; expr: Expr; line: number }
  | { k: "aug"; name: string; op: string; expr: Expr; line: number }
  | { k: "setindex"; target: Expr; index: Expr; expr: Expr; line: number }
  | { k: "if"; arms: { test: Expr | null; body: Stmt[] }[]; line: number }
  | { k: "while"; test: Expr; body: Stmt[]; line: number }
  | { k: "for"; name: string; iter: Expr; body: Stmt[]; line: number }
  | { k: "def"; name: string; params: string[]; body: Stmt[]; line: number }
  | { k: "return"; expr: Expr | null; line: number }
  | { k: "pass"; line: number }
  | { k: "break"; line: number }
  | { k: "continue"; line: number };

class PyError extends Error {
  nameTag: string;
  line?: number;
  constructor(nameTag: string, message: string, line?: number) {
    super(message);
    this.nameTag = nameTag;
    this.line = line;
  }
}
class ReturnSignal {
  value: Value;
  constructor(value: Value) {
    this.value = value;
  }
}
class BreakSignal {}
class ContinueSignal {}

const STEP_LIMIT = 20000;

type Tok = { t: string; v: string; line: number };

const OPS = [
  "**",
  "//",
  "==",
  "!=",
  "<=",
  ">=",
  "+=",
  "-=",
  "*=",
  "/=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "<",
  ">",
  "=",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  ":",
  ",",
  ".",
];

function tokenize(src: string): Tok[] {
  const lines = src.replace(/\t/g, "    ").split("\n");
  const out: Tok[] = [];
  const indents = [0];
  let paren = 0;
  const pushLine = (content: string, line: number) => {
    let i = 0;
    const peek = () => content[i] ?? "";
    while (i < content.length) {
      const c = peek();
      if (c === " " || c === "\r") {
        i++;
        continue;
      }
      if (c === "#") break;
      if (c === '"' || c === "'") {
        const q = c;
        i++;
        let s = "";
        let closed = false;
        while (i < content.length) {
          const ch = content[i];
          if (ch === "\\") {
            const n = content[i + 1];
            const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"' };
            s += n !== undefined ? (map[n] ?? n) : "\\";
            i += 2;
            continue;
          }
          if (ch === q) {
            closed = true;
            i++;
            break;
          }
          s += ch;
          i++;
        }
        if (!closed) throw new PyError("SyntaxError", "สตริงยังไม่ปิด", line);
        out.push({ t: "str", v: s, line });
        continue;
      }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(content[i + 1] ?? ""))) {
        let s = "";
        let float = false;
        while (i < content.length && /[0-9.]/.test(content[i])) {
          if (content[i] === ".") float = true;
          s += content[i];
          i++;
        }
        out.push({ t: float ? "float" : "int", v: s, line });
        continue;
      }
      if (/[A-Za-z_\u0E00-\u0E7F]/.test(c)) {
        let s = "";
        while (i < content.length && /[A-Za-z0-9_\u0E00-\u0E7F]/.test(content[i])) {
          s += content[i];
          i++;
        }
        out.push({ t: "name", v: s, line });
        continue;
      }
      const rest = content.slice(i);
      const op = OPS.find((o) => rest.startsWith(o));
      if (!op) throw new PyError("SyntaxError", `ไม่รู้จักสัญลักษณ์ '${c}'`, line);
      if ("([{".includes(op)) paren++;
      if (")]}".includes(op)) paren--;
      out.push({ t: "op", v: op, line });
      i += op.length;
    }
  };

  lines.forEach((raw, idx) => {
    const line = idx + 1;
    const hash = stripComment(raw);
    if (hash.trim() === "") {
      if (paren > 0) return;
      return;
    }
    if (paren === 0) {
      const indent = hash.match(/^ */)?.[0].length ?? 0;
      const content = hash.slice(indent);
      if (indent > indents[indents.length - 1]) {
        indents.push(indent);
        out.push({ t: "INDENT", v: "", line });
      } else {
        while (indent < indents[indents.length - 1]) {
          indents.pop();
          out.push({ t: "DEDENT", v: "", line });
        }
        if (indent !== indents[indents.length - 1]) {
          throw new PyError("IndentationError", "ย่อหน้าไม่สอดคล้องกับบล็อกก่อนหน้า", line);
        }
      }
      pushLine(content, line);
      out.push({ t: "NL", v: "", line });
    } else {
      pushLine(hash.trim(), line);
    }
  });
  while (indents.length > 1) {
    indents.pop();
    out.push({ t: "DEDENT", v: "", line: lines.length });
  }
  out.push({ t: "EOF", v: "", line: lines.length });
  return out;
}

function stripComment(line: string): string {
  let q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      continue;
    }
    if (c === "#") return line.slice(0, i);
  }
  return line;
}

class Parser {
  i = 0;
  toks: Tok[];
  constructor(toks: Tok[]) {
    this.toks = toks;
  }
  peek(): Tok {
    return this.toks[this.i] ?? { t: "EOF", v: "", line: 0 };
  }
  eat(t: string, v?: string): Tok {
    const tok = this.peek();
    if (tok.t !== t || (v !== undefined && tok.v !== v)) {
      throw new PyError("SyntaxError", `คาดว่าจะเจอ ${v ?? t} แต่เจอ '${tok.v || tok.t}'`, tok.line);
    }
    this.i++;
    return tok;
  }
  skipNl() {
    while (this.peek().t === "NL") this.i++;
  }

  program(): Stmt[] {
    const stmts: Stmt[] = [];
    this.skipNl();
    while (this.peek().t !== "EOF") {
      stmts.push(this.stmt());
      this.skipNl();
    }
    return stmts;
  }

  block(): Stmt[] {
    this.eat("op", ":");
    this.eat("NL");
    this.eat("INDENT");
    const body: Stmt[] = [];
    while (this.peek().t !== "DEDENT" && this.peek().t !== "EOF") {
      this.skipNl();
      if (this.peek().t === "DEDENT" || this.peek().t === "EOF") break;
      body.push(this.stmt());
    }
    if (this.peek().t === "DEDENT") this.eat("DEDENT");
    if (body.length === 0) throw new PyError("SyntaxError", "บล็อกว่าง ใส่คำสั่งหรือ pass", this.peek().line);
    return body;
  }

  stmt(): Stmt {
    const tok = this.peek();
    const line = tok.line;
    if (tok.t === "name" && ["if", "elif", "else", "for", "while", "def", "return", "pass", "break", "continue"].includes(tok.v)) {
      if (tok.v === "if") return this.ifStmt();
      if (tok.v === "for") return this.forStmt();
      if (tok.v === "while") return this.whileStmt();
      if (tok.v === "def") return this.defStmt();
      if (tok.v === "return") {
        this.i++;
        if (this.peek().t === "NL" || this.peek().t === "EOF" || this.peek().t === "DEDENT") {
          if (this.peek().t === "NL") this.eat("NL");
          return { k: "return", expr: null, line };
        }
        const expr = this.expr();
        if (this.peek().t === "NL") this.eat("NL");
        return { k: "return", expr, line };
      }
      if (tok.v === "pass" || tok.v === "break" || tok.v === "continue") {
        this.i++;
        if (this.peek().t === "NL") this.eat("NL");
        return { k: tok.v, line };
      }
    }
    const checkpoint = this.i;
    if (tok.t === "name") {
      const name = tok.v;
      this.i++;
      if (this.peek().t === "op" && this.peek().v === "=") {
        this.i++;
        const expr = this.expr();
        if (this.peek().t === "NL") this.eat("NL");
        return { k: "assign", name, expr, line };
      }
      if (this.peek().t === "op" && ["+=", "-=", "*=", "/="].includes(this.peek().v)) {
        const op = this.peek().v[0];
        this.i++;
        const expr = this.expr();
        if (this.peek().t === "NL") this.eat("NL");
        return { k: "aug", name, op, expr, line };
      }
      this.i = checkpoint;
    }
    const expr = this.expr();
    if (this.peek().t === "op" && this.peek().v === "=" && expr.k === "index") {
      this.eat("op", "=");
      const value = this.expr();
      if (this.peek().t === "NL") this.eat("NL");
      return { k: "setindex", target: expr.target, index: expr.index, expr: value, line };
    }
    if (this.peek().t === "NL") this.eat("NL");
    return { k: "expr", expr, line };
  }

  ifStmt(): Stmt {
    const line = this.peek().line;
    this.eat("name", "if");
    const arms: { test: Expr | null; body: Stmt[] }[] = [];
    const test = this.expr();
    arms.push({ test, body: this.block() });
    while (this.peek().t === "name" && this.peek().v === "elif") {
      this.i++;
      const t = this.expr();
      arms.push({ test: t, body: this.block() });
    }
    if (this.peek().t === "name" && this.peek().v === "else") {
      this.i++;
      arms.push({ test: null, body: this.block() });
    }
    return { k: "if", arms, line };
  }

  whileStmt(): Stmt {
    const line = this.peek().line;
    this.eat("name", "while");
    const test = this.expr();
    return { k: "while", test, body: this.block(), line };
  }

  forStmt(): Stmt {
    const line = this.peek().line;
    this.eat("name", "for");
    const nameTok = this.eat("name");
    this.eat("name", "in");
    const iter = this.expr();
    return { k: "for", name: nameTok.v, iter, body: this.block(), line };
  }

  defStmt(): Stmt {
    const line = this.peek().line;
    this.eat("name", "def");
    const name = this.eat("name").v;
    this.eat("op", "(");
    const params: string[] = [];
    if (!(this.peek().t === "op" && this.peek().v === ")")) {
      params.push(this.eat("name").v);
      while (this.peek().t === "op" && this.peek().v === ",") {
        this.i++;
        params.push(this.eat("name").v);
      }
    }
    this.eat("op", ")");
    return { k: "def", name, params, body: this.block(), line };
  }

  expr(): Expr {
    return this.or();
  }
  or(): Expr {
    let left = this.and();
    while (this.peek().t === "name" && this.peek().v === "or") {
      const line = this.peek().line;
      this.i++;
      left = { k: "bin", op: "or", left, right: this.and(), line };
    }
    return left;
  }
  and(): Expr {
    let left = this.not();
    while (this.peek().t === "name" && this.peek().v === "and") {
      const line = this.peek().line;
      this.i++;
      left = { k: "bin", op: "and", left, right: this.not(), line };
    }
    return left;
  }
  not(): Expr {
    if (this.peek().t === "name" && this.peek().v === "not") {
      const line = this.peek().line;
      this.i++;
      return { k: "unary", op: "not", expr: this.not(), line };
    }
    return this.cmp();
  }
  cmp(): Expr {
    const items = [this.add()];
    const ops: string[] = [];
    while (this.isCmp()) {
      ops.push(this.cmpOp());
      items.push(this.add());
    }
    if (ops.length === 0) return items[0];
    return { k: "cmp", ops, items, line: items[0].line };
  }
  isCmp(): boolean {
    const t = this.peek();
    if (t.t === "op" && ["==", "!=", "<", ">", "<=", ">="].includes(t.v)) return true;
    if (t.t === "name" && (t.v === "in")) return true;
    if (t.t === "name" && t.v === "not") {
      const n = this.toks[this.i + 1];
      return n?.t === "name" && n.v === "in";
    }
    return false;
  }
  cmpOp(): string {
    const t = this.peek();
    if (t.t === "name" && t.v === "not") {
      this.i += 2;
      return "not in";
    }
    this.i++;
    return t.v;
  }
  add(): Expr {
    let left = this.mul();
    while (this.peek().t === "op" && (this.peek().v === "+" || this.peek().v === "-")) {
      const op = this.peek().v;
      const line = this.peek().line;
      this.i++;
      left = { k: "bin", op, left, right: this.mul(), line };
    }
    return left;
  }
  mul(): Expr {
    let left = this.unary();
    while (this.peek().t === "op" && ["*", "/", "//", "%"].includes(this.peek().v)) {
      const op = this.peek().v;
      const line = this.peek().line;
      this.i++;
      left = { k: "bin", op, left, right: this.unary(), line };
    }
    return left;
  }
  unary(): Expr {
    if (this.peek().t === "op" && (this.peek().v === "-" || this.peek().v === "+")) {
      const op = this.peek().v as "+" | "-";
      const line = this.peek().line;
      this.i++;
      return { k: "unary", op, expr: this.unary(), line };
    }
    return this.power();
  }
  power(): Expr {
    const base = this.trailer();
    if (this.peek().t === "op" && this.peek().v === "**") {
      const line = this.peek().line;
      this.i++;
      return { k: "bin", op: "**", left: base, right: this.unary(), line };
    }
    return base;
  }
  trailer(): Expr {
    let expr = this.atom();
    for (;;) {
      if (this.peek().t === "op" && this.peek().v === "(") {
        const line = this.peek().line;
        this.i++;
        const args: Expr[] = [];
        if (!(this.peek().t === "op" && this.peek().v === ")")) {
          args.push(this.expr());
          while (this.peek().t === "op" && this.peek().v === ",") {
            this.i++;
            if (this.peek().t === "op" && this.peek().v === ")") break;
            args.push(this.expr());
          }
        }
        this.eat("op", ")");
        expr = { k: "call", callee: expr, args, line };
        continue;
      }
      if (this.peek().t === "op" && this.peek().v === "[") {
        const line = this.peek().line;
        this.i++;
        const index = this.expr();
        this.eat("op", "]");
        expr = { k: "index", target: expr, index, line };
        continue;
      }
      if (this.peek().t === "op" && this.peek().v === ".") {
        const line = this.peek().line;
        this.i++;
        const name = this.eat("name").v;
        expr = { k: "attr", target: expr, name, line };
        continue;
      }
      break;
    }
    return expr;
  }
  atom(): Expr {
    const tok = this.peek();
    if (tok.t === "int" || tok.t === "float") {
      this.i++;
      return { k: "num", v: Number(tok.v), float: tok.t === "float", line: tok.line };
    }
    if (tok.t === "str") {
      this.i++;
      return { k: "str", v: tok.v, line: tok.line };
    }
    if (tok.t === "name" && tok.v === "True") {
      this.i++;
      return { k: "bool", v: true, line: tok.line };
    }
    if (tok.t === "name" && tok.v === "False") {
      this.i++;
      return { k: "bool", v: false, line: tok.line };
    }
    if (tok.t === "name" && tok.v === "None") {
      this.i++;
      return { k: "none", line: tok.line };
    }
    if (tok.t === "name") {
      this.i++;
      return { k: "name", v: tok.v, line: tok.line };
    }
    if (tok.t === "op" && tok.v === "[") {
      this.i++;
      const items: Expr[] = [];
      if (!(this.peek().t === "op" && this.peek().v === "]")) {
        items.push(this.expr());
        while (this.peek().t === "op" && this.peek().v === ",") {
          this.i++;
          if (this.peek().t === "op" && this.peek().v === "]") break;
          items.push(this.expr());
        }
      }
      this.eat("op", "]");
      return { k: "list", items, line: tok.line };
    }
    if (tok.t === "op" && tok.v === "{") {
      this.i++;
      const pairs: [Expr, Expr][] = [];
      if (!(this.peek().t === "op" && this.peek().v === "}")) {
        const k = this.expr();
        this.eat("op", ":");
        const v = this.expr();
        pairs.push([k, v]);
        while (this.peek().t === "op" && this.peek().v === ",") {
          this.i++;
          if (this.peek().t === "op" && this.peek().v === "}") break;
          const k2 = this.expr();
          this.eat("op", ":");
          pairs.push([k2, this.expr()]);
        }
      }
      this.eat("op", "}");
      return { k: "dict", pairs, line: tok.line };
    }
    if (tok.t === "op" && tok.v === "(") {
      this.i++;
      const e = this.expr();
      this.eat("op", ")");
      return e;
    }
    throw new PyError("SyntaxError", `นิพจน์ไม่ถูกต้องใกล้ '${tok.v || tok.t}'`, tok.line);
  }
}

function truthy(v: Value): boolean {
  switch (v.t) {
    case "none":
      return false;
    case "bool":
      return v.v;
    case "num":
      return v.v !== 0;
    case "str":
      return v.v.length > 0;
    case "list":
      return v.v.length > 0;
    case "dict":
      return v.v.size > 0;
    default:
      return true;
  }
}

function num(v: number, float: boolean): Num {
  if (!float && Number.isInteger(v)) return { t: "num", v, float: false };
  return { t: "num", v, float: true };
}

function asNum(v: Value, line?: number): Num {
  if (v.t !== "num") throw new PyError("TypeError", `ต้องเป็นตัวเลข แต่ได้ ${typeName(v)}`, line);
  return v;
}

function keyOf(v: Value, line?: number): string {
  if (v.t === "str") return "s:" + v.v;
  if (v.t === "num") return "n:" + String(v.v);
  if (v.t === "bool") return "b:" + String(v.v);
  if (v.t === "none") return "none";
  throw new PyError("TypeError", "คีย์ของ dict ใช้ได้แค่ข้อความ ตัวเลข หรือบูลีน", line);
}

export function repr(v: Value): string {
  switch (v.t) {
    case "num":
      if (!v.float && Number.isInteger(v.v)) return String(v.v);
      if (Number.isInteger(v.v)) return v.v.toFixed(1);
      const s = String(v.v);
      return s;
    case "str":
      return "'" + v.v.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    case "bool":
      return v.v ? "True" : "False";
    case "none":
      return "None";
    case "list":
      return "[" + v.v.map(repr).join(", ") + "]";
    case "dict": {
      const parts: string[] = [];
      for (const k of v.keys) parts.push(repr(k) + ": " + repr(v.v.get(keyOf(k))!));
      return "{" + parts.join(", ") + "}";
    }
    case "func":
      return `<function ${v.name}>`;
    case "builtin":
      return `<built-in ${v.name}>`;
    case "bound":
      return `<method ${v.name}>`;
  }
}

function typeName(v: Value): string {
  switch (v.t) {
    case "num":
      return v.float ? "float" : "int";
    case "str":
      return "str";
    case "bool":
      return "bool";
    case "none":
      return "NoneType";
    case "list":
      return "list";
    case "dict":
      return "dict";
    case "func":
    case "builtin":
    case "bound":
      return "function";
  }
}

function className(v: Value): string {
  const n = typeName(v);
  return `<class '${n === "function" ? "builtin_function_or_method" : n}'>`;
}

function printValue(v: Value): string {
  if (v.t === "str") return v.v;
  return repr(v);
}

function eq(a: Value, b: Value): boolean {
  if (a.t === "num" && b.t === "num") return a.v === b.v;
  if (a.t !== b.t) return false;
  if (a.t === "str" && b.t === "str") return a.v === b.v;
  if (a.t === "bool" && b.t === "bool") return a.v === b.v;
  if (a.t === "none") return true;
  if (a.t === "list" && b.t === "list") {
    if (a.v.length !== b.v.length) return false;
    return a.v.every((x, i) => eq(x, b.v[i]));
  }
  if (a.t === "dict" && b.t === "dict") {
    if (a.v.size !== b.v.size) return false;
    for (const [k, val] of a.v) {
      const other = b.v.get(k);
      if (!other || !eq(val, other)) return false;
    }
    return true;
  }
  return false;
}

function cmpOrder(a: Value, b: Value, line: number): number {
  if (a.t === "num" && b.t === "num") return a.v - b.v;
  if (a.t === "str" && b.t === "str") return a.v < b.v ? -1 : a.v > b.v ? 1 : 0;
  throw new PyError("TypeError", `เปรียบเทียบ ${typeName(a)} กับ ${typeName(b)} ไม่ได้`, line);
}

function applyCmp(op: string, a: Value, b: Value, line: number): boolean {
  if (op === "==") return eq(a, b);
  if (op === "!=") return !eq(a, b);
  if (op === "in" || op === "not in") {
    let inside = false;
    if (b.t === "list") inside = b.v.some((x) => eq(x, a));
    else if (b.t === "str" && a.t === "str") inside = b.v.includes(a.v);
    else if (b.t === "dict") inside = b.v.has(keyOf(a));
    else throw new PyError("TypeError", "ใช้ in กับลิสต์ ข้อความ หรือ dict เท่านั้น", line);
    return op === "in" ? inside : !inside;
  }
  const d = cmpOrder(a, b, line);
  if (op === "<") return d < 0;
  if (op === ">") return d > 0;
  if (op === "<=") return d <= 0;
  if (op === ">=") return d >= 0;
  throw new PyError("SyntaxError", "ตัวดำเนินการเปรียบเทียบไม่รู้จัก", line);
}

function binNum(op: string, a: Num, b: Num, line: number): Num {
  const float = op === "/" || a.float || b.float;
  let v = 0;
  if (op === "+") v = a.v + b.v;
  else if (op === "-") v = a.v - b.v;
  else if (op === "*") v = a.v * b.v;
  else if (op === "/") {
    if (b.v === 0) throw new PyError("ZeroDivisionError", "หารด้วยศูนย์", line);
    return num(a.v / b.v, true);
  } else if (op === "//") {
    if (b.v === 0) throw new PyError("ZeroDivisionError", "หารด้วยศูนย์", line);
    v = Math.floor(a.v / b.v);
    return num(v, float && op === "//" && (a.float || b.float));
  } else if (op === "%") {
    if (b.v === 0) throw new PyError("ZeroDivisionError", "หารด้วยศูนย์", line);
    v = a.v % b.v;
  } else if (op === "**") {
    v = a.v ** b.v;
    return num(v, float || !Number.isInteger(v));
  }
  if (op === "//") return num(v, a.float || b.float);
  if (!a.float && !b.float && Number.isInteger(v) && op !== "/") return num(v, false);
  return num(v, a.float || b.float);
}

class Machine {
  steps = 0;
  stdout = "";
  stdin: string[];
  globals: Env;
  constructor(stdin: string) {
    this.stdin = stdin.split("\n");
    this.globals = new Map();
    for (const name of ["print", "range", "len", "int", "str", "float", "bool", "abs", "min", "max", "sum", "input", "type"]) {
      this.globals.set(name, { t: "builtin", name });
    }
  }
  tick(line?: number) {
    this.steps++;
    if (this.steps > STEP_LIMIT) {
      throw new PyError(
        "TimeoutError",
        "โปรแกรมทำงานนานเกินกำหนด อาจมีลูปไม่จบ ตรวจเงื่อนไขให้หลุดออกจากลูป",
        line,
      );
    }
  }
  lookup(name: string, env: Env, line?: number): Value {
    if (env.has(name)) return env.get(name)!;
    if (env !== this.globals && this.globals.has(name)) return this.globals.get(name)!;
    throw new PyError("NameError", `ยังไม่มีการกำหนดชื่อ '${name}'`, line);
  }
  evalExpr(e: Expr, env: Env): Value {
    this.tick(e.line);
    switch (e.k) {
      case "num":
        return { t: "num", v: e.v, float: e.float };
      case "str":
        return { t: "str", v: e.v };
      case "bool":
        return { t: "bool", v: e.v };
      case "none":
        return { t: "none" };
      case "name":
        return this.lookup(e.v, env, e.line);
      case "list":
        return { t: "list", v: e.items.map((x) => this.evalExpr(x, env)) };
      case "dict": {
        const map = new Map<string, Value>();
        const keys: Value[] = [];
        for (const [k, v] of e.pairs) {
          const key = this.evalExpr(k, env);
          keys.push(key);
          map.set(keyOf(key, e.line), this.evalExpr(v, env));
        }
        return { t: "dict", v: map, keys };
      }
      case "unary": {
        const v = this.evalExpr(e.expr, env);
        if (e.op === "not") return { t: "bool", v: !truthy(v) };
        const n = asNum(v, e.line);
        return num(e.op === "-" ? -n.v : n.v, n.float);
      }
      case "bin": {
        if (e.op === "and" || e.op === "or") {
          const l = this.evalExpr(e.left, env);
          if (e.op === "and") return truthy(l) ? this.evalExpr(e.right, env) : l;
          return truthy(l) ? l : this.evalExpr(e.right, env);
        }
        const l = this.evalExpr(e.left, env);
        const r = this.evalExpr(e.right, env);
        if ((e.op === "+" || e.op === "*") && (l.t === "str" || r.t === "str" || l.t === "list" || r.t === "list")) {
          if (e.op === "+" && l.t === "str" && r.t === "str") return { t: "str", v: l.v + r.v };
          if (e.op === "+" && l.t === "list" && r.t === "list") return { t: "list", v: [...l.v, ...r.v] };
          if (e.op === "*" && l.t === "str" && r.t === "num") return { t: "str", v: repeat(l.v, r.v, e.line) };
          if (e.op === "*" && r.t === "str" && l.t === "num") return { t: "str", v: repeat(r.v, l.v, e.line) };
          if (e.op === "*" && l.t === "list" && r.t === "num") {
            const n = asNum(r, e.line).v;
            if (n < 0 || !Number.isInteger(n) || l.v.length * n > 10000) {
              throw new PyError("ValueError", "คูณลิสต์ได้เฉพาะจำนวนเต็มที่ไม่ทำให้ลิสต์ใหญ่เกินไป", e.line);
            }
            const out: Value[] = [];
            for (let i = 0; i < n; i++) out.push(...l.v);
            return { t: "list", v: out };
          }
        }
        return binNum(e.op, asNum(l, e.line), asNum(r, e.line), e.line);
      }
      case "cmp": {
        let ok = true;
        for (let i = 0; i < e.ops.length; i++) {
          const a = i === 0 ? this.evalExpr(e.items[0], env) : this.evalExpr(e.items[i], env);
          const b = this.evalExpr(e.items[i + 1], env);
          if (!applyCmp(e.ops[i], a, b, e.line)) ok = false;
        }
        return { t: "bool", v: ok };
      }
      case "call":
        return this.call(this.evalExpr(e.callee, env), e.args.map((a) => this.evalExpr(a, env)), e.line);
      case "index":
        return this.index(this.evalExpr(e.target, env), this.evalExpr(e.index, env), e.line);
      case "attr": {
        const recv = this.evalExpr(e.target, env);
        return { t: "bound", recv, name: e.name };
      }
    }
  }
  index(target: Value, index: Value, line: number): Value {
    if (target.t === "list" || target.t === "str") {
      const n = asNum(index, line);
      if (n.float && !Number.isInteger(n.v)) throw new PyError("TypeError", "ดัชนีต้องเป็นจำนวนเต็ม", line);
      const len = target.t === "list" ? target.v.length : target.v.length;
      let i = n.v;
      if (i < 0) i += len;
      if (i < 0 || i >= len) throw new PyError("IndexError", "ดัชนีอยู่นอกช่วง", line);
      if (target.t === "list") return target.v[i];
      return { t: "str", v: target.v[i] };
    }
    if (target.t === "dict") {
      const got = target.v.get(keyOf(index, line));
      if (got === undefined) throw new PyError("KeyError", `ไม่พบคีย์ ${repr(index)}`, line);
      return got;
    }
    throw new PyError("TypeError", "ค่านี้ใช้อินเด็กซ์ไม่ได้", line);
  }
  call(fn: Value, args: Value[], line: number): Value {
    if (fn.t === "builtin") return this.builtin(fn.name, args, line);
    if (fn.t === "bound") return this.method(fn.recv, fn.name, args, line);
    if (fn.t !== "func") throw new PyError("TypeError", "ค่านี้เรียกใช้แบบฟังก์ชันไม่ได้", line);
    if (args.length !== fn.params.length) {
      throw new PyError(
        "TypeError",
        `${fn.name}() ต้องการ ${fn.params.length} ค่า แต่ได้รับ ${args.length}`,
        line,
      );
    }
    const local: Env = new Map(fn.env);
    fn.params.forEach((p, i) => local.set(p, args[i]));
    try {
      this.execBlock(fn.body, local);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      throw e;
    }
    return { t: "none" };
  }
  method(recv: Value, name: string, args: Value[], line: number): Value {
    if (recv.t === "list" && name === "append") {
      if (args.length !== 1) throw new PyError("TypeError", "append ต้องการ 1 ค่า", line);
      recv.v.push(args[0]);
      return { t: "none" };
    }
    if (recv.t === "list" && name === "pop") {
      if (recv.v.length === 0) throw new PyError("IndexError", "pop จากลิสต์ว่าง", line);
      return recv.v.pop()!;
    }
    if (recv.t === "str" && (name === "upper" || name === "lower" || name === "strip")) {
      if (args.length) throw new PyError("TypeError", `${name}() ไม่รับอาร์กิวเมนต์`, line);
      const v = name === "upper" ? recv.v.toUpperCase() : name === "lower" ? recv.v.toLowerCase() : recv.v.trim();
      return { t: "str", v };
    }
    if (recv.t === "str" && name === "split") {
      const sep = args.length ? args[0] : null;
      if (sep && sep.t !== "str") throw new PyError("TypeError", "split รับข้อความเป็นตัวคั่น", line);
      const parts = sep && sep.t === "str" ? (sep.v === "" ? [...recv.v] : recv.v.split(sep.v)) : recv.v.trim().split(/\s+/).filter((x) => x !== "" || recv.v.trim() === "");
      const cleaned = sep ? parts : recv.v.trim() === "" ? [] : recv.v.trim().split(/\s+/);
      return { t: "list", v: cleaned.map((p) => ({ t: "str", v: p })) };
    }
    throw new PyError("AttributeError", `'${typeName(recv)}' ไม่มีเมธอด ${name}`, line);
  }
  builtin(name: string, args: Value[], line: number): Value {
    if (name === "print") {
      this.stdout += args.map(printValue).join(" ") + "\n";
      if (this.stdout.length > 100_000) throw new PyError("OverflowError", "ผลลัพธ์ยาวเกินไป", line);
      return { t: "none" };
    }
    if (name === "input") {
      const lineIn = this.stdin.length ? this.stdin.shift()! : "";
      return { t: "str", v: lineIn };
    }
    if (name === "len") {
      if (args.length !== 1) throw new PyError("TypeError", "len ต้องการ 1 ค่า", line);
      const a = args[0];
      if (a.t === "str" || a.t === "list") return num(a.v.length, false);
      if (a.t === "dict") return num(a.v.size, false);
      throw new PyError("TypeError", "len ใช้กับข้อความ ลิสต์ หรือ dict", line);
    }
    if (name === "range") {
      let start = 0;
      let stop = 0;
      let step = 1;
      if (args.length === 1) stop = asNum(args[0], line).v;
      else if (args.length === 2) {
        start = asNum(args[0], line).v;
        stop = asNum(args[1], line).v;
      } else if (args.length === 3) {
        start = asNum(args[0], line).v;
        stop = asNum(args[1], line).v;
        step = asNum(args[2], line).v;
      } else throw new PyError("TypeError", "range รับ 1 ถึง 3 ค่า", line);
      if (step === 0) throw new PyError("ValueError", "step ของ range ต้องไม่เป็น 0", line);
      const out: Value[] = [];
      if (step > 0) for (let i = start; i < stop && out.length < 10000; i += step) out.push(num(i, false));
      else for (let i = start; i > stop && out.length < 10000; i += step) out.push(num(i, false));
      return { t: "list", v: out };
    }
    if (name === "int") {
      if (!args.length) return num(0, false);
      const a = args[0];
      if (a.t === "num") return num(Math.trunc(a.v), false);
      if (a.t === "bool") return num(a.v ? 1 : 0, false);
      if (a.t === "str") {
        const n = Number(a.v.trim());
        if (!Number.isFinite(n) || a.v.trim() === "") throw new PyError("ValueError", `แปลง '${a.v}' เป็น int ไม่ได้`, line);
        return num(Math.trunc(n), false);
      }
      throw new PyError("TypeError", "แปลงเป็น int ไม่ได้", line);
    }
    if (name === "float") {
      if (!args.length) return num(0, true);
      const a = args[0];
      if (a.t === "num") return num(a.v, true);
      if (a.t === "str") {
        const n = Number(a.v.trim());
        if (!Number.isFinite(n)) throw new PyError("ValueError", `แปลง '${a.v}' เป็น float ไม่ได้`, line);
        return num(n, true);
      }
      throw new PyError("TypeError", "แปลงเป็น float ไม่ได้", line);
    }
    if (name === "str") {
      if (args.length !== 1) throw new PyError("TypeError", "str ต้องการ 1 ค่า", line);
      return { t: "str", v: printValue(args[0]) };
    }
    if (name === "bool") return { t: "bool", v: args.length ? truthy(args[0]) : false };
    if (name === "abs") {
      const n = asNum(args[0], line);
      return num(Math.abs(n.v), n.float);
    }
    if (name === "type") {
      if (args.length !== 1) throw new PyError("TypeError", "type ต้องการ 1 ค่า", line);
      return { t: "str", v: className(args[0]) };
    }
    if (name === "min" || name === "max" || name === "sum") {
      let list: Value[] = args;
      if (args.length === 1 && args[0].t === "list") list = args[0].v;
      if (!list.length) throw new PyError("ValueError", `${name} ของลำดับว่าง`, line);
      if (name === "sum") {
        let acc = num(0, false);
        for (const item of list) acc = binNum("+", acc, asNum(item, line), line);
        return acc;
      }
      let best = list[0];
      for (const item of list.slice(1)) {
        const d = cmpOrder(item, best, line);
        if (name === "min" ? d < 0 : d > 0) best = item;
      }
      return best;
    }
    throw new PyError("NameError", `ไม่มีฟังก์ชัน ${name}`, line);
  }
  execBlock(body: Stmt[], env: Env) {
    for (const stmt of body) this.exec(stmt, env);
  }
  exec(stmt: Stmt, env: Env) {
    this.tick(stmt.line);
    switch (stmt.k) {
      case "pass":
        return;
      case "break":
        throw new BreakSignal();
      case "continue":
        throw new ContinueSignal();
      case "expr":
        this.evalExpr(stmt.expr, env);
        return;
      case "assign":
        env.set(stmt.name, this.evalExpr(stmt.expr, env));
        return;
      case "aug": {
        const cur = this.lookup(stmt.name, env, stmt.line);
        const right = this.evalExpr(stmt.expr, env);
        const fake: Expr = {
          k: "bin",
          op: stmt.op,
          left: { k: "name", v: stmt.name, line: stmt.line },
          right: { k: "num", v: 0, float: false, line: stmt.line },
          line: stmt.line,
        };
        void fake;
        env.set(stmt.name, this.applyAug(cur, stmt.op, right, stmt.line));
        return;
      }
      case "setindex": {
        const target = this.evalExpr(stmt.target, env);
        const index = this.evalExpr(stmt.index, env);
        const value = this.evalExpr(stmt.expr, env);
        if (target.t === "list") {
          const n = asNum(index, stmt.line);
          let i = n.v;
          if (i < 0) i += target.v.length;
          if (i < 0 || i >= target.v.length) throw new PyError("IndexError", "ดัชนีอยู่นอกช่วง", stmt.line);
          target.v[i] = value;
          return;
        }
        if (target.t === "dict") {
          const k = keyOf(index, stmt.line);
          if (!target.v.has(k)) target.keys.push(index);
          target.v.set(k, value);
          return;
        }
        throw new PyError("TypeError", "กำหนดค่าผ่านอินเด็กซ์แบบนี้ไม่ได้", stmt.line);
      }
      case "if":
        for (const arm of stmt.arms) {
          if (arm.test === null || truthy(this.evalExpr(arm.test, env))) {
            this.execBlock(arm.body, env);
            break;
          }
        }
        return;
      case "while":
        for (;;) {
          if (!truthy(this.evalExpr(stmt.test, env))) break;
          try {
            this.execBlock(stmt.body, env);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        return;
      case "for": {
        const iter = this.evalExpr(stmt.iter, env);
        let seq: Value[] = [];
        if (iter.t === "list") seq = iter.v;
        else if (iter.t === "str") seq = [...iter.v].map((ch) => ({ t: "str", v: ch }));
        else if (iter.t === "dict") seq = iter.keys;
        else throw new PyError("TypeError", "for ใช้กับลิสต์ ข้อความ หรือ dict", stmt.line);
        for (const item of seq) {
          env.set(stmt.name, item);
          try {
            this.execBlock(stmt.body, env);
          } catch (e) {
            if (e instanceof BreakSignal) break;
            if (e instanceof ContinueSignal) continue;
            throw e;
          }
        }
        return;
      }
      case "def":
        env.set(stmt.name, { t: "func", name: stmt.name, params: stmt.params, body: stmt.body, env });
        return;
      case "return":
        throw new ReturnSignal(stmt.expr ? this.evalExpr(stmt.expr, env) : { t: "none" });
    }
  }
  applyAug(left: Value, op: string, right: Value, line: number): Value {
    if (op === "+" && left.t === "str" && right.t === "str") return { t: "str", v: left.v + right.v };
    if (op === "+" && left.t === "list" && right.t === "list") return { t: "list", v: [...left.v, ...right.v] };
    return binNum(op, asNum(left, line), asNum(right, line), line);
  }
}

function repeat(s: string, n: number, line: number): string {
  if (!Number.isInteger(n)) throw new PyError("TypeError", "คูณข้อความด้วยจำนวนเต็มเท่านั้น", line);
  if (n <= 0) return "";
  if (s.length * n > 10000) throw new PyError("OverflowError", "ข้อความที่คูณออกมายาวเกินไป", line);
  return s.repeat(n);
}

export function runPython(code: string, stdin = ""): RunResult {
  const machine = new Machine(stdin);
  const dump = () => {
    const variables: { name: string; value: string }[] = [];
    for (const [name, value] of machine.globals) {
      if (value.t === "builtin") continue;
      variables.push({ name, value: value.t === "func" ? `<function ${value.name}>` : repr(value) });
    }
    return variables;
  };
  try {
    const parser = new Parser(tokenize(code));
    const ast = parser.program();
    try {
      machine.execBlock(ast, machine.globals);
    } catch (e) {
      if (e instanceof ReturnSignal) {
        return {
          stdout: machine.stdout,
          error: { name: "SyntaxError", message: "return อยู่นอกฟังก์ชัน", line: undefined },
          variables: dump(),
          steps: machine.steps,
        };
      }
      if (e instanceof BreakSignal || e instanceof ContinueSignal) {
        return {
          stdout: machine.stdout,
          error: { name: "SyntaxError", message: "break หรือ continue อยู่นอกวงรอบ" },
          variables: dump(),
          steps: machine.steps,
        };
      }
      throw e;
    }
    return { stdout: machine.stdout, error: null, variables: dump(), steps: machine.steps };
  } catch (e) {
    if (e instanceof PyError) {
      return {
        stdout: machine.stdout,
        error: { name: e.nameTag, message: e.message, line: e.line },
        variables: dump(),
        steps: machine.steps,
      };
    }
    return {
      stdout: machine.stdout,
      error: { name: "InternalError", message: e instanceof Error ? e.message : "ตัวรันทำงานผิดพลาด" },
      variables: [],
      steps: machine.steps,
    };
  }
}

export function explainError(name: string): { meaning: string; causes: string[]; checks: string[] } {
  const table: Record<string, { meaning: string; causes: string[]; checks: string[] }> = {
    SyntaxError: {
      meaning: "ไวยากรณ์ของโปรแกรมยังไม่ถูกต้อง ตัวรันจึงยังไม่เริ่มทำงาน",
      causes: ["ลืมโคลอนหลัง if / for / while / def", "วงเล็บหรือเครื่องหมายคำพูดไม่ครบ", "เขียนคำสั่งในตำแหน่งที่ยังไม่รองรับ"],
      checks: ["อ่านบรรทัดที่ชี้ไว้", "นับวงเล็บเปิดและปิด", "ตรวจว่าบล็อกมีโคลอน"],
    },
    IndentationError: {
      meaning: "การย่อหน้าไม่เข้าบล็อก Python ใช้การย่อหน้าแทนปีกกา",
      causes: ["ผสมจำนวนเว้นวรรค", "ลืมย่อบรรทัดใน if หรือ for"],
      checks: ["ใช้ 4 ช่องต่อหนึ่งระดับ", "อย่าผสมแท็บกับเว้นวรรค"],
    },
    NameError: {
      meaning: "มีการใช้ชื่อที่ยังไม่ถูกกำหนด",
      causes: ["สะกดตัวแปรผิด", "ใช้ตัวแปรก่อนบรรทัดที่กำหนดค่า", "ชื่อฟังก์ชันไม่ตรงกับที่ def"],
      checks: ["เทียบตัวพิมพ์เล็กใหญ่", "ไล่จากบนลงล่างว่าชื่อเกิดก่อนถูกใช้"],
    },
    TypeError: {
      meaning: "ชนิดของค่าไม่ตรงกับสิ่งที่คำสั่งต้องการ",
      causes: ["บวกข้อความกับตัวเลข", "เรียกฟังก์ชันด้วยจำนวนอาร์กิวเมนต์ไม่ครบ", "ใช้ค่าที่ไม่ใช่ลำดับใน for"],
      checks: ["พิมพ์ type(ค่า) หรือแสดงค่าด้วย print", "แปลงชนิดด้วย int() หรือ str() ให้ตรงกัน"],
    },
    ValueError: {
      meaning: "ชนิดถูกแล้ว แต่ค่าที่ส่งเข้าไปไม่สมเหตุสมผล",
      causes: ["int() กับข้อความที่ไม่มีตัวเลข", "range step เป็น 0"],
      checks: ["แสดงค่าก่อนแปลง", "ตัดช่องว่างด้วย strip()"],
    },
    IndexError: {
      meaning: "ขอสมาชิกตำแหน่งที่ไม่มีในลิสต์หรือข้อความ",
      causes: ["ดัชนีเริ่มที่ 0 ไม่ใช่ 1", "ลิสต์สั้นกว่าที่คิด"],
      checks: ["พิมพ์ len(ลิสต์)", "ตรวจลูปว่าไม่วิ่งเกิน len - 1"],
    },
    KeyError: {
      meaning: "ไม่มีคีย์นี้ใน dict",
      causes: ["สะกดคีย์ผิด", "คีย์เป็นข้อความแต่ส่งเป็นตัวเลข หรือกลับกัน"],
      checks: ["พิมพ์ dict ทั้งก้อน", "เทียบชนิดของคีย์"],
    },
    ZeroDivisionError: {
      meaning: "มีการหารด้วยศูนย์",
      causes: ["ตัวหารเป็น 0", "ตัวแปรที่ตั้งใจให้เป็นตัวหารยังเป็น 0"],
      checks: ["พิมพ์ตัวหารก่อนหาร", "ใส่เงื่อนไขกันตัวหารเป็น 0"],
    },
    TimeoutError: {
      meaning: "โปรแกรมใช้จำนวนขั้นเกินกำหนด จึงถูกหยุด",
      causes: ["while ที่เงื่อนไขไม่เคยเป็นเท็จ", "ลืมเพิ่มตัวนับ"],
      checks: ["หาบรรทัดที่เปลี่ยนค่าในเงื่อนไข", "จำกัดจำนวนรอบด้วยตัวนับ"],
    },
    AttributeError: {
      meaning: "เรียกเมธอดที่ค่านี้ไม่มี",
      causes: ["สะกดเมธอดผิด", "ใช้เมธอดของลิสต์กับข้อความ"],
      checks: ["ตรวจชนิดด้วย type()", "ดูรายการเมธอดที่บทเรียนนี้รองรับ"],
    },
    OverflowError: {
      meaning: "ผลลัพธ์ใหญ่เกินขีดที่ตัวรันบทเรียนยอมให้",
      causes: ["ลูป print จำนวนมาก", "คูณข้อความหรือลิสต์ยาว"],
      checks: ["ลดจำนวนรอบ", "พิมพ์เฉพาะค่าที่ต้องการตรวจ"],
    },
  };
  return (
    table[name] ?? {
      meaning: "เกิดข้อผิดพลาดขณะทำงาน",
      causes: ["ค่าหรือโครงสร้างไม่ตรงกับที่คำสั่งต้องการ"],
      checks: ["อ่านชื่อ error และบรรทัด", "พิมพ์ค่าที่เกี่ยวข้องก่อนบรรทัดนั้น"],
    }
  );
}

export function normalizeOutput(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}
