const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

async function loadCategoriesForSelect() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const select = document.getElementById('product-category');
  select.innerHTML = '';

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
    return;
  }

  const container = document.getElementById('categories-list');

  let html = '<table><tr><th>ID</th><th>Название</th><th>Удалить</th></tr>';
  data.forEach(cat => {
    html += `
      <tr>
        <td>${cat.id}</td>
        <td>${cat.name}</td>
        <td><button onclick="deleteCategory(${cat.id})">Удалить</button></td>
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
    return;
  }

  const container = document.getElementById('products-list');

  let html = '<table><tr><th>ID</th><th>Название</th><th>Цена</th><th>Удалить</th></tr>';
  data.forEach(product => {
    html += `
      <tr>
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.price}</td>
        <td><button onclick="deleteProduct(${product.id})">Удалить</button></td>
      </tr>
    `;
  });
  html += '</table>';

  container.innerHTML = html;
}

document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('category-name').value;
  const image_url = document.getElementById('category-image').value;
  const description = document.getElementById('category-description').value;

  const { error } = await supabaseClient
    .from('categories')
    .insert([{ name, image_url, description }]);

  if (error) {
    console.error(error);
    alert('Ошибка при добавлении категории');
    return;
  }

  alert('Категория добавлена');
  e.target.reset();
  loadCategoriesForSelect();
  renderCategories();
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('product-name').value;
  const description = document.getElementById('product-description').value;
  const price = document.getElementById('product-price').value;
  const image = document.getElementById('product-image').value;
  const category_id = document.getElementById('product-category').value;
  const is_sale = document.getElementById('product-sale').checked;

  const { error } = await supabaseClient
    .from('product')
    .insert([{
      name,
      description,
      price,
      image,
      category_id,
      is_sale
    }]);

  if (error) {
    console.error(error);
    alert('Ошибка при добавлении товара');
    return;
  }

  alert('Товар добавлен');
  e.target.reset();
  renderProducts();
});

async function deleteCategory(id) {
  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Ошибка удаления категории');
    return;
  }

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
    alert('Ошибка удаления товара');
    return;
  }

  renderProducts();
}

loadCategoriesForSelect();
renderCategories();
renderProducts();