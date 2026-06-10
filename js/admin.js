const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = '12345';
const STORAGE_BUCKET = 'product-images';

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const globalSuccess = document.getElementById('global-success');
const globalError = document.getElementById('global-error');

function showSuccess(msg) {
  globalError.style.display = 'none';
  globalSuccess.textContent = msg;
  globalSuccess.style.display = 'block';
  setTimeout(() => globalSuccess.style.display = 'none', 2500);
}
function showError(msg) {
  globalSuccess.style.display = 'none';
  globalError.textContent = msg;
  globalError.style.display = 'block';
  setTimeout(() => globalError.style.display = 'none', 3500);
}

function checkAdminAccess() {
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    loginView.classList.add('admin-hidden');
    adminView.classList.remove('admin-hidden');
    initAdmin();
  } else {
    loginView.classList.remove('admin-hidden');
    adminView.classList.add('admin-hidden');
  }
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const login = document.getElementById('admin-login').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const loginError = document.getElementById('login-error');
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_logged_in', 'true');
    loginError.style.display = 'none';
    checkAdminAccess();
  } else {
    loginError.textContent = 'Неверный логин или пароль';
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
});

// ----- Табы -----
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('admin-hidden'));
    document.getElementById('tab-' + tab).classList.remove('admin-hidden');
  });
});

// ----- Вспомогательные функции -----
function slugifyFileName(fileName) {
  const dotIndex = fileName.lastIndexOf('.');
  const name = dotIndex !== -1 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex !== -1 ? fileName.slice(dotIndex) : '';
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-_]/gi, '') + ext.toLowerCase();
}

function setupImagePreview(fileInputId, textInputId, previewImgId, previewTextId) {
  const fileInput = document.getElementById(fileInputId);
  const textInput = document.getElementById(textInputId);
  const previewImg = document.getElementById(previewImgId);
  const previewText = document.getElementById(previewTextId);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    textInput.value = slugifyFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
      previewText.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file, folder = 'uploads') {
  if (!file) return '';
  const preparedName = slugifyFileName(file.name);
  const filePath = `${folder}/${Date.now()}-${preparedName}`;
  const { error: uploadError } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function loadCategoriesForSelect() {
  const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
  if (error) { showError('Не удалось загрузить категории'); return; }
  const select = document.getElementById('product-category');
  select.innerHTML = '';
  if (!data.length) {
    const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'Сначала добавьте категорию';
    select.appendChild(opt); return;
  }
  data.forEach(cat => {
    const opt = document.createElement('option'); opt.value = cat.id; opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

// ----- Управление категориями -----
async function renderCategories() {
  const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
  if (error) { showError('Не удалось получить категории'); return; }
  const container = document.getElementById('categories-list');
  let html = `<table class="admin-table"><tr><th>ID</th><th>Фото</th><th>Название</th><th>Удалить</th></tr>`;
  data.forEach(cat => {
    html += `<tr><td>${cat.id}</td><td>${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">` : '—'}</td><td>${cat.name}</td><td><button onclick="deleteCategory(${cat.id})" class="btn custom-btn-dark">Удалить</button></td></tr>`;
  });
  html += '</table>'; container.innerHTML = html;
}
window.deleteCategory = async (id) => {
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) { showError('Ошибка удаления'); return; }
  showSuccess('Категория удалена'); renderCategories(); loadCategoriesForSelect();
};

// ----- Управление товарами -----
async function renderProducts() {
  const { data, error } = await supabaseClient.from('product').select('*').order('id', { ascending: true });
  if (error) { showError('Не удалось загрузить товары'); return; }
  const container = document.getElementById('products-list');
  let html = `<table class="admin-table"><tr><th>ID</th><th>Фото</th><th>Название</th><th>Цена</th><th>Категория</th><th>Распродажа</th><th>Удалить</th></tr>`;
  data.forEach(p => {
    const image = p.image_url || '';
    const priceDisplay = p.is_sale && p.sale_price
      ? `<span class="text-decoration-line-through text-muted">${p.price}</span> <strong>${p.sale_price} сом</strong>`
      : `${p.price} сом`;
    html += `<tr>
      <td>${p.id}</td>
      <td>${image ? `<img src="${image}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">` : '—'}</td>
      <td>${p.name}</td>
      <td>${priceDisplay}</td>
      <td>${p.category_id ?? '—'}</td>
      <td><button onclick="toggleSale(${p.id}, ${p.is_sale}, ${p.price})" class="btn custom-btn-dark">${p.is_sale ? 'Снять с распродажи' : 'В распродажу'}</button></td>
      <td><button onclick="deleteProduct(${p.id})" class="btn custom-btn-dark">Удалить</button></td>
    </tr>`;
  });
  html += '</table>'; container.innerHTML = html;
}
window.deleteProduct = async (id) => {
  const { error } = await supabaseClient.from('product').delete().eq('id', id);
  if (error) { showError('Ошибка удаления'); return; }
  showSuccess('Товар удалён'); renderProducts();
};

// Переключение распродажи с запросом скидочной цены
window.toggleSale = async (id, currentStatus, originalPrice) => {
  if (!currentStatus) {
    // Включение распродажи: запрашиваем новую цену
    const newPrice = prompt('Введите цену со скидкой (в сомах):', originalPrice);
    if (newPrice === null) return; // отмена
    const salePrice = parseFloat(newPrice);
    if (isNaN(salePrice) || salePrice < 0) { alert('Некорректная цена'); return; }
    const { error } = await supabaseClient.from('product').update({ is_sale: true, sale_price: salePrice }).eq('id', id);
    if (error) { showError('Ошибка обновления'); return; }
  } else {
    // Снятие с распродажи
    const { error } = await supabaseClient.from('product').update({ is_sale: false, sale_price: null }).eq('id', id);
    if (error) { showError('Ошибка обновления'); return; }
  }
  showSuccess('Статус обновлён');
  renderProducts();
};

async function loadOrders() {
  const sort = document.getElementById('order-sort').value;
  const min = document.getElementById('order-filter-min').value;
  const max = document.getElementById('order-filter-max').value;

  let query = supabaseClient.from('orders').select('*');
  if (min) query = query.gte('total', min);
  if (max) query = query.lte('total', max);
  switch (sort) {
    case 'date_asc': query = query.order('created_at', { ascending: true }); break;
    case 'price_desc': query = query.order('total', { ascending: false }); break;
    case 'price_asc': query = query.order('total', { ascending: true }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  const summaryDiv = document.getElementById('orders-summary');
  const ordersDiv = document.getElementById('orders-list');
  if (error) { ordersDiv.innerHTML = '<p class="text-muted">Ошибка загрузки</p>'; summaryDiv.innerHTML = ''; return; }
  if (!data.length) { summaryDiv.innerHTML = ''; ordersDiv.innerHTML = '<p class="text-muted">Заказов нет</p>'; return; }
  let totalSum = 0;
  data.forEach(o => totalSum += Number(o.total) || 0);
  summaryDiv.innerHTML = `<div class="d-flex gap-4"><div><strong>Всего заказов:</strong> ${data.length}</div><div><strong>Общая сумма:</strong> ${totalSum} сом</div></div>`;
  let html = `<table class="admin-table"><tr><th>ID</th><th>Имя</th><th>Телефон</th><th>Товары</th><th>Сумма</th><th>Дата</th></tr>`;
  data.forEach(order => {
    let productsList = '';
    try { const items = typeof order.products === 'string' ? JSON.parse(order.products) : order.products; if (Array.isArray(items)) productsList = items.map(i => i.name).join(', '); else productsList = '—'; } catch { productsList = '—'; }
    const date = order.created_at ? new Date(order.created_at).toLocaleString('ru-RU') : '—';
    html += `<tr><td>${order.id}</td><td>${order.name || '—'}</td><td>${order.phone || '—'}</td><td>${productsList}</td><td>${order.total} сом</td><td>${date}</td></tr>`;
  });
  html += '</table>'; ordersDiv.innerHTML = html;
}
document.getElementById('apply-order-filter').addEventListener('click', loadOrders);

// ----- Сообщения -----
async function loadMessages() {
  const sort = document.getElementById('messages-sort')?.value || 'date_desc';
  let query = supabaseClient.from('messages').select('*');
  
  // Применяем сортировку
  query = sort === 'date_asc' 
    ? query.order('created_at', { ascending: true })
    : query.order('created_at', { ascending: false });

  const { data, error } = await query;
  const container = document.getElementById('messages-list');
  if (error) { 
    container.innerHTML = '<p class="text-muted">Ошибка загрузки сообщений</p>'; 
    return; 
  }
  if (!data.length) { 
    container.innerHTML = '<p class="text-muted">Сообщений нет</p>'; 
    return; 
  }
  let html = `<table class="admin-table"><tr><th>ID</th><th>Имя</th><th>Телефон</th><th>Сообщение</th><th>Дата</th></tr>`;
  data.forEach(msg => {
    const date = msg.created_at ? new Date(msg.created_at).toLocaleString('ru-RU') : '—';
    html += `<tr><td>${msg.id}</td><td>${msg.name || '—'}</td><td>${msg.phone || '—'}</td><td>${msg.message || '—'}</td><td>${date}</td></tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
}
// ----- Отзывы -----
async function loadReviewsAdmin() {
  const { data, error } = await supabaseClient.from('reviews').select('*').order('created_at', { ascending: false });
  const container = document.getElementById('reviews-admin-list');
  if (error) { container.innerHTML = '<p class="text-muted">Ошибка</p>'; return; }
  if (!data.length) { container.innerHTML = '<p class="text-muted">Отзывов нет</p>'; return; }
  let html = `<table class="admin-table"><tr><th>ID</th><th>Автор</th><th>Оценка</th><th>Текст</th><th>Фото</th><th>Дата</th><th>Удалить</th></tr>`;
  data.forEach(r => {
    const stars = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '—';
    const img = r.image_url ? `<img src="${r.image_url}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">` : '—';
    const date = r.created_at ? new Date(r.created_at).toLocaleString('ru-RU') : '—';
    html += `<tr><td>${r.id}</td><td>${r.author_name}</td><td>${stars}</td><td>${r.body}</td><td>${img}</td><td>${date}</td><td><button onclick="deleteReview(${r.id})" class="btn custom-btn-dark">Удалить</button></td></tr>`;
  });
  html += '</table>'; container.innerHTML = html;
}
window.deleteReview = async (id) => {
  const { error } = await supabaseClient.from('reviews').delete().eq('id', id);
  if (error) { showError('Ошибка удаления'); return; }
  showSuccess('Отзыв удалён'); loadReviewsAdmin();
};

// ----- Формы -----
document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    const file = document.getElementById('category-image-file').files[0];
    let image_url = '';
    if (file) { image_url = await uploadImage(file, 'categories'); document.getElementById('category-image').value = image_url; }
    const { error } = await supabaseClient.from('categories').insert([{ name, image_url, description }]);
    if (error) throw error;
    e.target.reset(); document.getElementById('category-preview-img').style.display = 'none'; document.getElementById('category-preview-text').style.display = 'block';
    showSuccess('Категория добавлена'); await loadCategoriesForSelect(); await renderCategories();
  } catch (err) { console.error(err); showError('Ошибка при добавлении категории'); }
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('product-name').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const price = document.getElementById('product-price').value;
    const category_id = document.getElementById('product-category').value;
    const file = document.getElementById('product-image-file').files[0];
    let image_url = '';
    if (file) { image_url = await uploadImage(file, 'products'); document.getElementById('product-image').value = image_url; }
    const { error } = await supabaseClient.from('product').insert([{ name, description, price, image_url, category_id }]);
    if (error) throw error;
    e.target.reset(); document.getElementById('product-preview-img').style.display = 'none'; document.getElementById('product-preview-text').style.display = 'block';
    showSuccess('Товар добавлен'); await renderProducts();
  } catch (err) { console.error(err); showError('Ошибка при добавлении товара'); }
});

function initAdmin() {
  setupImagePreview('category-image-file', 'category-image', 'category-preview-img', 'category-preview-text');
  setupImagePreview('product-image-file', 'product-image', 'product-preview-img', 'product-preview-text');
  loadCategoriesForSelect();
  renderCategories();
  renderProducts();
  loadOrders();
  loadMessages();
  loadReviewsAdmin();
  document.getElementById('apply-messages-filter').addEventListener('click', loadMessages);
  // Загрузка текущей даты окончания распродажи
async function loadSaleSettings() {
  const { data, error } = await supabaseClient
    .from('settings')
    .select('sale_end_time')
    .eq('id', 1)
    .single();

  const input = document.getElementById('sale-end-time');
  if (!input) return;

  if (error || !data || !data.sale_end_time) {
    input.value = '';
    return;
  }

  // Преобразуем в формат datetime-local (YYYY-MM-DDTHH:MM)
  const date = new Date(data.sale_end_time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Сохранение новой даты окончания
document.getElementById('sale-settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('sale-end-time');
  if (!input.value) {
    showError('Выберите дату и время');
    return;
  }
  const newDate = new Date(input.value).toISOString();
  const { error } = await supabaseClient
    .from('settings')
    .update({ sale_end_time: newDate })
    .eq('id', 1);

  if (error) {
    showError('Ошибка сохранения');
    return;
  }
  showSuccess('Дата окончания распродажи обновлена');
});

// Кнопка "Сбросить распродажу" — снимает все товары с распродажи и очищает дату
document.getElementById('clear-sale-btn').addEventListener('click', async () => {
  if (!confirm('Снять все товары с распродажи и очистить таймер?')) return;

  // Снимаем is_sale у всех товаров
  await supabaseClient.from('product').update({ is_sale: false, sale_price: null }).neq('id', 0);
  // Очищаем дату окончания
  await supabaseClient.from('settings').update({ sale_end_time: null }).eq('id', 1);

  document.getElementById('sale-end-time').value = '';
  showSuccess('Все товары сняты с распродажи, таймер сброшен');
  renderProducts(); // обновить таблицу товаров в админке
});

// Вызовите loadSaleSettings() в initAdmin() после setupImagePreview:
function initAdmin() {
  // ... существующий код ...
  loadSaleSettings();
}
}
checkAdminAccess(); 