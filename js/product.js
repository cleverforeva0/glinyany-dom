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
  alert(`${item.name} добавлен в корзину`);
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

  if (error) {
    console.error(error);
    container.innerHTML = `<p>Ошибка загрузки товара</p>`;
    return;
  }

  const imageSrc = data.image || data.image_url || 'img/default.jpg';

  container.innerHTML = `
    <div class="card">
      <img src="${imageSrc}" alt="${data.name}">
      <h3>${data.name}</h3>
      <p>${data.description || ''}</p>
      <p class="price">${data.price} сом</p>

      <div class="btn-row">
        <button id="addBtn">В корзину</button>
        <a class="btn" href="cart.html">Перейти в корзину</a>
        <a class="btn secondary" href="index.html">Назад</a>
      </div>
    </div>
  `;

  document.getElementById('addBtn').addEventListener('click', () => {
    addToCart({
      id: data.id,
      name: data.name,
      description: data.description,
      price: Number(data.price) || 0,
      image: imageSrc
    });
  });
}

updateCartCount();
loadProduct();
