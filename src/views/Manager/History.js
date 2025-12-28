// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Date utilities
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Data storage
let itemsList = {};
let allTransactions = [];
let filteredTransactions = [];
let currentTransaction = null;
let isReturnMode = false;
let returnQuantities = {};

// Format date for display
function formatDate(date) {
  const day = daysOfWeek[date.getDay()];
  const dateNum = date.getDate();
  const month = months[date.getMonth()];
  return `${day}, ${dateNum} ${month}`;
}

// Handle logout
async function handleLogout(event) {
  if (event) event.preventDefault();
  
  try {
    await fetch(`${API_BASE_URL}/db/login_page/log_out`, {
      method: 'GET',
      credentials: 'include'
    });
    window.location.href = '../login/login.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Still redirect even if logout fails
    window.location.href = '../login/login.html';
  }
}

// Fetch item list from API
async function fetchItemList() {
  try {
    const response = await fetch(`${API_BASE_URL}/summary_page/high_level`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Response is not JSON:', text);
      
      if (text === 'err from sql') {
        throw new Error('NOT_LOGGED_IN');
      }
      throw new Error('Invalid response from server: ' + text);
    }

    const items = await response.json();
    console.log('Items fetched:', items);
    
    // Store items in a lookup object
    items.forEach(item => {
      itemsList[item.id] = {
        name: item.name,
        price: item.price,
        type: item.type,
        currentStock: item.currentStock,
        image: item.image
      };
    });
    
    console.log('Items lookup created:', itemsList);
    return items;
    
  } catch (error) {
    console.error('Error fetching item list:', error);
  }
}

// Fetch transaction history from API (only 5 most recent)
async function fetchTransactionHistory() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/db/transaction_page/fetch_transaction_history`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Response is not JSON:', text);
      
      if (text === 'err from sql') {
        throw new Error('NOT_LOGGED_IN');
      }
      throw new Error('Invalid response from server: ' + text);
    }

    const transactions = await response.json();
    console.log('Raw transactions from API (5 most recent):', transactions);
    
    return transactions;

  } catch (error) {
    console.log('Error fetching transaction history:', error);
    throw error;
  }
}

// Process transaction data - group by time (same time = same transaction)
function processTransactionData(transactions) {
  // Group transactions by time
  const groupedByTime = {};
  
  transactions.forEach(tx => {
    const timeKey = new Date(tx.time).getTime();
    
    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = {
        time: new Date(tx.time),
        items: [],
        total: 0
      };
    }
    
    // Get item details
    const item = itemsList[tx.item_id];
    if (item) {
      const itemTotal = tx.count * item.price;
      groupedByTime[timeKey].items.push({
        name: item.name,
        qty: tx.count,
        price: itemTotal,
        item_id: tx.item_id
      });
      groupedByTime[timeKey].total += itemTotal;
    } else {
      console.warn(`Item ${tx.item_id} not found in itemsList`);
    }
  });
  
  console.log('Grouped transactions by time:', groupedByTime);
  
  // Convert to array and format
  allTransactions = Object.values(groupedByTime).map(transaction => {
    const date = transaction.time;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // Generate transaction ID from timestamp
    const transactionId = `#${date.getTime().toString(36).toUpperCase().substring(0, 8)}`;
    
    return {
      id: transactionId,
      time: timeStr,
      date: formatDate(date),
      total: transaction.total,
      items: transaction.items,
      originalTime: date
    };
  });
  
  // Sort by time (newest first)
  allTransactions.sort((a, b) => b.originalTime - a.originalTime);
  
  console.log('Processed 5 most recent transactions:', allTransactions);
}

// Load transactions
function loadTransactions() {
  filteredTransactions = [...allTransactions];
  
  console.log(`Displaying ${filteredTransactions.length} transactions`);
  
  renderTransactions();
  
  // Load first transaction if available
  if (filteredTransactions.length > 0) {
    loadTransaction(0);
  } else {
    // Clear checkout view if no transactions
    const itemsList = document.getElementById('itemsList');
    const mainTotal = document.getElementById('mainTotal');
    
    if (itemsList) {
      itemsList.innerHTML = '<p class="text-gray-400 text-center py-8">No recent transactions</p>';
    }
    if (mainTotal) {
      mainTotal.textContent = '0元';
    }
  }
}

// Search transactions
function searchTransactions() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  
  if (searchTerm === '') {
    filteredTransactions = [...allTransactions];
  } else {
    filteredTransactions = allTransactions.filter(t => {
      return t.id.toLowerCase().includes(searchTerm) ||
             t.time.includes(searchTerm) ||
             t.date.toLowerCase().includes(searchTerm) ||
             t.total.toString().includes(searchTerm);
    });
  }
  
  renderTransactions();
}

// Render transaction list
function renderTransactions() {
  const container = document.getElementById('transactionList');
  if (!container) return;
  
  if (filteredTransactions.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-center py-4">No transactions found</p>';
    return;
  }
  
  container.innerHTML = '';
  
  filteredTransactions.forEach((tx, index) => {
    const isNegative = tx.total < 0;
    
    const row = document.createElement('div');
    row.className = `grid grid-cols-4 gap-4 py-3 ${index === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'} rounded cursor-pointer transaction-item`;
    row.dataset.index = index;

    row.innerHTML = `
      <div class="font-mono text-sm">${tx.id}</div>
      <div class="text-sm">${tx.date}</div>
      <div class="text-sm">${tx.time}</div>
      <div class="text-right font-semibold ${isNegative ? 'text-red-500' : ''}">${tx.total}元</div>
    `;

    row.addEventListener('click', function() {
      const idx = parseInt(this.dataset.index);
      loadTransaction(idx);
      
      // Update selection styling
      document.querySelectorAll('.transaction-item').forEach(t => t.classList.remove('bg-gray-100'));
      this.classList.add('bg-gray-100');
    });

    container.appendChild(row);
  });
}

// Load transaction details into right panel
function loadTransaction(index) {
  currentTransaction = filteredTransactions[index];
  isReturnMode = false;
  returnQuantities = {};
  
  console.log('Loading transaction:', currentTransaction);
  
  // Update title based on transaction type
  const isReturn = currentTransaction.total < 0;
  const checkoutTitle = document.getElementById('checkoutTitle');
  if (checkoutTitle) {
    checkoutTitle.textContent = isReturn ? 'Returned Content' : 'Content';
  }
  
  // Hide return button if this is a return transaction
  const actionButton = document.getElementById('actionButton');
  if (actionButton) {
    if (isReturn) {
      actionButton.style.display = 'none';
    } else {
      actionButton.style.display = 'flex';
      const buttonText = document.getElementById('buttonText');
      if (buttonText) {
        buttonText.textContent = 'Return Item';
      }
      actionButton.className = 'bg-[#FF4444] hover:bg-[#EE3333] text-white font-bold py-6 rounded-xl shadow-lg transition-all duration-200 text-lg flex items-center justify-center gap-2';
    }
  }
  
  renderCheckoutItems();
}

// Render items in checkout panel
function renderCheckoutItems() {
  const container = document.getElementById('itemsList');
  if (!container) return;
  
  const isReturn = currentTransaction.total < 0;
  
  container.innerHTML = '';
  
  currentTransaction.items.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-[2fr_1fr_1fr] gap-4 py-4 border-b border-gray-200 items-center';
    
    if (isReturnMode) {
      const pricePerUnit = item.price / item.qty;
      itemDiv.innerHTML = `
        <div class="text-sm">${item.name}</div>
        <div class="flex items-center justify-center gap-2">
          <button onclick="decrementQty('${item.name}')" class="w-6 h-6 rounded-full bg-[#27DD8E] text-white flex items-center justify-center hover:bg-[#1FC878] transition text-lg leading-none">−</button>
          <span class="text-sm w-6 text-center" id="qty-${item.name.replace(/\s/g, '-')}">${returnQuantities[item.name]}</span>
          <button onclick="incrementQty('${item.name}', ${Math.abs(item.qty)})" class="w-6 h-6 rounded-full bg-[#27DD8E] text-white flex items-center justify-center hover:bg-[#1FC878] transition text-lg leading-none">+</button>
        </div>
        <div class="text-right text-sm" id="price-${item.name.replace(/\s/g, '-')}">${Math.round(pricePerUnit * returnQuantities[item.name])}元</div>
      `;
    } else {
      itemDiv.innerHTML = `
        <div class="text-sm">${item.name}</div>
        <div class="text-center text-sm">${item.qty}</div>
        <div class="text-right text-sm">${item.price}元</div>
      `;
    }
    
    container.appendChild(itemDiv);
  });

  // Update total
  const mainTotal = document.getElementById('mainTotal');
  if (mainTotal) {
    if (isReturnMode) {
      mainTotal.textContent = `0元`;
    } else {
      mainTotal.textContent = `${currentTransaction.total}元`;
    }
  }
}

// Toggle return view
function toggleReturnView() {
  if (!isReturnMode) {
    // Enter return mode
    isReturnMode = true;
    
    const checkoutTitle = document.getElementById('checkoutTitle');
    if (checkoutTitle) {
      checkoutTitle.textContent = 'Returned Content';
    }
    
    const btn = document.getElementById('actionButton');
    if (btn) {
      btn.className = 'bg-[#27DD8E] hover:bg-[#1FC878] text-white font-bold py-6 rounded-xl shadow-lg transition-all duration-200 text-lg flex items-center justify-center gap-2';
      btn.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span id="buttonText">Save</span>
      `;
    }
    
    // Initialize return quantities to 0
    currentTransaction.items.forEach(item => {
      returnQuantities[item.name] = 0;
    });
    
    renderCheckoutItems();
  } else {
    // Save return
    saveReturn();
  }
}

// Save return transaction
async function saveReturn() {
  // Calculate returned items
  const returnedItems = currentTransaction.items.map(item => ({
    name: item.name,
    qty: -returnQuantities[item.name],
    price: -(item.price / item.qty) * returnQuantities[item.name],
    item_id: item.item_id
  })).filter(item => item.qty !== 0);
  
  if (returnedItems.length === 0) {
    alert('No items to return');
    return;
  }
  
  // Show loading state
  const btn = document.getElementById('actionButton');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Saving...</span>';
  
  // Confirm with user
  const returnTotal = returnedItems.reduce((sum, item) => sum + item.price, 0);
  const confirmMsg = `Return ${returnedItems.length} item(s) for ${Math.abs(Math.round(returnTotal))}元?`;
  
  if (!confirm(confirmMsg)) {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    return;
  }
  
  try {
    // Build data object for API
    const data = { 
      time: currentTransaction.originalTime.toISOString()
    };
    
    returnedItems.forEach(item => {
      data[item.item_id] = item.qty; // negative quantity
    });
    
    console.log('Sending return data to API:', data);
    
    // Send to API using FormData
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    
    const response = await fetch(`${API_BASE_URL}/db/transaction_page/update_transaction`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const result = await response.text();
    console.log('Return saved successfully:', result);
    
    // Refresh transactions from server
    const transactions = await fetchTransactionHistory();
    processTransactionData(transactions);
    loadTransactions();
    isReturnMode = false;
    
    alert('Return saved successfully!');
    
  } catch (error) {
    console.error('Error saving return:', error);
    alert('Failed to save return: ' + error.message);
    
    // Restore button
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

// Increment quantity
function incrementQty(name, maxQty) {
  if (returnQuantities[name] < maxQty) {
    returnQuantities[name]++;
    const qtyElement = document.getElementById(`qty-${name.replace(/\s/g, '-')}`);
    if (qtyElement) {
      qtyElement.textContent = returnQuantities[name];
    }
    updateItemPrice(name);
    updateReturnTotal();
  }
}

// Decrement quantity
function decrementQty(name) {
  if (returnQuantities[name] > 0) {
    returnQuantities[name]--;
    const qtyElement = document.getElementById(`qty-${name.replace(/\s/g, '-')}`);
    if (qtyElement) {
      qtyElement.textContent = returnQuantities[name];
    }
    updateItemPrice(name);
    updateReturnTotal();
  }
}

// Update individual item price
function updateItemPrice(name) {
  const item = currentTransaction.items.find(i => i.name === name);
  const pricePerUnit = item.price / item.qty;
  const newPrice = Math.round(pricePerUnit * returnQuantities[name]);
  const priceElement = document.getElementById(`price-${name.replace(/\s/g, '-')}`);
  if (priceElement) {
    priceElement.textContent = `${newPrice}元`;
  }
}

// Update return total
function updateReturnTotal() {
  let total = 0;
  currentTransaction.items.forEach(item => {
    const pricePerUnit = item.price / item.qty;
    total += pricePerUnit * returnQuantities[item.name];
  });
  const mainTotal = document.getElementById('mainTotal');
  if (mainTotal) {
    mainTotal.textContent = `${Math.round(total)}元`;
  }
}

// Select category (for navigation highlighting)
function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll("[data-icon]");

  buttons.forEach((btn) => {
    const icon = btn.querySelector("img");
    const iconName = btn.dataset.icon;
    icon.src = `/src/assets/${iconName}.svg`;
  });

  const activeIconName = activeBtn.dataset.icon;
  const activeImg = activeBtn.querySelector("img");
  activeImg.src = `/src/assets/${activeIconName}-active.svg`;
}

// Initialize app
async function initializeApp() {
  console.log('Initializing History Page (5 Most Recent Transactions)...');
  
  // Show loading
  const container = document.getElementById('transactionList');
  if (container) {
    container.innerHTML = '<p class="text-gray-400 text-center py-4">Loading 5 most recent transactions...</p>';
  }
  
  // Highlight history icon
  const historyCategory = document.querySelector('[data-icon="history"]');
  if (historyCategory) {
    selectCategory(historyCategory);
  }
  
  // Fetch data
  try {
    // Fetch items first
    await fetchItemList();
    
    // Fetch transactions
    const transactions = await fetchTransactionHistory();
    
    // Process the data
    processTransactionData(transactions);
    
    // Display transactions
    loadTransactions();
    
    console.log('Initialization complete!');
  } catch (error) {
    console.error('Initialization failed:', error);
    
    if (error.message === 'NOT_LOGGED_IN') {
      showError('', true);
    } else {
      showError(error.message, false);
    }
  }
}

// Start when page loads - ONLY ONCE
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// CATEGORY SELECTION
function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll("[data-icon]");

  buttons.forEach((btn) => {
    const icon = btn.querySelector("img");
    const iconName = btn.dataset.icon;
    icon.src = `/src/assets/${iconName}.svg`;
  });

  const activeIconName = activeBtn.dataset.icon;
  const activeImg = activeBtn.querySelector("img");
  activeImg.src = `/src/assets/${activeIconName}-active.svg`;
}

window.addEventListener("load", async () => {
  const stockCategory = document.querySelector('[data-icon="history"]');
  if (stockCategory) {
    selectCategory(stockCategory);
  }
  await fetchItemList();
});