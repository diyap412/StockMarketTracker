const apiKey = "W1CUJ9AZPBL2DTFN"; // Replace with your Alpha Vantage API key

// Handle form submit
document.getElementById("stock-search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  getStockData();
});

async function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.toUpperCase().trim();
  if (!symbol) return;

  const dataSection = document.getElementById("stock-data");
  const chartSection = document.getElementById("chart-container");
  const newsSection = document.getElementById("news-section");

  // Clear previous content
  dataSection.innerHTML = "Loading...";
  chartSection.innerHTML = `<canvas id="stockChart" height="300"></canvas>`;
  newsSection.innerHTML = "";

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    const timeSeries = data["Time Series (Daily)"];

    if (!timeSeries) {
      dataSection.innerHTML = "Invalid symbol or API limit reached.";
      return;
    }

    const dates = Object.keys(timeSeries).slice(0, 10).reverse();
    const prices = dates.map(date => parseFloat(timeSeries[date]["4. close"]));
    const latestPrice = prices[prices.length - 1];

    dataSection.innerHTML = `Latest Price for <strong>${symbol}</strong>: $${latestPrice.toFixed(2)}`;

    const chartCanvas = document.getElementById("stockChart");

    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: dates,
        datasets: [{
          label: `${symbol} Closing Prices`,
          data: prices,
          borderColor: "#e63946",
          backgroundColor: "rgba(230, 57, 70, 0.2)",
          fill: true,
          tension: 0.3
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
              maxTicksLimit: 5,
              color: "#fff"
            }
          },
          y: {
            ticks: {
              color: "#fff"
            }
          }
        }
      }
    });

    loadNews(symbol);
  } catch (err) {
    dataSection.innerHTML = "Error loading data.";
    console.error(err);
  }
}

async function loadNews(symbol) {
  const newsSection = document.getElementById("news-section");

  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${apiKey}`);
    const data = await response.json();
    const articles = data.feed?.slice(0, 5) || [];

    if (articles.length === 0) {
      newsSection.innerHTML = "No news found.";
      return;
    }

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

    articles.forEach(article => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = article.title;
      link.style.color = "#ffffff";
      link.style.display = "block";
      link.style.marginBottom = "10px";
      link.style.textDecoration = "underline";
      item.appendChild(link);
      list.appendChild(item);
    });

    newsSection.appendChild(list);
  } catch (err) {
    newsSection.innerHTML = "Error loading news.";
    console.error(err);
  }
}
