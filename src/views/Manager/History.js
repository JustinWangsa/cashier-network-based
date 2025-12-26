let currentDateObj = new Date();
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const API_BASE_URL = 'http://localhost:3000';

let itemsList = {};
let transactionsByDate = {};
let currentTransactions = [];
let filteredTransactions = [];
let currentTransaction = null;
let isReturnMode = false;
let returnQuantities = {};

async function fetchTransactionHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/transaction_page/fetch_transaction_history`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }

    const data = await response.json();
    console.log('Transaction history:', data);
    
    await processTransactionData(data);
    
  } catch (error) {
    console.error('Error fetching transaction history:', error);
  }
}

async function fetchItemList() {
  try {
    const response = await fetch(`${API_BASE_URL}/transaction_page/fetch_item_list`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item list');
    }

    const items = await response.json();

    items.forEach(item => {
      itemsList[item.id] = {
        name: item.name,
        price: item.price,
        type: item.type,
        currentStock: item.currentStock,
        image: item.image
      };
    });
    
    console.log('Items loaded:', itemsList);
    
  } catch (error) {
    console.error('Error fetching item list:', error);
  }
}

async function processTransactionData(transactions) {
  await fetchItemList();

  const groupedByTime = {};
  
  transactions.forEach(t => {
    const timeKey = new Date(t.time).getTime();
    
    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = {
        time: new Date(t.time),
        items: [],
        total: 0
      };
    }
    
    const item = itemsList[t.item_id];
    if (item) {
      const itemTotal = t.count * item.price;
      groupedByTime[timeKey].items.push({
        name: item.name,
        qty: t.count,
        price: itemTotal
      });
      groupedByTime[timeKey].total += itemTotal;
    }
  });
  
  transactionsByDate = {};
  
  Object.values(groupedByTime).forEach(transaction => {
    const date = transaction.time;
    const dateKey = getDateKey(date);
    
    if (!transactionsByDate[dateKey]) {
      transactionsByDate[dateKey] = [];
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    transactionsByDate[dateKey].push({
      id: `#${date.getTime().toString(36).toUpperCase()}`,
      time: timeStr,
      total: transaction.total,
      items: transaction.items
    });
  });

  Object.keys(transactionsByDate).forEach(dateKey => {
    transactionsByDate[dateKey].sort((a, b) => {
      return b.time.localeCompare(a.time);
    });
  });
}

function formatDate(date) {
  const day = daysOfWeek[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  return `${day}, ${dateNum} ${month}`;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function changeDate(direction) {
  currentDateObj.setDate(currentDateObj.getDate() + direction);
  document.getElementById('currentDate').textContent = formatDate(currentDateObj);
  loadTransactionsForDate();
}

function loadTransactionsForDate() {
  const dateKey = getDateKey(currentDateObj);
  currentTransactions = transactionsByDate[dateKey] || [];
  filteredTransactions = [...currentTransactions];
  renderTransactions();

  if (currentTransactions.length > 0) {
    loadTransaction(0);
  } else {
    document.getElementById('itemsList').innerHTML = '<p class="text-gray-400 text-center py-8">No transactions for this date</p>';
    document.getElementById('mainTotal').textContent = '0元';
  }
}

function searchTransactions() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  if (searchTerm === '') {
    filteredTransactions = [...currentTransactions];
  } else {
    filteredTransactions = currentTransactions.filter(t => {
      return t.id.toLowerCase().includes(searchTerm) ||
              t.time.includes(searchTerm) ||
              t.total.toString().includes(searchTerm);
    });
  }
  
  renderTransactions();
}

function renderTransactions() {
  const list = document.getElementById('transactionList');
  
  if (filteredTransactions.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-center py-4">No transactions found</p>';
    return;
  }
  
  list.innerHTML = filteredTransactions.map((t, index) => {
    const isNegative = t.total < 0;
    const actualIndex = currentTransactions.indexOf(t);
    return `
      <div class="grid grid-cols-3 gap-4 py-3 ${index === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'} rounded cursor-pointer transaction-item" data-index="${actualIndex}">
        <div class="font-mono text-sm">${t.id}</div>
        <div class="text-sm">${t.time}</div>
        <div class="text-right font-semibold ${isNegative ? 'text-red-500' : ''}">${isNegative ? '' : ''}${t.total}元</div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.transaction-item').forEach(item => {
    item.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      loadTransaction(index);

      document.querySelectorAll('.transaction-item').forEach(t => t.classList.remove('bg-gray-100'));
      this.classList.add('bg-gray-100');
    });
  });
}

function loadTransaction(index) {
  currentTransaction = currentTransactions[index];
  isReturnMode = false;
  returnQuantities = {};

  const isReturn = currentTransaction.total < 0;
  document.getElementById('checkoutTitle').textContent = isReturn ? 'Returned Content' : 'Content';

  if (isReturn) {
    document.getElementById('actionButton').style.display = 'none';
  } else {
    document.getElementById('actionButton').style.display = 'flex';
    document.getElementById('buttonText').textContent = 'Return Item';
    document.getElementById('actionButton').className = 'bg-[#FF4444] hover:bg-[#EE3333] text-white font-bold py-6 rounded-xl shadow-lg transition-all duration-200 text-lg flex items-center justify-center gap-2';
  }
  
  renderCheckoutItems();
}

function renderCheckoutItems() {
  const itemsList = document.getElementById('itemsList');
  const isReturn = currentTransaction.total < 0;
  
  itemsList.innerHTML = currentTransaction.items.map(item => {
    const displayQty = isReturn ? item.qty : item.qty;
    const displayPrice = isReturn ? item.price : item.price;
    
    if (isReturnMode) {
      const pricePerUnit = item.price / item.qty;
      return `
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 py-4 border-b border-gray-200 items-center">
          <div class="text-sm">${item.name}</div>
          <div class="flex items-center justify-center gap-2">
            <button onclick="decrementQty('${item.name}')" class="w-6 h-6 rounded-full bg-[#27DD8E] text-white flex items-center justify-center hover:bg-[#1FC878] transition text-lg leading-none">−</button>
            <span class="text-sm w-6 text-center" id="qty-${item.name.replace(/\s/g, '-')}">${returnQuantities[item.name]}</span>
            <button onclick="incrementQty('${item.name}', ${Math.abs(item.qty)})" class="w-6 h-6 rounded-full bg-[#27DD8E] text-white flex items-center justify-center hover:bg-[#1FC878] transition text-lg leading-none">+</button>
          </div>
          <div class="text-right text-sm" id="price-${item.name.replace(/\s/g, '-')}">${Math.round(pricePerUnit * returnQuantities[item.name])}元</div>
        </div>
      `;
    } else {
      return `
        <div class="grid grid-cols-[2fr_1fr_1fr] gap-4 py-4 border-b border-gray-200 items-center">
          <div class="text-sm">${item.name}</div>
          <div class="text-center text-sm">${displayQty}</div>
          <div class="text-right text-sm">${displayPrice}元</div>
        </div>
      `;
    }
  }).join('');

  if (isReturnMode) {
    document.getElementById('mainTotal').textContent = `0元`;
  } else {
    document.getElementById('mainTotal').textContent = `${currentTransaction.total}元`;
  }
}

function toggleReturnView() {
  if (!isReturnMode) {
    isReturnMode = true;
    document.getElementById('checkoutTitle').textContent = 'Returned Content';
    document.getElementById('buttonText').textContent = 'Save';
    const btn = document.getElementById('actionButton');
    btn.className = 'bg-[#27DD8E] hover:bg-[#1FC878] text-white font-bold py-6 rounded-xl shadow-lg transition-all duration-200 text-lg flex items-center justify-center gap-2';
    btn.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span id="buttonText">Save</span>
    `;

    currentTransaction.items.forEach(item => {
      returnQuantities[item.name] = 0;
    });
    
    renderCheckoutItems();
  } else {
    saveReturn();
  }
}

function saveReturn() {
  const returnedItems = currentTransaction.items.map(item => ({
    name: item.name,
    qty: -returnQuantities[item.name],
    price: -(item.price / item.qty) * returnQuantities[item.name]
  })).filter(item => item.qty !== 0);
  
  if (returnedItems.length === 0) {
    alert('No items to return');
    return;
  }
  
  const returnTotal = returnedItems.reduce((sum, item) => sum + item.price, 0);
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  const returnTransaction = {
    id: `#B3RT0${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
    time: timeStr,
    total: Math.round(returnTotal),
    items: returnedItems
  };

  const dateKey = getDateKey(currentDateObj);
  if (!transactionsByDate[dateKey]) {
    transactionsByDate[dateKey] = [];
  }
  transactionsByDate[dateKey].unshift(returnTransaction);
  
  loadTransactionsForDate();

  isReturnMode = false;
}

function incrementQty(name, maxQty) {
  if (returnQuantities[name] < maxQty) {
    returnQuantities[name]++;
    document.getElementById(`qty-${name.replace(/\s/g, '-')}`).textContent = returnQuantities[name];
    updateItemPrice(name);
    updateReturnTotal();
  }
}

function decrementQty(name) {
  if (returnQuantities[name] > 0) {
    returnQuantities[name]--;
    document.getElementById(`qty-${name.replace(/\s/g, '-')}`).textContent = returnQuantities[name];
    updateItemPrice(name);
    updateReturnTotal();
  }
}

function updateItemPrice(name) {
  const item = currentTransaction.items.find(i => i.name === name);
  const pricePerUnit = item.price / item.qty;
  const newPrice = Math.round(pricePerUnit * returnQuantities[name]);
  document.getElementById(`price-${name.replace(/\s/g, '-')}`).textContent = `${newPrice}元`;
}

function updateReturnTotal() {
  let total = 0;
  currentTransaction.items.forEach(item => {
    const pricePerUnit = item.price / item.qty;
    total += pricePerUnit * returnQuantities[item.name];
  });
  document.getElementById('mainTotal').textContent = `${Math.round(total)}元`;
}

async function initializeApp() {
  document.getElementById('currentDate').textContent = formatDate(currentDateObj);

  await fetchTransactionHistory();

  loadTransactionsForDate();
}

initializeApp();