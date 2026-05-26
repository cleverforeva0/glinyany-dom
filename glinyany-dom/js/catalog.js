const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];
let allCategories = [];
let selectedCategories = new Set();

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cart.length;
}

function showToast(message) {
  let toast = document.getElementById('custom-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.className = 'custom-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="custom-toast-icon">✓</div>
    <div class="custom-toast-content">
      <div class="custom-toast-title">Товар добавлен в корзину</div>
      <div class="custom-toast-text">${message}</div>
    </div>
  `;

  toast.classList.add('show');

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function addToCart(item) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`${item.name} добавлен в корзину`);
}

function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function readCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');

  if (category) {
    selectedCategories.add(Number(category));
  }
}

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = '';

  allCategories.forEach(category => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-check';

    wrapper.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${category.id}" id="cat-${category.id}">
      <label class="form-check-label" for="cat-${category.id}">
        ${category.name}
      </label>
    `;

    const input = wrapper.querySelector('input');
    input.checked = selectedCategories.has(category.id);

    input.addEventListener('change', () => {
      if (input.checked) {
        selectedCategories.add(category.id);
      } else {
        selectedCategories.delete(category.id);
      }
      renderProducts();
    });

    container.appendChild(wrapper);
  });
}

function renderProducts() {
  const container = document.getElementById('catalog-products');
  container.innerHTML = '';

  let productsToShow = allProducts;

  if (selectedCategories.size > 0) {
    productsToShow = allProducts.filter(product =>
      selectedCategories.has(Number(product.category_id))
    );
  }

  if (productsToShow.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="about-note text-center">
          <h2 class="mb-3">Товаров в выбранной категории пока нет</h2>
          <p class="mb-0">Попробуйте выбрать другую категорию.</p>
        </div>
      </div>
    `;
    return;
  }

  productsToShow.forEach((p) => {
    const imageSrc = p.image || p.image_url || 'img/default.jpg';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-xl-4';

    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <img src="${imageSrc}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <p class="product-price">${p.price} сом</p>
      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn-add btn">В корзину</button>
        <button class="btn-more btn">Подробнее</button>
      </div>
    `;

    card.querySelector('.btn-add').addEventListener('click', () => {
      addToCart({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        image: imageSrc
      });
    });

    card.querySelector('.btn-more').addEventListener('click', () => {
      openProduct(p.id);
    });

    col.appendChild(card);
    container.appendChild(col);
  });
}

async function loadData() {
  const { data: categories, error: categoriesError } = await supabaseClient
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  const { data: products, error: productsError } = await supabaseClient
    .from('product')
    .select('*')
    .order('id', { ascending: true });

  if (categoriesError) {
    console.error('Ошибка загрузки категорий:', categoriesError);
    return;
  }

  if (productsError) {
    console.error('Ошибка загрузки товаров:', productsError);
    return;
  }

  allCategories = categories || [];
  allProducts = products || [];

  readCategoryFromUrl();
  renderCategoryFilters();
  renderProducts();
  updateCartCount();
}

loadData();