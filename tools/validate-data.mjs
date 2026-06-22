import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dealValidation from "../assets/deal-validation.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dealsPath = join(root, "data", "deals.json");
const MIN_DEALS_TOTAL = 2000;
const MAX_INVALID_EXAMPLES = 10;

function fail(message, details = []) {
  console.error(`Data validation failed: ${message}`);
  for (const detail of details.slice(0, MAX_INVALID_EXAMPLES)) {
    console.error(JSON.stringify(detail));
  }
  process.exit(1);
}

function validateDeal(deal, index) {
  const errors = dealValidation.getDealValidationErrors(deal);

  return errors.length
    ? {
        index,
        externalId: deal?.externalId ?? null,
        name: deal?.name ?? null,
        errors
      }
    : null;
}

let payload;
try {
  payload = JSON.parse(await readFile(dealsPath, "utf8"));
} catch (error) {
  fail(`cannot read or parse ${dealsPath}: ${error.message}`);
}

if (!Array.isArray(payload.deals)) {
  fail("data/deals.json must contain a deals array");
}

const { deals } = payload;
if (deals.length < MIN_DEALS_TOTAL) {
  fail(`deals.length is below minimum ${MIN_DEALS_TOTAL}`, [{ total: deals.length }]);
}

if (payload.meta && Object.hasOwn(payload.meta, "total") && payload.meta.total !== deals.length) {
  fail("meta.total does not match deals.length", [{
    metaTotal: payload.meta.total,
    dealsLength: deals.length
  }]);
}

const invalid = deals
  .map((deal, index) => validateDeal(deal, index))
  .filter(Boolean);

if (invalid.length) {
  fail(`${invalid.length} invalid deal records`, invalid);
}

const externalIds = new Set();
const duplicates = [];
for (const [index, deal] of deals.entries()) {
  if (externalIds.has(deal.externalId)) {
    duplicates.push({ index, externalId: deal.externalId });
  }
  externalIds.add(deal.externalId);
}

if (duplicates.length) {
  fail(`${duplicates.length} duplicate externalId values`, duplicates);
}

console.log(`Data validation passed: total deals=${deals.length}, unique externalId=${externalIds.size}, invalid count=0.`);
