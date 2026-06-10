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
    toast.id = 'custom-toast'; toast.className = 'custom-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<div class="custom-toast-icon">✓</div><div class="custom-toast-content"><div class="custom-toast-title">Товар добавлен в корзину</div><div class="custom-toast-text">${message}</div></div>`;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function addToCart(item) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(item.name);
}

function openProduct(id) { window.location.href = `product.html?id=${id}`; }

// Таймер до указанной даты
let saleEndDate = null;

async function loadSaleEndDate() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('sale_end_time')
    .eq('id', 1)
    .single();

  if (error || !data || !data.sale_end_time) {
    saleEndDate = null;
    document.getElementById('sale-timer').textContent = 'Распродажа не активна';
    return;
  }
  saleEndDate = new Date(data.sale_end_time);
  updateTimer();
  setInterval(updateTimer, 60000);
}

function updateTimer() {
  const timerEl = document.getElementById('sale-timer');
  if (!timerEl || !saleEndDate) return;

  const now = new Date().getTime();
  const distance = saleEndDate.getTime() - now;

  if (distance < 0) {
    timerEl.textContent = 'Акция завершена';
    // Автоматически снимаем все товары с распродажи (один раз)
    endSale();
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  timerEl.textContent = `${days}д ${hours}ч ${mins}м`;
}

async function endSale() {
  // Снимаем все товары с распродажи
  await supabaseClient.from('product').update({ is_sale: false, sale_price: null }).neq('id', 0);
  // Очищаем дату в settings
  await supabaseClient.from('settings').update({ sale_end_time: null }).eq('id', 1);
  saleEndDate = null;
  // Перезагружаем страницу, чтобы отобразился пустой список
  location.reload();
}

async function loadSaleProducts() {
  // Проверяем, не истекла ли уже распродажа
  if (saleEndDate && new Date() > saleEndDate) {
    await endSale();
    return;
  }

  const { data, error } = await supabaseClient
    .from('product')
    .select('*')
    .eq('is_sale', true)
    .order('id', { ascending: true });

  const container = document.getElementById('sale-products');
  if (!container) return;
  container.innerHTML = '';

  if (error) {
    container.innerHTML = `<div class="col-12"><div class="about-note text-center"><h2>Ошибка загрузки</h2></div></div>`;
    return;
  }
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="col-12"><div class="about-note text-center"><h2>Сейчас акционных товаров нет</h2><a href="catalog.html" class="btn custom-btn-dark">Открыть каталог</a></div></div>`;
    updateCartCount();
    return;
  }

  data.forEach(p => {
    const imageSrc = p.image_url || 'img/default.jpg';
    const originalPrice = p.price;
    const salePrice = p.sale_price || originalPrice;
    const priceHtml = p.sale_price
      ? `<span class="text-decoration-line-through text-muted me-2">${originalPrice} сом</span><span class="product-price">${salePrice} сом</span>`
      : `<span class="product-price">${originalPrice} сом</span>`;

    const col = document.createElement('div'); col.className = 'col-md-6 col-lg-4';
    const card = document.createElement('div'); card.className = 'product-card';
    card.innerHTML = `
      <div class="mb-2"><span class="badge rounded-pill text-bg-dark px-3 py-2">Акция</span></div>
      <img src="${imageSrc}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.description || ''}</p>
      <div class="mb-2">${priceHtml}</div>
      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-add custom-btn-dark">В корзину</button>
        <button class="btn btn-more custom-btn-light">Подробнее</button>
      </div>
    `;
    card.querySelector('.btn-add').addEventListener('click', () => addToCart({
      id: p.id, name: p.name, description: p.description || '', price: Number(salePrice) || 0, image: imageSrc
    }));
    card.querySelector('.btn-more').addEventListener('click', () => openProduct(p.id));
    col.appendChild(card); container.appendChild(col);
  });
  updateCartCount();
}

// Запуск
loadSaleEndDate().then(() => {
  loadSaleProducts();
});