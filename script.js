const apiKey = "W1CUJ9AZPBL2DTFN"; // Replace with your Alpha Vantage API key

async function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.toUpperCase().trim();
  if (!symbol) return;

  const priceSection = document.getElementById("stock-price");
  const chartCanvas = document.getElementById("stockChart");
  const newsList = document.getElementById("news-list");
  priceSection.innerHTML = "Loading...";
  newsList.innerHTML = "";

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    const timeSeries = data["Time Series (Daily)"];

    if (!timeSeries) {
      priceSection.innerHTML = "Invalid symbol or API limit reached.";
      return;
    }

    const dates = Object.keys(timeSeries).slice(0, 10).reverse();
    const prices = dates.map(date => parseFloat(timeSeries[date]["4. close"]));
    const latestPrice = prices[prices.length - 1];

    priceSection.innerHTML = `Latest Price for <strong>${symbol}</strong>: $${latestPrice.toFixed(2)}`;

    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: dates,
        datasets: [{
          label: `${symbol} Closing Prices`,
          data: prices,
          borderColor: "#4caf50",
          fill: false,
          tension: 0.2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 5
            }
          }
        }
      }
    });

    loadNews(symbol);
  } catch (err) {
    priceSection.innerHTML = "Error loading data.";
    console.error(err);
  }
}

async function loadNews(symbol) {
  const newsList = document.getElementById("news-list");
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    const articles = data.feed?.slice(0, 5) || [];

    if (articles.length === 0) {
      newsList.innerHTML = "No news found.";
      return;
    }

    articles.forEach(article => {
      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = article.title;
      newsList.appendChild(link);
    });
  } catch (err) {
    newsList.innerHTML = "Error loading news.";
    console.error(err);
  }
}
