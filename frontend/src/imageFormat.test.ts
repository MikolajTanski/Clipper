import assert from "node:assert/strict";
import { test } from "node:test";
import { detectFormat, formatSpec } from "./imageFormat.ts";

test("formatSpec jpg uses jpeg mime and quality", () => {
  assert.deepEqual(formatSpec("jpg"), {
    mime: "image/jpeg",
    quality: 0.92,
    ext: "jpg",
  });
});

test("formatSpec png has no quality", () => {
  assert.deepEqual(formatSpec("png"), { mime: "image/png", ext: "png" });
});

test("formatSpec webp uses quality", () => {
  assert.deepEqual(formatSpec("webp"), {
    mime: "image/webp",
    quality: 0.92,
    ext: "webp",
  });
});

test("detectFormat reads jpeg from type or .jpg/.jpeg", () => {
  assert.equal(detectFormat(new File([], "a.jpg", { type: "image/jpeg" })), "jpg");
  assert.equal(detectFormat(new File([], "a.jpeg", { type: "" })), "jpg");
});

test("detectFormat reads png and webp; gif becomes png", () => {
  assert.equal(detectFormat(new File([], "a.png", { type: "image/png" })), "png");
  assert.equal(detectFormat(new File([], "a.webp", { type: "image/webp" })), "webp");
  assert.equal(detectFormat(new File([], "a.gif", { type: "image/gif" })), "png");
});
