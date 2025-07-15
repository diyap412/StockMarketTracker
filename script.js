async function getStockData() {
  const symbol = document.getElementById("stock-symbol").value.toUpperCase().trim();
  const output = document.getElementById("stock-price");
  const apiKey = "BNRIU890X44B58J8";

  if (!symbol) {
    output.innerText = "Please enter a stock symbol.";
    return;
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.Note) {
      output.innerText = "API limit reached. Please wait and try again.";
      return;
    }

    if (!data["Time Series (Daily)"]) {
      output.innerText = "Stock not found. Please check the symbol.";
      return;
    }

    const timeSeries = data["Time Series (Daily)"];
    const latestDate = Object.keys(timeSeries)[0];
    const latestData = timeSeries[latestDate];
    const close = parseFloat(latestData["4. close"]).toFixed(2);

    output.innerText = `${symbol} closing price on ${latestDate}: $${close}`;
  } catch (error) {
    output.innerText = "Error fetching data. Try again.";
    console.error(error);
  }
}
