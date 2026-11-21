import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOutput, runPython } from "./run.ts";

test("prints and assigns", () => {
  const r = runPython("name = 'Ada'\nprint('hi', name)\n");
  assert.equal(r.error, null);
  assert.equal(normalizeOutput(r.stdout), "hi Ada");
  assert.ok(r.variables.some((v) => v.name === "name" && v.value === "'Ada'"));
});

test("if elif else", () => {
  const code = `x = 0
if x > 0:
    print("pos")
elif x == 0:
    print("zero")
else:
    print("neg")
`;
  assert.equal(normalizeOutput(runPython(code).stdout), "zero");
});

test("for range and while cap", () => {
  assert.equal(normalizeOutput(runPython("for i in range(3):\n    print(i)\n").stdout), "0\n1\n2");
  const loop = runPython("x = 0\nwhile x < 3:\n    x = x + 1\nprint(x)\n");
  assert.equal(loop.error, null);
  assert.equal(normalizeOutput(loop.stdout), "3");
  const inf = runPython("while True:\n    x = 1\n");
  assert.equal(inf.error?.name, "TimeoutError");
});

test("functions lists and dicts", () => {
  const code = `def add(a, b):
    return a + b
print(add(2, 3))
xs = [1]
xs.append(2)
print(xs[0], len(xs))
book = {"py": 1}
book["cs"] = 2
print(book["cs"])
`;
  const r = runPython(code);
  assert.equal(r.error, null, r.error?.message);
  assert.equal(normalizeOutput(r.stdout), "5\n1 2\n2");
});

test("name error keeps meaning", () => {
  const r = runPython("print(missing)\n");
  assert.equal(r.error?.name, "NameError");
});

test("input and int", () => {
  const r = runPython("n = int(input())\nprint(n + 1)\n", "41\n");
  assert.equal(normalizeOutput(r.stdout), "42");
});

test("does not execute imports", () => {
  const r = runPython("import os\n");
  assert.ok(r.error);
});
