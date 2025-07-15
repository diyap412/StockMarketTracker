const apiKey = "d1r99thr01qk8n65jv40d1r99thr01qk8n65jv4g"; // Replace this with your Finnhub API key

// Form submission
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
    // Step 1: Get quote
    const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    const quoteData = await quoteResponse.json();

    if (!quoteData.c) {
      dataSection.innerHTML = "Invalid symbol or data not available.";
      return;
    }

    dataSection.innerHTML = `Latest Price for <strong>${symbol}</strong>: $${quoteData.c.toFixed(2)}`;

    // Step 2: Get historical candles (past 10 days)
    const now = Math.floor(Date.now() / 1000); // Current UNIX timestamp
    const tenDaysAgo = now - (60 * 60 * 24 * 15); // 15 days ago (buffer for weekends)

    const historyResponse = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${tenDaysAgo}&to=${now}&token=${apiKey}`);
    const historyData = await historyResponse.json();

    if (historyData.s !== "ok") {
      chartSection.innerHTML = "Chart data not available.";
      return;
    }

    const dates = historyData.t.map(ts => new Date(ts * 1000).toLocaleDateString());
    const prices = historyData.c;

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
            ticks: { color: "#fff", maxTicksLimit: 5 }
          },
          y: {
            ticks: { color: "#fff" }
          }
        }
      }
    });

    // Step 3: Load News
    loadNews(symbol);
  } catch (err) {
    dataSection.innerHTML = "Error loading data.";
    console.error(err);
  }
}

async function loadNews(symbol) {
  const newsSection = document.getElementById("news-section");

  try {
    const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=2024-07-01&to=2025-07-15&token=${apiKey}`);
    const articles = await response.json();

    if (!articles || articles.length === 0) {
      newsSection.innerHTML = "No news found.";
      return;
    }

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

    articles.slice(0, 5).forEach(article => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = article.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = article.headline;
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
