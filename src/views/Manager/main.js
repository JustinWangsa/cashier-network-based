// IMAGE UPLOAD
const input = document.getElementById("imageUpload");
const fileName = document.getElementById("fileName");
const removeBtn = document.getElementById("removeImage");
const fakeUpload = document.getElementById("fakeUpload");

input.addEventListener("change", () => {
  if (input.files.length > 0) {
    fileName.textContent = input.files[0].name;
    fileName.classList.remove("hidden");

    removeBtn.classList.remove("hidden");

    fakeUpload.textContent = "Image selected";
    fakeUpload.classList.remove("text-gray-500");
    fakeUpload.classList.add("text-green-600");
  }
});

removeBtn.addEventListener("click", () => {
  input.value = "";

  fileName.textContent = "";
  fileName.classList.add("hidden");

  removeBtn.classList.add("hidden");

  fakeUpload.textContent = "Upload Image";
  fakeUpload.classList.add("text-gray-500");
  fakeUpload.classList.remove("text-green-600");
});

// STOCK CONTROLS
const minusBtn = document.getElementById("minusStock");
const plusBtn = document.getElementById("plusStock");
const stockInput = document.getElementById("stockInput");

plusBtn.addEventListener("click", () => {
  stockInput.value = Number(stockInput.value) + 1;
});

minusBtn.addEventListener("click", () => {
  if (Number(stockInput.value) > 1) {
    stockInput.value = Number(stockInput.value) - 1;
  }
});

// SAVE BUTTON
const saveBtn = document.getElementById("saveButton");
const grid = document.getElementById("itemGrid");

const nameInput = document.getElementById("itemName");
const priceInput = document.getElementById("itemPrice");

saveBtn.addEventListener("click", () => {
  if (stockInput.value <= 0) {
    alert("Out of stock");
    return;
  }

  if (!nameInput.value || !priceInput.value || !input.files[0]) {
    alert("Please fill all fields");
    return;
  }

  const imgURL = URL.createObjectURL(input.files[0]);

  const item = document.createElement("div");
  item.className = "rounded-md text-center";

  item.innerHTML = `
    <img src="${imgURL}" class="aspect-square object-cover rounded-md" />
    <p class="font-bold mt-1">${nameInput.value}</p>
    <p class="text-green-600 font-bold">NT$${priceInput.value}</p>
  `;

  grid.appendChild(item);

  stockInput.value = Number(stockInput.value) - 1;
});

//search function//
document.addEventListener('DOMContentLoaded', () => {
const searchInput = document.getElementById('searchInput')
const items = document.querySelectorAll(
  '.grid > div'
)

searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.toLowerCase()

  items.forEach(item => {
    const name = item
      .querySelector('p')
      .textContent
      .toLowerCase()

    if (name.includes(keyword)) {
      item.style.display = ''
    } else {
      item.style.display = 'none'
    }
  })
})
})

//category selection function/
function selectCategory(activeBtn) {
  const buttons = document.querySelectorAll('.category-btn')

  buttons.forEach(btn => {
    btn.classList.remove('border-[#27DD8E]')
    btn.classList.add('border-[#C0C0C0]')

    const text = btn.querySelector('.category-text')
    text.classList.remove('text-[#105E3C]')
    text.classList.add('text-[#C0C0C0]')

    const iconName = btn.dataset.icon
    btn.querySelector('.category-icon').src =
      `/src/assets/${iconName}.svg`
  })

  activeBtn.classList.remove('border-[#C0C0C0]')
  activeBtn.classList.add('border-[#27DD8E]')

  const activeText = activeBtn.querySelector('.category-text')
  activeText.classList.remove('text-[#C0C0C0]')
  activeText.classList.add('text-[#105E3C]')

  const activeIcon = activeBtn.dataset.icon
  activeBtn.querySelector('.category-icon').src =
    `/src/assets/${activeIcon}-active.svg`
}

//always start on stock
window.addEventListener('load', () => {
  const stockCategory = document.querySelector(
    '.category-btn[data-icon="Stock"]'
  )

  if (stockCategory) {
    selectCategory(stockCategory)
  }
})