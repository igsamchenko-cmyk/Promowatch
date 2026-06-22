import test from "node:test";
import assert from "node:assert/strict";
import formatting from "../../assets/deal-formatting.js";

test("formats money with current fallback behavior", () => {
  assert.equal(formatting.money(null), "0 грн");
  assert.equal(formatting.money(undefined), "0 грн");
  assert.equal(formatting.money(10), "10 грн");
  assert.equal(formatting.money(10.5), "10,50 грн");
});

test("calculates discount and respects precomputed discount", () => {
  assert.equal(formatting.discount({ price: 80, old: 100 }), 20);
  assert.equal(formatting.discount({ price: 79.9, old: 100 }), 20);
  assert.equal(formatting.discount({ price: 80, old: 100, _discount: 17 }), 17);
});

test("formats and parses dates", () => {
  assert.equal(formatting.todayIso(new Date("2026-06-21T21:30:00Z")), "2026-06-22");
  assert.equal(formatting.parseIsoDate(null), null);
  assert.equal(formatting.parseIsoDate("not-a-date"), null);
  assert.equal(formatting.parseIsoDate("2026-06-22").toISOString(), "2026-06-22T00:00:00.000Z");
  assert.equal(formatting.dateLabel(null), "");
  assert.equal(formatting.dateLabel("2026-06-22"), "22.06.2026");
});

test("calculates days left using an explicit today value", () => {
  assert.equal(formatting.daysLeft({ end: null }, "2026-06-22"), null);
  assert.equal(formatting.daysLeft({ end: "2026-06-21" }, "2026-06-22"), -1);
  assert.equal(formatting.daysLeft({ end: "2026-06-22" }, "2026-06-22"), 0);
  assert.equal(formatting.daysLeft({ end: "2026-06-23" }, "2026-06-22"), 1);
  assert.equal(formatting.daysLeft({ end: "2026-06-25" }, "2026-06-22"), 3);
});

test("formats promo term labels", () => {
  assert.equal(formatting.termLabel({ end: null }, false, "2026-06-22"), "термін не вказано");
  assert.equal(formatting.termLabel({ end: "2026-06-21" }, false, "2026-06-22"), "завершено");
  assert.equal(formatting.termLabel({ end: "2026-06-22" }, true, "2026-06-22"), "сьогодні");
  assert.equal(formatting.termLabel({ end: "2026-06-22" }, false, "2026-06-22"), "до 22.06.2026 · сьогодні");
  assert.equal(formatting.termLabel({ end: "2026-06-23" }, true, "2026-06-22"), "завтра");
  assert.equal(formatting.termLabel({ end: "2026-06-23" }, false, "2026-06-22"), "до 23.06.2026 · завтра");
  assert.equal(formatting.termLabel({ end: "2026-06-25" }, true, "2026-06-22"), "3 дн.");
  assert.equal(formatting.termLabel({ end: "2026-06-25" }, false, "2026-06-22"), "до 25.06.2026 · 3 дн.");
});

test("uses precomputed ending values for labels and sorting", () => {
  assert.equal(formatting.termLabel({ _daysLeft: 2, end: "2026-06-25" }, true, "2026-06-22"), "2 дн.");
  assert.equal(formatting.endingSortValue({ _endingSort: 7, end: "2026-06-25" }, "2026-06-22"), 7);
  assert.equal(formatting.endingSortValue({ end: null }, "2026-06-22"), Number.POSITIVE_INFINITY);
  assert.equal(formatting.endingSortValue({ end: "2026-06-24" }, "2026-06-22"), 2);
});
