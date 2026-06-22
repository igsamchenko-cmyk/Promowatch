# PromoWatch Architecture

PromoWatch is a static GitHub Pages dashboard for comparing promotional supermarket prices, currently focused on Lviv.

The production UI has no backend. It reads prebuilt data from `data/deals.json` and runs entirely in the browser. Promo data is imported by `tools/import-promos.mjs` and refreshed through GitHub Actions.

## Core Principles

- Keep the project static-first.
- Do not add a frontend framework unless there is a strong product or maintenance reason.
- Do not add a build step unless it is clearly justified.
- Prefer small, production-safe commits.
- Treat production data safety as the first priority.
- Avoid large rewrites of `assets/app.js`.

## Data Flow

1. External promo sources are parsed by `tools/import-promos.mjs`.
2. The importer normalizes deals and keeps `externalId` from the source data.
3. Before writing `data/deals.json`, the importer applies safety guards:
   - absolute minimum total;
   - relative drop guard compared with the previous data file.
4. The generated `data/deals.json` is validated by `tools/validate-data.mjs`.
5. GitHub Actions runs validation before auto-commit.
6. The frontend in `assets/app.js` fetches `data/deals.json?v=...`, filters invalid records with the shared validation helper, and renders the dashboard.

Broken or suspicious data should fail before it reaches an auto-commit.

## Stable Identifiers

`externalId` is the stable deal key.

The numeric `id` field exists only for backward compatibility and must not be used as a persistent identifier. It can change after each import because it depends on sort order.

Selected items, comparison items, and `localStorage` values must use `externalId` directly or go through `getDealKey(deal)`.

## Validation Rules

Shared deal validation lives in `assets/deal-validation.js` and is reused by both the browser and `tools/validate-data.mjs`.

A valid deal must have:

- `externalId`;
- `name`;
- `source`;
- finite numeric `price`;
- finite numeric `old`;
- `price > 0`;
- `old > 0`;
- `price < old`.

Do not duplicate these rules in another place. Extend the shared helper when the rules need to change.

## GitHub Actions Safety

The update workflow imports fresh promo data, audits classification, then validates data and syntax before committing generated files.

The importer protects `data/deals.json` with:

- an absolute minimum total of deals;
- a relative drop guard against the previous total.

`tools/validate-data.mjs` protects the auto-commit path. If data is invalid, too small, has duplicate `externalId` values, or has a mismatched `meta.total`, the workflow must fail before committing.

## Frontend Architecture

`assets/app.js` is currently monolithic. That is acceptable for now.

Pure utilities can be extracted gradually when it reduces risk or duplication. Good candidates are validation, formatting, search/filter/sort helpers, and other side-effect-free code.

Do not combine UI changes with technical refactors. Do not rewrite the dashboard in one large commit.

## Things To Avoid

- Do not store selected items by numeric `id`.
- Do not bypass `tools/validate-data.mjs`.
- Do not commit generated broken `data/deals.json`.
- Do not casually add React, Vue, Svelte, Vite, or another build system.
- Do not duplicate validation rules.
- Do not mix large CSS or `app.js` refactors with logic changes.

## Safe Next Refactor Candidates

- Unit tests for `assets/deal-validation.js`.
- Extracting pure formatting utilities.
- Extracting search, filter, and sort utilities.
- CSS cleanup in a separate later pass.
- Accessibility review in a separate later pass.
