import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyDeal } from "./classifier.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataPath = join(root, "data", "deals.json");
const reportPath = join(root, "data", "classification-report.json");
const shouldFix = globalThis.AUDIT_SHOULD_FIX === true
  || (typeof process !== "undefined" && process.argv.includes("--fix"));

function text(value = "") {
  return String(value).toLowerCase();
}

function itemSummary(item) {
  return {
    id: item.id,
    name: item.name,
    store: item.store,
    category: item.category,
    subcategory: item.subcategory
  };
}

function buildAudit(deals) {
  const checks = [
    {
      name: "ice_cream_has_only_ice_cream",
      description: "У Заморозка -> Морозиво не повинні бути вареники, пельмені, піца чи овочі.",
      test: item => item.category === "Заморозка"
        && item.subcategory === "Морозиво"
        && /вареник|пельмен|піца|овоч|суміш|броколі|картоп.*фрі|тісто/.test(text(item.name))
    },
    {
      name: "frozen_dumplings_do_not_contain_ice_cream",
      description: "У варениках, пельменях і піці не повинно бути морозива.",
      test: item => item.category === "Заморозка"
        && /Вареники|Пельмені|Піца|Заморожені овочі|Заморожене тісто/.test(item.subcategory)
        && /морозив|ескімо|пломбір|сорбет/.test(text(item.name))
    },
    {
      name: "meat_has_no_fish",
      description: "Риба та морепродукти не повинні потрапляти у м'ясо.",
      test: item => item.category === "М'ясо"
        && /(^|[^а-яіїєґ])риб(а|н|к)|оселед|скумбр|лосос|(^|[^а-яіїєґ])хек([^а-яіїєґ]|$)|тунець|форел|краб|кревет|міді|кальмар|ікра|морепродукт/.test(text(item.name))
    },
    {
      name: "chicken_has_only_chicken",
      description: "Курятина не повинна містити рибу, індичку, свинину чи яловичину.",
      test: item => item.category === "М'ясо"
        && item.subcategory === "Курятина"
        && /(^|[^а-яіїєґ])риб(а|н|к)|оселед|скумбр|лосос|(^|[^а-яіїєґ])хек([^а-яіїєґ]|$)|тунець|форел|краб|кревет|міді|кальмар|ікра|індич|свин|ялович|яйц|яйце/.test(text(item.name))
    },
    {
      name: "hard_cheese_has_no_cottage_cheese",
      description: "Кисломолочний сир, сирки й молочні десерти не повинні бути у твердому сирі.",
      test: item => item.category === "Твердий сир"
        && /сир кисломол|кисломолочн|творог|сирок|глазурован|actimel|молоко|йогурт|кефір|сметана(?![а-яіїєґ])|згущ/.test(text(item.name))
    },
    {
      name: "coffee_tea_not_sweets",
      description: "Чай і кава не повинні залітати у солодощі через смакові слова.",
      test: item => item.category === "Солодощі"
        && /(^|\s)(чай|кава)(\s|$)|tea moments|lipton|jacobs|nescafe/.test(text(item.name))
    },
    {
      name: "ice_cream_not_sweets",
      description: "Морозиво не повинно бути у солодощах.",
      test: item => item.category === "Солодощі"
        && /морозив|ескімо|пломбір|сорбет/.test(text(item.name))
    },
    {
      name: "non_alcoholic_not_alcohol",
      description: "Безалкогольні напої не повинні бути в алкоголі.",
      test: item => item.category === "Алкоголь"
        && /безалкогольн/.test(text(item.name))
    },
    {
      name: "pet_food_not_meat_or_fish",
      description: "Корм із куркою, яловичиною чи лососем має лишатися товарами для тварин.",
      test: item => item.category !== "Товари для тварин"
        && /корм|для кот|для кіт|для кіш|для собак|pre-?vital|e-?zoo|whiskas|purina|pedigree/.test(text(item.name))
    },
    {
      name: "personal_care_not_grocery",
      description: "Гігієна й побутова хімія не повинні бути у бакалії.",
      test: item => item.category === "Бакалія"
        && /зубн|шампун|гель для|мило|душ|праль|сервет|папір|проклад|дезодорант|крем.*(облич|тіл|рук|spf)/.test(text(item.name))
    },
    {
      name: "grocery_not_obvious_dairy_or_drink",
      description: "Напої, сиркова паста й молочні продукти не повинні бути у бакалії; каші та пластівці є винятком.",
      test: item => item.category === "Бакалія"
        && !/каша|пластівц|мюслі|сніданок|сніданки сухі|сухий сніданок/.test(text(item.name))
        && !/соус|заправк|маринад|кетчуп|майонез/.test(text(item.name))
        && /напій|молоко|йогурт|кефір|сметан(?!ков)|сирков|сир кисломол|сік|нектар/.test(text(item.name))
    },
    {
      name: "grocery_not_fish",
      description: "Кілька, тунець, шпроти та інша явна риба не повинні бути у бакалії.",
      test: item => item.category === "Бакалія"
        && /(^|[^а-яіїєґ])кільк|тунець|лосос|оселед|скумбр|сардин|шпрот|(^|[^а-яіїєґ])риба/.test(text(item.name))
    },
    {
      name: "meat_not_pasta_snack_or_flavor",
      description: "Паста, вермішель, чипси й картопляне пюре зі смаком курки не повинні бути у м'ясі.",
      test: item => item.category === "М'ясо"
        && /вермішел|локшин|макарон|ч[іи]пс|пюре картоп|зі смаком курк/.test(text(item.name))
    },
    {
      name: "produce_not_flavored_goods",
      description: "Смакові назви соусів, напоїв, чипсів, цукерок і йогуртів не повинні бути овочами чи фруктами.",
      test: item => item.category === "Овочі та фрукти"
        && /смак|соус|приправа|напій|цукер|ч[іи]пс|йогурт|паста/.test(text(item.name))
    },
    {
      name: "dairy_not_cereal_or_pasta",
      description: "Каші, пластівці, макарони й вермішель не повинні бути у молочці.",
      test: item => item.category === "Молочні"
        && /каша|пластівц|мюслі|круп|вермішел|макарон|паста(?! сирков)/.test(text(item.name))
    }
  ];

  const issues = checks.map(check => {
    const hits = deals.filter(check.test);
    return {
      name: check.name,
      description: check.description,
      count: hits.length,
      examples: hits.slice(0, 20).map(itemSummary)
    };
  });

  return {
    ok: issues.every(issue => issue.count === 0),
    totalDeals: deals.length,
    issueCount: issues.reduce((sum, issue) => sum + issue.count, 0),
    issues
  };
}

const payload = JSON.parse(await readFile(dataPath, "utf8"));
const before = buildAudit(payload.deals);
const changes = [];

if (shouldFix) {
  for (const item of payload.deals) {
    const previous = {
      category: item.category,
      subcategory: item.subcategory,
      color: item.color
    };
    const next = classifyDeal(item.name);
    item.category = next.category;
    item.subcategory = next.subcategory;
    item.color = next.color;
    if (previous.category !== item.category || previous.subcategory !== item.subcategory) {
      changes.push({
        id: item.id,
        name: item.name,
        store: item.store,
        from: previous,
        to: {
          category: item.category,
          subcategory: item.subcategory,
          color: item.color
        }
      });
    }
  }
  payload.meta = {
    ...payload.meta,
    classificationVersion: "2026-06-04-strict-product-taxonomy",
    classificationUpdatedAt: new Date().toISOString(),
    classificationChanges: changes.length
  };
  await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

const after = buildAudit(payload.deals);
const report = {
  generatedAt: new Date().toISOString(),
  fixed: shouldFix,
  changedDeals: changes.length,
  before,
  after,
  changedExamples: changes.slice(0, 60)
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (!after.ok && typeof process !== "undefined") {
  process.exitCode = 1;
} else if (!after.ok) {
  throw new Error("Product classification audit failed");
}
