import assert from "node:assert/strict";
import { test } from "node:test";
import { fitLockedSize } from "./fitLockedSize.ts";

test("lock on, width 200, orig 400x300 → height 150", () => {
  assert.deepEqual(
    fitLockedSize({
      origWidth: 400,
      origHeight: 300,
      width: 200,
      height: 300,
      changed: "width",
      locked: true,
    }),
    { width: 200, height: 150 }
  );
});

test("lock on, height 150, orig 400x300 → width 200", () => {
  assert.deepEqual(
    fitLockedSize({
      origWidth: 400,
      origHeight: 300,
      width: 400,
      height: 150,
      changed: "height",
      locked: true,
    }),
    { width: 200, height: 150 }
  );
});

test("lock off keeps independent width and height", () => {
  assert.deepEqual(
    fitLockedSize({
      origWidth: 400,
      origHeight: 300,
      width: 200,
      height: 100,
      changed: "width",
      locked: false,
    }),
    { width: 200, height: 100 }
  );
});

test("rounds to integers and clamps to at least 1", () => {
  assert.deepEqual(
    fitLockedSize({
      origWidth: 400,
      origHeight: 300,
      width: 1,
      height: 0,
      changed: "width",
      locked: true,
    }),
    { width: 1, height: 1 }
  );
});
