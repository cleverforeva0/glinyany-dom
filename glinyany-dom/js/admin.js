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

function showSuccess(message) {
  globalError.style.display = 'none';
  globalSuccess.textContent = message;
  globalSuccess.style.display = 'block';
  setTimeout(() => {
    globalSuccess.style.display = 'none';
  }, 2500);
}

function showError(message) {
  globalSuccess.style.display = 'none';
  globalError.textContent = message;
  globalError.style.display = 'block';
  setTimeout(() => {
    globalError.style.display = 'none';
  }, 3500);
}

function checkAdminAccess() {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';

  if (isLoggedIn) {
    loginView.classList.add('admin-hidden');
    adminView.classList.remove('admin-hidden');
    initAdmin();
  } else {
    loginView.classList.remove('admin-hidden');
    adminView.classList.add('admin-hidden');
  }
}

loginForm.addEventListener('submit', (e) => {
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

function slugifyFileName(fileName) {
  const dotIndex = fileName.lastIndexOf('.');
  const name = dotIndex !== -1 ? fileName.slice(0, dotIndex) : fileName;
  const ext = dotIndex !== -1 ? fileName.slice(dotIndex) : '';

  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-яё0-9-_]/gi, '') + ext.toLowerCase();
}

function setupImagePreview(fileInputId, textInputId, previewImgId, previewTextId) {
  const fileInput = document.getElementById(fileInputId);
  const textInput = document.getElementById(textInputId);
  const previewImg = document.getElementById(previewImgId);
  const previewText = document.getElementById(previewTextId);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const preparedName = slugifyFileName(file.name);
    textInput.value = preparedName;

    const reader = new FileReader();
    reader.onload = function (e) {
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

  const { error: uploadError } = await supabaseClient
    .storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function loadCategoriesForSelect() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    showError('Не удалось загрузить категории');
    return;
  }

  const select = document.getElementById('product-category');
  select.innerHTML = '';

  if (!data.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Сначала добавьте категорию';
    select.appendChild(option);
    return;
  }

  data.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

async function renderCategories() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    showError('Не удалось получить список категорий');
    return;
  }

  const container = document.getElementById('categories-list');

  let html = `
    <table class="admin-table">
      <tr>
        <th>ID</th>
        <th>Фото</th>
        <th>Название</th>
        <th>Удалить</th>
      </tr>
  `;

  data.forEach(cat => {
    html += `
      <tr>
        <td>${cat.id}</td>
        <td>${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">` : '—'}</td>
        <td>${cat.name}</td>
        <td><button onclick="deleteCategory(${cat.id})" class="btn custom-btn-dark">Удалить</button></td>
      </tr>
    `;
  });

  html += '</table>';
  container.innerHTML = html;
}

async function renderProducts() {
  const { data, error } = await supabaseClient
    .from('product')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    showError('Не удалось получить список товаров');
    return;
  }

  const container = document.getElementById('products-list');

  let html = `
    <table class="admin-table">
      <tr>
        <th>ID</th>
        <th>Фото</th>
        <th>Название</th>
        <th>Цена</th>
        <th>Категория</th>
        <th>Акция</th>
        <th>Удалить</th>
      </tr>
  `;

  data.forEach(product => {
    const image = product.image || product.image_url || '';
    html += `
      <tr>
        <td>${product.id}</td>
        <td>${image ? `<img src="${image}" alt="${product.name}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;">` : '—'}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td>${product.category_id ?? '—'}</td>
        <td>${product.is_sale ? 'Да' : 'Нет'}</td>
        <td><button onclick="deleteProduct(${product.id})" class="btn custom-btn-dark">Удалить</button></td>
      </tr>
    `;
  });

  html += '</table>';
  container.innerHTML = html;
}

// ========== НОВОЕ: загрузка заказов ==========
async function renderOrders() {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  const summaryDiv = document.getElementById('orders-summary');
  const ordersDiv = document.getElementById('orders-list');

  if (error) {
    console.error(error);
    ordersDiv.innerHTML = '<p class="text-muted">Не удалось загрузить заказы</p>';
    summaryDiv.innerHTML = '';
    return;
  }

  if (!data || data.length === 0) {
    summaryDiv.innerHTML = '';
    ordersDiv.innerHTML = '<p class="text-muted">Заказов пока нет</p>';
    return;
  }

  // Подсчёт общей суммы и количества
  let totalSum = 0;
  data.forEach(order => {
    totalSum += Number(order.total) || 0;
  });

  summaryDiv.innerHTML = `
    <div class="d-flex gap-4 flex-wrap">
      <div><strong>Всего заказов:</strong> ${data.length}</div>
      <div><strong>Общая сумма:</strong> ${totalSum} сом</div>
    </div>
  `;

  let html = `
    <table class="admin-table">
      <tr>
        <th>ID</th>
        <th>Имя</th>
        <th>Телефон</th>
        <th>Товары</th>
        <th>Сумма</th>
        <th>Дата</th>
      </tr>
  `;

  data.forEach(order => {
    let productsList = '';
    try {
      const items = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
      if (Array.isArray(items)) {
        productsList = items.map(item => item.name).join(', ');
      } else {
        productsList = '—';
      }
    } catch {
      productsList = '—';
    }

    const createdAt = order.created_at
      ? new Date(order.created_at).toLocaleString('ru-RU')
      : '—';

    html += `
      <tr>
        <td>${order.id}</td>
        <td>${order.name || '—'}</td>
        <td>${order.phone || '—'}</td>
        <td>${productsList}</td>
        <td>${order.total} сом</td>
        <td>${createdAt}</td>
      </tr>
    `;
  });

  html += '</table>';
  ordersDiv.innerHTML = html;
}
// ============================================

document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    const file = document.getElementById('category-image-file').files[0];

    let image_url = '';
    if (file) {
      image_url = await uploadImage(file, 'categories');
      document.getElementById('category-image').value = image_url;
    }

    const { error } = await supabaseClient
      .from('categories')
      .insert([{ name, image_url, description }]);

    if (error) throw error;

    e.target.reset();
    document.getElementById('category-preview-img').style.display = 'none';
    document.getElementById('category-preview-text').style.display = 'block';

    showSuccess('Категория добавлена');
    await loadCategoriesForSelect();
    await renderCategories();
  } catch (error) {
    console.error(error);
    showError('Ошибка при добавлении категории');
  }
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const name = document.getElementById('product-name').value.trim();
    const description = document.getElementById('product-description').value.trim();
    const price = document.getElementById('product-price').value;
    const category_id = document.getElementById('product-category').value;
    const is_sale = document.getElementById('product-sale').checked;
    const file = document.getElementById('product-image-file').files[0];

    let image_url = '';
    if (file) {
      image_url = await uploadImage(file, 'products');
      document.getElementById('product-image').value = image_url;
    }

    const { error } = await supabaseClient
      .from('product')
      .insert([{
        name,
        description,
        price,
        image_url,
        category_id,
        is_sale
      }]);

    if (error) throw error;

    e.target.reset();
    document.getElementById('product-preview-img').style.display = 'none';
    document.getElementById('product-preview-text').style.display = 'block';

    showSuccess('Товар добавлен');
    await renderProducts();
  } catch (error) {
    console.error(error);
    showError('Ошибка при добавлении товара');
  }
});

async function deleteCategory(id) {
  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    showError('Ошибка удаления категории');
    return;
  }

  showSuccess('Категория удалена');
  renderCategories();
  loadCategoriesForSelect();
}

async function deleteProduct(id) {
  const { error } = await supabaseClient
    .from('product')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    showError('Ошибка удаления товара');
    return;
  }

  showSuccess('Товар удалён');
  renderProducts();
}

function initAdmin() {
  setupImagePreview('category-image-file', 'category-image', 'category-preview-img', 'category-preview-text');
  setupImagePreview('product-image-file', 'product-image', 'product-preview-img', 'product-preview-text');
  loadCategoriesForSelect();
  renderCategories();
  renderProducts();
  renderOrders();  // <-- добавили вызов загрузки заказов
}

checkAdminAccess();