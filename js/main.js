const COUNTER_URL =
  "https://api.russiafossiltracker.com/v0/counter_last?destination_region=EU28&date_from=2022-02-24&fill_with_estimates=false&use_eu=false&commodity_grouping=default&aggregate_by=commodity,destination_region,destination_country&format=json";
const FULL_MONETARY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const CONFIG = {};

/**
 *
 * @param {number} value
 * @param {'full'|'mills'} format
 */
function formatMonetary(value, format = "full") {
  if (format === "mills") {
    return FULL_MONETARY_FORMAT.format(value / 1000_000) + "M";
  } else {
    return FULL_MONETARY_FORMAT(value);
  }
}

/**
 * @typedef {Object} CommodityTotal
 * @property {number} oil
 * @property {number} gaz
 * @property {number} coal
 *
 *
 * @typedef {"oil" | "gaz" | "coal"} Commodity
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
    gaz: 0,
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
   * @property {Commodity} commodityGroup
   * @property {number} totalEur
   *
   * @typedef {Object} CountryChartDTO
   * @property {ChartItemDTO[]} items
   * @property {number} totalEur
   *
   * @typedef {CountryTotal}
   * @property {Country} country
   * @property {CountryChartDTO} data
   *
   *
   * @type {CountryTotal[]}
   */
  const countryTotals = [];

  let lastCountryCode = null;

  for (const item of data) {
    total += item.total_eur;
    commodityTotals[item.commodity_group] += item.total_eur;

    if (lastCountryCode !== item.destination_iso2) {
      lastCountryCode = item.destination_iso2;

      countryTotals.push({
        country: item.destination_country,
        data: {
          [item.commodity_group]: item.total_eur,
					totalEur: item.total_eur,
        },
      });
    } else {
      countryTotals[countryTotals.length - 1].data[item.commodity_group] +=
        item.total_eur;
			countryTotals[countryTotals.length - 1].data.totalEur += item.total_eur;
    }
  }

  countryTotals.sort();

  return {
    total,
    commodityTotals,
    countryTotals,
  };
}
async function fetchCounterData() {
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
	renderTotalIndicator(total)
  renderTotalCommodityIndicator(commodityTotals);
  countryTotals.map(renderCountryChart);
}


/**
 * 
 * @param {CountryTotal[]} countryTotals 
 */
function renderCountryChart(countryTotals) {
  // if placeholder, render initially
  // else, update
  // check ordering
}


/**
 * @param {Country} country
 * @param {CountryChartDTO} data
 */
function renderCountryChartItem(country, data) {
  console.log(rendering )
  // ...
}

/**
 * 
 * @param {HTMLElement} el 
 * @param {CountryChartDTO} data 
 */
function updateCountryChartElement(el, data) {


}

/**
 *
 * @param {CommodityTotal} data
 */

function renderTotalCommodityIndicator(data) {
  // ...
}


/**
 * 
 * @param {number} totalEur 
 */
function renderTotalIndicator(totalEur) {}
