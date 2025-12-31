const API_BASE_URL = "http://localhost:3000";

const monthLabels = [
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

const donutColors = ["#0B7A4B", "#1AC978", "#37E09B", "#8FF0BF", "#A6F5D3"];

const logoutBtn = document.getElementById("logoutBtn");

let revenueChart = null;
let bestSellingChart = null;

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value) {
  if (value >= 1000) {
    const text = (value / 1000).toFixed(1).replace(/\.0$/, "");
    return `${text}k`;
  }
  return value.toString();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

async function fetchSummaryRecords() {
  const response = await fetch(`${API_BASE_URL}/db/summary_page/high_level`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (text.trim() === "err from sql") {
    throw new Error("NOT_LOGGED_IN");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error("Invalid response from server.");
  }

  return Array.isArray(data) ? data : [];
}

function buildSummary(records) {
  const revenueByMonth = Array.from({ length: 12 }, () => 0);
  const itemTotals = new Map();
  const transactionTimes = new Set();

  let totalRevenue = 0;
  let totalSales = 0;

  records.forEach((record, index) => {
    const count = toInt(record.count);
    const price = toInt(record.price);
    const time = new Date(record.time);
    const rawId = record.item_id ?? record.itemId ?? record.id;
    const name = (record.name || "").trim();
    const key =
      rawId !== undefined && rawId !== null
        ? String(rawId)
        : name || `item-${index}`;
    const displayName =
      name || (rawId !== undefined ? `Item #${rawId}` : "Item");

    totalRevenue += count * price;
    totalSales += count;

    if (!Number.isNaN(time.getTime())) {
      const monthIndex = time.getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        revenueByMonth[monthIndex] += count * price;
      }
      transactionTimes.add(time.toISOString());
    }

    const existing = itemTotals.get(key);
    if (existing) {
      existing.count += count;
    } else {
      itemTotals.set(key, { name: displayName, count });
    }
  });

  const sortedItems = Array.from(itemTotals.values()).sort(
    (a, b) => b.count - a.count
  );
  const topItems = sortedItems.slice(0, 4);

  return {
    totalRevenue,
    totalOrders: transactionTimes.size,
    totalItems: itemTotals.size,
    totalSales,
    revenueByMonth,
    bestSelling: topItems,
  };
}

function updateCards(summary) {
  setText("totalRevenue", `$${formatNumber(summary.totalRevenue)}`);
  setText("totalOrders", formatNumber(summary.totalOrders));
  setText("totalItems", formatNumber(summary.totalItems));
  setText("totalSales", formatNumber(summary.totalSales));
}

function renderRevenueChart(revenueByMonth) {
  const canvas = document.getElementById("revenueChart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (revenueChart) {
    revenueChart.destroy();
  }

  const maxValue = Math.max(1, ...revenueByMonth);

  revenueChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: "Revenue",
          data: revenueByMonth,
          backgroundColor: "#1AC978",
          borderRadius: 4,
          barThickness: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${formatNumber(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#6B7280", font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValue,
          grid: { color: "#E5E7EB" },
          ticks: {
            color: "#6B7280",
            callback: (value) => (value === 0 ? "" : formatCompact(value)),
          },
        },
      },
    },
  });
}

function renderBestSellingChart(items, totalSales) {
  const canvas = document.getElementById("bestSellingChart");
  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const hasData = items.length > 0 && totalSales > 0;
  const chartItems = hasData ? items : [{ name: "No data", count: 1 }];
  const chartColors = hasData ? donutColors : ["#E0E0E0"];

  if (bestSellingChart) {
    bestSellingChart.destroy();
  }

  bestSellingChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: chartItems.map((item) => item.name),
      datasets: [
        {
          data: chartItems.map((item) => item.count),
          backgroundColor: chartColors,
          borderColor: "#FFFFFF",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed;
              if (!hasData) {
                return ctx.label;
              }
              const percent = Math.round((value / totalSales) * 100);
              return `${ctx.label}: ${percent}%`;
            },
          },
        },
      },
    },
  });

  const legend = document.getElementById("bestSellingLegend");
  if (legend) {
    legend.innerHTML = "";
    chartItems.forEach((item, index) => {
      const percent = hasData
        ? Math.round((item.count / totalSales) * 100)
        : 100;
      const row = document.createElement("div");
      row.className = "flex items-center gap-3";
      row.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full" style="background:${chartColors[index]};"></span>
        <span class="flex-1">${item.name}</span>
        <span class="text-gray-500">${percent}%</span>
      `;
      legend.appendChild(row);
    });
  }
}

function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll("[data-icon]");

  buttons.forEach((btn) => {
    const icon = btn.querySelector("img");
    const iconName = btn.dataset.icon;
    if (icon && iconName) {
      icon.src = `/src/assets/${iconName}.svg`;
    }
  });

  if (!activeBtn) {
    return;
  }

  const activeIconName = activeBtn.dataset.icon;
  const activeImg = activeBtn.querySelector("img");
  if (activeImg && activeIconName) {
    activeImg.src = `/src/assets/${activeIconName}-active.svg`;
  }
}

// LOGOUT FUNCTIONALITY
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/db/login_page/log_out", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 200) {
        console.log("Logged out successfully");

        // Clear any local data
        items = [];
        selectedItemIndex = null;

        // Redirect to login page (cannot go back)
        window.location.replace("../login/login.html");
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Cannot connect to server.");
    }
  });
}

async function initSummary() {
  const summaryCategory = document.querySelector('[data-icon="summary"]');
  if (summaryCategory) {
    selectCategory(summaryCategory);
  }
  // Prevent back button after logout
  window.history.pushState(null, "", window.location.href);
  window.onpopstate = function () {
    window.history.pushState(null, "", window.location.href);
  };
  try {
    const records = await fetchSummaryRecords();
    const summary = buildSummary(records);

    updateCards(summary);
    renderRevenueChart(summary.revenueByMonth);
    renderBestSellingChart(summary.bestSelling, summary.totalSales);
  } catch (error) {
    console.error("Summary error:", error);

    if (error.message === "NOT_LOGGED_IN") {
      window.location.href = "../login/login.html";
      return;
    }

    updateCards({
      totalRevenue: 0,
      totalOrders: 0,
      totalItems: 0,
      totalSales: 0,
    });
    renderRevenueChart(Array.from({ length: 12 }, () => 0));
    renderBestSellingChart([], 0);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSummary);
} else {
  initSummary();
}

window.selectCategory = selectCategory;
