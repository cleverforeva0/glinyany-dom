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

// Закрытие Bootstrap меню при клике вне его
document.addEventListener('click', function (event) {
  const navbarCollapse = document.getElementById('mainNav');
  const toggler = document.querySelector('.navbar-toggler');
  if (!navbarCollapse || !toggler) return;
  if (navbarCollapse.classList.contains('show') &&
      !navbarCollapse.contains(event.target) &&
      !toggler.contains(event.target)) {
    const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
    bsCollapse.hide();
  }
});

updateCartCount();
initMenu();
initDropdown();