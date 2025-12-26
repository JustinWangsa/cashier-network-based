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

// SAVE EDITED ITEM
saveButton.addEventListener("click", () => {
  if (selectedItemIndex === null) {
    alert("No item selected");
    return;
  }

  if (!editNameInput.value || !editPriceInput.value) {
    alert("Please fill all fields");
    return;
  }

  items[selectedItemIndex].name = editNameInput.value;
  items[selectedItemIndex].price = parseInt(editPriceInput.value);
  items[selectedItemIndex].stock = parseInt(editStockInput.value) || 0;

  // Update image if new one uploaded
  if (editImageUpload.files.length > 0) {
    items[selectedItemIndex].imageUrl = URL.createObjectURL(
      editImageUpload.files[0]
    );
  }

  renderItems();
  alert("Item updated successfully!");
});

// DELETE ITEM
deleteButton.addEventListener("click", () => {
  if (selectedItemIndex === null) {
    alert("No item selected");
    return;
  }

  if (confirm("Are you sure you want to delete this item?")) {
    items.splice(selectedItemIndex, 1);

    if (items.length > 0) {
      selectedItemIndex = 0;
    } else {
      selectedItemIndex = null;
    }

    renderItems();

    if (selectedItemIndex !== null) {
      selectItem(selectedItemIndex);
    } else {
      // Clear edit panel
      editNameInput.value = "";
      editPriceInput.value = "";
      editStockInput.value = "1";
    }
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

// INITIALIZE - Start on stock category
window.addEventListener("load", () => {
  const stockCategory = document.querySelector('[data-icon="stock"]');
  if (stockCategory) {
    selectCategory(stockCategory);
  }

  // Add some sample items for testing
  items = [
    {
      name: "Bertrand Onlyfans",
      price: 1000,
      stock: 10,
      imageUrl:
        "/src/assets/windows-11-stock-black-abstract-black-background-amoled-3840x2400-8971.jpg",
    },
    {
      name: "Test Item",
      price: 1500,
      stock: 5,
      imageUrl:
        "/src/assets/windows-11-stock-black-abstract-black-background-amoled-3840x2400-8971.jpg",
    },
  ];

  renderItems();

  // Auto-select first item
  if (items.length > 0) {
    selectItem(0);
  }
});
