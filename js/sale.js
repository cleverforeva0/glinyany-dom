const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

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
  showToast(item.name);
}

function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

async function loadSaleProducts() {
  const { data, error } = await supabaseClient
    .from('product')
    .select('*')
    .eq('is_sale', true)
    .order('id', { ascending: true });

  const container = document.getElementById('sale-products');
  if (!container) return;

  container.innerHTML = '';

  if (error) {
    console.error('Ошибка загрузки акционных товаров:', error);
    container.innerHTML = `
      <div class="col-12">
        <div class="about-note text-center">
          <h2 class="mb-3">Ошибка загрузки</h2>
          <p class="mb-0">Не удалось получить товары со скидкой.</p>
        </div>
      </div>
    `;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="about-note text-center">
          <h2 class="mb-3">Сейчас акционных товаров нет</h2>
          <p class="mb-4">
            Этот раздел обновляется не постоянно. Позже здесь появятся изделия
            по специальной цене.
          </p>
          <a href="catalog.html" class="btn custom-btn-dark">Открыть каталог</a>
        </div>
      </div>
    `;
    updateCartCount();
    return;
  }

  data.forEach((p) => {
    const imageSrc = p.image || p.image_url || 'img/default.jpg';

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <div class="mb-2">
        <span class="badge rounded-pill text-bg-dark px-3 py-2">Акция</span>
      </div>
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

  updateCartCount();
}

loadSaleProducts();