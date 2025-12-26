// Summary.js - Dashboard matching Figma design

// Global chart instances
let salesChart = null;
let bestSellingChart = null;
let miniCharts = [];

// Fetch all transaction data
async function fetchTransactionData() {
  try {
    const res = await fetch(
      "http://localhost:3000/db/summary_page/high_level",
      {
        method: "GET",
        credentials: "include",
      }
    );

    console.log("Transaction data status:", res.status);

    if (res.status === 200) {
      const data = await res.json();
      console.log("Transaction data:", data);
      return data;
    } else {
      console.error("Failed to fetch transaction data");
      return [];
    }
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    return [];
  }
}

// Fetch item list
async function fetchItemList() {
  try {
    const res = await fetch(
      "http://localhost:3000/db/stock_page/fetch_item_list",
      {
        method: "GET",
        credentials: "include",
      }
    );

    console.log("Item list status:", res.status);

    if (res.status === 200) {
      const data = await res.json();
      console.log("Item list:", data);
      return data;
    } else {
      console.error("Failed to fetch item list");
      return [];
    }
  } catch (error) {
    console.error("Error fetching item list:", error);
    return [];
  }
}

// Format currency
function formatCurrency(amount) {
  return (
    "$" +
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

// Format number with k/m suffix
function formatNumberShort(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "m";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + "k";
  }
  return num.toString();
}

// Group transactions by month for bar chart
function groupTransactionsByMonth(transactions) {
  const monthData = {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  transactions.forEach((transaction) => {
    const date = new Date(transaction.time);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = monthNames[date.getMonth()];

    if (!monthData[monthKey]) {
      monthData[monthKey] = {
        label: monthLabel,
        revenue: 0,
        sales: 0,
      };
    }

    monthData[monthKey].revenue += transaction.count * transaction.price;
    monthData[monthKey].sales += transaction.count;
  });

  // Sort by date
  const sortedMonths = Object.keys(monthData).sort();

  return {
    labels: sortedMonths.map((key) => monthData[key].label),
    revenue: sortedMonths.map((key) => monthData[key].revenue),
    sales: sortedMonths.map((key) => monthData[key].sales),
  };
}

// Calculate monthly order counts for mini chart
function calculateMonthlyOrders(transactions) {
  const monthOrders = {};
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Group unique transactions by month
  const uniqueTransactionsByMonth = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.time);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = monthNames[date.getMonth()];

    if (!uniqueTransactionsByMonth[monthKey]) {
      uniqueTransactionsByMonth[monthKey] = {
        label: monthLabel,
        transactions: new Set(),
      };
    }

    // Add unique transaction time
    uniqueTransactionsByMonth[monthKey].transactions.add(transaction.time);
  });

  // Sort by date and convert to counts
  const sortedMonths = Object.keys(uniqueTransactionsByMonth).sort();

  return {
    labels: sortedMonths.map((key) => uniqueTransactionsByMonth[key].label),
    data: sortedMonths.map(
      (key) => uniqueTransactionsByMonth[key].transactions.size
    ),
  };
}

// Calculate all monthly data for mini charts
function calculateMonthlyData(transactions) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyData = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.time);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthLabel = monthNames[date.getMonth()];

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        label: monthLabel,
        revenue: 0,
        sales: 0,
        orders: new Set(),
        customers: new Set(),
      };
    }

    monthlyData[monthKey].revenue += transaction.count * transaction.price;
    monthlyData[monthKey].sales += transaction.count;
    monthlyData[monthKey].orders.add(transaction.time);
    monthlyData[monthKey].customers.add(transaction.time); // Same as orders
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  return {
    revenue: {
      labels: sortedMonths.map((key) => monthlyData[key].label),
      data: sortedMonths.map((key) => monthlyData[key].revenue),
    },
    orders: {
      labels: sortedMonths.map((key) => monthlyData[key].label),
      data: sortedMonths.map((key) => monthlyData[key].orders.size),
    },
    customers: {
      labels: sortedMonths.map((key) => monthlyData[key].label),
      data: sortedMonths.map((key) => monthlyData[key].customers.size),
    },
    sales: {
      labels: sortedMonths.map((key) => monthlyData[key].label),
      data: sortedMonths.map((key) => monthlyData[key].sales),
    },
  };
}

// Calculate statistics for top boxes
function calculateStatistics(transactions) {
  let totalRevenue = 0;
  let totalItemsSold = 0;
  const uniqueTransactions = new Set();
  const dailyRevenue = {};

  transactions.forEach((transaction) => {
    const revenue = transaction.count * transaction.price;
    totalRevenue += revenue;
    totalItemsSold += transaction.count;
    uniqueTransactions.add(transaction.time);

    // Track daily revenue for mini chart
    const date = new Date(transaction.time).toLocaleDateString();
    dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
  });

  const sortedDates = Object.keys(dailyRevenue).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const revenueValues = sortedDates.map((date) => dailyRevenue[date]);

  return {
    totalRevenue,
    totalOrders: uniqueTransactions.size,
    totalCustomers: uniqueTransactions.size,
    totalItemsSold,
    revenueOverTime: revenueValues,
  };
}

// Calculate best selling by category
function calculateBestSellingByCategory(transactions, itemList) {
  const categoryMap = {};

  // Create item type map
  const itemTypes = {};
  itemList.forEach((item) => {
    itemTypes[item.id] = item.type || "Others";
  });

  // Count sales by category
  transactions.forEach((transaction) => {
    const type = itemTypes[transaction.item_id] || "Others";

    if (!categoryMap[type]) {
      categoryMap[type] = 0;
    }

    categoryMap[type] += transaction.count;
  });

  // Convert to array
  const categories = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }));

  return categories;
}

// Update top statistics boxes
function updateStatisticsBoxes(stats, monthlyData) {
  // Select only the first grid (the 4-column stat boxes)
  const firstGrid = document.querySelector(".grid.grid-cols-1");
  if (!firstGrid) {
    console.error("Stats grid not found");
    return;
  }

  const boxes = firstGrid.querySelectorAll(".bg-white");
  console.log("Found stat boxes:", boxes.length);

  if (boxes[0]) {
    boxes[0].querySelector(".text-2xl").textContent = formatCurrency(
      stats.totalRevenue
    );
    // Add mini chart for Total Revenue
    createRevenueMiniChart(boxes[0], monthlyData.revenue);
  }
  if (boxes[1]) {
    boxes[1].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalOrders
    );
    // Add mini chart for Total Orders
    createOrderMiniChart(boxes[1], monthlyData.orders);
  }
  if (boxes[2]) {
    boxes[2].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalCustomers
    );
    // Add mini chart for Total Customers
    createCustomerMiniChart(boxes[2], monthlyData.customers);
  }
  if (boxes[3]) {
    boxes[3].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalItemsSold
    );
    // Add mini chart for Total Sales
    createSaleMiniChart(boxes[3], monthlyData.sales);
  }
}

// Create mini sparkline chart in stat box
function createMiniChart(container, data) {
  if (!container || data.length === 0) return;

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "60px";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => i),
      datasets: [
        {
          data: data,
          borderColor: "#27DD8E",
          backgroundColor: "rgba(39, 221, 142, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });

  miniCharts.push(chart);
}

// Create mini bar chart for Total Orders box
function createOrderMiniChart(boxElement, monthlyOrders) {
  // Calculate total and average
  const totalOrders = monthlyOrders.data.reduce((a, b) => a + b, 0);
  const avgOrders = Math.round(totalOrders / monthlyOrders.data.length);
  const maxMonth = Math.max(...monthlyOrders.data);
  const maxMonthIndex = monthlyOrders.data.indexOf(maxMonth);
  const maxMonthName = monthlyOrders.labels[maxMonthIndex];

  // Find or create container for the chart
  let chartContainer = boxElement.querySelector(".mini-chart-container");

  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.className = "mini-chart-container";
    chartContainer.style.width = "100%";
    boxElement.appendChild(chartContainer);
  }

  chartContainer.innerHTML = "";

  // Add description text
  const descDiv = document.createElement("div");
  descDiv.className = "text-xs text-gray-500 mb-2";
  descDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <span>Monthly Orders</span>
      <span class="text-[#137048] font-semibold">Peak: ${maxMonthName} (${maxMonth})</span>
    </div>
  `;
  chartContainer.appendChild(descDiv);

  // Create chart canvas
  const canvasWrapper = document.createElement("div");
  canvasWrapper.style.height = "120px";
  canvasWrapper.style.width = "100%";
  chartContainer.appendChild(canvasWrapper);

  const canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const miniChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlyOrders.labels,
      datasets: [
        {
          data: monthlyOrders.data,
          backgroundColor: monthlyOrders.data.map((val, idx) =>
            idx === maxMonthIndex ? "#137048" : "rgba(39, 221, 142, 0.6)"
          ),
          borderRadius: 3,
          barPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `Orders: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
      },
    },
  });

  miniCharts.push(miniChart);
}

// Create mini bar chart for Total Revenue box
function createRevenueMiniChart(boxElement, monthlyRevenue) {
  const maxMonth = Math.max(...monthlyRevenue.data);
  const maxMonthIndex = monthlyRevenue.data.indexOf(maxMonth);
  const maxMonthName = monthlyRevenue.labels[maxMonthIndex];

  let chartContainer = boxElement.querySelector(".mini-chart-container");

  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.className = "mini-chart-container";
    chartContainer.style.width = "100%";
    boxElement.appendChild(chartContainer);
  }

  chartContainer.innerHTML = "";

  const descDiv = document.createElement("div");
  descDiv.className = "text-xs text-gray-500 mb-2";
  descDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <span>Monthly Revenue</span>
      <span class="text-[#137048] font-semibold">Peak: ${maxMonthName} (${formatCurrency(
    maxMonth
  )})</span>
    </div>
  `;
  chartContainer.appendChild(descDiv);

  const canvasWrapper = document.createElement("div");
  canvasWrapper.style.height = "120px";
  canvasWrapper.style.width = "100%";
  chartContainer.appendChild(canvasWrapper);

  const canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const miniChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlyRevenue.labels,
      datasets: [
        {
          data: monthlyRevenue.data,
          backgroundColor: monthlyRevenue.data.map((val, idx) =>
            idx === maxMonthIndex ? "#137048" : "rgba(39, 221, 142, 0.6)"
          ),
          borderRadius: 3,
          barPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `Revenue: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 10,
            },
            callback: function (value) {
              return formatCurrency(value);
            },
          },
        },
      },
    },
  });

  miniCharts.push(miniChart);
}

// Create mini bar chart for Total Customers box
function createCustomerMiniChart(boxElement, monthlyCustomers) {
  const maxMonth = Math.max(...monthlyCustomers.data);
  const maxMonthIndex = monthlyCustomers.data.indexOf(maxMonth);
  const maxMonthName = monthlyCustomers.labels[maxMonthIndex];

  let chartContainer = boxElement.querySelector(".mini-chart-container");

  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.className = "mini-chart-container";
    chartContainer.style.width = "100%";
    boxElement.appendChild(chartContainer);
  }

  chartContainer.innerHTML = "";

  const descDiv = document.createElement("div");
  descDiv.className = "text-xs text-gray-500 mb-2";
  descDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <span>Monthly Customers</span>
      <span class="text-[#137048] font-semibold">Peak: ${maxMonthName} (${maxMonth})</span>
    </div>
  `;
  chartContainer.appendChild(descDiv);

  const canvasWrapper = document.createElement("div");
  canvasWrapper.style.height = "120px";
  canvasWrapper.style.width = "100%";
  chartContainer.appendChild(canvasWrapper);

  const canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const miniChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlyCustomers.labels,
      datasets: [
        {
          data: monthlyCustomers.data,
          backgroundColor: monthlyCustomers.data.map((val, idx) =>
            idx === maxMonthIndex ? "#137048" : "rgba(39, 221, 142, 0.6)"
          ),
          borderRadius: 3,
          barPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `Customers: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
      },
    },
  });

  miniCharts.push(miniChart);
}

// Create mini bar chart for Total Sale box
function createSaleMiniChart(boxElement, monthlySales) {
  const maxMonth = Math.max(...monthlySales.data);
  const maxMonthIndex = monthlySales.data.indexOf(maxMonth);
  const maxMonthName = monthlySales.labels[maxMonthIndex];

  let chartContainer = boxElement.querySelector(".mini-chart-container");

  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.className = "mini-chart-container";
    chartContainer.style.width = "100%";
    boxElement.appendChild(chartContainer);
  }

  chartContainer.innerHTML = "";

  const descDiv = document.createElement("div");
  descDiv.className = "text-xs text-gray-500 mb-2";
  descDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <span>Monthly Sales (Items)</span>
      <span class="text-[#137048] font-semibold">Peak: ${maxMonthName} (${maxMonth.toLocaleString()})</span>
    </div>
  `;
  chartContainer.appendChild(descDiv);

  const canvasWrapper = document.createElement("div");
  canvasWrapper.style.height = "120px";
  canvasWrapper.style.width = "100%";
  chartContainer.appendChild(canvasWrapper);

  const canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const miniChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: monthlySales.labels,
      datasets: [
        {
          data: monthlySales.data,
          backgroundColor: monthlySales.data.map((val, idx) =>
            idx === maxMonthIndex ? "#137048" : "rgba(39, 221, 142, 0.6)"
          ),
          borderRadius: 3,
          barPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `Items Sold: ${context.parsed.y.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              size: 10,
            },
          },
        },
      },
    },
  });

  miniCharts.push(miniChart);
}

// Create Sales & Revenue Bar Chart (matching Figma)
function createSalesChart(chartData) {
  const container = document.querySelector(".lg\\:col-span-2 .h-72");
  if (!container) {
    console.error("Sales chart container not found");
    return;
  }

  container.innerHTML = "";

  // Calculate totals for summary text
  const totalRevenue = chartData.revenue.reduce((a, b) => a + b, 0);
  const totalSales = chartData.sales.reduce((a, b) => a + b, 0);

  // Create summary text container
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "flex justify-between items-center mb-4 px-2";
  summaryDiv.innerHTML = `
    <div class="flex gap-6">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#137048]"></div>
        <span class="text-sm text-gray-600">Revenue: <strong>${formatCurrency(
          totalRevenue
        )}</strong></span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#27DD8E]"></div>
        <span class="text-sm text-gray-600">Sales: <strong>${totalSales.toLocaleString()} items</strong></span>
      </div>
    </div>
  `;
  container.parentElement.insertBefore(summaryDiv, container);

  // Create canvas for chart
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  if (salesChart) {
    salesChart.destroy();
  }

  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "Revenue",
          data: chartData.revenue,
          backgroundColor: "#137048",
          borderRadius: 4,
        },
        {
          label: "Sales",
          data: chartData.sales,
          backgroundColor: "#27DD8E",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 15,
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.datasetIndex === 0) {
                label += formatCurrency(context.parsed.y);
              } else {
                label += context.parsed.y.toLocaleString() + " items";
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            callback: function (value) {
              return formatCurrency(value);
            },
            font: {
              size: 11,
            },
          },
        },
      },
    },
  });

  console.log("Sales chart created successfully");
}

// Create Best Selling Food Donut Chart (by category)
function createBestSellingChart(categoryData) {
  const container = document.querySelector(".lg\\:col-span-1 .h-72");
  if (!container) {
    console.error("Best selling chart container not found");
    return;
  }

  container.innerHTML = "";
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  if (bestSellingChart) {
    bestSellingChart.destroy();
  }

  // Calculate total and percentages
  const total = categoryData.reduce((sum, item) => sum + item.count, 0);

  const colors = {
    Food: "#137048",
    Beverage: "#27DD8E",
    Snacks: "#1A955F",
    Others: "#CDF7E5",
  };

  bestSellingChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryData.map((item) => item.name),
      datasets: [
        {
          data: categoryData.map((item) => item.count),
          backgroundColor: categoryData.map(
            (item) => colors[item.name] || "#E0FAEF"
          ),
          borderColor: "#ffffff",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 15,
            generateLabels: function (chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / total) * 100).toFixed(0);
                return {
                  text: `${label} ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  console.log("Best selling chart created successfully");
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    console.log("Loading dashboard data...");

    const transactions = await fetchTransactionData();
    const itemList = await fetchItemList();

    if (transactions.length === 0) {
      console.warn("No transaction data available");
      return;
    }

    // Calculate statistics
    const stats = calculateStatistics(transactions);
    const monthlyData = calculateMonthlyData(transactions);
    updateStatisticsBoxes(stats, monthlyData);

    // Prepare chart data
    const salesData = groupTransactionsByMonth(transactions);
    const categoryData = calculateBestSellingByCategory(transactions, itemList);

    // Create charts
    createSalesChart(salesData);
    createBestSellingChart(categoryData);

    console.log("Dashboard loaded successfully");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}

// Load Chart.js from CDN
function loadChartJS() {
  return new Promise((resolve, reject) => {
    if (typeof Chart !== "undefined") {
      console.log("Chart.js already loaded");
      resolve();
      return;
    }

    console.log("Loading Chart.js from CDN...");
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    script.onload = () => {
      console.log("Chart.js loaded successfully");
      resolve();
    };
    script.onerror = () => {
      console.error("Failed to load Chart.js");
      reject(new Error("Failed to load Chart.js"));
    };
    document.head.appendChild(script);
  });
}

// Initialize when page loads
window.addEventListener("load", async () => {
  try {
    await loadChartJS();
    await initializeDashboard();
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
  }
});
