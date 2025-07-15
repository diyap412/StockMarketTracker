async function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.toUpperCase().trim();
  const apiKey = "demo"; // Replace with your actual Alpha Vantage API key
  const output = document.getElementById("stock-price");

  if (!symbol) {
    output.innerText = "Please enter a stock symbol.";
    return;
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note) {
      output.innerText = "API limit reached. Try again later.";
      return;
    }

    if (!data["Time Series (Daily)"]) {
      output.innerText = "Invalid stock symbol or no data available.";
      return;
    }

    const timeSeries = data["Time Series (Daily)"];
    const latestDate = Object.keys(timeSeries)[0];
    const latestData = timeSeries[latestDate];
    const close = parseFloat(latestData["4. close"]).toFixed(2);

    output.innerText = `${symbol} closing price on ${latestDate}: $${close}`;
  } catch (err) {
    output.innerText = "Something went wrong. Please try again.";
    console.error(err);
  }
}
