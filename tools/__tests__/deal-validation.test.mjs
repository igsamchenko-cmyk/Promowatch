import test from "node:test";
import assert from "node:assert/strict";
import dealValidation from "../../assets/deal-validation.js";

const validDeal = {
  externalId: "store.example:123",
  name: "Test promo",
  source: "test-source",
  price: 10,
  old: 15
};

function withOverride(overrides) {
  return { ...validDeal, ...overrides };
}

test("accepts a valid deal", () => {
  assert.equal(dealValidation.isValidDeal(validDeal), true);
  assert.deepEqual(dealValidation.getDealValidationErrors(validDeal), []);
});

test("rejects deals with missing required fields", () => {
  const cases = [
    ["externalId", "missing externalId"],
    ["name", "missing name"],
    ["source", "missing source"]
  ];

  for (const [field, expectedError] of cases) {
    const deal = { ...validDeal };
    delete deal[field];

    assert.equal(dealValidation.isValidDeal(deal), false);
    assert.ok(dealValidation.getDealValidationErrors(deal).includes(expectedError));
  }
});

test("rejects missing or non-number prices", () => {
  const cases = [
    [withOverride({ price: undefined }), "invalid price"],
    [withOverride({ old: undefined }), "invalid old"],
    [withOverride({ price: "10" }), "invalid price"],
    [withOverride({ old: "15" }), "invalid old"],
    [withOverride({ price: Number.NaN }), "invalid price"],
    [withOverride({ old: Number.NaN }), "invalid old"],
    [withOverride({ price: Number.POSITIVE_INFINITY }), "invalid price"],
    [withOverride({ old: Number.POSITIVE_INFINITY }), "invalid old"]
  ];

  for (const [deal, expectedError] of cases) {
    assert.equal(dealValidation.isValidDeal(deal), false);
    assert.ok(dealValidation.getDealValidationErrors(deal).includes(expectedError));
  }
});

test("rejects non-positive prices", () => {
  const cases = [
    [withOverride({ price: 0 }), "price must be positive"],
    [withOverride({ price: -1 }), "price must be positive"],
    [withOverride({ old: 0 }), "old must be positive"],
    [withOverride({ old: -1 }), "old must be positive"]
  ];

  for (const [deal, expectedError] of cases) {
    assert.equal(dealValidation.isValidDeal(deal), false);
    assert.ok(dealValidation.getDealValidationErrors(deal).includes(expectedError));
  }
});

test("rejects deals where promo price is not lower than old price", () => {
  const cases = [
    withOverride({ price: 15, old: 15 }),
    withOverride({ price: 20, old: 15 })
  ];

  for (const deal of cases) {
    assert.equal(dealValidation.isValidDeal(deal), false);
    assert.ok(dealValidation.getDealValidationErrors(deal).includes("price must be lower than old"));
  }
});
