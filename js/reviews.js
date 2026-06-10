const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Загрузка существующих отзывов
async function loadReviews() {
  const container = document.getElementById('reviews-container');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = '';
  (data || []).forEach(r => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    const starsHtml = r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '★★★★★';
    let imgHtml = '';
    if (r.image_url) {
      imgHtml = `<img src="${r.image_url}" alt="Фото отзыва" class="img-fluid rounded mb-2" style="max-height:200px; object-fit:cover;">`;
    }
    col.innerHTML = `
      <div class="about-note h-100">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="review-stars">${starsHtml}</span>
        </div>
        <p>"${r.body}"</p>
        ${imgHtml}
        <p class="small-muted mb-0">— ${r.author_name}</p>
      </div>
    `;
    container.appendChild(col);
  });
}

// Генерация звёзд для выбора
function renderStarSelector() {
  const container = document.getElementById('star-selector');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star-option';
    star.dataset.value = i;
    star.innerHTML = '☆';
    star.addEventListener('click', () => {
      document.getElementById('review-rating').value = i;
      document.querySelectorAll('.star-option').forEach((s, idx) => {
        s.innerHTML = idx < i ? '★' : '☆';
        s.style.color = idx < i ? '#e7a854' : '#ccc';
      });
    });
    container.appendChild(star);
  }
}

// Основная логика после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  // Обновление счётчика корзины (функция из common.js)
  if (typeof updateCartCount === 'function') {
    updateCartCount();
  }

  // Загрузка отзывов
  loadReviews();

  // Звёздочный рейтинг
  renderStarSelector();

  // Предпросмотр изображения
  const imageFileInput = document.getElementById('review-image-file');
  if (imageFileInput) {
    imageFileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const previewImg = document.getElementById('review-preview-img');
          const previewDiv = document.getElementById('review-preview');
          if (previewImg && previewDiv) {
            previewImg.src = e.target.result;
            previewDiv.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Отправка отзыва
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const author = document.getElementById('review-author').value.trim();
      const body = document.getElementById('review-text').value.trim();
      const rating = parseInt(document.getElementById('review-rating').value);
      const file = imageFileInput ? imageFileInput.files[0] : null;

      if (!rating) {
        alert('Пожалуйста, выберите оценку');
        return;
      }

      let image_url = '';
      if (file) {
        const fileName = Date.now() + '-' + file.name.replace(/\s+/g, '-');
        const { error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload('reviews/' + fileName, file);
        if (uploadError) {
          alert('Ошибка загрузки фото: ' + uploadError.message);
          return;
        }
        const { data: publicData } = supabaseClient.storage
          .from('product-images')
          .getPublicUrl('reviews/' + fileName);
        image_url = publicData.publicUrl;
      }

      const { error } = await supabaseClient
        .from('reviews')
        .insert([{ author_name: author, body, rating, image_url }]);

      if (error) {
        alert('Ошибка сохранения отзыва');
        return;
      }

      // Очистка формы
      document.getElementById('review-author').value = '';
      document.getElementById('review-text').value = '';
      document.getElementById('review-rating').value = '';
      document.querySelectorAll('.star-option').forEach(s => {
        s.innerHTML = '☆';
        s.style.color = '#ccc';
      });
      const previewDiv = document.getElementById('review-preview');
      if (previewDiv) previewDiv.style.display = 'none';
      const successMsg = document.getElementById('review-success');
      if (successMsg) {
        successMsg.style.display = 'block';
        setTimeout(() => { successMsg.style.display = 'none'; }, 4000);
      }
      // Обновить список отзывов
      loadReviews();
    });
  }
});