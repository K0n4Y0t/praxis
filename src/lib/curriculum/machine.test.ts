import assert from "node:assert/strict";
import { test } from "node:test";
import { matchMachineOutput } from "./machine.ts";

test("machine output match does not treat a typed claim as a run", () => {
  assert.equal(matchMachineOutput("exact", "praxis", "praxis\n"), true);
  assert.equal(matchMachineOutput("exact", "4", "4\r\n"), true);
  assert.equal(matchMachineOutput("exact", "4", "SELECT 4"), false);
  assert.equal(matchMachineOutput("contains", "git version", "git version 2.43.0"), true);
  assert.equal(matchMachineOutput("contains", "Linux", "Darwin"), false);
});
