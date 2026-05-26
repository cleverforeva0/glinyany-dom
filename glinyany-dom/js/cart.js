const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cart.length;
}

function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalBox = document.getElementById('cart-total');

  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="about-note">
        <h2 class="mb-2">Корзина пуста</h2>
        <p class="mb-0">Добавьте товары из каталога, чтобы оформить заказ.</p>
      </div>
    `;
    totalBox.innerHTML = `<h2 class="mb-0">Итого: 0 сом</h2>`;
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price) || 0;
    const imageSrc = item.image || 'img/default.jpg';

    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <div class="row g-3 align-items-center">
        <div class="col-md-4">
          <img src="${imageSrc}" alt="${item.name}">
        </div>
        <div class="col-md-8">
          <h3>${item.name}</h3>
          <p>${item.description || ''}</p>
          <p class="product-price">${item.price} сом</p>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="btn btn-add">Удалить</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-add').addEventListener('click', () => {
      removeItem(index);
    });

    container.appendChild(card);
  });

  totalBox.innerHTML = `<h2 class="mb-0">Итого: ${total} сом</h2>`;
}

document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert('Корзина пуста');
    return;
  }

  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const { error } = await supabaseClient
    .from('orders')
    .insert([{
      name,
      phone,
      products: JSON.stringify(cart),
      total
    }]);

  if (error) {
    console.error(error);
    alert('Ошибка при отправке заказа');
    return;
  }

  alert('Заказ успешно отправлен');
  cart = [];
  localStorage.removeItem('cart');
  document.getElementById('order-form').reset();
  renderCart();
  updateCartCount();
});

renderCart();
updateCartCount();