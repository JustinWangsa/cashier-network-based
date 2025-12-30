//move the stock if 0
function moveItemToEndOnce(itemEl) {
  if (itemEl.dataset.moved === "true") return;

  itemEl.dataset.moved = "true";
  document.getElementById("itemGrid").appendChild(itemEl);
}

//cart
const cart = {};

function addToCart(id, name, price, image) {
  if (cart[id]) {
    cart[id].qty++;
  } else {
    cart[id] = { id, name, price, qty: 1, image };
  }
  renderCart();
}

function addToCartFromItem(itemEl) {
  let stock = Number(itemEl.dataset.stock);

  if (stock <= 0) {
    alert("This item is out of stock");
    return;
  }

  addToCart(
    itemEl.dataset.id,
    itemEl.dataset.name,
    Number(itemEl.dataset.price),
    itemEl.dataset.image
  );

  // decrease stock
  stock--;
  itemEl.dataset.stock = stock;

  // update UI
  const stockSpan = itemEl.querySelector(".stock-text span");
  stockSpan.textContent = stock;

  // move ONLY when it just reached 0
  if (stock === 0) {
    alert(`${itemEl.dataset.name} is now out of stock`);
    moveItemToEndOnce(itemEl);
  }
  moveItemToEnd(itemEl);
}

function changeQty(id, delta) {
  if (!cart[id]) return;

  const itemEl = document.querySelector(`[data-id="${id}"]`);

  let stock = Number(itemEl.dataset.stock);
  const nextQty = cart[id].qty + delta;

  if (delta > 0 && stock <= 0) {
    alert("No more stock available");
    return;
  }

  if (nextQty < 1) return;

  cart[id].qty = nextQty;

  itemEl.dataset.stock = stock - delta;
  const newStock = Number(itemEl.dataset.stock);

  const stockSpan = itemEl.querySelector(".stock-text span");
  stockSpan.textContent = newStock;

  if (newStock === 0) {
    alert(`${cart[id].name} is now out of stock`);
    moveItemToEndOnce(itemEl);
  }

  renderCart();
}

function removeItem(id) {
  const item = cart[id];
  if (!item) return;

  const itemEl = document.querySelector(`[data-id="${id}"]`);

  let stock = Number(itemEl.dataset.stock);
  stock += item.qty;

  itemEl.dataset.stock = stock;
  itemEl.querySelector(".stock-text span").textContent = stock;

  delete cart[id];
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const totalPriceEl = document.getElementById("totalPrice");

  cartItems.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach((item) => {
    total += item.price * item.qty;

    cartItems.innerHTML += `
      <div class="flex items-center justify-between px-4 py-3 font-bold text-[#4B4B4B]">

        <div class="flex items-center gap-3 flex-1">
          <img
            src="/src/assets/Vector.svg"
            class="w-5 h-5 cursor-pointer"
            onclick="removeItem('${item.id}')"
          />
          <p class="text-base font-semibold">${item.name}</p>
        </div>

        <div class="flex items-center gap-3 flex-1 justify-center">
          <button onclick="changeQty('${item.id}', -1)">
            <img src="/src/assets/Subtract.svg" class="w-8 h-9" />
          </button>
          <span class="text-base font-semibold">${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)">
            <img src="/src/assets/Add.svg" class="w-10 h-8" />
          </button>
        </div>

        <p class="text-right w-24 text-base font-semibold">
          NT$${item.price * item.qty}
        </p>
      </div>
    `;
  });

  totalPriceEl.textContent = `NT$${total}`;
}

//search
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  document.querySelectorAll("#itemGrid > div").forEach((item) => {
    const name = item.querySelector("p").textContent.toLowerCase();
    item.style.display = name.includes(keyword) ? "" : "none";
  });
});

// Global variable to track current category filter
let currentCategory = "All";

//category
function selectCategory(activeBtn) {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("border-[#27DD8E]");
    btn.classList.add("border-[#C0C0C0]");

    const text = btn.querySelector(".category-text");
    text.classList.remove("text-[#105E3C]");
    text.classList.add("text-[#C0C0C0]");

    const icon = btn.dataset.icon;
    btn.querySelector(".category-icon").src = `/src/assets/${icon}.svg`;
  });

  activeBtn.classList.remove("border-[#C0C0C0]");
  activeBtn.classList.add("border-[#27DD8E]");

  const activeText = activeBtn.querySelector(".category-text");
  activeText.classList.remove("text-[#C0C0C0]");
  activeText.classList.add("text-[#105E3C]");

  const activeIcon = activeBtn.dataset.icon;
  activeBtn.querySelector(
    ".category-icon"
  ).src = `/src/assets/${activeIcon}-active.svg`;

  // Store the selected category and filter items
  currentCategory = activeIcon;
  filterItemsByCategory(currentCategory);
}

// Filter items by category
function filterItemsByCategory(category) {
  document.querySelectorAll("#itemGrid > div").forEach((item) => {
    const itemCategory = item.dataset.type || "Others";

    if (category === "All") {
      item.style.display = "";
    } else if (itemCategory === category) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

// fetch item
async function fetchItemList() {
  try {
    const res = await fetch(
      "http://localhost:3000/db/stock_page/fetch_item_list",
      { credentials: "include" }
    );

    if (res.status !== 200) {
      console.error("Failed to fetch items:", res.status);
      return;
    }

    const data = await res.json();
    const activeItems = data.filter((item) => item.expiry === null);
    const grid = document.getElementById("itemGrid");
    grid.innerHTML = "";

    activeItems.forEach((item) => {
      const div = document.createElement("div");
      div.className =
        "bg-white rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition";

      div.dataset.id = item.id;
      div.dataset.name = item.name;
      div.dataset.type = item.type || "Others"; // Store category
      div.dataset.price = item.price;
      div.dataset.stock = item.currentStock ?? 0;

      div.dataset.image = item.image
        ? `data:image;base64,${item.image}`
        : "/src/assets/placeholder.jpg";

      div.addEventListener("click", () => addToCartFromItem(div));

      div.innerHTML = `
        <img 
          src="${div.dataset.image}" 
          class="w-full h-full object-cover rounded-xl"
        />
        <p class="font-bold mt-1">${item.name}</p>
        <p class="text-[#27ae60] font-bold">NT$${item.price}</p>
        <p class="text-gray-600 text-sm stock-text">
          Stock: <span>${div.dataset.stock}</span>
        </p>
      `;
      grid.appendChild(div);
    });

    // Apply current category filter after loading items
    filterItemsByCategory(currentCategory);
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Cannot connect to database server.");
  }
}

window.addEventListener("load", () => {
  const allCategory = document.querySelector('.category-btn[data-icon="All"]');
  fetchItemList();
  if (allCategory) selectCategory(allCategory);
});

// payment
const payButton = document.getElementById("payButton");

payButton.addEventListener("click", async () => {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty!");
    return;
  }

  // build backend payload
  const dataObj = {};
  Object.values(cart).forEach((item) => {
    dataObj[item.id] = String(item.qty);
  });

  const formData = new FormData();
  formData.append("data", JSON.stringify(dataObj));

  try {
    const res = await fetch(
      "http://localhost:3000/db/transaction_page/new_transaction",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const text = await res.text();

    if (res.status === 200) {
      const total = Object.values(cart).reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );

      alert(`Payment successful! Total: NT$${total}`);

      for (let id in cart) delete cart[id];
      renderCart();
      fetchItemList();
      return;
    }

    if (text.includes("company_id is null") || text === "err from sql") {
      alert("Session expired! Please login again.");
      window.location.href = "/views/login/login.html";
      return;
    }

    alert("Payment failed: " + text);
  } catch (err) {
    console.error("Network error:", err);
    alert("Cannot connect to server. Please check if the server is running.");
  }
});

//logout
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
