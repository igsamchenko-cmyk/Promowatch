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

const colors = {
  "Молочні": "#245fbd",
  "Твердий сир": "#d7a018",
  "Ковбаси": "#b12f3b",
  "М'ясо": "#d7352a",
  "Алкоголь": "#8a3d74",
  "Заморозка": "#6f61a8",
  "Хліб": "#b97811",
  "Овочі та фрукти": "#16845c",
  "Бакалія": "#d49a21",
  "Солодощі": "#7c4a88",
  "Кава та чай": "#5f493f",
  "Напої": "#245fbd",
  "Консерви": "#2d7f8f",
  "Риба та морепродукти": "#2d7f8f",
  "Товари для тварин": "#2d7f8f",
  "Побутова хімія": "#245fbd",
  "Снеки": "#5f493f",
  "Готові страви": "#d49a21",
  "Інше": "#384551"
};

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
  const normalized = String(text).replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/[0-9]+(?:\.[0-9]+)?/);
  return match ? Number(match[0]) : null;
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

function inferSize(name) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const complex = cleaned.match(/(\d+)\*(\d+(?:[.,]\d+)?)\s*(г|мл|л|кг|шт)/i);
  if (complex) {
    const count = Number(complex[1]);
    const amount = Number(complex[2].replace(",", "."));
    const unit = complex[3].toLowerCase();
    const total = count * amount;
    if (unit === "г") return { size: `${complex[1]}*${complex[2]} г`, unitAmount: total / 1000, unitLabel: "кг" };
    if (unit === "мл") return { size: `${complex[1]}*${complex[2]} мл`, unitAmount: total / 1000, unitLabel: "л" };
    return { size: `${complex[1]}*${complex[2]} ${unit}`, unitAmount: total, unitLabel: unit };
  }

  const matches = [...cleaned.matchAll(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(кг|г|л|мл|шт|пак|табл|капс)(?:\b|$)/gi)];
  if (!matches.length) return { size: "1 шт", unitAmount: 1, unitLabel: "шт" };

  const match = matches[matches.length - 1];
  const amount = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  if (unit === "г") return { size: `${match[1]} г`, unitAmount: amount / 1000, unitLabel: "кг" };
  if (unit === "мл") return { size: `${match[1]} мл`, unitAmount: amount / 1000, unitLabel: "л" };
  if (unit === "кг") return { size: `${match[1]} кг`, unitAmount: amount, unitLabel: "кг" };
  if (unit === "л") return { size: `${match[1]} л`, unitAmount: amount, unitLabel: "л" };
  return { size: `${match[1]} ${unit}`, unitAmount: amount || 1, unitLabel: "шт" };
}

function normalizeCategory(name) {
  const text = name.toLowerCase();
  if (/корм|кот|пес|собак|миска.*природа/.test(text)) return "Товари для тварин";
  if (/пиво|вино|віно|віскі|лікер|горіл|сидр|шампан|ігрист|брют|просек|prosecco|frizzante|аперитив|бренді|коньяк|ром|джин|текіл|текил|вермут|бальзам.*\d+%/.test(text)) return "Алкоголь";
  if (/насіння|арахіс|фісташ|чіпс|чипс|снек|сухар|крекер|грінк|маршмелоу/.test(text)) return "Снеки";
  if (/шокол|цукер|конфет|ірис|печив|зефір|мармелад|тістеч|торт|халва|батончик|вафл|десерт|желе|гумка жув|жувальн.*гумк|рулет бісквіт|ролліні/.test(text)) return "Солодощі";
  if (/ковбас|сосиск|сардель|салям|шинка|бекон|балик|кабанос/.test(text)) return "Ковбаси";
  if (/крабов|оселед|кревет|міді|кальмар|морепродукт|ікра|шпрот|сардин|скумбр|форел|сьомг|хек|минтай|лосось|масляна|(?:^|[^а-яіїєґ])риб(а|н)/.test(text)) return "Риба та морепродукти";
  if (/слойк/.test(text)) return "Хліб";
  if (/яйц/.test(text)) return "Молочні";
  if (/вермішель|локшина|mivina|мівіна|картопляне пюре|пюре картоп|куркума|паприка|прянощ|приправа|маринад/.test(text)) return "Бакалія";
  if (/пельмен|вареник|гіоза|gyoza/.test(text)) return "Заморозка";
  if (/крем-суп|(^|\s)суп(\s|$)/.test(text)) return "Готові страви";
  if (/куряч|курчат|курк(?!ум)|гомілк|індич|свини|ялович|м[’'ʼ]яс|фарш|стегн|філе|биток|паштет|буженин/.test(text)) return "М'ясо";
  if (/морозив|ескімо|заморож|пельмен|вареник|піца/.test(text)) return "Заморозка";
  if (/хліб|батон|багет|лаваш|булоч|круасан|пряник|випіч|тісто|сушк/.test(text)) return "Хліб";
  if (/яблу|огір|томат|помід|картоп|капуст|салат|зелень|цибуля|кріп|петруш|гриб|мандар|банан|ананас|манго|лохин|груша|сухофрукт|фрукт|овоч/.test(text)) return "Овочі та фрукти";
  if (/кава|чай|цикор|maccoffee|jacobs|monarch/.test(text)) return "Кава та чай";
  if (/сік|нектар|напій|вода|квас|cola|coca|pepsi/.test(text)) return "Напої";
  if (/консерв|тунець|оливки|кукурудз|ананас.*сироп/.test(text)) return "Консерви";
  if (/крабов|оселед|кревет|міді|кальмар|морепродукт|ікра|шпрот|сардин|скумбр|форел|сьомг|хек|минтай|лосось|масляна|(?:^|[^а-яіїєґ])риб(а|н)/.test(text)) return "Риба та морепродукти";
  if (/праль|прання|засіб|гель|шампун|душ|мило|папір|проклад|тампон|бритв|підгуз|відбілювач|ополіскувач.*білизн|кондиціонер.*білизн|кондиціонер.*волос|кондиціонер hair|hair trend|лосьйон|дезодорант|зубн|крем(?![-\s]?(сир|суп))(?=.*(універсальн|для|spf|захист|шкіри|облич|тіла|рук|волос|голін|засмаг|зволож|живиль))|крем-?гель|zewa|perwoll|persil/.test(text)) return "Побутова хімія";
  if (/плов|крем-суп|(^|\s)суп(\s|$)|картопля.*смаж|гриль|салат готов/.test(text)) return "Готові страви";
  if (/круп|греч|(?:^|[^а-яіїєґ])рис(?![а-яіїєґ])|кус[-\s]?кус|каша|пластівц|сухий сніданок|сніданки сухі|готовий сніданок|мюслі|кульки з какао|макарон|спагеті|олія|борош|цукор|сіль|сочевиц|соус|кетчуп|майонез|гірчиц|бульйон|куркума|паприка|прянощ|трави|приправа|розпушувач|борщ|паста(?!.*зубн)/.test(text)) return "Бакалія";
  if (!/сирокопч|сиров'?ялен|сирн[а-я]*\s*начин/.test(text) && /(^|\s)(сир|сири|сиру|сирний|сирна|сирне)(\s|$)|крем-сир|philadelphia|моцарел|сулугун|камамбер|брі|пармезан|грана/.test(text)) return "Твердий сир";
  if (/молок|молочн|кефір|йогурт(?!ов)|сирок|сметан(?!а та цибуля)|вершк|масло(?!.*тіла)|творог|кисломол/.test(text)) return "Молочні";
  return "Інше";
}

function inferSubcategory(name, category) {
  const text = name.toLowerCase();
  if (category === "Молочні") {
    if (/йогурт/.test(text)) return "Йогурти";
    if (/кефір/.test(text)) return "Кефір";
    if (/сметан/.test(text)) return "Сметана";
    if (/вершк/.test(text)) return "Вершки";
    if (/масло/.test(text)) return "Масло";
    if (/сирок|десерт|пудинг|коктейль/.test(text)) return "Сирки та десерти";
    if (/творог|кисломол/.test(text)) return "Кисломолочний сир";
    if (/молок/.test(text)) return "Молоко";
    return "Інша молочка";
  }
  if (category === "Твердий сир") {
    if (/моцарел/.test(text)) return "Моцарела";
    if (/сулугун/.test(text)) return "Сулугуні";
    if (/плавлен/.test(text)) return "Плавлений сир";
    if (/камамбер|брі|крем-сир|philadelphia/.test(text)) return "М'які сири";
    return "Твердий/напівтвердий сир";
  }
  if (category === "Ковбаси") {
    if (/сосиск|сардель/.test(text)) return "Сосиски та сардельки";
    if (/варен/.test(text)) return "Варені ковбаси";
    if (/сирокоп|салям|с\/к|сиров/.test(text)) return "Сирокопчені ковбаси";
    if (/шинка|бекон|балик/.test(text)) return "Шинка та бекон";
    return "Інші ковбаси";
  }
  if (category === "М'ясо") {
    if (/індич/.test(text)) return "Індичка";
    if (/свин/.test(text)) return "Свинина";
    if (/ялович/.test(text)) return "Яловичина";
    if (/куряч|курчат|курк(?!ум)|гомілк|крило|чверть|стегн|філе/.test(text)) return "Курятина";
    if (/паштет/.test(text)) return "Паштети";
    return "Інше м'ясо";
  }
  if (category === "Кава та чай") {
    if (/кава/.test(text)) return "Кава";
    if (/чай/.test(text)) return "Чай";
    if (/цикор/.test(text)) return "Цикорій";
    return "Інше";
  }
  if (category === "Напої") {
    if (/вода/.test(text)) return "Вода";
    if (/сік|нектар/.test(text)) return "Соки та нектари";
    if (/квас/.test(text)) return "Квас";
    return "Інші напої";
  }
  if (category === "Овочі та фрукти") {
    if (/яблу|банан|мандар|ананас|груша|лохин|фрукт/.test(text)) return "Фрукти";
    if (/огір|томат|помід|картоп|капуст|салат|овоч/.test(text)) return "Овочі";
    return "Інше";
  }
  if (category === "Алкоголь") {
    if (/пиво/.test(text)) return "Пиво";
    if (/вино|віно|шампан|ігрист|брют|просек|prosecco|frizzante/.test(text)) return "Вино";
    if (/віскі/.test(text)) return "Віскі";
    if (/горіл/.test(text)) return "Горілка";
    return "Інший алкоголь";
  }
  if (category === "Солодощі") {
    if (/шокол/.test(text)) return "Шоколад";
    if (/печив|вафл/.test(text)) return "Печиво та вафлі";
    if (/цукер|ірис/.test(text)) return "Цукерки";
    if (/тістеч|торт/.test(text)) return "Торти та тістечка";
    if (/батончик|драже/.test(text)) return "Батончики та драже";
    if (/морозив|ескімо/.test(text)) return "Морозиво";
    return "Інші солодощі";
  }
  if (category === "Заморозка") {
    if (/морозив/.test(text)) return "Морозиво";
    if (/пельмен/.test(text)) return "Пельмені";
    if (/вареник/.test(text)) return "Вареники";
    if (/піца/.test(text)) return "Піца";
    if (/овоч|суміш|броколі|картоп/.test(text)) return "Заморожені овочі";
    return "Інша заморозка";
  }
  if (category === "Бакалія") {
    if (/макарон|спагеті|паста(?!.*зубн)/.test(text)) return "Макарони";
    if (/каша|пластівц|сухий сніданок|сніданки сухі|готовий сніданок|мюслі|кульки з какао/.test(text)) return "Пластівці та сніданки";
    if (/круп|греч|(?:^|[^а-яіїєґ])рис(?![а-яіїєґ])|булгур|кус[-\s]?кус|вівсян|пшен/.test(text)) return "Крупи";
    if (/олія|оливкова|соняшникова/.test(text)) return "Олія";
    if (/борош|цукор|сіль/.test(text)) return "Борошно, цукор, сіль";
    if (/соус|кетчуп|майонез|гірчиц|заправк|маринад/.test(text)) return "Соуси та заправки";
    if (/приправа|спеці|бульйон|куркума|паприка|прянощ|трави|розпушувач|борщ/.test(text)) return "Приправи";
    return "Інша бакалія";
  }
  if (category === "Риба та морепродукти") {
    if (/крабов/.test(text)) return "Крабові палички";
    if (/оселед/.test(text)) return "Оселедець";
    if (/кревет|міді|кальмар|морепродукт/.test(text)) return "Морепродукти";
    if (/ікра/.test(text)) return "Ікра";
    if (/шпрот|сардин|скумбр|форел|сьомг|хек|минтай|лосось|масляна|(?:^|[^а-яіїєґ])риб(а|н)/.test(text)) return "Риба";
    return "Інша риба";
  }
  if (category === "Консерви") {
    if (/тунець|шпрот|сардин|риба/.test(text)) return "Рибні консерви";
    if (/горош|кукурудз|квасол|оливки|маслин/.test(text)) return "Овочеві консерви";
    if (/ананас|персик|фрукт/.test(text)) return "Фруктові консерви";
    if (/тушк|м'яс|мʼяс|м’яс/.test(text)) return "М'ясні консерви";
    return "Інші консерви";
  }
  if (category === "Побутова хімія") {
    if (/праль|прання/.test(text)) return "Прання";
    if (/проклад|тампон|підгуз|уролог|бритв/.test(text)) return "Особиста гігієна";
    if (/ополіскувач.*білизн|кондиціонер.*білизн/.test(text)) return "Прання";
    if (/доместос|універсальн|чист|миття|посуд/.test(text)) return "Прибирання";
    if (/шампун|душ|мило|гель|кондиціонер.*волос|кондиціонер hair|hair trend|лосьйон|дезодорант|крем(?![-\s]?(сир|суп))(?=.*(універсальн|для|spf|захист|шкіри|облич|тіла|рук|волос|голін|засмаг|зволож|живиль))|крем-?гель|зубн/.test(text)) return "Гігієна";
    if (/папір|сервет/.test(text)) return "Паперові товари";
    return "Інше";
  }
  if (category === "Снеки") {
    if (/чіпс/.test(text)) return "Чіпси";
    if (/сухар|крекер|грінк/.test(text)) return "Сухарики та крекери";
    if (/арахіс|горіх|насіння|фісташ/.test(text)) return "Горіхи та насіння";
    if (/батончик|драже/.test(text)) return "Батончики та драже";
    return "Інші снеки";
  }
  if (category === "Товари для тварин") {
    if (/корм.*кот|для кот|кіш/.test(text)) return "Для котів";
    if (/корм.*собак|для собак|пес/.test(text)) return "Для собак";
    if (/сухий/.test(text)) return "Сухий корм";
    if (/вологий|пауч|желе|соус/.test(text)) return "Вологий корм";
    return "Інше для тварин";
  }
  if (category === "Хліб") {
    if (/хліб/.test(text)) return "Хліб";
    if (/батон|багет|лаваш|тако|тортиль/.test(text)) return "Батони, багети, лаваш";
    if (/хлібц/.test(text)) return "Хлібці";
    if (/круасан|булоч|пряник|випіч|тісто|сушк/.test(text)) return "Випічка";
    return "Інший хліб";
  }
  if (category === "Готові страви") {
    if (/плов/.test(text)) return "Плов";
    if (/крем-суп|(^|\s)суп(\s|$)/.test(text)) return "Супи";
    if (/гриль/.test(text)) return "Гриль";
    if (/салат/.test(text)) return "Салати";
    if (/приправа/.test(text)) return "Приправи до страв";
    return "Інші готові страви";
  }
  return "Інше";
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
})).concat([
  {
    name: "Сімі Львів",
    state: "Не знайдено стабільне джерело",
    detail: "Публічної сторінки з повною таблицею акційних цін для Львова не знайдено",
    url: null
  }
]);

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
