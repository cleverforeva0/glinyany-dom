const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cart.length;
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function addToCart(item) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();

  // Показываем toast, как в каталоге
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
      <div class="custom-toast-text">${item.name}</div>
    </div>
  `;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function loadProduct() {
  const id = getIdFromUrl();
  const container = document.getElementById('product');

  if (!id) {
    container.innerHTML = `<p>Не указан id товара в URL. Пример: product.html?id=1</p>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from('product')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error(error);
    container.innerHTML = `<p>Товар не найден</p>`;
    return;
  }

  const imageSrc = data.image || data.image_url || 'img/default.jpg';

  container.innerHTML = `
    <div class="row g-4 align-items-center">
      <div class="col-md-6">
        <img src="${imageSrc}" alt="${data.name}" class="img-fluid rounded-4 product-image" style="background:#f0ebe4;">
      </div>
      <div class="col-md-6">
        <h1 class="mb-3" style="font-family: 'Playfair Display', serif;">${data.name}</h1>
        <p class="fs-5 mb-4" style="color: #5e4d46;">${data.description || ''}</p>
        <p class="fs-3 fw-bold mb-4" style="color: #2d201b;">${data.price} сом</p>
        <div class="d-flex flex-wrap gap-3">
          <button id="addBtn" class="btn custom-btn-dark">В корзину</button>
          <a href="cart.html" class="btn custom-btn-light">Перейти в корзину</a>
          <a href="catalog.html" class="btn btn-outline-secondary rounded-pill">Назад в каталог</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('addBtn').addEventListener('click', () => {
    addToCart({
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: Number(data.price) || 0,
      image: imageSrc
    });
  });
}

updateCartCount();
loadProduct();