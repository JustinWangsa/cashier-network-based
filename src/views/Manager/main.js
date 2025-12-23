// ELEMENTS
const addItemBtn = document.getElementById("addItemBtn");
const popup = document.getElementById("addItemPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const discardBtn = document.getElementById("discardBtn");
const saveBtn = document.getElementById("saveButton");

const imageUpload = document.getElementById("imageUpload");
const imagePreviewBtn = document.getElementById("imagePreviewBtn");
const fileName = document.getElementById("fileName");

const nameInput = document.getElementById("itemName");
const priceInput = document.getElementById("itemPrice");
const stockInput = document.getElementById("stockInput");
const grid = document.getElementById("itemGrid");

// OPEN POPUP
addItemBtn.addEventListener("click", () => {
  clearInputs();
  popup.classList.remove("hidden");
});

// CLOSE POPUP
function closePopup() {
  popup.classList.add("hidden");
}

closePopupBtn.addEventListener("click", closePopup);
discardBtn.addEventListener("click", closePopup);

// IMAGE PREVIEW
imageUpload.addEventListener("change", () => {
  if (imageUpload.files.length > 0) {
    const file = imageUpload.files[0];
    const imgURL = URL.createObjectURL(file);

    imagePreviewBtn.innerHTML = `
      <img src="${imgURL}" class="w-full h-full object-cover rounded-xl" />
    `;

    fileName.textContent = file.name;
  }
});

// SAVE ITEM
saveBtn.addEventListener("click", () => {
  if (!nameInput.value || !priceInput.value || !imageUpload.files[0]) {
    alert("Please fill all fields");
    return;
  }

  const imgURL = URL.createObjectURL(imageUpload.files[0]);

  const item = document.createElement("div");
  item.className = "rounded-md text-center bg-white p-2";

  item.innerHTML = `
    <img src="${imgURL}" class="aspect-square object-cover rounded-md" />
    <p class="font-bold mt-1">${nameInput.value}</p>
    <p class="text-green-600 font-bold">NT$${priceInput.value}</p>
  `;

  grid.appendChild(item);

  clearInputs();
  closePopup();
});

// CLEAR FORM
function clearInputs() {
  nameInput.value = "";
  priceInput.value = "";
  stockInput.value = 1;
  imageUpload.value = "";
  fileName.textContent = "";

  imagePreviewBtn.innerHTML = `
    <span id="imagePlaceholder" class="flex flex-col items-center gap-2">
      <span class="text-3xl">＋</span>
      Add Image
    </span>
  `;
}

//search function//
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const grid = document.getElementById("itemGrid");

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();
    const items = grid.children;

    Array.from(items).forEach((item) => {
      const name = item.querySelector("p").textContent.toLowerCase();

      if (name.includes(keyword)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
});

//category selection function/
function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll("[data-icon]");

  buttons.forEach((btn) => {
    const icon = btn.querySelector("img");
    const iconName = btn.dataset.icon;

    // reset all icons to normal
    icon.src = `/src/assets/${iconName}.svg`;
  });

  // set active icon
  const activeIconName = activeBtn.dataset.icon;
  const activeImg = activeBtn.querySelector("img");
  activeImg.src = `/src/assets/${activeIconName}-active.svg`;
}

//always start on stock
window.addEventListener("load", () => {
  const stockCategory = document.querySelector('[data-icon="stock"]');

  if (stockCategory) {
    selectCategory(stockCategory);
  }
});

// Open popup
addItemBtn.addEventListener("click", () => {
  popup.classList.remove("hidden");
  popup.classList.add("flex");
});

// Close popup
function closePopup() {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
}

closePopupBtn.addEventListener("click", closePopup);
discardBtn.addEventListener("click", closePopup);

// Close popup after save
saveBtn.addEventListener("click", () => {
  closePopup();
});
