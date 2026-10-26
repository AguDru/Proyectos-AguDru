// Si tienes un servicio que reciba formularios (Formspree, Getform, tu propio backend…),
// pega aquí su URL. Mientras esté vacío, la solicitud solo se muestra como confirmada.
const FORM_ENDPOINT = "";

const OPENING_HOURS = {
  // getDay(): 0 = domingo … 6 = sábado. Horas de inicio de cita disponibles.
  1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19],
  6: [9, 14],
};

const form = document.getElementById("booking");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const errorBox = document.getElementById("form-error");
const success = document.getElementById("success");

document.getElementById("year").textContent = new Date().getFullYear();

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseDate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

dateInput.min = toISODate(new Date());

function renderSlots() {
  timeSelect.innerHTML = '<option value="" selected disabled>Selecciona</option>';
  if (!dateInput.value) return;

  const day = parseDate(dateInput.value);
  const hours = OPENING_HOURS[day.getDay()];
  if (!hours) {
    timeSelect.innerHTML = '<option value="" selected disabled>Cerrado</option>';
    return;
  }

  const now = new Date();
  const isToday = toISODate(day) === toISODate(now);
  for (let h = hours[0]; h < hours[1]; h++) {
    for (const m of [0, 30]) {
      if (isToday && (h < now.getHours() + 1 || (h === now.getHours() + 1 && m < now.getMinutes()))) continue;
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      timeSelect.add(new Option(label, label));
    }
  }
  if (timeSelect.options.length === 1) {
    timeSelect.options[0].textContent = "Sin horarios";
  }
}

dateInput.addEventListener("change", renderSlots);

function validate() {
  let message = "";
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("is-invalid"));

  for (const el of form.elements) {
    if (!el.name) continue;
    if (!el.checkValidity()) {
      el.closest(".field").classList.add("is-invalid");
      message ||= "Por favor completa todos los campos correctamente.";
    }
  }

  if (dateInput.value && !OPENING_HOURS[parseDate(dateInput.value).getDay()]) {
    dateInput.closest(".field").classList.add("is-invalid");
    message = "Los domingos la clínica permanece cerrada. Elige otro día.";
  }

  errorBox.textContent = message;
  errorBox.hidden = !message;
  return !message;
}

form.addEventListener("input", (e) => e.target.closest(".field")?.classList.remove("is-invalid"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Enviando…";

  try {
    if (FORM_ENDPOINT) {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.statusText);
    }

    const when = parseDate(data.date).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
    document.getElementById("success-text").textContent =
      `${data.name.split(" ")[0]}, reservamos tu cita para el ${when} a las ${data.time}. Te contactaremos para confirmarla.`;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  } catch {
    errorBox.textContent = "No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.";
    errorBox.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Confirmar cita";
  }
});

document.getElementById("again").addEventListener("click", () => {
  form.reset();
  renderSlots();
  success.hidden = true;
  form.hidden = false;
  form.querySelector("input").focus();
});
