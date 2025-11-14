const API_KEY = '2KA4N6X8QP8CT2NC';

const stockInfoDiv = document.getElementById('stock-price');
const newsList = document.getElementById('news-list');
const input = document.getElementById('stock-symbol');
const suggestionsList = document.getElementById('suggestions');
let stockChart;

// you can add more symbols to expand the search
const stockSymbols = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
  "NFLX", "NVDA", "META", "BABA", "AMD",
  "INTC", "CRM", "UBER", "PYPL", "DIS",
  "BA", "KO", "NKE", "ORCL", "T"
];

// ---------------- SUGGESTIONS ----------------
input.addEventListener("input", function () {
  const query = this.value.toUpperCase();
  suggestionsList.innerHTML = "";

  if (query.length === 0) return;

  const matches = stockSymbols.filter(symbol => symbol.startsWith(query));

  matches.forEach(symbol => {
    const li = document.createElement("li");
    li.textContent = symbol;
    li.addEventListener("click", () => {
      input.value = symbol;
      suggestionsList.innerHTML = "";
      getStockData();
    });
    suggestionsList.appendChild(li);
  });
});

function handleSearch() {
  suggestionsList.innerHTML = "";
  getStockData();
}

function getStockData() {
  const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
  if (!symbol) return;
  fetchStockPrice(symbol);
  fetchStockHistory(symbol);
  fetchStockNews(symbol);
}

// ------------------- PRICE + DATE FIX ------------------------
async function fetchStockPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      stockInfoDiv.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
      return;
    }
    const data = await res.json();

    if (!data || !data["Global Quote"] || Object.keys(data["Global Quote"]).length === 0) {
      if (data.Note) {
        stockInfoDiv.innerHTML = `<p>API call limit reached. Please wait and try again later.</p>`;
      } else {
        stockInfoDiv.innerHTML = `<p>Invalid stock symbol. Please check and try again.</p>`;
      }
      return;
    }

    const quote = data["Global Quote"];
    const price = parseFloat(quote["05. price"]);
    if (isNaN(price)) {
      stockInfoDiv.innerHTML = `<p>Invalid stock symbol or no price data available.</p>`;
      return;
    }

    const change = quote["10. change percent"];

    // ------------------- FIXED DATE FORMAT -------------------
    let lastDayRaw = quote["07. latest trading day"] || "";
    let lastDay = lastDayRaw;
    if (lastDayRaw && lastDayRaw.includes("-")) {
      const parts = lastDayRaw.split("-");
      lastDay = `${parts[1]}-${parts[2]}-${parts[0]}`; // mm-dd-yyyy
    }

    stockInfoDiv.innerHTML = `
      <h2>${symbol}</h2>
      <p><strong>Price:</strong> $${price.toFixed(2)}</p>
      <p><strong>Change:</strong> ${change}</p>
      <p><strong>Last Updated:</strong> ${lastDay}</p>
    `;
  } catch (error) {
    console.error('Fetch error:', error);
    stockInfoDiv.innerHTML = `<p>Failed to fetch stock data. Please try again later.</p>`;
  }
}

// ------------------- Helper: build arrays from series ------------------------
function seriesToArrays(series) {
  // series is object keyed by "YYYY-MM-DD"
  // produce arrays ordered oldest -> newest
  const allDates = Object.keys(series).reverse(); // oldest first
  const pricesAll = allDates.map(d => parseFloat(series[d]["4. close"]));
  return { allDates, pricesAll };
}

// ------------------- INDICATORS ------------------------
function calculateSMAFromArray(prices, period) {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return (sum / period);
}

// Exponential moving average (returns last EMA)
function calculateEMAFromArray(prices, period) {
  if (!prices || prices.length < period) return null;
  // seed with SMA of first period
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const k = 2 / (period + 1);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSIFromArray(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null;
  // Use Wilder's smoothing on last 'period' differences
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi;
}

function calculateMACDFromArray(prices) {
  if (!prices || prices.length < 26) return null;
  const ema12 = calculateEMAFromArray(prices, 12);
  const ema26 = calculateEMAFromArray(prices, 26);
  if (ema12 == null || ema26 == null) return null;
  const macd = ema12 - ema26;

  // For signal line (9-period EMA of MACD), we need MACD series.
  // Approximate by computing MACD values across last (26+9) points if available,
  // otherwise compute signal as EMA of last available MACD as a fallback.
  // We'll compute MACD series:
  const macdSeries = [];
  for (let i = 26 - 1; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const e12 = calculateEMAFromArray(slice, 12);
    const e26 = calculateEMAFromArray(slice, 26);
    macdSeries.push(e12 - e26);
  }
  // compute signal (EMA of MACD series, period 9)
  const signal = calculateEMAFromArray(macdSeries, 9);
  return { macd, signal };
}

// ------------------- STOCK HISTORY GRAPH + INDICATORS + PREDICTION ------------------------
async function fetchStockHistory(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const series = data["Time Series (Daily)"];
  if (!series) {
    // clear chart and indicators if no data
    if (stockChart) stockChart.destroy();
    document.getElementById("indicator-output").innerHTML = `<p>No history data.</p>`;
    document.getElementById("prediction-output").innerHTML = `<p>N/A</p>`;
    return;
  }

  // chart: use 7 most recent days (same as original)
  const dates = Object.keys(series)
    .slice(0, 7)
    .reverse()
    .map(date => {
      const parts = date.split("-");
      return parts[1] + "-" + parts[2] + "-" + parts[0];
    });

  const prices = Object.keys(series)
    .slice(0, 7)
    .reverse()
    .map(date => parseFloat(series[date]["4. close"]));

  // indicators & prediction: use a larger window from the series (oldest -> newest)
  const { allDates, pricesAll } = seriesToArrays(series); // oldest first

  // --- Indicators ---
  const sma5 = calculateSMAFromArray(pricesAll, 5);
  const rsi14 = calculateRSIFromArray(pricesAll, 14);
  const macdObj = calculateMACDFromArray(pricesAll);

  const indicatorOutput = document.getElementById("indicator-output");
  indicatorOutput.innerHTML = `
    <p><strong>SMA (5):</strong> ${sma5 ? sma5.toFixed(2) : "N/A"}</p>
    <p><strong>RSI (14):</strong> ${rsi14 ? rsi14.toFixed(2) : "N/A"}</p>
    <p><strong>MACD:</strong> ${macdObj ? macdObj.macd.toFixed(2) : "N/A"}</p>
    <p><strong>Signal Line:</strong> ${macdObj && macdObj.signal ? macdObj.signal.toFixed(2) : "N/A"}</p>
  `;

  // --- Prediction (simple linear regression on last N closes) ---
  function predictNextPrice(pricesArr) {
    const n = pricesArr.length;
    if (n < 3) return null;
    // use last up-to-30 points for a more stable slope
    const windowSize = Math.min(30, n);
    const recent = pricesArr.slice(-windowSize);
    const x = recent.map((_, i) => i);
    const y = recent;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const slope = (windowSize * sumXY - sumX * sumY) / (windowSize * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / windowSize;
    const nextX = windowSize;
    const pred = slope * nextX + intercept;
    return pred;
  }

  const prediction = predictNextPrice(pricesAll);
  document.getElementById("prediction-output").innerHTML =
    `<p><strong>Predicted Next Close:</strong> ${prediction ? "$" + prediction.toFixed(2) : "N/A"}</p>`;

  // draw chart (same look as before)
  if (stockChart) stockChart.destroy();

  const ctx = document.getElementById("stockChart").getContext("2d");
  stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: `${symbol} Price`,
        data: prices,
        borderColor: "#3b82f6",
        borderWidth: 2,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// ------------------- NEWS ------------------------
async function fetchStockNews(symbol) {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const articles = data && data.feed ? data.feed : null;

  newsList.innerHTML = '';

  if (!articles || articles.length === 0) {
    newsList.innerHTML = '<p>No news available or API limit hit.</p>';
    return;
  }

  articles.slice(0, 5).forEach(article => {
    const newsItem = document.createElement('div');
    newsItem.innerHTML = `
      <p><strong>${article.title}</strong></p>
      <a href="${article.url}" target="_blank">Read more</a>
    `;
    newsList.appendChild(newsItem);
  });
}

// ------------------- PORTFOLIO (localStorage) ------------------------
function loadPortfolio() {
  const list = JSON.parse(localStorage.getItem("portfolio")) || [];
  const container = document.getElementById("portfolio-list");
  container.innerHTML = "";

  list.forEach(symbol => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${symbol}</span>
      <div>
        <button class="remove-btn" onclick="removeFromPortfolio('${symbol}')">Remove</button>
      </div>
    `;
    container.appendChild(li);
  });
}

function addToPortfolio() {
  const symbol = document.getElementById("stock-symbol").value.trim().toUpperCase();
  if (!symbol) return;
  let list = JSON.parse(localStorage.getItem("portfolio")) || [];
  if (!list.includes(symbol)) {
    list.push(symbol);
    localStorage.setItem("portfolio", JSON.stringify(list));
  }
  loadPortfolio();
}

function removeFromPortfolio(symbol) {
  let list = JSON.parse(localStorage.getItem("portfolio")) || [];
  list = list.filter(s => s !== symbol);
  localStorage.setItem("portfolio", JSON.stringify(list));
  loadPortfolio();
}

// initialize portfolio display on load
loadPortfolio();
