// GLOBAL STATE
let items = [];
let selectedItemIndex = null;

// POPUP ELEMENTS
const addItemBtn = document.getElementById("addItemBtn");
const popup = document.getElementById("addItemPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const discardBtn = document.getElementById("discardBtn");
const popupSaveBtn = document.getElementById("popupSaveButton");

const popupImageUpload = document.getElementById("popupImageUpload");
const imagePreviewBtn = document.getElementById("imagePreviewBtn");
const popupFileName = document.getElementById("popupFileName");

const popupNameInput = document.getElementById("popupItemName");
const popupPriceInput = document.getElementById("popupItemPrice");
const popupStockInput = document.getElementById("popupStockInput");

// EDIT PANEL ELEMENTS
const editNameInput = document.getElementById("itemName");
const editPriceInput = document.getElementById("itemPrice");
const editStockInput = document.getElementById("stockInput");
const editImageUpload = document.getElementById("imageUpload");
const editFileName = document.getElementById("fileName");
const removeImageBtn = document.getElementById("removeImage");
const minusStockBtn = document.getElementById("minusStock");
const plusStockBtn = document.getElementById("plusStock");

const saveButton = document.getElementById("saveButton");
const deleteButton = document.getElementById("deleteButton");

const grid = document.getElementById("itemGrid");
const searchInput = document.getElementById("searchInput");

const logoutBtn = document.getElementById("logoutBtn");

// CHECK IF USER IS LOGGED IN
async function checkLoginStatus() {
  try {
    const res = await fetch("http://localhost:3000/db/admin/WhoAmI", {
      credentials: "include",
    });

    if (res.status !== 200) {
      alert("You are not logged in! Redirecting to login page...");
      window.location.href = "/views/login/login.html";
      return false;
    }

    const companyName = await res.text();
    console.log("Logged in as:", companyName);
    return true;
  } catch (error) {
    console.error("Login check failed:", error);
    alert(
      "Cannot connect to server. Please make sure the server is running on port 3000."
    );
    return false;
  }
}

// FETCH ITEMS FROM DATABASE
async function fetchItemList() {
  try {
    const res = await fetch(
      "http://localhost:3000/db/stock_page/fetch_item_list",
      {
        method: "GET",
        credentials: "include",
      }
    );

    console.log("Fetch status:", res.status);

    if (res.status === 200) {
      const data = await res.json();
      console.log("Fetched items from database:", data);

      // Filter out items that have an expiry date (deleted items)
      const activeItems = data.filter(item => item.expiry === null);

      items = activeItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        stock: item.currentStock || 0,
        imageUrl: item.image
          ? `data:image;base64,${item.image}`
          : "/src/assets/placeholder.jpg",
      }));

      renderItems();

      // Auto-select first item
      if (items.length > 0) {
        selectItem(0);
      }
    } else {
      const errorText = await res.text();
      console.error("Failed to fetch items:", errorText);

      if (errorText.includes("company_id is null")) {
        alert("Session expired! Please login again.");
        window.location.href = "/views/login/login.html";
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Cannot connect to database server.");
  }
}

// ADD NEW ITEM TO DATABASE
async function addItemToAPI(formData) {
  try {
    console.log("Sending item to database...");

    const res = await fetch("http://localhost:3000/db/stock_page/new_item", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    console.log("Response status:", res.status);

    if (res.status === 200) {
      const result = await res.text();
      console.log("Item added to database successfully! Item ID:", result);
      return true;
    } else {
      const errorText = await res.text();
      console.error("Database error:", errorText);

      if (
        errorText.includes("company_id is null") ||
        errorText === "err from sql"
      ) {
        alert("Session expired! Please login again.");
        window.location.href = "/views/login/login.html";
      } else {
        alert("Failed to add item to database: " + errorText);
      }
      return false;
    }
  } catch (error) {
    console.error("Network error:", error);
    alert(
      "Cannot connect to server. Please check if the server is running on port 3000."
    );
    return false;
  }
}

// UPDATE ITEM IN DATABASE
async function updateItemInAPI(formData) {
  try {
    console.log("Updating item in database...");

    const res = await fetch("http://localhost:3000/db/stock_page/update_item", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 200) {
      const result = await res.text();
      console.log("Item updated in database successfully! Item ID:", result);
      return true;
    } else {
      const errorText = await res.text();
      console.error("Failed to update item:", errorText);

      if (errorText.includes("company_id is null")) {
        alert("Session expired! Please login again.");
        window.location.href = "/views/login/login.html";
      } else {
        alert("Failed to update item: " + errorText);
      }
      return false;
    }
  } catch (error) {
    console.error("Update error:", error);
    alert("Cannot connect to server.");
    return false;
  }
}

// DELETE ITEM FROM DATABASE
async function deleteItemFromAPI(itemId) {
  try {
    console.log('Deleting item from database...');
    
    // Backend expects item_id_array as JSON string: "[1,2,3]"
    const formData = new FormData();
    formData.append("item_id_array", JSON.stringify([itemId]));

    const res = await fetch("http://localhost:3000/db/stock_page/delete_item", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 200) {
      const result = await res.text();
      console.log("Item deleted successfully! Rows affected:", result);
      return true;
    } else {
      const errorText = await res.text();
      console.error("Failed to delete item:", errorText);
      
      if (errorText.includes('company_id is null')) {
        alert('Session expired! Please login again.');
        window.location.replace('../login/login.html');
      } else {
        alert('Failed to delete item: ' + errorText);
      }
      return false;
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert('Cannot connect to server.');
    return false;
  }
}

// OPEN POPUP
addItemBtn.addEventListener("click", () => {
  clearPopupInputs();
  popup.classList.remove("hidden");
  popup.classList.add("flex");
});

// CLOSE POPUP
function closePopup() {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
}

closePopupBtn.addEventListener("click", closePopup);
discardBtn.addEventListener("click", closePopup);

// POPUP IMAGE PREVIEW
popupImageUpload.addEventListener("change", () => {
  if (popupImageUpload.files.length > 0) {
    const file = popupImageUpload.files[0];
    const imgURL = URL.createObjectURL(file);

    imagePreviewBtn.innerHTML = `
      <img src="${imgURL}" class="w-full h-full object-cover rounded-xl" />
    `;

    popupFileName.textContent = file.name;
  }
});

// ADD NEW ITEM TO DATABASE
popupSaveBtn.addEventListener("click", async () => {
  // Validation
  if (!popupNameInput.value.trim()) {
    alert("Please enter item name");
    popupNameInput.focus();
    return;
  }

  if (!popupPriceInput.value || popupPriceInput.value <= 0) {
    alert("Please enter a valid price");
    popupPriceInput.focus();
    return;
  }

  if (!popupStockInput.value || popupStockInput.value < 0) {
    alert("Please enter a valid stock amount");
    popupStockInput.focus();
    return;
  }

  if (!popupImageUpload.files[0]) {
    alert("Please upload an image");
    return;
  }

  // Create FormData for database
  const formData = new FormData();
  formData.append("name", popupNameInput.value.trim());
  formData.append("type", "Food"); // Required by database
  formData.append("stock", parseInt(popupStockInput.value) || 0);
  formData.append("price", parseInt(popupPriceInput.value));
  formData.append("icon", popupImageUpload.files[0]);

  // Log what we're sending to database
  console.log("Sending to database:");
  console.log("  - Name:", popupNameInput.value.trim());
  console.log("  - Type:", "Food");
  console.log("  - Stock:", parseInt(popupStockInput.value));
  console.log("  - Price:", parseInt(popupPriceInput.value));
  console.log("  - Image:", popupImageUpload.files[0].name);

  // Send to database via backend API
  const success = await addItemToAPI(formData);

  if (success) {
    // Refresh from database
    await fetchItemList();
    alert("Item added successfully to database!");
    clearPopupInputs();
    closePopup();
  }
});

// EDIT PANEL IMAGE UPLOAD
editImageUpload.addEventListener("change", () => {
  if (editImageUpload.files.length > 0) {
    const file = editImageUpload.files[0];
    editFileName.textContent = file.name;
    editFileName.classList.remove("hidden");
    removeImageBtn.classList.remove("hidden");
  }
});

removeImageBtn.addEventListener("click", () => {
  editImageUpload.value = "";
  editFileName.textContent = "";
  editFileName.classList.add("hidden");
  removeImageBtn.classList.add("hidden");
});

// STOCK BUTTONS
minusStockBtn.addEventListener("click", () => {
  const currentValue = parseInt(editStockInput.value) || 0;
  if (currentValue > 0) {
    editStockInput.value = currentValue - 1;
  }
});

plusStockBtn.addEventListener("click", () => {
  const currentValue = parseInt(editStockInput.value) || 0;
  editStockInput.value = currentValue + 1;
});

// ADD NEW ITEM
popupSaveBtn.addEventListener("click", () => {
  if (
    !popupNameInput.value ||
    !popupPriceInput.value ||
    !popupImageUpload.files[0]
  ) {
    alert("Please fill all fields and upload an image");
    return;
  }

  const newItem = {
    name: popupNameInput.value,
    price: parseInt(popupPriceInput.value),
    stock: parseInt(popupStockInput.value) || 1,
    imageUrl: URL.createObjectURL(popupImageUpload.files[0]),
  };

  items.push(newItem);
  renderItems();

  // Auto-select the newly added item
  selectItem(items.length - 1);

  clearPopupInputs();
  closePopup();
});

// RENDER ITEMS IN GRID
function renderItems() {
  grid.innerHTML = "";

  items.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className =
      "rounded-md text-center cursor-pointer hover:bg-gray-100 p-2 transition";
    itemDiv.dataset.index = index;

    itemDiv.innerHTML = `
      <img src="${item.imageUrl}" class="aspect-square object-cover rounded-md" />
      <p class="font-bold mt-1 text-xs md:text-sm lg:text-base">${item.name}</p>
      <p class="text-[#27ae60] font-bold text-xs md:text-sm lg:text-base">NT${item.price}</p>
      <p class="text-gray-600 text-xs">Stock: ${item.stock}</p>
    `;

    itemDiv.addEventListener("click", () => selectItem(index));

    // Highlight if selected with green border
    if (index === selectedItemIndex) {
      itemDiv.classList.add("border-4", "border-[#27DD8E]");
    }

    grid.appendChild(itemDiv);
  });
}

// SELECT ITEM FOR EDITING
function selectItem(index) {
  selectedItemIndex = index;
  const item = items[index];

  editNameInput.value = item.name;
  editPriceInput.value = item.price;
  editStockInput.value = item.stock;

  // Clear file input display
  editImageUpload.value = "";
  editFileName.textContent = "";
  editFileName.classList.add("hidden");
  removeImageBtn.classList.add("hidden");

  renderItems();
}

// SAVE EDITED ITEM TO DATABASE
saveButton.addEventListener("click", async () => {
  if (selectedItemIndex === null) {
    alert("No item selected");
    return;
  }

  if (!editNameInput.value || !editPriceInput.value) {
    alert("Please fill all fields");
    return;
  }

  const item = items[selectedItemIndex];

  // Create FormData for database update
  const formData = new FormData();
  formData.append("item_id", item.id);

  if (editNameInput.value !== item.name) {
    formData.append("name", editNameInput.value);
  }

  if (item.type) {
    formData.append("type", item.type);
  }

  if (editImageUpload.files.length > 0) {
    items[selectedItemIndex].imageUrl = URL.createObjectURL(
      editImageUpload.files[0]
    );
  }

  formData.append("stock", parseInt(editStockInput.value) || 0);
  formData.append("price", parseInt(editPriceInput.value));

  console.log("Updating item in database...");

  // Send update to database via backend API
  const success = await updateItemInAPI(formData);

  if (success) {
    // Refresh from database
    await fetchItemList();

    // Reselect the item
    if (items.length > selectedItemIndex) {
      selectItem(selectedItemIndex);
    } else {
      // Clear edit panel
      editNameInput.value = "";
      editPriceInput.value = "";
      editStockInput.value = "1";
    }

    alert("Item updated successfully in database!");
  }
});

// DELETE BUTTON - DELETE SELECTED ITEM
deleteButton.addEventListener("click", async () => {
  if (selectedItemIndex === null) {
    alert("No item selected");
    return;
  }

  const item = items[selectedItemIndex];
  
  // Confirm deletion
  const confirmDelete = confirm(
    `Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`
  );

  if (!confirmDelete) {
    return;
  }

  console.log("Deleting item ID:", item.id);

  // Send delete request to database
  const success = await deleteItemFromAPI(item.id);

  if (success) {
    // Refresh from database (deleted items won't appear)
    await fetchItemList();

    // Clear the edit panel
    selectedItemIndex = null;
    editNameInput.value = "";
    editPriceInput.value = "";
    editStockInput.value = "1";

    alert("Item deleted successfully!");
  }
});

// SEARCH FUNCTION
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const itemDivs = grid.children;

  Array.from(itemDivs).forEach((itemDiv) => {
    const name = itemDiv.querySelector("p").textContent.toLowerCase();

    if (name.includes(keyword)) {
      itemDiv.style.display = "";
    } else {
      itemDiv.style.display = "none";
    }
  });
});

// CLEAR POPUP INPUTS
function clearPopupInputs() {
  popupNameInput.value = "";
  popupPriceInput.value = "";
  popupStockInput.value = "1";
  popupImageUpload.value = "";
  popupFileName.textContent = "";

  imagePreviewBtn.innerHTML = `
    <span id="popupImagePlaceholder" class="flex flex-col items-center gap-2">
      <span class="text-3xl">＋</span>
      Add Image
    </span>
  `;
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

// INITIALIZE - CHECK LOGIN AND LOAD DATA FROM DATABASE
window.addEventListener("load", async () => {
  console.log("Initializing application...");

  // Check if user is logged in first
  const isLoggedIn = await checkLoginStatus();

  if (!isLoggedIn) {
    console.log("Not logged in, stopping initialization");
    return;
  }

  console.log("User is logged in");

  // Prevent back button after logout
  window.history.pushState(null, "", window.location.href);
  window.onpopstate = function () {
    window.history.pushState(null, "", window.location.href);
  };

  // Set active category
  const stockCategory = document.querySelector('[data-icon="stock"]');
  if (stockCategory) {
    selectCategory(stockCategory);
  }

  // Load items from database
  console.log("Loading items from database...");
  await fetchItemList();
  console.log("Application ready!");
});
