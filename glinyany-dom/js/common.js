function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cart.length;
}

function initMenu() {
  const btn = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
  }
}

function initDropdown() {
  const dropdown = document.getElementById('aboutDropdown');
  const toggle = document.getElementById('aboutToggle');

  if (!dropdown || !toggle) return;

  toggle.addEventListener('click', (e) => {
    if (window.innerWidth <= 760) {
      e.preventDefault();
      dropdown.classList.toggle('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && window.innerWidth <= 760) {
      dropdown.classList.remove('open');
    }
  });
}

updateCartCount();
initMenu();
initDropdown();