const apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY';

const ctx = document.getElementById('stockChart').getContext('2d');
let stockChart;

document.getElementById('search-btn').addEventListener('click', getStockData);
document.getElementById('stock-symbol').addEventListener('keypress', e => {
  if (e.key === 'Enter') getStockData();
});

async function getStockData() {
  const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
  if (!symbol) return;

  const priceEl = document.getElementById('stock-price');
  const newsList = document.getElementById('news-list');
  priceEl.textContent = 'Loading...';
  newsList.innerHTML = '';

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();

    if (data['Error Message'] || !data['Time Series (Daily)']) {
      priceEl.textContent = 'Invalid stock symbol or API limit reached.';
      return;
    }

    const timeSeries = data['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).slice(0, 30).reverse();
    const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

    priceEl.textContent = `${symbol} Latest Close Price: $${prices[prices.length - 1].toFixed(2)}`;

    if (stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: `${symbol} Close Price`,
          data: prices,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.3)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { maxTicksLimit: 10 }
          }
        }
      }
    });

    loadNews(symbol);
  } catch {
    priceEl.textContent = 'Failed to fetch stock data.';
  }
}

async function loadNews(symbol) {
  const newsList = document.getElementById('news-list');
  newsList.textContent = 'Loading news...';

  try {
    const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&apiKey=YOUR_NEWSAPI_KEY`);
    const newsData = await newsResponse.json();

    if (newsData.status !== 'ok' || newsData.totalResults === 0) {
      newsList.textContent = 'No related news found.';
      return;
    }

    newsList.innerHTML = newsData.articles.slice(0, 5).map(article =>
      `<article>
         <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
         <p>${new Date(article.publishedAt).toLocaleDateString()}</p>
       </article>`
    ).join('');
  } catch {
    newsList.textContent = 'Failed to load news.';
  }
}
