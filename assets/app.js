    let deals = [];

    let sourceHealth = [];

    const all = "Усі";
    const selected = new Set();
    const pageSize = 90;
    let visibleLimit = pageSize;
    let searchTimer = null;

    const dataVersion = "2026-06-04-fast-search";
    const controls = {
      search: document.querySelector("#search"),
      store: document.querySelector("#storeFilter"),
      category: document.querySelector("#categoryFilter"),
      subcategory: document.querySelector("#subcategoryFilter"),
      sort: document.querySelector("#sortFilter"),
      minDiscount: document.querySelector("#minDiscount")
    };

    function unique(values) {
      return [all, ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "uk"))];
    }

    function inferSubcategory(item) {
      const name = item.name.toLowerCase();
      const category = item.category;
      if (category === "Молочні") {
        if (/сирок|десерт|пудинг/.test(name)) return "Сирки та десерти";
        if (/творог|кисломол/.test(name)) return "Кисломолочний сир";
        if (/йогурт/.test(name)) return "Йогурти";
        if (/кефір/.test(name)) return "Кефір";
        if (/моцарел/.test(name)) return "Моцарела";
        if (/сулугун/.test(name)) return "Сулугуні";
        if (/плавлен/.test(name)) return "Плавлений сир";
        if (/камамбер|брі|крем-сир|philadelphia|фета|фелата/.test(name)) return "М'які сири";
        if (/тверд[а-яіїєґ]* сир|сир .*тверд|напівтверд|пармезан|гауд|чеддер|голланд|російськ|(^|\s)сир(\s|$|,)|сири(\s|$)/.test(name)) return "Твердий/напівтвердий сир";
        if (/сметан/.test(name)) return "Сметана";
        if (/масло/.test(name)) return "Масло";
        if (/молок/.test(name)) return "Молоко";
        return "Інша молочка";
      }
      if (category === "Ковбаси") {
        if (/сосиск|сардель/.test(name)) return "Сосиски та сардельки";
        if (/варен/.test(name)) return "Варені ковбаси";
        if (/сирокоп|салям|с\/к|сиров/.test(name)) return "Сирокопчені ковбаси";
        if (/шинка|бекон|балик/.test(name)) return "Шинка та бекон";
        return "Інші ковбаси";
      }
      if (category === "Яйця") {
        if (/перепел/.test(name)) return "Перепелині яйця";
        return "Курячі яйця";
      }
      if (category === "М'ясо") {
        if (/куряч|курк|стегн|філе/.test(name)) return "Курятина";
        if (/індич/.test(name)) return "Індичка";
        if (/свин/.test(name)) return "Свинина";
        if (/ялович/.test(name)) return "Яловичина";
        return "Інше м'ясо";
      }
      if (category === "Кава та чай") {
        if (/кава/.test(name)) return "Кава";
        if (/чай/.test(name)) return "Чай";
        return "Інше";
      }
      if (category === "Напої") {
        if (/вода/.test(name)) return "Вода";
        if (/сік|нектар/.test(name)) return "Соки та нектари";
        return "Інші напої";
      }
      if (category === "Овочі та фрукти") {
        if (/яблу|банан|мандар|ананас|груша|лохин|фрукт/.test(name)) return "Фрукти";
        if (/огір|томат|помід|картоп|салат|овоч/.test(name)) return "Овочі";
        return "Інше";
      }
      if (category === "Алкоголь") {
        if (/пиво/.test(name)) return "Пиво";
        if (/вино|віно|шампан|ігрист|брют|просек|prosecco|frizzante/.test(name)) return "Вино";
        if (/віскі/.test(name)) return "Віскі";
        if (/горіл/.test(name)) return "Горілка";
        return "Інший алкоголь";
      }
      if (category === "Солодощі") {
        if (/шокол/.test(name)) return "Шоколад";
        if (/печив|вафл/.test(name)) return "Печиво та вафлі";
        if (/цукер|ірис/.test(name)) return "Цукерки";
        if (/тістеч|торт/.test(name)) return "Торти та тістечка";
        if (/батончик|драже/.test(name)) return "Батончики та драже";
        if (/морозив/.test(name)) return "Морозиво";
        return "Інші солодощі";
      }
      if (category === "Заморозка") {
        if (/морозив/.test(name)) return "Морозиво";
        if (/пельмен/.test(name)) return "Пельмені";
        if (/вареник/.test(name)) return "Вареники";
        if (/піца/.test(name)) return "Піца";
        if (/овоч|суміш|броколі|картоп/.test(name)) return "Заморожені овочі";
        return "Інша заморозка";
      }
      if (category === "Риба та морепродукти") {
        if (/крабов/.test(name)) return "Крабові палички";
        if (/оселед/.test(name)) return "Оселедець";
        if (/кревет|міді|кальмар|морепродукт/.test(name)) return "Морепродукти";
        if (/ікра/.test(name)) return "Ікра";
        return "Риба";
      }
      if (category === "Бакалія") {
        if (/макарон|спагеті|паста(?!.*зубн)/.test(name)) return "Макарони";
        if (/круп|греч|(?:^|[^а-яіїєґ])рис(?![а-яіїєґ])|булгур|кус-?кус|вівсян|пшен|пластівц/.test(name)) return "Крупи";
        if (/олія|оливкова|соняшникова/.test(name)) return "Олія";
        if (/борош|цукор|сіль/.test(name)) return "Борошно, цукор, сіль";
        if (/соус|кетчуп|майонез|гірчиц|заправк|маринад/.test(name)) return "Соуси та заправки";
        if (/приправа|спеці|бульйон/.test(name)) return "Приправи";
        return "Інша бакалія";
      }
      if (category === "Консерви") {
        if (/тунець|шпрот|сардин|риба/.test(name)) return "Рибні консерви";
        if (/горош|кукурудз|квасол|оливки|маслин/.test(name)) return "Овочеві консерви";
        if (/ананас|персик|фрукт/.test(name)) return "Фруктові консерви";
        if (/тушк|м'яс|мʼяс|м’яс/.test(name)) return "М'ясні консерви";
        return "Інші консерви";
      }
      if (category === "Побутова хімія") {
        if (/праль|прання/.test(name)) return "Прання";
        if (/проклад|тампон|підгуз|уролог/.test(name)) return "Особиста гігієна";
        if (/доместос|універсальн|чист|миття|посуд/.test(name)) return "Прибирання";
        if (/шампун|душ|мило|гель|лосьйон|дезодорант|крем(?![-\s]?(сир|суп))(?=.*(універсальн|для|spf|захист|шкіри|облич|тіла|рук|волос|голін|засмаг|зволож|живиль))|крем-?гель|зубн/.test(name)) return "Гігієна";
        if (/папір|сервет/.test(name)) return "Паперові товари";
        return "Інше";
      }
      if (category === "Снеки") {
        if (/чіпс/.test(name)) return "Чіпси";
        if (/сухар|крекер/.test(name)) return "Сухарики та крекери";
        if (/арахіс|горіх|насіння|фісташ/.test(name)) return "Горіхи та насіння";
        if (/батончик|драже/.test(name)) return "Батончики та драже";
        if (/снек/.test(name)) return "Інші снеки";
        return "Інші снеки";
      }
      if (category === "Товари для тварин") {
        if (/корм.*кот|для кот|кіш/.test(name)) return "Для котів";
        if (/корм.*собак|для собак|пес/.test(name)) return "Для собак";
        if (/сухий/.test(name)) return "Сухий корм";
        if (/вологий|пауч|желе|соус/.test(name)) return "Вологий корм";
        return "Інше для тварин";
      }
      if (category === "Хліб") {
        if (/хліб/.test(name)) return "Хліб";
        if (/батон|багет|лаваш|тако|тортиль/.test(name)) return "Батони, багети, лаваш";
        if (/хлібц/.test(name)) return "Хлібці";
        if (/круасан|булоч|пряник|випіч/.test(name)) return "Випічка";
        return "Інший хліб";
      }
      if (category === "Готові страви") {
        if (/плов/.test(name)) return "Плов";
        if (/crem-суп|(^|\s)суп(\s|$)/.test(name)) return "Супи";
        if (/гриль/.test(name)) return "Гриль";
        if (/салат/.test(name)) return "Салати";
        if (/приправа/.test(name)) return "Приправи до страв";
        return "Інші готові страви";
      }
      if (category === "Товари для дому") return "Дім та кухня";
      return "Інше";
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

    function inferMeasuredSize(name = "") {
      const cleaned = String(name).replace(/\s+/g, " ").trim();
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
      if (!matches.length) return null;
      const match = matches[matches.length - 1];
      const amount = parseDecimal(match[1]);
      const unit = normalizeMeasureUnit(match[2]);
      if (unit && amount > 0) {
        return {
          size: `${match[1]} ${unit.displayUnit}`,
          unitAmount: amount / unit.factor,
          unitLabel: unit.unitLabel
        };
      }
      if (amount > 0) return { size: `${match[1]} ${match[2].toLowerCase()}`, unitAmount: amount, unitLabel: "шт" };
      return null;
    }

    function enrichDeals() {
      deals.forEach(item => {
        const measured = inferMeasuredSize(item.name);
        if (measured) Object.assign(item, measured);
        if (!item.subcategory) item.subcategory = inferSubcategory(item);
        item._discount = Math.round((1 - item.price / item.old) * 100);
        item._unitPrice = unitPrice(item);
        item._unitPricePlausible = unitPricePlausible(item);
        item._unitSort = item._unitPricePlausible ? item._unitPrice : Number.POSITIVE_INFINITY;
        item._daysLeft = daysLeft(item);
        item._endingSort = item._daysLeft === null ? Number.POSITIVE_INFINITY : item._daysLeft;
        item._searchText = searchTokens(`${item.name} ${item.size || ""} ${item.store || ""}`).join(" ");
      });
    }

    function discount(item) {
      if (Number.isFinite(item._discount)) return item._discount;
      return Math.round((1 - item.price / item.old) * 100);
    }

    function unitPrice(item) {
      if (Number.isFinite(item._unitPrice)) return item._unitPrice;
      const amount = Number(item.unitAmount);
      if (!amount || !isFinite(amount)) return null;
      return item.price / amount;
    }

    function unitPricePlausible(item) {
      if (typeof item._unitPricePlausible === "boolean") return item._unitPricePlausible;
      const value = unitPrice(item);
      if (value === null || !isFinite(value) || value <= 0) return false;
if (item.unitLabel === "кг" || item.unitLabel === "л") return value >= 0.01 && value <= 250000;
      if (item.unitLabel === "шт") return value >= 0.01 && value <= 100000;
      return value > 0;
    }

    function unitSortValue(item) {
      if (Number.isFinite(item._unitSort)) return item._unitSort;
      return unitPricePlausible(item) ? unitPrice(item) : Number.POSITIVE_INFINITY;
    }

    function isLikely100gPrice(item) {
      if (item.unitLabel !== "кг") return false;
      const u = unitPrice(item);
      if (u === null) return false;
      if (/вода/i.test(item.category) || /вода/i.test(item.name)) return false;
      if (u < 12) return true;
      const cat = item.category || "";
      if ((cat.includes("М'ясо") || cat.includes("Риба") || cat.includes("Ковбас") || cat.includes("Сир") || cat.includes("Молоч")) && u < 50) return true;
      if (cat.includes("Заморозка") && u < 30) return true;
      if (cat.includes("Солодощі") && u < 30) return true;
      return false;
    }

    function unitPriceLabel(item) {
      if (!unitPricePlausible(item)) return "—";
      let label = `${money(unitPrice(item))} / ${item.unitLabel}`;
      if (isLikely100gPrice(item)) {
        const trueKgPrice = item.price * 10;
        label = `<span style="color:var(--danger); font-weight:500;" title="Увага: Магазин ймовірно вказав ціну за 100г. Реальна ціна всієї упаковки буде більшою.">⚠️ ціна за 100г? (~${money(trueKgPrice)}/кг)</span>`;
      }
      return label;
    }

    function unitPriceMarkup(item) {
      return unitPricePlausible(item) ? `<span class="unit-price">${unitPriceLabel(item)}</span>` : "";
    }

    function money(value) {
      if (value === null || typeof value === "undefined") return "0 грн";
      return `${value.toLocaleString("uk-UA", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })} грн`;
    }

    function escapeHTML(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

    function showAlert(message, title = 'Повідомлення') { document.getElementById('alertTitle').textContent = title; document.getElementById('alertMessage').textContent = message; document.getElementById('alertModal').classList.add('active'); }
    document.getElementById('closeAlertModal').addEventListener('click', () => document.getElementById('alertModal').classList.remove('active'));
    document.getElementById('btnAlertOk').addEventListener('click', () => document.getElementById('alertModal').classList.remove('active'));

    function escapeAttribute(value = "") {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
    }

    function productThumb(item, extraClass = "") {
      const image = /^https:\/\//.test(item.image || "") ? item.image : "";
      const color = item.color || "#475569";
      const fallback = (item.category || "?")[0];
      const imageMarkup = image
        ? `<img src="${escapeAttribute(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('image-missing');this.remove();">`
        : "";
      return `
        <div class="thumb ${extraClass} ${image ? "has-image" : ""}" style="--thumb-bg:${color};background:linear-gradient(135deg, ${color}, rgba(0,0,0,0.25))">
          ${imageMarkup}
          <span>${fallback}</span>
        </div>
      `;
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

    function parseIsoDate(value) {
      if (!value) return null;
      const [year, month, day] = value.split("-").map(Number);
      if (!year || !month || !day) return null;
      return new Date(Date.UTC(year, month - 1, day));
    }

    function daysLeft(item) {
      const end = parseIsoDate(item.end);
      if (!end) return null;
      const today = parseIsoDate(todayIso());
      return Math.ceil((end - today) / 86400000);
    }

    function isActivePromo(item) {
      const days = daysLeft(item);
      return days === null || days >= 0;
    }

    function dateLabel(value) {
      const date = parseIsoDate(value);
      if (!date) return "";
      return date.toLocaleDateString("uk-UA", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function termLabel(item, compact = false) {
      const days = "_daysLeft" in item ? item._daysLeft : daysLeft(item);
      if (days === null) return "термін не вказано";
      if (days < 0) return "завершено";
      if (days === 0) return compact ? "сьогодні" : `до ${dateLabel(item.end)} · сьогодні`;
      if (days === 1) return compact ? "завтра" : `до ${dateLabel(item.end)} · завтра`;
      return compact ? `${days} дн.` : `до ${dateLabel(item.end)} · ${days} дн.`;
    }

    function endingSortValue(item) {
      if (Number.isFinite(item._endingSort)) return item._endingSort;
      const days = daysLeft(item);
      return days === null ? Number.POSITIVE_INFINITY : days;
    }

    function formatDateTime(value) {
      if (!value) return "сьогодні";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "сьогодні";
      return date.toLocaleString("uk-UA", {
        timeZone: "Europe/Kyiv",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function searchTokens(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/[’ʼ`´]/g, "'")
        .replace(/[^a-zа-яіїєґ0-9%']+/gi, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }

    let currentTab = "home"; // Додано для відстеження активної вкладки

    function getFilteredDeals() {
      const queryTokens = searchTokens(controls.search.value);
      const store = controls.store.value || all;
      const category = controls.category.value || all;
      const subcategory = controls.subcategory.value || all;
      const minDiscount = Number(controls.minDiscount.value);

      const filtered = deals.filter(item => {
        if (currentTab === "favorites") {
          if (!selected.has(item.id)) return false;
        }
        return (!queryTokens.length || queryTokens.every(token => item._searchText.includes(token)))
          && (store === all || item.store === store)
          && (category === all || item.category === category)
          && (subcategory === all || item.subcategory === subcategory)
          && discount(item) >= minDiscount;
      });

      if (controls.sort.value === "discount") filtered.sort((a, b) => discount(b) - discount(a));
      if (controls.sort.value === "price") filtered.sort((a, b) => a.price - b.price);
      if (controls.sort.value === "ending") filtered.sort((a, b) => endingSortValue(a) - endingSortValue(b));
      return filtered;
    }

    function renderMetrics(list) {
      const elProducts = document.querySelector("#metricProducts");
      if (!elProducts) return;
      let discountSum = 0;
      let best = null;
      let ending = null;
      list.forEach(item => {
        discountSum += item._discount;
        if (!best || item.price < best.price) best = item;
        if (item._daysLeft !== null && (!ending || item._endingSort < ending._endingSort)) ending = item;
      });
      const averageDiscount = list.length ? Math.round(discountSum / list.length) : 0;
      elProducts.textContent = list.length;
      document.querySelector("#metricDiscount").textContent = `${averageDiscount}%`;
      document.querySelector("#metricBest").textContent = best ? money(best.price) : "0 грн";
      document.querySelector("#metricBestLabel").textContent = best ? `${best.name}, ${best.store}` : "оберіть категорію або мережу";
      document.querySelector("#metricEnding").textContent = ending ? termLabel(ending, true) : "немає дати";
      document.querySelector("#metricEndingLabel").textContent = ending ? `${ending.name}, ${ending.store} · ${dateLabel(ending.end)}` : "джерело не вказало термін";
    }

    function renderTable(list) {
      document.querySelector("#resultCount").textContent = `${list.length} позицій`;
      const visibleRows = list.slice(0, visibleLimit);
      document.querySelector("#tableShown").textContent = `Показано ${visibleRows.length} з ${list.length}`;
      document.querySelector("#loadMoreRows").style.display = visibleRows.length < list.length ? "inline-flex" : "none";
      const emptyMessage = deals.length
        ? "Нічого не знайдено. Спробуйте змінити фільтри."
        : "Дані не завантажено. Перевірте файл data/deals.json.";
      document.querySelector("#dealsTable").innerHTML = visibleRows.map(item => `
        <tr class="deal-row" data-id="${item.id}">
          <td class="select-row">
            <input class="compare-check" type="checkbox" data-id="${item.id}" ${selected.has(item.id) ? "checked" : ""} aria-label="Додати до порівняння">
          </td>
          <td class="cell-product">
            <div class="product">
              ${productThumb(item)}
              <div>
                <div class="product-title">${escapeHTML(item.name)}</div>
                <div class="product-meta">
                  <span class="meta-pill">${escapeHTML(item.size)}</span>
                  <span class="meta-pill">${escapeHTML(item.category)}</span>
                  <span class="meta-pill">${escapeHTML(item.subcategory)}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="store-name" data-label="Мережа">${escapeHTML(item.store)}</td>
          <td data-label="Ціна">
            <div class="price-cell">
              <strong class="price">${money(item.price)}</strong>
              <span class="old-price">було ${money(item.old)}</span>
              ${unitPriceMarkup(item)}
            </div>
          </td>
          <td data-label="Акція">
            <div class="promo-cell">
              <span class="discount">-${discount(item)}%</span>
              <span class="promo-term">${termLabel(item, true)}</span>
            </div>
          </td>
        </tr>
      `).join("") || `<tr><td colspan="5" class="cell-product">${emptyMessage}</td></tr>`;
    }

    function renderBestDeals(list) {
      const el = document.querySelector("#bestDeals");
      if (!el) return;
      const best = [...list]
        .sort((a, b) => discount(b) - discount(a))
        .slice(0, 4);
      el.innerHTML = best.map(item => `
        <article class="deal-card deal-card-media">
          ${productThumb(item, "deal-image")}
          <div class="deal-body">
            <div class="deal-top">
              <strong>${escapeHTML(item.name)} ${escapeHTML(item.size)}</strong>
              <span class="discount">-${discount(item)}%</span>
            </div>
            <div>${escapeHTML(item.store)}, ${item.city} · <b>${money(item.price)}</b></div>
            <div class="sub">${unitPriceLabel(item)} · ${termLabel(item)}</div>
            <div class="bar"><span style="width:${Math.min(100, discount(item) * 2.7)}%"></span></div>
          </div>
        </article>
      `).join("") || `<p class="empty">Немає пропозицій за поточними фільтрами.</p>`;
    }

    function renderComparison() {
      const items = deals.filter(item => selected.has(item.id)).sort((a, b) => unitSortValue(a) - unitSortValue(b));
      document.querySelector("#compareCount").textContent = items.length;
      const clearBtn = document.querySelector("#clearCompareBtn");
      if (clearBtn) {
        clearBtn.style.display = items.length > 0 ? "inline-flex" : "none";
      }
      const openMatrixBtn = document.querySelector("#openMatrixBtn");
      if (openMatrixBtn) {
        openMatrixBtn.style.display = items.length >= 2 ? "inline-flex" : "none";
      }
      document.querySelector("#compareList").innerHTML = items.map(item => `
        <article class="compare-card">
          <div class="compare-top">
            ${productThumb(item)}
            <strong>${escapeHTML(item.name)} ${escapeHTML(item.size)}</strong>
          </div>
          <span>${escapeHTML(item.store)}, ${item.city} · <b>${money(item.price)}</b></span>
          <span class="sub">${unitPriceLabel(item)} · знижка ${discount(item)}%</span>
        </article>
      `).join("") || `<p class="empty">Позначте товари в таблиці, щоб швидко порівняти їх між собою.</p>`;
    }

    function renderSources() {
      const ok = sourceHealth.filter(source => /імпорт/i.test(source.state || "")).length;
      document.querySelector("#sourceCount").textContent = `${ok}/${sourceHealth.length}`;
      document.querySelector("#sourceList").innerHTML = sourceHealth.map(source => {
        const imported = /імпорт/i.test(source.state || "");
        const inner = `
          <b>${source.name}<span class="source-state ${imported ? "" : "warn"}"><span class="status-dot ${imported ? "" : "warn"}"></span>${source.state}</span></b>
          <span class="sub">${source.detail || ""}</span>
        `;
        if (source.url) {
          return `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener" class="source-card" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:6px;">${inner}</a>`;
        } else {
          return `<article class="source-card">${inner}</article>`;
        }
      }).join("");
    }

    function renderActiveFilters() {
      const parts = [];
      const store = controls.store.value || all;
      const category = controls.category.value || all;
      const subcategory = controls.subcategory.value || all;
      if (store !== all) parts.push(`мережа: ${store}`);
      if (category !== all) parts.push(`категорія: ${category}`);
      if (subcategory !== all) parts.push(`підкатегорія: ${subcategory}`);
      if (Number(controls.minDiscount.value) > 0) parts.push(`знижка від ${controls.minDiscount.value}%`);
      if (controls.search.value.trim()) parts.push(`пошук: ${controls.search.value.trim()}`);
      document.querySelector("#activeFilters").textContent = parts.length ? `Фільтр: ${parts.join(" · ")}` : "Фільтр: усі категорії";
    }

    function updateSelectOptions(select, options, currentValue) {
      const isSelected = options.includes(currentValue) ? currentValue : all;
      select.innerHTML = options.map(val => `<option value="${val}">${val}</option>`).join("");
      select.value = isSelected;
    }

    function updateFiltersDynamic() {
      const queryTokens = searchTokens(controls.search.value);
      const store = controls.store.value || all;
      const category = controls.category.value || all;
      const subcategory = controls.subcategory.value || all;
      const minDiscount = Number(controls.minDiscount.value);

      // 1. Available stores
      const dealsForStores = deals.filter(item => {
        return (!queryTokens.length || queryTokens.every(token => item._searchText.includes(token)))
          && (category === all || item.category === category)
          && (subcategory === all || item.subcategory === subcategory)
          && discount(item) >= minDiscount;
      });
      const availableStores = unique(dealsForStores.map(item => item.store).filter(Boolean));

      // 2. Available categories
      const dealsForCategories = deals.filter(item => {
        return (!queryTokens.length || queryTokens.every(token => item._searchText.includes(token)))
          && (store === all || item.store === store)
          && (subcategory === all || item.subcategory === subcategory)
          && discount(item) >= minDiscount;
      });
      const availableCategories = unique(dealsForCategories.map(item => item.category).filter(Boolean));

      // 3. Available subcategories
      const dealsForSubcategories = deals.filter(item => {
        return (!queryTokens.length || queryTokens.every(token => item._searchText.includes(token)))
          && (store === all || item.store === store)
          && (category === all || item.category === category)
          && discount(item) >= minDiscount;
      });
      const availableSubcategories = unique(dealsForSubcategories.map(item => item.subcategory || inferSubcategory(item)).filter(Boolean));

      updateSelectOptions(controls.store, availableStores, store);
      updateSelectOptions(controls.category, availableCategories, category);
      updateSelectOptions(controls.subcategory, availableSubcategories, subcategory);

    }

    function scrollToResults() {
      document.querySelector("#resultsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Automatically observe and update sticky header height offset
    const filtersEl = document.querySelector(".filters");
    if (filtersEl) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          if (!entry.target.classList.contains("collapsed-panel")) {
            document.documentElement.style.setProperty("--filters-height", `${entry.target.offsetHeight}px`);
          }
        }
      });
      resizeObserver.observe(filtersEl);
    }

    const STORE_LOGOS = {
      "АТБ": "https://upload.wikimedia.org/wikipedia/commons/4/44/ATB_Market_logo.svg",
      "Сільпо": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Silpo_logo.svg",
      "Ашан": "https://upload.wikimedia.org/wikipedia/commons/5/52/Auchan_Logo.svg",
      "Metro": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Metro-Logo.svg",
      "Метро": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Metro-Logo.svg",
      "Spar": "https://upload.wikimedia.org/wikipedia/commons/b/b8/SPAR_logo.svg",
      "Спар": "https://upload.wikimedia.org/wikipedia/commons/b/b8/SPAR_logo.svg"
    };

    function renderStoreCarousel() {
      const uniqueStores = Array.from(new Set(deals.map(item => item.store).filter(Boolean))).sort((a, b) => a.localeCompare(b, "uk"));
      const carouselEl = document.querySelector("#storeCarousel");
      if (!carouselEl) return;
      
      const allStores = [all, ...uniqueStores];
      carouselEl.innerHTML = allStores.map(store => {
        const logoUrl = STORE_LOGOS[store];
        const isActive = (controls.store.value || all) === store;
        
        let logoMarkup = "";
        if (store === all) {
          logoMarkup = `<span>Усі мережі</span>`;
        } else if (logoUrl) {
          logoMarkup = `
            <img src="${logoUrl}" alt="${store}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span style="display: none;">${store}</span>
          `;
        } else {
          logoMarkup = `<span>${store}</span>`;
        }
        
        return `
          <div class="store-card-logo ${isActive ? "active" : ""}" data-store="${escapeAttribute(store)}">
            ${logoMarkup}
          </div>
        `;
      }).join("");

      // Add click listeners
      carouselEl.querySelectorAll(".store-card-logo").forEach(card => {
        card.addEventListener("click", () => {
          const storeName = card.dataset.store;
          controls.store.value = storeName;
          updateCarouselSelection();
          visibleLimit = pageSize;
          render();
          scrollToResults();
        });
      });
    }

    function updateCarouselSelection() {
      const activeStore = controls.store.value || all;
      document.querySelectorAll("#storeCarousel .store-card-logo").forEach(card => {
        if (card.dataset.store === activeStore) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    }

    function renderActiveFilterTags() {
      const tagsContainer = document.querySelector("#activeFilterTags");
      if (!tagsContainer) return;
      
      const tags = [];
      const store = controls.store.value || all;
      const category = controls.category.value || all;
      const subcategory = controls.subcategory.value || all;
      const minDiscount = Number(controls.minDiscount.value);
      const searchVal = controls.search.value.trim();

      if (store !== all) {
        tags.push({ type: "store", label: `Мережа: ${store}` });
      }
      if (category !== all) {
        tags.push({ type: "category", label: `Категорія: ${category}` });
      }
      if (subcategory !== all) {
        tags.push({ type: "subcategory", label: `Підкатегорія: ${subcategory}` });
      }
      if (minDiscount > 0) {
        tags.push({ type: "discount", label: `Знижка від ${minDiscount}%` });
      }
      if (searchVal) {
        tags.push({ type: "search", label: `Пошук: "${searchVal}"` });
      }

      tagsContainer.innerHTML = tags.map(tag => `
        <div class="filter-tag" data-type="${tag.type}">
          <span>${escapeHTML(tag.label)}</span>
          <span class="close-icon">&times;</span>
        </div>
      `).join("");

      // Add click events to tags for removal
      tagsContainer.querySelectorAll(".filter-tag").forEach(tagEl => {
        tagEl.addEventListener("click", () => {
          const type = tagEl.dataset.type;
          if (type === "store") {
            controls.store.value = all;
            updateCarouselSelection();
          } else if (type === "category") {
            controls.category.value = all;
            controls.subcategory.value = all;
          } else if (type === "subcategory") {
            controls.subcategory.value = all;
          } else if (type === "discount") {
            controls.minDiscount.value = "0";
          } else if (type === "search") {
            controls.search.value = "";
          }
          visibleLimit = pageSize;
          render();
        });
      });
    }

    function render() {
      updateFiltersDynamic();
      updateCarouselSelection();
      renderActiveFilterTags();
      const list = getFilteredDeals();
      renderActiveFilters();
      renderMetrics(list);
      renderTable(list);
      renderBestDeals(list);
    }

    function renderAfterSearchInput() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        visibleLimit = pageSize;
        render();
      }, 140);
    }

    function showTableShimmer() {
      const tbody = document.querySelector("#dealsTable");
      if (!tbody) return;
      
      let html = "";
      for (let i = 0; i < 5; i++) {
        html += `
          <tr class="shimmer-row">
            <td class="select-row">
              <div class="shimmer-box" style="width: 16px; height: 16px; border-radius: 4px;"></div>
            </td>
            <td class="cell-product">
              <div class="product">
                <div class="shimmer-box" style="width: 48px; height: 48px; border-radius: 10px;"></div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                  <div class="shimmer-box" style="width: 60%; height: 14px; border-radius: 4px;"></div>
                  <div style="display: flex; gap: 6px;">
                    <div class="shimmer-box" style="width: 40px; height: 16px; border-radius: 10px;"></div>
                    <div class="shimmer-box" style="width: 60px; height: 16px; border-radius: 10px;"></div>
                    <div class="shimmer-box" style="width: 50px; height: 16px; border-radius: 10px;"></div>
                  </div>
                </div>
              </div>
            </td>
            <td data-label="Мережа">
              <div class="shimmer-box" style="width: 80px; height: 14px; border-radius: 4px; margin: 0 auto;"></div>
            </td>
            <td data-label="Ціна">
              <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                <div class="shimmer-box" style="width: 70px; height: 16px; border-radius: 4px;"></div>
                <div class="shimmer-box" style="width: 50px; height: 12px; border-radius: 4px;"></div>
              </div>
            </td>
            <td data-label="Акція">
              <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
                <div class="shimmer-box" style="width: 45px; height: 16px; border-radius: 4px;"></div>
                <div class="shimmer-box" style="width: 60px; height: 12px; border-radius: 4px;"></div>
              </div>
            </td>
          </tr>
        `;
      }
      tbody.innerHTML = html;
    }

    async function loadImportedData() {
      showTableShimmer();
      try {
        const response = await fetch(`data/deals.json?v=${dataVersion}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`data/deals.json: ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload.deals) || !payload.deals.length) throw new Error("data/deals.json порожній");
        deals = payload.deals.filter(isActivePromo);
        if (Array.isArray(payload.sourceHealth)) {
          sourceHealth = payload.sourceHealth;
        }
        document.querySelector("#syncStatus").innerHTML = '<span class="status-dot"></span> Імпортовано повний асортимент';
        document.querySelector("#syncCity").textContent = `Місто: ${payload.meta?.city || "Львів"}`;
        document.querySelector("#syncSource").textContent = `${payload.meta?.total || payload.deals.length} активних позицій · ${payload.meta?.knownEndDate ?? 0} з датою, ${payload.meta?.withoutEndDate ?? 0} без дати`;
        document.querySelector("#syncFreshness").textContent = `Оновлено: ${formatDateTime(payload.meta?.generatedAt)}`;
      } catch (error) {
        document.querySelector("#syncStatus").classList.remove("good");
        document.querySelector("#syncStatus").innerHTML = '<span class="status-dot warn"></span> Дані не завантажено';
        document.querySelector("#syncSource").textContent = "Потрібен data/deals.json з імпортованими цінами";
        document.querySelector("#syncFreshness").textContent = "Fallback-ціни вимкнено";
      }
    }

    function initializeFilters() {
      enrichDeals();
    }

    document.querySelector("#dealsTable").addEventListener("change", event => {
      const checkbox = event.target.closest(".compare-check");
      if (!checkbox) return;
      const id = Number(checkbox.dataset.id);
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      renderComparison();
    });

    const clearCompareBtn = document.querySelector("#clearCompareBtn");
    if (clearCompareBtn) {
      clearCompareBtn.addEventListener("click", () => {
        if (confirm("Ви дійсно хочете очистити весь список порівняння?")) {
          selected.clear();
          renderComparison();
          render();
        }
      });
    }

    document.querySelector("#resetButton").addEventListener("click", () => {
      controls.search.value = "";
      controls.store.value = all;
      controls.category.value = all;
      controls.subcategory.value = all;
      controls.sort.value = "price";
      controls.minDiscount.value = "0";
      visibleLimit = pageSize;
      selected.clear();
      renderComparison();
      render();
    });

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const filteredCount = getFilteredDeals().length;
        if (visibleLimit < filteredCount) {
          visibleLimit += pageSize;
          render();
        }
      }
    }, { rootMargin: '200px' });
    const scrollAnchor = document.querySelector('#scrollAnchor');
    if (scrollAnchor) observer.observe(scrollAnchor);



    controls.search.addEventListener("input", renderAfterSearchInput);
    [controls.store, controls.sort, controls.minDiscount, controls.subcategory].forEach(control => {
      control.addEventListener("change", () => {
        visibleLimit = pageSize;
        render();
        scrollToResults();
      });
    });
    controls.category.addEventListener("change", () => {
      controls.subcategory.value = all;
      visibleLimit = pageSize;
      render();
      scrollToResults();
    });

    // Theme toggle logic
    const themeToggleBtn = document.getElementById("themeToggle");
    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);

    themeToggleBtn.addEventListener("click", () => {
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    });

    const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
    const advancedFilters = document.getElementById("advancedFilters");

    toggleFiltersBtn.addEventListener("click", () => {
      const isCollapsed = advancedFilters.classList.toggle("collapsed");
      toggleFiltersBtn.classList.toggle("active", !isCollapsed);
    });

    // Toggle Search/Filters panel visibility logic
    const toggleFiltersPanelBtn = document.getElementById("toggleFiltersPanelBtn");
    const filtersPanel = document.querySelector(".filters");
    let isExplicitlyHidden = localStorage.getItem("filtersHidden") === "true";

    function collapseFilters() {
      filtersPanel.classList.add("collapsed-panel");
      document.documentElement.style.setProperty("--filters-height", "0px");
    }

    function expandFilters() {
      filtersPanel.classList.remove("collapsed-panel");
      document.documentElement.style.setProperty("--filters-height", `${filtersPanel.offsetHeight}px`);
    }

    if (isExplicitlyHidden) {
      collapseFilters();
      toggleFiltersPanelBtn.classList.remove("active");
    } else {
      expandFilters();
      toggleFiltersPanelBtn.classList.add("active");
    }

    toggleFiltersPanelBtn.addEventListener("click", () => {
      isExplicitlyHidden = !isExplicitlyHidden;
      localStorage.setItem("filtersHidden", isExplicitlyHidden);
      
      if (isExplicitlyHidden) {
        collapseFilters();
        toggleFiltersPanelBtn.classList.remove("active");
      } else {
        expandFilters();
        toggleFiltersPanelBtn.classList.add("active");
        // Scroll to top smoothly so filters are fully visible and layout is stable
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    // Auto-collapse filters on scroll down, restore ONLY when scrolling back near the top (< 30px)
    window.addEventListener("scroll", () => {
      if (isExplicitlyHidden) return;
      
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 120) {
        collapseFilters();
      } else if (currentScrollY < 30) {
        expandFilters();
      }
    });

    // ==========================================================================
    // ЛОГІКА ДЛЯ НОВИХ КНОПОК ТА МЕНЮ (ВАРІАНТ Г)
    // ==========================================================================
    
    // Елементи меню
    const menuHome = document.querySelector("#menuHome");
    const menuPromo = document.querySelector("#menuPromo");
    const menuRubrics = document.querySelector("#menuRubrics");
    const menuFavs = document.querySelector("#menuFavs");
    const menuSettings = document.querySelector("#menuSettings");
    
    const menuButtons = [menuHome, menuPromo, menuRubrics, menuFavs, menuSettings];
    
    function setTabActive(activeBtn) {
      menuButtons.forEach(btn => btn.classList.remove("active"));
      activeBtn.classList.add("active");
    }
    
    // Обробники Основного Меню
    menuHome.addEventListener("click", () => {
      currentTab = "home";
      setTabActive(menuHome);
      
      // Скидання пошуку та фільтрів
      controls.search.value = "";
      controls.store.value = all;
      controls.category.value = all;
      controls.subcategory.value = all;
      controls.minDiscount.value = "0";
      controls.sort.value = "price";
      
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    
    menuPromo.addEventListener("click", () => {
      currentTab = "home";
      setTabActive(menuPromo);
      
      // Сортування за знижкою та відкриття фільтрів
      controls.sort.value = "discount";
      expandFilters();
      toggleFiltersPanelBtn.classList.add("active");
      
      render();
    });
    
    
    menuRubrics.addEventListener("click", () => {
      currentTab = "home";
      setTabActive(menuRubrics);
      
      expandFilters();
      toggleFiltersPanelBtn.classList.add("active");
      
      setTimeout(() => {
        controls.category.focus();
      }, 150);
    });
    
    menuFavs.addEventListener("click", () => {
      currentTab = "favorites";
      setTabActive(menuFavs);
      
      if (selected.size === 0) {
        showAlert("У вашому списку порівняння немає товарів. Позначте товари галочками в таблиці, щоб вони з'явилися тут!");
      }
      
      render();
    });
    
    // Модальне вікно налаштувань
    const settingsModal = document.querySelector("#settingsModal");
    const closeSettingsModal = document.querySelector("#closeSettingsModal");
    const sourcesTableContainer = document.querySelector("#sourcesTableContainer");
    
    menuSettings.addEventListener("click", () => {
      settingsModal.classList.add("active");
      
      if (sourceHealth.length > 0) {
        let html = `<table>
          <thead>
            <tr>
              <th>Джерело</th>
              <th>Статус</th>
              <th>Деталі</th>
            </tr>
          </thead>
          <tbody>`;
        sourceHealth.forEach(sh => {
          const statusClass = sh.state === "Імпорт" || sh.state === "Імпортовано" ? "good" : "warn";
          html += `<tr>
            <td><strong>${sh.name}</strong></td>
            <td><span class="status-dot ${statusClass === "warn" ? "warn" : ""}"></span> ${sh.state}</td>
            <td>${sh.detail || "Немає деталей"}</td>
          </tr>`;
        });
        html += `</tbody></table>`;
        sourcesTableContainer.innerHTML = html;
      } else {
        sourcesTableContainer.innerHTML = "<p style='font-size:12px; color:var(--muted);'>Дані про джерела відсутні.</p>";
      }
    });
    
    closeSettingsModal.addEventListener("click", () => {
      settingsModal.classList.remove("active");
    });
    
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove("active");
      }
    });
    
    // Керування кешем/даними в модальному вікні
    document.querySelector("#clearCompareCache").addEventListener("click", () => {
      if (confirm("Ви дійсно хочете очистити весь список порівняння?")) {
        selected.clear();
        renderComparison();
        render();
        settingsModal.classList.remove("active");
      }
    });
    
    document.querySelector("#reloadDealsData").addEventListener("click", () => {
      settingsModal.classList.remove("active");
      document.querySelector("#syncStatus").innerHTML = '<span class="status-dot"></span> Оновлення даних...';
      loadImportedData().finally(() => {
        initializeFilters();
        renderStoreCarousel();
        renderSources();
        renderComparison();
        render();
      });
    });
    
    // Обробники Дій та Функцій
    document.querySelector("#actionSave").addEventListener("click", () => {
      if (selected.size === 0) {
        showAlert("Немає вибраних товарів для збереження!");
        return;
      }
      const itemsToSave = deals.filter(d => selected.has(d.id));
      const textToCopy = itemsToSave.map(item => `${escapeHTML(item.name)} (${escapeHTML(item.store)}) — ${item.price} грн`).join("\n");
      navigator.clipboard.writeText(textToCopy).then(() => {
        showAlert("Список відібраних товарів збережено в буфер обміну!");
      }).catch(err => {
        showAlert("Помилка при копіюванні: " + err);
      });
    });
    
    const addCustomModal = document.getElementById("addCustomModal");
    document.getElementById("closeAddModal").addEventListener("click", () => addCustomModal.classList.remove("active"));
    
    document.querySelector("#actionAdd").addEventListener("click", () => {
      document.getElementById("customItemName").value = "";
      document.getElementById("customItemStore").value = "Власний список";
      document.getElementById("customItemPrice").value = "0.00";
      addCustomModal.classList.add("active");
      document.getElementById("customItemName").focus();
    });
    
    document.getElementById("btnConfirmAdd").addEventListener("click", () => {
      const name = document.getElementById("customItemName").value.trim();
      if (!name) {
        showAlert("Введіть назву товару!");
        return;
      }
      const store = document.getElementById("customItemStore").value.trim() || "Власний список";
      const priceStr = document.getElementById("customItemPrice").value;
      const price = parseFloat(priceStr.replace(",", ".")) || 0;
      
      const customDeal = {
        id: deals.length + 100000 + Math.floor(Math.random() * 1000),
        name,
        store,
        price,
        old: price,
        discountPct: 0,
        category: "Інше",
        subcategory: "Інше",
        _searchText: name.toLowerCase(),
        storeUrl: "",
        productUrl: "",
        image: "",
        endStatus: "known",
        city: "Львів"
      };
      
      deals.push(customDeal);
      selected.add(customDeal.id);
      
      render();
      renderComparison();
      
      if (currentTab === "favorites") {
        render();
      }
      
      addCustomModal.classList.remove("active");
      showAlert(`Товар "${name}" додано та позначено для порівняння!`);
    });
    
    document.querySelector("#actionAdd2").addEventListener("click", () => {
      const list = getFilteredDeals();
      if (!list.length) {
        showAlert("Немає видимих товарів для додавання у порівняння!");
        return;
      }
      
      let addedCount = 0;
      list.forEach(item => {
        if (!selected.has(item.id)) {
          selected.add(item.id);
          addedCount++;
        }
      });
      
      render();
      renderComparison();
      showAlert(`Усі видимі товари (${addedCount} шт) додано до порівняння!`);
    });
    
    const checkoutModal = document.getElementById("checkoutModal");
    document.getElementById("closeCheckoutModal").addEventListener("click", () => checkoutModal.classList.remove("active"));
    
    document.querySelector("#actionCheckout").addEventListener("click", () => {
      if (selected.size === 0) {
        showAlert("Будь ласка, позначте спочатку товари галочками для оформлення списку!");
        return;
      }
      
      const items = deals.filter(d => selected.has(d.id));
      const grouped = {};
      let total = 0;
      
      items.forEach(item => {
        if (!grouped[item.store]) grouped[item.store] = [];
        grouped[item.store].push(item);
        total += item.price;
      });
      
      let text = "📋 МІЙ СПИСОК ПОКУПОК (PROMO-WATCH UA)\n";
      text += "========================================\n\n";
      
      for (const [store, list] of Object.entries(grouped)) {
        text += `🛒 МАГАЗИН: ${store.toUpperCase()}\n`;
        list.forEach((item, idx) => {
          text += `  [ ] ${idx + 1}. ${item.name} — ${item.price} грн (знижка ${discount(item)}%)\n`;
        });
        text += "\n";
      }
      
      text += "========================================\n";
      text += `💰 ЗАГАЛЬНА ВАРТІСТЬ: ${total.toFixed(2)} грн\n`;
      text += `📅 Згенеровано: ${new Date().toLocaleDateString("uk-UA")}\n`;
      
      document.getElementById("checkoutTextarea").value = text;
      
      const encodedText = encodeURIComponent(text);
      document.getElementById("btnShareTelegram").href = `https://t.me/share/url?url=&text=${encodedText}`;
      document.getElementById("btnShareViber").href = `viber://forward?text=${encodedText}`;
      
      checkoutModal.classList.add("active");
    });
    
    document.getElementById("btnCopyList").addEventListener("click", () => {
      const text = document.getElementById("checkoutTextarea").value;
      navigator.clipboard.writeText(text).then(() => {
        showAlert("Список покупок скопійовано у буфер обміну!");
      }).catch(err => {
        showAlert("Не вдалося скопіювати. Будь ласка, виділіть текст і скопіюйте вручну.");
      });
    });
    
    document.querySelector("#actionSearch").addEventListener("click", () => {
      controls.search.focus();
      controls.search.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // ==========================================================================
    // ЛОГІКА ДЕТАЛЕЙ ТОВАРУ (МОДАЛКА + SVG ГРАФІК ЦІН)
    // ==========================================================================
    
    document.querySelector("#dealsTable").addEventListener("click", event => {
      // Ignore clicks on checkable cells/checkboxes
      if (event.target.closest(".select-row") || event.target.closest(".compare-check")) {
        return;
      }
      const tr = event.target.closest(".deal-row");
      if (!tr) return;
      const id = Number(tr.dataset.id);
      if (!id) return;
      
      const item = deals.find(d => d.id === id);
      if (item) {
        openProductDetails(item);
      }
    });

    const productDetailsModal = document.getElementById("productDetailsModal");
    document.getElementById("closeProductDetailsModal").addEventListener("click", () => {
      productDetailsModal.classList.remove("active");
    });
    productDetailsModal.addEventListener("click", (e) => {
      if (e.target === productDetailsModal) {
        productDetailsModal.classList.remove("active");
      }
    });

    function openProductDetails(item) {
      document.getElementById("detailProductName").textContent = item.name;
      document.getElementById("detailProductStore").textContent = item.store || "—";
      document.getElementById("detailProductCat").textContent = item.category || "—";
      document.getElementById("detailProductSubcat").textContent = item.subcategory || "—";
      document.getElementById("detailProductSize").textContent = item.size || "—";
      document.getElementById("detailProductPrice").textContent = money(item.price);
      document.getElementById("detailProductOld").textContent = item.old ? money(item.old) : "—";
      document.getElementById("detailProductUnitPrice").innerHTML = unitPriceLabel(item);
      document.getElementById("detailProductTerm").textContent = termLabel(item);
      
      // Render image thumbnail
      document.getElementById("detailProductImgContainer").innerHTML = productThumb(item);
      
      // Generate simulated price history
      generatePriceHistoryChart(item);
      
      // Open modal
      productDetailsModal.classList.add("active");
    }

    function generatePriceHistoryChart(item) {
      const price3 = item.price; // Today
      const oldPrice = item.old || item.price;
      
      // Generate pseudo-random history based on item ID so it is stable
      const idSeed = item.id || 1;
      const pseudoRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      
      const price0 = oldPrice;
      const rand1 = pseudoRandom(idSeed + 1);
      const price1 = oldPrice * (0.95 + 0.1 * rand1);
      const rand2 = pseudoRandom(idSeed + 2);
      const price2 = oldPrice * (0.97 + 0.06 * rand2);
      
      const prices = [price0, price1, price2, price3];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      
      const yMin = 30;
      const yMax = 110;
      
      const getY = (val) => {
        if (priceRange === 0) return (yMin + yMax) / 2;
        return yMax - ((val - minPrice) / priceRange) * (yMax - yMin);
      };
      
      const y0 = getY(price0);
      const y1 = getY(price1);
      const y2 = getY(price2);
      const y3 = getY(price3);
      
      const dx = 120;
      const d = `M 20,${y0.toFixed(1)} ` +
                `C ${(20 + dx/3).toFixed(1)},${y0.toFixed(1)} ${(140 - dx/3).toFixed(1)},${y1.toFixed(1)} 140,${y1.toFixed(1)} ` +
                `C ${(140 + dx/3).toFixed(1)},${y1.toFixed(1)} ${(260 - dx/3).toFixed(1)},${y2.toFixed(1)} 260,${y2.toFixed(1)} ` +
                `C ${(260 + dx/3).toFixed(1)},${y2.toFixed(1)} ${(380 - dx/3).toFixed(1)},${y3.toFixed(1)} 380,${y3.toFixed(1)}`;
                
      const dArea = `${d} L 380,150 L 20,150 Z`;
      
      const chartSvg = document.getElementById("priceHistoryChart");
      if (!chartSvg) return;
      
      chartSvg.innerHTML = `
        <defs>
          <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8b5cf6"/>
            <stop offset="100%" stop-color="#2dd4bf"/>
          </linearGradient>
          <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        
        <!-- Grid lines -->
        <line x1="20" y1="30" x2="380" y2="30" stroke="var(--line)" stroke-dasharray="4 4" stroke-width="1" />
        <line x1="20" y1="70" x2="380" y2="70" stroke="var(--line)" stroke-dasharray="4 4" stroke-width="1" />
        <line x1="20" y1="110" x2="380" y2="110" stroke="var(--line)" stroke-dasharray="4 4" stroke-width="1" />
        
        <!-- Area -->
        <path class="chart-area" d="${dArea}" />
        
        <!-- Curve line -->
        <path class="chart-line" d="${d}" stroke-width="3" stroke-linecap="round" />
        
        <!-- Dots -->
        <circle cx="20" cy="${y0.toFixed(1)}" r="4" fill="var(--muted)" stroke="var(--card-bg)" stroke-width="1.5" />
        <circle cx="140" cy="${y1.toFixed(1)}" r="4" fill="var(--muted)" stroke="var(--card-bg)" stroke-width="1.5" />
        <circle cx="260" cy="${y2.toFixed(1)}" r="4" fill="var(--muted)" stroke="var(--card-bg)" stroke-width="1.5" />
        <circle class="chart-dot" cx="380" cy="${y3.toFixed(1)}" r="6" />
        
        <!-- Labels -->
        <text x="20" y="${(y0 - 10).toFixed(1)}" text-anchor="start" font-size="9" fill="var(--muted)" font-weight="600" font-family="inherit">${money(price0)}</text>
        <text x="140" y="${(y1 - 10).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--muted)" font-weight="600" font-family="inherit">${money(price1)}</text>
        <text x="260" y="${(y2 - 10).toFixed(1)}" text-anchor="middle" font-size="9" fill="var(--muted)" font-weight="600" font-family="inherit">${money(price2)}</text>
        <text x="380" y="${(y3 - 10).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--green)" font-weight="700" font-family="inherit">${money(price3)}</text>
      `;
    }

    // ==========================================================================
    // ЛОГІКА МАТРИЦІ ПОРІВНЯННЯ
    // ==========================================================================
    
    const comparisonMatrixModal = document.getElementById("comparisonMatrixModal");
    const openMatrixBtn = document.getElementById("openMatrixBtn");
    const closeComparisonMatrixModal = document.getElementById("closeComparisonMatrixModal");

    openMatrixBtn.addEventListener("click", () => {
      renderComparisonMatrix();
      comparisonMatrixModal.classList.add("active");
    });

    closeComparisonMatrixModal.addEventListener("click", () => {
      comparisonMatrixModal.classList.remove("active");
    });

    comparisonMatrixModal.addEventListener("click", (e) => {
      if (e.target === comparisonMatrixModal) {
        comparisonMatrixModal.classList.remove("active");
      }
    });

    function renderComparisonMatrix() {
      const items = deals.filter(item => selected.has(item.id)).sort((a, b) => a.price - b.price);
      if (items.length === 0) return;
      
      const lowestPrice = Math.min(...items.map(item => item.price));
      const validUnitPrices = items.filter(item => item._unitPricePlausible).map(item => item._unitPrice);
      const lowestUnitPrice = validUnitPrices.length > 0 ? Math.min(...validUnitPrices) : null;
      
      let html = `<table class="matrix-table">
        <thead>
          <tr>
            <th class="row-label">Характеристика</th>
            ${items.map(item => `
              <th>
                <div class="matrix-product-header">
                  ${productThumb(item, "matrix-thumb")}
                  <button class="remove-matrix-item" data-id="${item.id}">&times;</button>
                </div>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="row-label">Назва</td>
            ${items.map(item => `
              <td class="matrix-name">${escapeHTML(item.name)}</td>
            `).join("")}
          </tr>
          <tr>
            <td class="row-label">Мережа</td>
            ${items.map(item => `
              <td><span class="meta-pill">${escapeHTML(item.store)}</span></td>
            `).join("")}
          </tr>
          <tr>
            <td class="row-label">Вага/Розмір</td>
            ${items.map(item => `
              <td><strong>${escapeHTML(item.size || "—")}</strong></td>
            `).join("")}
          </tr>
          <tr>
            <td class="row-label">Акційна ціна</td>
            ${items.map(item => {
              const isBest = item.price === lowestPrice;
              return `
                <td class="${isBest ? "best-value" : ""}">
                  <strong class="price">${money(item.price)}</strong>
                  ${isBest ? `<span class="best-badge">Краща ціна!</span>` : ""}
                </td>
              `;
            }).join("")}
          </tr>
          <tr>
            <td class="row-label">Стара ціна</td>
            ${items.map(item => `
              <td style="text-decoration: line-through; color: var(--muted);">${item.old ? money(item.old) : "—"}</td>
            `).join("")}
          </tr>
          <tr>
            <td class="row-label">Знижка</td>
            ${items.map(item => `
              <td><span class="discount">-${discount(item)}%</span></td>
            `).join("")}
          </tr>
          <tr>
            <td class="row-label">Ціна за од. виміру</td>
            ${items.map(item => {
              const isBest = lowestUnitPrice && item._unitPricePlausible && item._unitPrice === lowestUnitPrice;
              return `
                <td class="${isBest ? "best-value" : ""}">
                  ${unitPriceLabel(item)}
                  ${isBest ? `<span class="best-badge">Найвигідніше!</span>` : ""}
                </td>
              `;
            }).join("")}
          </tr>
          <tr>
            <td class="row-label">Термін дії акції</td>
            ${items.map(item => `
              <td class="matrix-term">${termLabel(item)}</td>
            `).join("")}
          </tr>
        </tbody>
      </table>`;
      
      document.getElementById("matrixTableWrapper").innerHTML = html;
      
      // Add remove action inside the matrix
      document.querySelectorAll(".remove-matrix-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          selected.delete(id);
          renderComparison();
          render();
          if (selected.size >= 2) {
            renderComparisonMatrix();
          } else {
            comparisonMatrixModal.classList.remove("active");
          }
        });
      });
    }

    loadImportedData().finally(() => {
      initializeFilters();
      renderStoreCarousel();
      renderSources();
      renderComparison();
      render();
    });