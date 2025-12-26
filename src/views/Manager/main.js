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

const grid = document.getElementById("itemGrid");
const searchInput = document.getElementById("searchInput");

// FETCH
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
      console.log("Fetched items:", data);

      items = data.map((item) => ({
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
      console.error("Failed to fetch items");
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// ADD NEW ITEM TO API
async function addItemToAPI(formData) {
  try {
    const res = await fetch("http://localhost:3000/db/stock_page/new_item", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 200) {
      const result = await res.json();
      console.log("Item added successfully:", result);
      return true;
    } else {
      const errorText = await res.text();
      console.error("Failed to add item:", errorText);
      return false;
    }
  } catch (error) {
    console.error("Add item error:", error);
    return false;
  }
}

// UPDATE ITEM
async function updateItemInAPI(formData) {
  try {
    const res = await fetch("http://localhost:3000/db/stock_page/update_item", {
      method: "POST",
      credentials: "include",
      body: formData, // FormData handles multipart/form-data automatically
    });

    if (res.status === 200) {
      const result = await res.json();
      console.log("Item updated successfully:", result);
      return true;
    } else {
      const errorText = await res.text();
      console.error("Failed to update item:", errorText);
      return false;
    }
  } catch (error) {
    console.error("Update item error:", error);
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

// ADD NEW ITEM
popupSaveBtn.addEventListener("click", async () => {
  if (
    !popupNameInput.value ||
    !popupPriceInput.value ||
    !popupImageUpload.files[0]
  ) {
    alert("Please fill all fields and upload an image");
    return;
  }

  // Create FormData
  const formData = new FormData();
  formData.append("name", popupNameInput.value);
  formData.append("type", "Food"); // Default type, you can add a dropdown for this
  formData.append("stock", parseInt(popupStockInput.value) || 1);
  formData.append("price", parseInt(popupPriceInput.value));
  formData.append("icon", popupImageUpload.files[0]); // The actual file

  const success = await addItemToAPI(formData);

  if (success) {
    // Refresh the item list from server
    await fetchItemList();
    alert("Item added successfully!");
    clearPopupInputs();
    closePopup();
  } else {
    alert("Failed to add item. Please try again.");
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

// RENDER ITEMS IN GRID
function renderItems() {
  grid.innerHTML = "";

  items.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className =
      "rounded-md text-center cursor-pointer hover:bg-gray-100 p-2 transition";
    itemDiv.dataset.index = index;

    itemDiv.innerHTML = `
      <img src="${item.imageUrl}" class="aspect-square object-cover rounded-md" alt="${item.name}" />
      <p class="font-bold mt-1 text-xs md:text-sm lg:text-base">${item.name}</p>
      <p class="text-[#27ae60] font-bold text-xs md:text-sm lg:text-base">NT$${item.price}</p>
      <p class="text-gray-600 text-xs">Stock: ${item.stock}</p>
    `;

    itemDiv.addEventListener("click", () => selectItem(index));

    // selected = green border
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

// SAVE EDITED ITEM
saveButton.addEventListener("click", async () => {
  if (selectedItemIndex === null) {
    alert("No item selected");
    return;
  }

  if (!editNameInput.value || !editPriceInput.value) {
    alert("Please fill all required fields");
    return;
  }

  const item = items[selectedItemIndex];

  const formData = new FormData();
  formData.append("item_id", item.id);
  if (editNameInput.value !== item.name) {
    formData.append("name", editNameInput.value);
  }
  if (item.type) {
    formData.append("type", item.type);
  }
  if (editImageUpload.files.length > 0) {
    formData.append("icon", editImageUpload.files[0]);
  }

  formData.append("stock", parseInt(editStockInput.value) || 0);
  formData.append("price", parseInt(editPriceInput.value));

  const success = await updateItemInAPI(formData);

  if (success) {
    // Refresh the item 
    await fetchItemList();

    // Reselect the item at the same position
    if (items.length > selectedItemIndex) {
      selectItem(selectedItemIndex);
    }

    alert("Item updated successfully!");
  } else {
    alert("Failed to update item. Please try again.");
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

window.addEventListener("load", async () => {
  const stockCategory = document.querySelector('[data-icon="stock"]');
  if (stockCategory) {
    selectCategory(stockCategory);
  }
  await fetchItemList();
});
