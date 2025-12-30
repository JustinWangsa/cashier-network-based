// Summary.js - Dashboard matching Figma design

// Global chart instances
let salesChart = null;
let bestSellingChart = null;

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
      console.log("Transaction data received:", data);
      return data;
    } else {
      console.error("Failed to fetch transaction data, status:", res.status);
      const text = await res.text();
      console.error("Response:", text);
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
      console.log("Item list received:", data);
      return data;
    } else {
      console.error("Failed to fetch item list, status:", res.status);
      const text = await res.text();
      console.error("Response:", text);
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

// Calculate statistics for top boxes
function calculateStatistics(transactions) {
  let totalRevenue = 0;
  let totalItemsSold = 0;
  const uniqueTransactions = new Set();

  transactions.forEach((transaction) => {
    const revenue = transaction.count * transaction.price;
    totalRevenue += revenue;
    totalItemsSold += transaction.count;
    uniqueTransactions.add(transaction.time);
  });

  return {
    totalRevenue,
    totalOrders: uniqueTransactions.size,
    totalCustomers: uniqueTransactions.size,
    totalItemsSold,
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

  // Convert to array and sort by count descending
  const categories = Object.entries(categoryMap)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return categories;
}

// Update top statistics boxes
function updateStatisticsBoxes(stats) {
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
  }
  if (boxes[1]) {
    boxes[1].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalOrders
    );
  }
  if (boxes[2]) {
    boxes[2].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalCustomers
    );
  }
  if (boxes[3]) {
    boxes[3].querySelector(".text-2xl").textContent = formatNumberShort(
      stats.totalItemsSold
    );
  }
}

// Create Sales & Revenue Bar Chart (matching Figma - grouped bars)
function createSalesChart(chartData) {
  const container = document.querySelector(".lg\\:col-span-2 .h-72");
  if (!container) {
    console.error("Sales chart container not found");
    return;
  }

  // Clear any existing content
  const parent = container.parentElement;
  const existingSummary = parent.querySelector('.flex.justify-between.items-center');
  if (existingSummary) {
    existingSummary.remove();
  }
  container.innerHTML = "";

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
          barThickness: 'flex',
          maxBarThickness: 30,
        },
        {
          label: "Sales",
          data: chartData.sales,
          backgroundColor: "#27DD8E",
          borderRadius: 4,
          barThickness: 'flex',
          maxBarThickness: 30,
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
              weight: "500",
            },
            generateLabels: function(chart) {
              return [
                {
                  text: 'Revenue',
                  fillStyle: '#137048',
                  hidden: false,
                  lineWidth: 0,
                },
                {
                  text: 'Sales',
                  fillStyle: '#27DD8E',
                  hidden: false,
                  lineWidth: 0,
                }
              ];
            }
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 13,
          },
          titleFont: {
            size: 14,
            weight: 'bold',
          },
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
          grid: { 
            display: false,
            drawBorder: false,
          },
          ticks: {
            font: {
              size: 11,
            },
            color: '#666',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.06)",
            drawBorder: false,
          },
          border: {
            display: false,
          },
          ticks: {
            callback: function (value) {
              return formatCurrency(value);
            },
            font: {
              size: 11,
            },
            color: '#666',
            padding: 8,
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
  container.style.display = "flex";
  container.style.flexDirection = "column";
  
  // Create chart canvas wrapper
  const chartWrapper = document.createElement("div");
  chartWrapper.style.height = "180px";
  chartWrapper.style.marginBottom = "20px";
  chartWrapper.style.flexShrink = "0";
  container.appendChild(chartWrapper);
  
  const canvas = document.createElement("canvas");
  chartWrapper.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  if (bestSellingChart) {
    bestSellingChart.destroy();
  }

  // Calculate total and percentages
  const total = categoryData.reduce((sum, item) => sum + item.count, 0);

  const colors = {
    Food: "#137048",
    Beverage: "#27DD8E",
    Snack: "#5FE3A1",
    Snacks: "#5FE3A1",
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
      cutout: "65%",
      plugins: {
        legend: {
          display: false, // Hide default legend
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 13,
          },
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} items (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Create custom legend
  const legendContainer = document.createElement("div");
  legendContainer.style.display = "flex";
  legendContainer.style.flexDirection = "column";
  legendContainer.style.gap = "8px";
  legendContainer.style.paddingLeft = "0px";
  legendContainer.style.alignItems = "flex-start";
  
  categoryData.forEach((item) => {
    const percentage = ((item.count / total) * 100).toFixed(0);
    const color = colors[item.name] || "#E0FAEF";
    
    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.gap = "8px";
    legendItem.style.fontSize = "13px";
    
    const colorBox = document.createElement("div");
    colorBox.style.width = "12px";
    colorBox.style.height = "12px";
    colorBox.style.backgroundColor = color;
    colorBox.style.borderRadius = "2px";
    colorBox.style.flexShrink = "0";
    
    const text = document.createElement("span");
    text.textContent = `${item.name}  ${percentage}%`;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(text);
    legendContainer.appendChild(legendItem);
  });
  
  container.appendChild(legendContainer);

  console.log("Best selling chart created successfully");
}

// Show loading state
function showLoading() {
  const containers = document.querySelectorAll('.h-72');
  containers.forEach(container => {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">Loading data...</div>';
  });
}

// Show error state
function showError(message) {
  const containers = document.querySelectorAll('.h-72');
  containers.forEach(container => {
    container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #f44336; text-align: center; padding: 20px;">${message}</div>`;
  });
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    console.log("Loading dashboard data...");
    showLoading();

    const transactions = await fetchTransactionData();
    const itemList = await fetchItemList();

    if (transactions.length === 0) {
      console.warn("No transaction data available");
      showError("No transaction data available.<br>Create some transactions to see statistics.");
      return;
    }

    console.log(`Processing ${transactions.length} transactions and ${itemList.length} items`);

    // Calculate statistics
    const stats = calculateStatistics(transactions);
    console.log("Statistics calculated:", stats);
    updateStatisticsBoxes(stats);

    // Prepare chart data
    const salesData = groupTransactionsByMonth(transactions);
    console.log("Sales data by month:", salesData);
    
    const categoryData = calculateBestSellingByCategory(transactions, itemList);
    console.log("Category data:", categoryData);

    // Create charts
    createSalesChart(salesData);
    createBestSellingChart(categoryData);

    console.log("✅ Dashboard loaded successfully");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    showError("Failed to load dashboard data.<br>Please check console for details.");
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

// Category selection function with navigation
function selectCategory(activeBtn) {
  const iconName = activeBtn.dataset.icon;
  
  // Define page URLs
  const pageUrls = {
    stock: 'main.html',
    history: 'history.html',
    summary: 'summary.html'
  };
  
  // Navigate to the corresponding page
  if (pageUrls[iconName]) {
    window.location.href = pageUrls[iconName];
  }
}

// Make selectCategory available globally
window.selectCategory = selectCategory;

// Initialize when page loads
window.addEventListener("load", async () => {
  // Highlight the active summary icon
  const summaryCategory = document.querySelector('[data-icon="summary"]');
  if (summaryCategory) {
    const activeImg = summaryCategory.querySelector("img");
    activeImg.src = `/src/assets/summary-active.svg`;
  }

  try {
    await loadChartJS();
    await initializeDashboard();
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    showError("Failed to initialize dashboard.<br>Please refresh the page.");
  }
});