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
 *
 */

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
  renderCountryChart(countryTotals);
}

/**
 *
 * @param {CountryTotal[]} countryTotals
 */
function renderCountryChart(countryTotals) {
  console.log("rendering country chart", countryTotals);
  const topCountryTotal = countryTotals[0].data.totalEur;
  // if placeholder, render initially
  const chartContainer = document.querySelector('.X-country-chart');
  if (chartContainer.children.length === 0) {
    countryTotals.forEach(ct => renderCountryChartItem(chartContainer, ct, topCountryTotal));
  } else {
    // update existing
    const children = chartContainer.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      updateCountryChartElement(el, countryTotals[i], topCountryTotal);
    }
  }

  // else, update
  // check ordering
}

/**
 * @param {HTMLElement} el
 * @param {CountryTotal} countryTotal
 * @param {number} topCountryTotal
 */
function renderCountryChartItem(el, countryTotal, topCountryTotal) {
  const template = document.querySelector('#X-country-chart-item-template');

  // Clone the new row and insert it into the table
  const clone = template.content.cloneNode(true);
  updateCountryChartElement(clone, countryTotal, topCountryTotal);

  el.appendChild(clone)
}

/**
 *
 * @param {HTMLElement} el
 * @param {CountryTotal} countryTotal
 * @param {number} topCountryTotal
 */
function updateCountryChartElement(el, countryTotal, topCountryTotal) {
  const {country, data} = countryTotal

  const totalPercent = (data.totalEur / topCountryTotal) * 100;
  const gasPercent = (data.gas / data.totalEur) * 100;
  const oilPercent = (data.oil / data.totalEur) * 100;
  const coalPercent = (data.coal / data.totalEur) * 100;

  const flag = el.querySelector(".flag");
  flag.src = `images/${country.name}-${country.code}.png`;

  const countryName = el.querySelector(".country-name");
  countryName.textContent = country.name;

  const chart = el.querySelector(".chart");

  const chartLine = chart.querySelector(".gr-line")
  chartLine.style.width = `${totalPercent}%`;
  
  const gasBar = chart.querySelector(".gas");
  const oilBar = chart.querySelector(".oil");
  const coalBar = chart.querySelector(".coal");

  gasBar.style.width = `${gasPercent}%`;
  oilBar.style.width = `${oilPercent}%`;
  coalBar.style.width = `${coalPercent}%`;


  const total = chart.querySelector(".eur");
  total.textContent = formatMonetary(data.totalEur);


}

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
