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

        // Log the full response for debugging
        console.log(data);

        // Check for API limit or invalid symbol error
        if (data["Error Message"]) {
            document.getElementById("stock-price").innerText = "Invalid stock symbol or API limit reached!";
        } else if (data["Time Series (Daily)"]) {
            const stockData = data["Time Series (Daily)"];
            const latestDate = Object.keys(stockData)[0];
            const latestPrice = stockData[latestDate]["4. close"];
            document.getElementById("stock-price").innerText = `${symbol}: $${latestPrice}`;
        } else {
            document.getElementById("stock-price").innerText = "Error retrieving stock data.";
        }
    } catch (error) {
        console.error("Error fetching stock data:", error);
        document.getElementById("stock-price").innerText = "Failed to load stock data.";
    }
}

// Function to fetch stock market news
async function fetchStockNews() {
    const apiKey = "558112"; // Your Alpha Vantage API key
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.feed) {
            displayNews(data.feed);
        } else {
            console.error("No news found:", data);
            document.getElementById("news-container").innerText = "No news available at the moment.";
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        document.getElementById("news-container").innerText = "Failed to load news.";
    }
}

// Function to display news on the page
function displayNews(newsArray) {
    const newsContainer = document.getElementById("news-container");
    newsContainer.innerHTML = ''; // Clear previous content

    newsArray.slice(0, 5).forEach(news => {
        const newsItem = document.createElement("div");
        newsItem.classList.add("news-item");

        newsItem.innerHTML = `
            <h3><a href="${news.
