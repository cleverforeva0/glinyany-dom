const supabaseUrl = 'https://ysdpobfcbenzpzvydbje.supabase.co';
const supabaseKey = 'sb_publishable_OySyyqZ0iQstXWDph4U_cQ_hBvb5qH0';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  const { error } = await supabaseClient.from('messages').insert([{ name, phone, message }]);
  if (error) {
    alert('Ошибка отправки: ' + error.message);
    return;
  }


  document.getElementById('contact-form').reset();
  const successEl = document.getElementById('contact-success');
  successEl.classList.remove('d-none');
  setTimeout(() => {
    successEl.classList.add('d-none');
  }, 4000);
});