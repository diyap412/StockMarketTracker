const API_KEY = 'YOUR_ALPHA_VANTAGE_API_KEY'; // Replace with your real API key

const stockInfoDiv = document.getElementById('stock-price');
const newsList = document.getElementById('news-list');
let stockChart; // Chart instance

function getStockData() {
  const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
  if (!symbol) return;

  fetchStockPrice(symbol);
  fetchStockHistory(symbol);
  fetchStockNews(symbol);
}

async function fetchStockPrice(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const quote = data["Global Quote"];

  if (!quote || !quote["05. price"]) {
    stockInfoDiv.innerHTML = `<p>Stock not found or API limit reached.</p>`;
    return;
  }

  const price = parseFloat(quote["05. price"]).toFixed(2);
  const change = quote["10. change percent"];
  const lastDay = quote["07. latest trading day"];

  stockInfoDiv.innerHTML = `
    <h2>${symbol}</h2>
    <p><strong>Price:</strong> $${price}</p>
    <p><strong>Change:</strong> ${change}</p>
    <p><strong>Last Updated:</strong> ${lastDay}</p>
  `;
}

async function fetchStockHistory(symbol) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const series = data["Time Series (Daily)"];

  if (!series) return;

  const dates = Object.keys(series).slice(0, 7).reverse(); // latest 7 days
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
