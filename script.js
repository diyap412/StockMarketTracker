let chartInstance = null

function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.trim()
  if (!symbol) return

  const apiKey = "demo"
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const timeSeries = data["Time Series (Daily)"]
      if (!timeSeries) {
        document.getElementById("stock-price").textContent = "Invalid symbol or no data available."
        return
      }

      const dates = Object.keys(timeSeries).slice(0, 7).reverse()
      const prices = dates.map(date => parseFloat(timeSeries[date]["4. close"]))
      const latestPrice = prices[prices.length - 1]

      document.getElementById("stock-price").textContent = `${symbol.toUpperCase()} Latest Close: $${latestPrice.toFixed(2)}`
      renderChart(dates, prices, symbol.toUpperCase())
    })
    .catch(() => {
      document.getElementById("stock-price").textContent = "Error fetching data."
    })
}

function renderChart(labels, data, symbol) {
  const ctx = document.getElementById("stockChart").getContext("2d")

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${symbol} Closing Price`,
        data: data,
        fill: false,
        borderColor: "#2563eb",
        pointBackgroundColor: "#2563eb",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date"
          }
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)"
          },
          beginAtZero: false
        }
      }
    }
  })
}
