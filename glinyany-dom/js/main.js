const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let heroProducts = [];
let currentHeroIndex = 0;

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

function startHeroSlider() {
  const heroImage = document.getElementById('hero-image');
  if (!heroImage || heroProducts.length === 0) return;

  heroImage.src = heroProducts[0].image_url || heroProducts[0].image || 'img/default.jpg';

  if (heroProducts.length < 2) return;

  setInterval(() => {
    heroImage.style.opacity = '0.35';

    setTimeout(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroProducts.length;
      heroImage.src = heroProducts[currentHeroIndex].image_url || heroProducts[currentHeroIndex].image || 'img/default.jpg';
      heroImage.style.opacity = '1';
    }, 250);
  }, 3000);
}

async function loadCategories() {
  const { data: categories } = await supabaseClient
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  // Загружаем товары (только image_url) с обработкой ошибок
  let products = [];
  try {
    const response = await supabaseClient
      .from('product')
      .select('id, category_id, image_url')   // <-- убрал image
      .order('id', { ascending: true });
    products = response.data || [];
  } catch (e) {
    console.warn('Не удалось загрузить товары для фото категорий:', e);
    // категории отобразятся без фото товаров, но с default.jpg
  }

  const container = document.getElementById('categories');
  if (!container || !categories) return;

  container.innerHTML = '';

  categories.forEach(category => {
    const count = products.filter(p => p.category_id === category.id).length;

    let imageSrc = category.image_url;

    // если у категории нет своего фото, ищем первый товар с картинкой
    if (!imageSrc && products.length > 0) {
      const firstProduct = products.find(
        p => p.category_id === category.id && p.image_url
      );
      if (firstProduct) {
        imageSrc = firstProduct.image_url;
      }
    }

    // финальная страховка — если ничего не нашли
    if (!imageSrc) {
      imageSrc = 'img/default.jpg';
    }

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    col.innerHTML = `
      <a href="catalog.html?category=${category.id}" class="category-link">
        <div class="category-card">
          <img src="${imageSrc}" alt="${category.name}">
          <h3>${category.name}</h3>
          <div class="category-count">Товаров в категории: ${count}</div>
          <div class="category-arrow">Перейти в категорию →</div>
        </div>
      </a>
    `;

    container.appendChild(col);
  });
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('product')
    .select('*')
    .order('id', { ascending: true })
    .limit(6);

  if (error) {
    console.error(error);
    return;
  }

  heroProducts = data || [];
  startHeroSlider();

  const container = document.getElementById('products');
  if (!container) return;

  container.innerHTML = '';

  (data || []).forEach((p) => {
    const imageSrc = p.image_url || p.image || 'img/default.jpg';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

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

updateCartCount();
loadCategories();
loadProducts();