import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyDeal, colors as refinedColors } from "./classifier.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, "data");

const sources = [
  { store: "АТБ", slug: "atbmarket.com", url: "https://de-deshevshe.com.ua/city/lviv/shop/atbmarket.com/" },
  { store: "Сільпо", slug: "silpo.ua", url: "https://de-deshevshe.com.ua/city/lviv/shop/silpo.ua/" },
  { store: "Метро", slug: "metro.zakaz.ua", url: "https://de-deshevshe.com.ua/city/lviv/shop/metro.zakaz.ua/" },
  { store: "Рукавичка", slug: "rukavychka.ua", url: "https://de-deshevshe.com.ua/city/lviv/shop/rukavychka.ua/" },
  { store: "Близенько", slug: "blyzenko.ua", url: "https://de-deshevshe.com.ua/city/lviv/shop/blyzenko.ua/" },
  { store: "Ашан", slug: "auchan.zakaz.ua", url: "https://de-deshevshe.com.ua/city/lviv/shop/auchan.zakaz.ua/" }
];

function decodeHtml(text = "") {
  return text
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function numberFrom(text = "") {
  const cleaned = decodeHtml(String(text).replace(/<[^>]*>/g, " "))
    .replace(/\u00a0/g, " ");
  const match = cleaned.match(/\d[\d\s.,]*/);
  if (!match) return null;

  let number = match[0].replace(/\s/g, "");
  const lastComma = number.lastIndexOf(",");
  const lastDot = number.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    number = number
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    const decimals = number.length - lastComma - 1;
    number = decimals > 0 && decimals <= 2
      ? number.replace(",", ".")
      : number.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const decimals = number.length - lastDot - 1;
    const groups = number.split(".");
    number = decimals > 0 && decimals <= 2 && groups.length === 2
      ? number
      : number.replace(/\./g, "");
  }

  const parsed = Number(number);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function todayIso() {
  const parts = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date()).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseSaleEnd(card) {
  const raw = decodeHtml(card.match(/class="sale-end-date"[^>]*>\s*До:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/)?.[0] || "");
  const match = raw.match(/До:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isExpired(end, today = todayIso()) {
  return Boolean(end && end < today);
}

function splitCards(html) {
  const marker = '<div class="dede-unified-product-card';
  const cards = [];
  let index = html.indexOf(marker);
  while (index >= 0) {
    const next = html.indexOf(marker, index + marker.length);
    cards.push(html.slice(index, next >= 0 ? next : undefined));
    if (next < 0) break;
    index = next;
  }
  return cards;
}

function normalizeMeasureUnit(unit) {
  const value = String(unit || "").toLowerCase();
  if (value === "г") return { unitLabel: "кг", factor: 1000, displayUnit: "г" };
  if (value === "мл") return { unitLabel: "л", factor: 1000, displayUnit: "мл" };
  if (value === "кг") return { unitLabel: "кг", factor: 1, displayUnit: "кг" };
  if (value === "л") return { unitLabel: "л", factor: 1, displayUnit: "л" };
  return null;
}

function parseDecimal(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function inferSize(name) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const pack = cleaned.match(/(?:^|\s)(\d+)\s*(?:шт|штук|пак|табл|капс|ф\/?п|пакетик(?:и|ів)?|піпет(?:ки|ок))\s*(?:[xх×]|по)\s*(\d+(?:[.,]\d+)?)\s*(кг|г|л|мл)(?:\b|$)/i);
  if (pack) {
    const count = Number(pack[1]);
    const amount = parseDecimal(pack[2]);
    const unit = normalizeMeasureUnit(pack[3]);
    if (unit && count > 0 && amount > 0) {
      return {
        size: `${count} x ${pack[2]} ${unit.displayUnit}`,
        unitAmount: count * amount / unit.factor,
        unitLabel: unit.unitLabel
      };
    }
  }

  const matches = [...cleaned.matchAll(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(кг|г|л|мл|шт|пак|табл|капс)(?:\b|$)/gi)];
  if (!matches.length) return { size: "1 шт", unitAmount: 1, unitLabel: "шт" };

  const match = matches[matches.length - 1];
  const amount = parseDecimal(match[1]);
  const unit = normalizeMeasureUnit(match[2]);
  if (unit && amount > 0) return { size: `${match[1]} ${unit.displayUnit}`, unitAmount: amount / unit.factor, unitLabel: unit.unitLabel };
  const unitText = match[2].toLowerCase();
  if (amount > 0) return { size: `${match[1]} ${unitText}`, unitAmount: amount, unitLabel: "шт" };
  return { size: `${match[1]} ${unitText}`, unitAmount: 1, unitLabel: "шт" };
}

function parseCards(html, source) {
  const today = todayIso();
  return splitCards(html).map((card) => {
    const externalId = card.match(/data-product-id="([^"]+)/)?.[1];
    const name = decodeHtml(card.match(/data-analytics-item_name="([^"]+)/)?.[1] || card.match(/alt="([^"]+)/)?.[1] || "");
    const old = numberFrom(card.match(/class="old-price">([^<]+)/)?.[1]);
    const price = numberFrom(card.match(/class="sale-price">([^<]+)/)?.[1] || card.match(/data-analytics-price="([^"]+)/)?.[1]);
    if (!externalId || !name || !old || !price || price >= old) return null;

    const classification = classifyDeal(name);
    const { category, subcategory } = classification;
    const end = parseSaleEnd(card);
    const oldRounded = round2(old);
    const priceRounded = round2(price);
    return {
      externalId: `${source.slug}:${externalId}`,
      name,
      ...inferSize(name),
      category,
      subcategory,
      store: source.store,
      city: "Львів",
      old: oldRounded,
      price: priceRounded,
      end,
      endStatus: end ? (isExpired(end, today) ? "expired" : "known") : "unknown",
      source: "de-deshevshe.com.ua",
      sourceUrl: source.url,
      productUrl: decodeHtml(card.match(/href="(https:\/\/de-deshevshe\.com\.ua\/product\/[^"]+)/)?.[1] || ""),
      image: decodeHtml(card.match(/<img[^>]+src="([^"]+)/)?.[1] || ""),
      color: refinedColors[category] || refinedColors["Інше"],
      importedVia: "de-deshevshe-ajax",
      discountPct: round2((1 - priceRounded / oldRounded) * 100)
    };
  }).filter(Boolean);
}

function extractAjaxParams(html) {
  const ajaxUrl = html.match(/ajax_url['"]?\s*[:=]\s*['"]([^'"]+)/)?.[1] || html.match(/"ajax_url":"([^"]+)/)?.[1];
  const nonce = html.match(/nonce['"]?\s*[:=]\s*['"]([^'"]+)/)?.[1] || html.match(/"nonce":"([^"]+)/)?.[1];
  const button = html.match(/id="load-more-shop-sales"[^>]+>/)?.[0] || "";
  return {
    ajaxUrl,
    nonce,
    shopId: button.match(/data-shop-id="([^"]+)/)?.[1],
    offset: Number(button.match(/data-offset="([^"]+)/)?.[1] || 48),
    randomSeed: button.match(/data-random-seed="([^"]+)/)?.[1] || ""
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 PromoWatch prototype",
      "Accept-Language": "uk-UA,uk;q=0.9"
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function importSource(source) {
  const html = await fetchText(source.url);
  const params = extractAjaxParams(html);
  let items = parseCards(html, source);
  let offset = params.offset;
  let pages = 1;

  while (params.ajaxUrl && params.nonce && params.shopId && pages < 120) {
    const body = new URLSearchParams({
      action: "dede_load_more_sales",
      nonce: params.nonce,
      shop_id: params.shopId,
      offset: String(offset),
      random_seed: params.randomSeed
    });
    const response = await fetch(params.ajaxUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 PromoWatch prototype",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Referer": source.url,
        "X-Requested-With": "XMLHttpRequest"
      },
      body
    });
    const payload = await response.json();
    if (!payload.success) break;
    const next = parseCards(payload.data.html || "", source);
    if (!next.length) break;
    items = items.concat(next);
    pages += 1;
    offset += 48;
    if (!payload.data.has_more) break;
  }

  const unique = new Map();
  for (const item of items) unique.set(item.externalId, item);
  const uniqueItems = [...unique.values()];
  const activeItems = uniqueItems.filter((item) => item.endStatus !== "expired");
  return {
    source,
    items: activeItems,
    pages,
    rawCount: uniqueItems.length,
    expiredCount: uniqueItems.length - activeItems.length,
    withoutEndDate: activeItems.filter((item) => !item.end).length
  };
}

await mkdir(dataDir, { recursive: true });

const results = [];
for (const source of sources) {
  try {
    results.push(await importSource(source));
  } catch (error) {
    results.push({ source, items: [], pages: 0, error: error.message });
  }
}

const deals = results
  .flatMap((result) => result.items)
  .sort((a, b) => a.store.localeCompare(b.store, "uk") || b.discountPct - a.discountPct || a.name.localeCompare(b.name, "uk"))
  .map((deal, index) => ({ id: index + 1, ...deal }));

const expiredSkipped = results.reduce((sum, result) => sum + (result.expiredCount || 0), 0);
const withoutEndDate = deals.filter((deal) => !deal.end).length;
const knownEndDate = deals.length - withoutEndDate;

const sourceHealth = results.map((result) => ({
  name: `${result.source.store} Львів`,
  state: result.error ? "Помилка" : "Імпортовано",
  detail: result.error
    ? result.error
    : `${result.items.length} активних позицій, ${result.expiredCount || 0} прострочених прибрано, ${result.withoutEndDate || 0} без дати`,
  url: result.source.url
}));

await writeFile(join(dataDir, "deals.json"), JSON.stringify({
  meta: {
    city: "Львів",
    generatedAt: new Date().toISOString(),
    actualOn: todayIso(),
    timezone: "Europe/Kyiv",
    source: "de-deshevshe.com.ua AJAX",
    total: deals.length,
    knownEndDate,
    withoutEndDate,
    expiredSkipped
  },
  deals,
  sourceHealth
}, null, 2), "utf8");

await writeFile(join(dataDir, "source-report.json"), JSON.stringify(results.map((result) => ({
  source: result.source,
  count: result.items.length,
  pages: result.pages,
  error: result.error || null
})), null, 2), "utf8");

console.log(`Imported ${deals.length} promo items for Львів.`);
