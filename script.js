const mockStockData = {
  AAPL: {
    price: 174.55,
    date: "2025-07-14",
    history: [
      { date: "2025-07-08", close: 169.10 },
      { date: "2025-07-09", close: 171.30 },
      { date: "2025-07-10", close: 172.00 },
      { date: "2025-07-11", close: 173.50 },
      { date: "2025-07-14", close: 174.55 },
    ],
    news: [
      { title: "Apple announces new iPhone release date", url: "#" },
      { title: "Apple stock hits new all-time high", url: "#" },
      { title: "Experts discuss Apple's market strategy", url: "#" },
    ],
  },
  TSLA: {
    price: 689.12,
    date: "2025-07-14",
    history: [
      { date: "2025-07-08", close: 670.00 },
      { date: "2025-07-09", close: 675.50 },
      { date: "2025-07-10", close: 680.00 },
      { date: "2025-07-11", close: 685.00 },
      { date: "2025-07-14", close: 689.12 },
    ],
    news: [
      { title: "Tesla announces new battery tech", url: "#" },
      { title: "Tesla's Model Y sales increase", url: "#" },
      { title: "Elon Musk tweets about future plans", url: "#" },
    ],
  },
  MSFT: {
    price: 305.20,
    date: "2025-07-14",
    history: [
      { date: "2025-07-08", close: 300.00 },
      { date: "2025-07-09", close: 301.50 },
      { date: "2025-07-10", close: 303.00 },
      { date: "2025-07-11", close: 304.00 },
      { date: "2025-07-14", close: 305.20 },
    ],
    news: [
      { title: "Microsoft launches new cloud service", url: "#" },
      { title: "Microsoft stock steady amid market changes", url: "#" },
      { title: "Windows 12 rumors spread", url: "#" },
    ],
  },
};

let chart;

function getStockData() {
  const input = document.getElementById("stock-symbol");
  const symbol = input.value.toUpperCase().trim();
  const output = document.getElementById("stock-price");
  const newsList = document.getElementById("news-list");

  if (!symbol) {
    output.innerText = "Please enter a stock symbol.";
    newsList.innerHTML = "";
    if (chart) chart.destroy();
    return;
  }

  if (!mockStockData[symbol]) {
    output.innerText = "Stock not found. Please check the symbol.";
    newsList.innerHTML = "";
    if (chart) chart.destroy();
    return;
  }

  const data = mockStockData[symbol];

  output.innerText = `${symbol} closing price on ${data.date}: $${data.price.toFixed(2)}`;

  const ctx = document.getElementById("stockChart").getContext("2d");
  const labels = data.history.map((h) => h.date);
  const prices = data.history.map((h) => h.close);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${symbol} Closing Price`,
          data: prices,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (val) => `$${val.toFixed(2)}`,
          },
        },
      },
      interaction: {
        mode: "nearest",
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            font: { family: "'Space Grotesk', sans-serif", size: 14, weight: "600" },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
    },
  });

  newsList.innerHTML = "";
  data.news.forEach((article) => {
    const div = document.createElement("div");
    div.innerHTML = `<a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>`;
    newsList.appendChild(div);
  });
}
