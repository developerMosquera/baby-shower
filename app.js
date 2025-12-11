// 🔑 Configura tus datos de Supabase aquí
const supabaseUrl = 'https://sdcckdcxseomuosgjcca.supabase.co';           // por ej: https://abcxyz.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkY2NrZGN4c2VvbXVvc2dqY2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDMyNzAsImV4cCI6MjA4MDk3OTI3MH0.sqRECVVcIFXXov7Ff5n0iifwLFLKZewoWuXE9YexU5I';      // anon public key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const tbody = document.getElementById('gifts-tbody');
const errorMessage = document.getElementById('error-message');

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = 'block';
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

// Cargar lista de regalos desde la BD
async function loadGifts() {
  clearError();

  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error(error);
    showError('No se pudo cargar la lista de regalos. Intenta de nuevo más tarde.');
    return;
  }

  renderGifts(data);
}

// Pintar la tabla
function renderGifts(gifts) {
  tbody.innerHTML = '';

  gifts.forEach((gift) => {
    const tr = document.createElement('tr');

    const statusText = gift.is_locked
      ? `Tomado por ${gift.assigned_to || 'alguien'}`
      : 'Disponible';

    const statusClass = gift.is_locked ? 'status-tomado' : 'status-disponible';

    tr.innerHTML = `
      <td>${gift.name}</td>
      <td>${gift.description || ''}</td>
      <td class="${statusClass}">${statusText}</td>
      <td>
        ${
          gift.is_locked
            ? ''
            : `
          <input
            type="text"
            placeholder="Tu nombre"
            data-input-id="${gift.id}"
          />
          <button class="btn-primary" data-btn-id="${gift.id}">
            Lo llevo
          </button>
        `
        }
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Asociar eventos a los botones "Lo llevo"
  tbody.querySelectorAll('button[data-btn-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-btn-id'));
      const input = tbody.querySelector(`input[data-input-id="${id}"]`);

      const name = input.value.trim();
      if (!name) {
        alert('Por favor, escribe tu nombre antes de reservar el regalo.');
        return;
      }

      // Intentar marcar el regalo como tomado
      await assignGift(id, name);
    });
  });
}

// Marcar un regalo como tomado
async function assignGift(id, name) {
  clearError();

  // Actualizamos solo si aún no está bloqueado (is_locked = false)
  const { data, error } = await supabase
    .from('gifts')
    .update({
      assigned_to: name,
      assigned_at: new Date().toISOString(),
      is_locked: true
    })
    .eq('id', id)
    .eq('is_locked', false) // para evitar que dos personas lo tomen a la vez
    .select()
    .single();

  if (error) {
    console.error(error);
    showError('No se pudo registrar el regalo. Intenta nuevamente.');
    return;
  }

  if (!data) {
    // No se actualizó nada porque alguien se adelantó
    showError('Este regalo ya fue tomado por otra persona hace un momento.');
  }

  // Recargar la lista
  await loadGifts();
}

// Iniciar
loadGifts();
