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
        item._searchText = searchTokens(`${escapeHTML(item.name)} ${escapeHTML(item.size)} ${escapeHTML(item.category)} ${escapeHTML(item.subcategory)} ${escapeHTML(item.store)}`).join(" ");
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

    function unitPriceLabel(item) {
      return unitPricePlausible(item) ? `${money(unitPrice(item))} / ${item.unitLabel}` : "—";
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
        <tr>
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
        const title = source.url
          ? `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noreferrer">${source.name}</a>`
          : source.name;
        return `
        <article class="source-card">
          <b>${title}<span class="source-state ${imported ? "" : "warn"}"><span class="status-dot ${imported ? "" : "warn"}"></span>${source.state}</span></b>
          <span class="sub">${source.detail || ""}</span>
        </article>`;
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

    function render() {
      updateFiltersDynamic();
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

    async function loadImportedData() {
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
      
      // Відкрити фільтри та фокусуватись на категорії
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
    
    document.querySelector("#actionAdd").addEventListener("click", () => {
      const name = prompt("Введіть назву вашого товару:");
      if (!name) return;
      const store = prompt("Введіть назву магазину:", "Власний список");
      const priceStr = prompt("Введіть ціну (грн):", "0.00");
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
        showAlert("Р‘СѓРґСЊ Р»Р°СЃРєР°, РїРѕР·РЅР°С‡С‚Рµ СЃРїРѕС‡Р°С‚РєСѓ С‚РѕРІР°СЂРё РіР°Р»РѕС‡РєР°РјРё РґР»СЏ РѕС„РѕСЂРјР»РµРЅРЅСЏ СЃРїРёСЃРєСѓ!");
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
      
      let text = "рџ“‹ РњР†Р™ РЎРџРРЎРћРљ РџРћРљРЈРџРћРљ (PROMO-WATCH UA)\n";
      text += "========================================\n\n";
      
      for (const [store, list] of Object.entries(grouped)) {
        text += рџ›’ РњРђР“РђР—РРќ: \n;
        list.forEach((item, idx) => {
          text +=   [ ] .  вЂ”  РіСЂРЅ (Р·РЅРёР¶РєР° %)\n;
        });
        text += "\n";
      }
      
      text += "========================================\n";
      text += рџ’° Р—РђР“РђР›Р¬РќРђ Р’РђР РўР†РЎРўР¬:  РіСЂРЅ\n;
      text += рџ“… Р—РіРµРЅРµСЂРѕРІР°РЅРѕ: \n;
      
      document.getElementById("checkoutTextarea").value = text;
      
      const encodedText = encodeURIComponent(text);
      document.getElementById("btnShareTelegram").href = https://t.me/share/url?url=&text=;
      document.getElementById("btnShareViber").href = iber://forward?text=;
      
      checkoutModal.classList.add("active");
    });
    
    document.getElementById("btnCopyList").addEventListener("click", () => {
      const text = document.getElementById("checkoutTextarea").value;
      navigator.clipboard.writeText(text).then(() => {
        showAlert("РЎРїРёСЃРѕРє РїРѕРєСѓРїРѕРє СЃРєРѕРїС–Р№РѕРІР°РЅРѕ Сѓ Р±СѓС„РµСЂ РѕР±РјС–РЅСѓ!");
      }).catch(err => {
        showAlert("РќРµ РІРґР°Р»РѕСЃСЏ СЃРєРѕРїС–СЋРІР°С‚Рё. Р‘СѓРґСЊ Р»Р°СЃРєР°, РІРёРґС–Р»С–С‚СЊ С‚РµРєСЃС‚ С– СЃРєРѕРїС–СЋР№С‚Рµ РІСЂСѓС‡РЅСѓ.");
      });
    });
    
    document.querySelector("#actionSearch").addEventListener("click", () => {
      controls.search.focus();
      controls.search.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    loadImportedData().finally(() => {
      initializeFilters();
      renderSources();
      renderComparison();
      render();
    });
