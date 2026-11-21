import { normalizeOutput, runPython, type RunResult } from "./run.ts";
import type { LabTest } from "../curriculum/types";

export type GradedTest = {
  name: string;
  pass: boolean;
  expected: string;
  actual: string;
  error: RunResult["error"];
};

export function gradeCode(code: string, tests: LabTest[]): GradedTest[] {
  return tests.map((test) => {
    const harness = test.harness ?? "";
    const program = test.before ? `${harness}\n${code}` : `${code}\n${harness}`;
    const result = runPython(program, test.stdin ?? "");
    const actual = result.error ? "" : normalizeOutput(result.stdout);
    const expected = normalizeOutput(test.expected);
    return {
      name: test.name,
      pass: !result.error && actual === expected,
      expected,
      actual: result.error ? "" : actual,
      error: result.error,
    };
  });
}

export function allPassed(tests: GradedTest[]): boolean {
  return tests.length > 0 && tests.every((test) => test.pass);
}
