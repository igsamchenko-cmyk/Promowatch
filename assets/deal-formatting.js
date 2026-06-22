(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.PromoWatchDealFormatting = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : null, function () {
  function money(value) {
    if (value === null || typeof value === "undefined") return "0 грн";
    return `${value.toLocaleString("uk-UA", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })} грн`;
  }

  function discount(item) {
    if (Number.isFinite(item?._discount)) return item._discount;
    return Math.round((1 - item.price / item.old) * 100);
  }

  function todayIso(now = new Date()) {
    const parts = new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now).reduce((acc, part) => {
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

  function daysLeft(item, today = todayIso()) {
    const end = parseIsoDate(item?.end);
    if (!end) return null;
    const todayDate = parseIsoDate(today);
    return Math.ceil((end - todayDate) / 86400000);
  }

  function dateLabel(value) {
    const date = parseIsoDate(value);
    if (!date) return "";
    return date.toLocaleDateString("uk-UA", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function termLabel(item, compact = false, today = todayIso()) {
    const days = "_daysLeft" in item ? item._daysLeft : daysLeft(item, today);
    if (days === null) return "термін не вказано";
    if (days < 0) return "завершено";
    if (days === 0) return compact ? "сьогодні" : `до ${dateLabel(item.end)} · сьогодні`;
    if (days === 1) return compact ? "завтра" : `до ${dateLabel(item.end)} · завтра`;
    return compact ? `${days} дн.` : `до ${dateLabel(item.end)} · ${days} дн.`;
  }

  function endingSortValue(item, today = todayIso()) {
    if (Number.isFinite(item?._endingSort)) return item._endingSort;
    const days = daysLeft(item, today);
    return days === null ? Number.POSITIVE_INFINITY : days;
  }

  return {
    dateLabel,
    daysLeft,
    discount,
    endingSortValue,
    money,
    parseIsoDate,
    termLabel,
    todayIso
  };
});
