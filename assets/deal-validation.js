(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.PromoWatchDealValidation = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : null, function () {
  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function getDealValidationErrors(deal) {
    const errors = [];

    if (!deal?.externalId) errors.push("missing externalId");
    if (!deal?.name) errors.push("missing name");
    if (!deal?.source) errors.push("missing source");
    if (!isFiniteNumber(deal?.price)) errors.push("invalid price");
    if (!isFiniteNumber(deal?.old)) errors.push("invalid old");
    if (isFiniteNumber(deal?.price) && deal.price <= 0) errors.push("price must be positive");
    if (isFiniteNumber(deal?.old) && deal.old <= 0) errors.push("old must be positive");
    if (isFiniteNumber(deal?.price) && isFiniteNumber(deal?.old) && deal.price >= deal.old) {
      errors.push("price must be lower than old");
    }

    return errors;
  }

  function isValidDeal(deal) {
    return getDealValidationErrors(deal).length === 0;
  }

  return {
    getDealValidationErrors,
    isValidDeal
  };
});
