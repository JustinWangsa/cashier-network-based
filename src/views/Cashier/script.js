//add cart function//
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
  addToCart(
    itemEl.dataset.id,
    itemEl.dataset.name,
    Number(itemEl.dataset.price),
    itemEl.dataset.image
  );
}

function changeQty(id, delta) {
  if (!cart[id]) return;

  const nextQty = cart[id].qty + delta;

  if (nextQty < 1) return;

  cart[id].qty = nextQty;
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const totalPriceEl = document.getElementById("totalPrice");

  cartItems.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([id, item]) => {
    total += item.price * item.qty;

    cartItems.innerHTML += `
      <div class="flex items-center justify-between px-4 py-3 font-bold text-[#4B4B4B] text-[4px]">

        <div class="flex items-center gap-3 flex-1">
          <img
            src="/src/assets/Vector.svg"
            class="w-5 h-5 cursor-pointer"
            onclick="removeItem('${id}')"
            title="Remove item"
          />
          <p class="text-base font-semibold">${item.name}</p>
        </div>

        <div class="flex items-center gap-3 flex-1 justify-center">
          <button onclick="changeQty('${id}', -1)">
            <img src="/src/assets/Subtract.svg" class="w-8 h-9" />
          </button>
          <span class="text-base font-semibold">${item.qty}</span>
          <button onclick="changeQty('${id}', 1)">
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

//search function//
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const items = document.querySelectorAll("#itemGrid > div");

  items.forEach((item) => {
    const name = item.querySelector("p").textContent.toLowerCase();
    item.style.display = name.includes(keyword) ? "" : "none";
  });
});

//category selection function/
function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll(".category-btn");

  buttons.forEach((btn) => {
    btn.classList.remove("border-[#27DD8E]");
    btn.classList.add("border-[#C0C0C0]");

    const text = btn.querySelector(".category-text");
    text.classList.remove("text-[#105E3C]");
    text.classList.add("text-[#C0C0C0]");

    const iconName = btn.dataset.icon;
    btn.querySelector(".category-icon").src = `/src/assets/${iconName}.svg`;
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
}

async function fetchItemList() {
  try {
    const res = await fetch(
      "http://localhost:3000/db/stock_page/fetch_item_list",
      {
        method: "GET",
        credentials: "include",
      }
    );

    console.log(res.status);

    if (res.status === 200) {
      const data = await res.json();
      console.log(data);


      const grid = document.getElementById("itemGrid");
      grid.innerHTML = "";


      data.forEach((item) => {
        const div = document.createElement("div");
        div.className = "rounded-md text-center cursor-pointer";

        div.dataset.id = item.id;
        div.dataset.name = item.name;
        div.dataset.price = item.price;
        div.dataset.image = item.image || "/src/assets/placeholder.jpg";
        div.addEventListener("click", () => addToCartFromItem(div));

        div.innerHTML = `
          <img src="${item.image || "/src/assets/placeholder.jpg"}" 
               class="object-cover aspect-square rounded-md" 
               alt0"${item.name}" />
          <p class="font-bold mt-1 text-xs md:text-sm lg:text-base">
            ${item.name}
          </p>
          <p class="text-[#27ae60] font-bold text-xs md:text-sm lg:text-base">
            NT$${item.price}
          </p>
        `;

        grid.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

window.addEventListener("load", () => {
  const allCategory = document.querySelector('.category-btn[data-icon="All"]');

  fetchItemList();

  if (allCategory) {
    selectCategory(allCategory);
  }
});

async function submitPayment() {
  if (Object.keys(cart).length === 0) {
    alert("Cart is empty");
    return;
  }

  // Build data object
  const data = {};
  Object.values(cart).forEach(item => {
    data[item.id] = item.qty;
  });

  try {
    const res = await fetch(
      "http://localhost:3000/db/transaction_page/new_transaction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // send cookies for session
        body: JSON.stringify({ data }) // send as plain object
      }
    );

    // Log response text if failed
    if (!res.ok) {
      const text = await res.text();
      console.error("Transaction failed:", text);
      throw new Error("Transaction failed");
    }

    // Parse JSON response
    const result = await res.json();
    console.log("Transaction saved:", result);

    // Clear cart
    Object.keys(cart).forEach(key => delete cart[key]);
    renderCart();

    alert("Payment successful");
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
}