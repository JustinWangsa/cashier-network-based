//add cart function//
const cart = {}

function addToCart(name, price, image) {
  if (cart[name]) {
    cart[name].qty++
  } else {
    cart[name] = { price, qty: 1, image }
  }
  renderCart()
}

function addToCartFromItem(itemEl) {
  const name = itemEl.dataset.name
  const price = Number(itemEl.dataset.price)
  const image = itemEl.dataset.image

  addToCart(name, price, image)
}

function changeQty(name, delta) {
  cart[name].qty += delta

  if (cart[name].qty <= 0) {
    delete cart[name]
  }
  renderCart()
}

function removeItem(name) {
  delete cart[name]
  renderCart()
}

function renderCart() {
  const cartItems = document.getElementById('cartItems')
  const totalPriceEl = document.getElementById('totalPrice')
  
  cartItems.innerHTML = ''
  let total = 0


  Object.entries(cart).forEach(([name, item]) => {

    total += item.price * item.qty

    cartItems.innerHTML += `
      <div class="flex items-center justify-between px-4 py-3 font-bold text-[#4B4B4B] text-[4px]">

        <div class="flex items-center gap-3 flex-1">
          <img
            src="/src/assets/Vector.svg"
            class="w-5 h-5 cursor-pointer"
            onclick="removeItem('${name}')"
            title="Remove item"
          />
          <p class="text-base font-semibold">${name}</p>
        </div>

        <div class="flex items-center gap-3 flex-1 justify-center">
          <button onclick="changeQty('${name}', -1)">
            <img src="/src/assets/Subtract.svg" class="w-8 h-9" />
          </button>
          <span class="text-base font-semibold">${item.qty}</span>
          <button onclick="changeQty('${name}', 1)">
            <img src="/src/assets/Add.svg" class="w-10 h-8" />
          </button>
        </div>

        <p class="text-right w-24 text-base font-semibold">
          NT$${item.price * item.qty}
        </p>
      </div>
    `
  })
  
  totalPriceEl.textContent = `NT$${total}`
}

//search function//
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput')

  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase()
    const items = document.querySelectorAll('#itemGrid > div')

    items.forEach(item => {
      const name = item.dataset.name.toLowerCase()
      item.style.display = name.includes(keyword) ? '' : 'none'
    })
  })
})

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

//always start on all//
window.addEventListener('load', async () => {
   
    let formbody = new FormData();
    formbody.append("name","google_cs");  
    formbody.append("password","google_cs");  
    let result = await (await fetch('http://localhost:3000/db/login_page/log_in',{
        method:"POST",
        body:formbody
    })).text()

    console.log(result);
   
  



    fetchItemList()
  const allCategory = document.querySelector(
    '.category-btn[data-icon="All"]'
  )

  if (allCategory) {
    selectCategory(allCategory)
  }
})



async function fetchItemList() {
  await fetch('http://localhost:3000/db/stock_page/fetch_item_list')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch items')
      return res.json()
    })
    .then(items => {
      const grid = document.getElementById('itemGrid')
      grid.innerHTML = ''

      items.forEach(item => {
        const div = document.createElement('div')
        div.className = 'rounded-md text-center cursor-pointer'

        div.dataset.name = item.name
        div.dataset.price = item.price
        div.dataset.image = item.image

        div.addEventListener('click', () => addToCartFromItem(div))

        div.innerHTML = `
          <img src="${item.image}" class="object-cover aspect-square rounded-md" />
          <p class="font-bold mt-1 text-xs md:text-sm lg:text-base">
            ${item.name}
          </p>
          <p class="text-[#27ae60] font-bold text-xs md:text-sm lg:text-base">
            NT$${item.price}
          </p>
        `

        grid.appendChild(div)
      })
    })
    .catch(err => console.error('Fetch error:', err))
}

        

