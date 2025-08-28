const statusText = document.getElementById("status")
const sortBy = document.getElementById('sortBy')
const tbody = document.getElementById('tbody')
const sortRank = document.getElementById("sortRank")
const searchInput = document.getElementById("search")
const watchListCheck = document.getElementById('watchList')


let watchList = JSON.parse(localStorage.getItem("watchList") || '[]')
let coinsData = []

const gtCoins = async () => {
  try {
    statusText.textContent = "Loading Top 50 Coins......";

    const res = await axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h");
    coinsData = res.data;
    renderTable(coinsData);

    let numberOfCoins = coinsData.length;
    statusText.textContent = `Showing ${numberOfCoins} Coins`;
  } catch (error) {
    statusText.textContent = "Something went wrong! please wait for some time...";
    console.error(error);
  }
};


function renderTable(coins) {
  tbody.innerHTML = '';
  coins.forEach(coin => {
    const tr = document.createElement('tr');
    tr.dataset.coinId = coin.id;
    //creating rank section 
    const rank = `<td>${coin.market_cap_rank}</td>`

    //creating the naming symbol and iconimage part
    const name = `<td>
    <div style='display:flex;align-items:center;gap:8px;'>
   <img 
  src="${coin.image}" 
  width="25" 
  height="25" 
  alt="${coin.symbol} logo"
  style="background:white; border-radius:50%; padding:3px; box-shadow:0 0 2px rgba(0,0,0,0.15);"
/>
    
    <span>${coin.name} <small style= "color:var(--muted)">(${coin.symbol.toUpperCase()})</small></span>
    </div> 
    </td>`

    //price secstion design
    const price = `<td>$${coin.current_price.toLocaleString()}</td>`

    //one day price change section
    const isPositive24h = coin.price_change_percentage_24h >= 0
    const changeClass = isPositive24h ? 'positive' : "negative";
    const change = `<td class="${changeClass}">${coin.price_change_percentage_24h?.toFixed(2)}%</td>`

    //graph section of each coin 
    const sparkId = `spark-${coin.id}`;
    const graph = `<td><canvas id='${sparkId}' width="125" height="41"></canvas></td>`

    //fevourite logo part
    const heartClass = watchList.includes(coin.id) ? "positive" : "";
    const heart = `<td style="text-align:center; cursor:pointer;" data-coin-id="${coin.id}">
    <i class="${watchList.includes(coin.id) ? "fas" : "far"} fa-heart"></i>
  </td>`;
    tr.innerHTML = rank + name + price + change + graph + heart;
    tbody.appendChild(tr)

    //creating the colour of the graph of the coins 
    const prices1W = coin.sparkline_in_7d.price
    const weekUp = prices1W[prices1W.length - 1] >= prices1W[0];
    const sparkColor = getComputedStyle(document.documentElement).getPropertyValue(weekUp ? '--success' : '--danger')
    graphChirt(sparkId, prices1W, sparkColor)
  });

}

///function for createing the linegraph
function graphChirt(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return


  const ctx = canvas.getContext('2d')
  const min = Math.min(...data)
  const max = Math.max(...data)
  const scaleY = canvas.height / (max - min);
  const scaleX = canvas.width / (data.length - 1)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - (data[0] - min) * scaleY)
  data.forEach((val, i) => {
    const x = i * scaleX

    const y = canvas.height - (val - min) * scaleY;
    ctx.lineTo(x, y)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 1.7
  ctx.stroke();
}



//searching feature and orderby feature

function filterAndSort() {
  let filtered = [...coinsData]
  const searchTerm = searchInput.value.toLowerCase();



  if (searchTerm) {
    filtered = filtered.filter(
      c => c.name.toLowerCase().includes(searchTerm) || c.symbol.toLowerCase().includes(searchTerm)
    );
  }


  if (watchListCheck.checked) { filtered = filtered.filter(c => watchList.includes(c.id)) }

  const table = document.querySelector("table");

  if (filtered.length === 0) {
    table.style.display = "none";
    statusText.innerHTML = `
      <p style="text-align:center; padding:2rem; color:var(--muted);">
        ${watchListCheck.checked ? "Watchlist is empty" : "No coins found"}
      </p>
    `;
    return;
  }


  table.style.display = "table";
  const sortField = sortBy.value
  filtered.sort((a, b) => {
    return sortRank.value === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
  })
  statusText.innerText = `Showing ${filtered.length} Coins`;
  renderTable(filtered);
}

// event listeners for all the control parts 
searchInput.addEventListener('input', () => filterAndSort());
sortBy.addEventListener("change", () => filterAndSort());
sortRank.addEventListener("change", () => filterAndSort());
watchListCheck.addEventListener('change', () => filterAndSort());

//fevourit filterfunction
tbody.addEventListener("click", e => {
  const heartCell = e.target.closest("td[data-coin-id]");
  if (heartCell) {
    const id = heartCell.dataset.coinId;
    watchList = watchList.includes(id)
      ? watchList.filter(c => c !== id)
      : [...watchList, id];
    localStorage.setItem("watchList", JSON.stringify(watchList));
    filterAndSort();
    return;
  } else if (e.target.closest("tr")) {
    const coinId = e.target.closest("tr").dataset.coinId;
    drawer.setAttribute("aria-hidden", "false");
    showCoinDrawer(coinId);
  }
});

// sliding section logics and functionality
const drawer = document.getElementById("drawer");
document.getElementById("closeDrawer").addEventListener('click', () => {
  drawer.setAttribute("aria-hidden", 'true');
});

async function showCoinDrawer(id) {
  const coin = coinsData.find(c => c.id === id);
  if (!coin) return;
  document.getElementById("drawerRank").textContent = `Rank: ${coin.market_cap_rank}`
  document.getElementById("CoinIcon").src = coin.image
  document.getElementById('drawerSymbol').textContent = coin.symbol.toUpperCase()


  document.getElementById("drawerPrice").textContent = `Price: $${coin.current_price.toLocaleString()}`;
  document.getElementById('drawerDesc').textContent = coin.description || coin.name
  document.getElementById('drawerMcap').textContent = `Market Cap: $${coin.market_cap.toLocaleString()}`

  document.getElementById("drawerUpdated").textContent = new Date().toLocaleTimeString();

}


gtCoins();