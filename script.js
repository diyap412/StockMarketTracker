const API_KEY = '2KA4N6X8QP8CT2NC';

const stockInfoDiv = document.getElementById('stock-price');
const newsList = document.getElementById('news-list');
const input = document.getElementById('stock-symbol');
const suggestionsList = document.getElementById('suggestions');
let stockChart;

// Static suggestions (you can expand this list)
const stockSymbols = [
  "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
  "NFLX", "NVDA", "META", "BABA", "AMD",
  "INTC", "CRM", "UBER", "PYPL", "DIS",
  "BA", "KO", "NKE", "ORCL", "T"
];

// Handle input for suggestions
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
      getStockData(); // Calls full data fetch
    });
    suggestionsList.appendChild(li);
  });
});

// Search button handler (used by search icon)
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
    const lastDay = quote["07. latest trading day"];

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

async function fetchStockHistory(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const series = data["Time Series (Daily)"];
  if (!series) return;

  const dates = Object.keys(series).slice(0, 7).reverse();
  const prices = dates.map(date => parseFloat(series[date]["4. close"]));

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

async function fetchStockNews(symbol) {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const articles = data.feed;

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
