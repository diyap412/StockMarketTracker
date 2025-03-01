async function getStockData() {
    const apiKey = "558112"; // Your Alpha Vantage API key
    const symbol = document.getElementById("stock-symbol").value.toUpperCase();
    
    if (!symbol) {
        alert("Please enter a stock symbol!");
        return;
    }

    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data["Time Series (Daily)"]) {
            const stockData = data["Time Series (Daily)"];
            const latestDate = Object.keys(stockData)[0];
            const latestPrice = stockData[latestDate]["4. close"];
            document.getElementById("stock-price").innerText = `${symbol}: $${latestPrice}`;
        } else {
            document.getElementById("stock-price").innerText = "Invalid stock symbol or API limit reached!";
        }
    } catch (error) {
        console.error("Error fetching stock data:", error);
        document.getElementById("stock-price").innerText = "Failed to load stock data.";
    }
}
