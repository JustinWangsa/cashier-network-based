      let currentDateObj = new Date(2024, 11, 2);
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const transactionsByDate = {
        '2024-12-01': [
          { id: '#B3RT0A1', time: '14:30', total: 2500, items: [{name: 'Item X', qty: 2, price: 2500}] },
          { id: '#B3RT0A2', time: '15:20', total: 1800, items: [{name: 'Item Y', qty: 1, price: 1800}] },
        ],
        '2024-12-02': [
          { id: '#B3RT0DD', time: '13:57', total: 3292, items: [{name: 'Bertrand Onlyfans', qty: 3, price: 3000}, {name: 'Pacar Cina', qty: 3, price: 300}] },
          { id: '#B3RT0DC', time: '13:55', total: 140, items: [{name: 'Item A', qty: 1, price: 140}] },
          { id: '#B3RT0DB', time: '13:52', total: 200, items: [{name: 'Item B', qty: 2, price: 200}] },
          { id: '#B3RT0DA', time: '13:48', total: 230, items: [{name: 'Item C', qty: 1, price: 230}] },
          { id: '#B3RT0D9', time: '13:44', total: 135, items: [{name: 'Item D', qty: 3, price: 135}] },
          { id: '#B3RT0D8', time: '13:41', total: 120, items: [{name: 'Item E', qty: 1, price: 120}] },
          { id: '#B3RT0D7', time: '13:39', total: 90, items: [{name: 'Item F', qty: 2, price: 90}] },
          { id: '#B3RT0D6', time: '13:36', total: 5000, items: [{name: 'Item G', qty: 1, price: 5000}] },
          { id: '#B3RT0D5', time: '13:34', total: 235, items: [{name: 'Item H', qty: 2, price: 235}] },
          { id: '#B3RT0D4', time: '13:31', total: 300, items: [{name: 'Item I', qty: 1, price: 300}] },
          { id: '#B3RT0D3', time: '13:28', total: 100, items: [{name: 'Item J', qty: 1, price: 100}] },
          { id: '#B3RT0D2', time: '13:25', total: 1700, items: [{name: 'Item K', qty: 2, price: 1700}] },
        ],
        '2024-12-03': [
          { id: '#B3RT0E1', time: '10:15', total: 450, items: [{name: 'Morning Item', qty: 1, price: 450}] },
          { id: '#B3RT0E2', time: '11:30', total: 890, items: [{name: 'Lunch Special', qty: 2, price: 890}] },
        ]
      };

      let currentTransactions = [];
      let filteredTransactions = [];
      let currentTransaction = null;
      let isReturnMode = false;
      let returnQuantities = {};

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

      document.getElementById('currentDate').textContent = formatDate(currentDateObj);
      loadTransactionsForDate();