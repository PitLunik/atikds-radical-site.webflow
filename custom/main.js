const COUNTER_URL =
  "https://api.russiafossiltracker.com/v0/counter_last?destination_region=EU&date_from=2022-02-24&fill_with_estimates=false&use_eu=true&commodity_grouping=default&aggregate_by=destination_country,commodity_group&format=json";
const FULL_MONETARY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const COMPACT_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const CONFIG = {
  updateInterval: 1000 * 5,
};

/**
 *
 * @param {number} value
 * @param {'full'|'mills'} format
 */
function formatMonetary(value, format = "full") {
  if (format === "mills") {
    return COMPACT_FORMAT.format(value / 1000_000) + "M";
  } else {
    return FULL_MONETARY_FORMAT.format(value);
  }
}

/**
 * @typedef {Object} CommodityTotal
 * @property {number} oil
 * @property {number} gas
 * @property {number} coal
 *
 *
 * @typedef {"oil" | "gas" | "coal"} Commodity
 */

/**
 * @typedef {Object} CounterItemDTO
 * @property {string} destination_country
 * @property {Commodity} commodity_group
 * @property {string} destination_iso2
 * @property {number} total_eur
 *
 * @param {CounterItemDTO[]} data
 *
 * */
function processCounterData(data) {
  // Sort by country
  data.sort((a, b) =>
    a.destination_country.localeCompare(b.destination_country)
  );

  /**
   * @type {CommodityTotal}
   */
  const commodityTotals = {
    oil: 0,
    gas: 0,
    coal: 0,
  };

  let total = 0;

  /**
   * @typedef {Object} Country
   * @property {string} name
   * @property {string} code
   *
   *
   * @typedef {Object} ChartItemDTO
   * @property {number} gas
   * @property {number} coal
   * @property {number} oil
   * @property {number} totalEur
   *
   * @typedef {Object} CountryTotal
   * @property {Country} country
   * @property {ChartItemDTO} data
   *
   */

  /**
   * @type {CountryTotal[]}
   */
  const countryTotals = [];

  let lastCountryCode = null;

  for (const item of data) {
    if (item.commodity_group === "total") {
      // skip total records
      continue;
    }
    total += item.total_eur;
    commodityTotals[item.commodity_group] += item.total_eur;

    if (lastCountryCode !== item.destination_iso2) {
      lastCountryCode = item.destination_iso2;

      countryTotals.push({
        country: {
          code: item.destination_iso2,
          name: item.destination_country,
        },
        data: {
          gas: 0,
          oil: 0,
          coal: 0,
          totalEur: 0,
        },
      });
    }
    const currentTotal = countryTotals[countryTotals.length - 1].data;
    currentTotal[item.commodity_group] += item.total_eur;
    currentTotal.totalEur += item.total_eur;
  }

  countryTotals.sort((a, b) => b.data.totalEur - a.data.totalEur);

  return {
    total,
    commodityTotals,
    countryTotals,
  };
}
async function fetchCounterData() {
  return fetch(COUNTER_URL)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error("Failed to fetch counter data");
      }
    })
    .then((payload) => payload.data)
    .catch(console.error);
  // ...
}

async function main() {
  const data = await fetchCounterData();
  const processedData = processCounterData(data);
  renderIndicators(processedData);
}

// Renderers

/**
 *
 * @param {Object} param0
 * @param {number} param0.total
 * @param {CommodityTotal} param0.commodityTotals
 * @param {CountryTotal[]} param0.countryTotals
 */
function renderIndicators({ total, commodityTotals, countryTotals }) {
  renderTotalIndicator(total);
  renderTotalCommodityIndicator(commodityTotals);
  countryTotals.map(renderCountryChart);
}

/**
 *
 * @param {CountryTotal[]} countryTotals
 */
function renderCountryChart(countryTotals) {
  console.log("rendering country chart", countryTotals);
  // if placeholder, render initially
  // else, update
  // check ordering
}

/**
 * @param {CountryTotal} countryTotal
 */
function renderCountryChartItem(countryTotal) {
  console.log(rendering);
  // ...
}

/**
 *
 * @param {HTMLElement} el
 * @param {ChartItemDTO} data
 */
function updateCountryChartElement(el, data) {}

/**
 *
 * @param {CommodityTotal} data
 */

function renderTotalCommodityIndicator(data) {
  console.log("rendering total commodity indicator", data);
  document.querySelector(".X-total-gas").textContent = formatMonetary(data.gas, "mills");
  document.querySelector(".X-total-oil").textContent = formatMonetary(data.oil, "mills");
  document.querySelector(".X-total-coal").textContent = formatMonetary(data.coal, "mills");
  // ...
}

/**
 *
 * @param {number} totalEur
 */
function renderTotalIndicator(totalEur) {
  console.log("rendering total indicator", totalEur);
  document.querySelector(".X-total").textContent = formatMonetary(totalEur);
}


// UTILS
// ready(() => setInterval(main, CONFIG.updateInterval));
ready(main);
function ready(fn) {
  if (document.readyState != "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
