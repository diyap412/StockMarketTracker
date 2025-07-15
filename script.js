async function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.toUpperCase();
  const apiKey = "demo"; // Replace with your real API key
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const timeSeries = data["Time Series (Daily)"];

    if (!timeSeries) {
      document.getElementById("stock-price").innerText = "Invalid stock symbol or data not available.";
      return;
    }

    const latestDate = Object.keys(timeSeries)[0];
    const latestData = timeSeries[latestDate];
    const closingPrice = latestData["4. close"];

    document.getElementById("stock-price").innerText =
      `${symbol} closing price on ${latestDate}: $${parseFloat(closingPrice).toFixed(2)}`;
  } catch (error) {
    document.getElementById("stock-price").innerText = "Error fetching stock data.";
  }
}
