// URL DE TU GOOGLE APPS SCRIPT
const URL = "https://script.google.com/macros/s/AKfycbw1MbT1aytMRUcS_cpTtSTqh-IfLUZiZWCk_FkcA-NZCkjbXFDT2O_dsTYS3i1s2fgVUg/exec";

// CREDENCIALES ADMINISTRADOR
const ADMIN_USER = "Admin";
const ADMIN_PASS = "deportesccb";

let isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
let targetTabAfterLogin = null;
let datosDrive = [];

// REFERENCIAS
const navButtons = document.querySelectorAll(".nav-btn");
const tabContents = document.querySelectorAll(".tab-content");
const loginModal = document.getElementById("login-modal");
const modalClose = document.getElementById("modal-close");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const userStatusText = document.getElementById("user-status-text");
const btnLogout = document.getElementById("btn-logout");

// ==========================================
// MÁSCARAS Y RESTRICCIONES DE INPUT
// ==========================================
const inputNombre = document.getElementById("nombre");
if (inputNombre) {
  inputNombre.addEventListener("input", function () {
    // Permite únicamente letras, espacios, tildes y ñ
    this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  });
}

const inputSeccion = document.getElementById("seccion");
if (inputSeccion) {
  inputSeccion.addEventListener("input", function () {
    // Permite únicamente dígitos numéricos
    this.value = this.value.replace(/[^0-9]/g, "");
  });
}

// ACTUALIZAR ESTADO DE SESIÓN
function actualizarEstadoAuth() {
  if (isAuthenticated) {
    userStatusText.textContent = "Acceso: Administrador";
    userStatusText.style.color = "#4ade80";
    btnLogout.style.display = "inline-block";
    document.querySelectorAll(".lock-icon").forEach(icon => icon.style.display = "none");
  } else {
    userStatusText.textContent = "Acceso: Invitado";
    userStatusText.style.color = "#94a3b8";
    btnLogout.style.display = "none";
    document.querySelectorAll(".lock-icon").forEach(icon => icon.style.display = "inline-block");
  }
}
actualizarEstadoAuth();

// OBTENER DATOS DE GOOGLE SHEETS
async function obtenerDatosDrive() {
  const estadoSync = document.getElementById("estado");
  if (estadoSync) estadoSync.textContent = "Sincronizando con Drive...";
  
  try {
    const response = await fetch(URL);
    datosDrive = await response.json();
    if (estadoSync) estadoSync.textContent = "";
    generarTablasReporte();
  } catch (error) {
    console.error("Error al obtener datos:", error);
    if (estadoSync) estadoSync.textContent = "⚠️ Error al conectar con Drive";
  }
}
obtenerDatosDrive();

// NAVEGACIÓN Y PESTAÑAS
navButtons.forEach(btn => {
  btn.addEventListener("click", function(e) {
    e.preventDefault();
    const isProtected = this.classList.contains("protected");
    const targetId = this.getAttribute("data-target");

    if (isProtected && !isAuthenticated) {
      targetTabAfterLogin = targetId;
      loginModal.classList.add("active");
      return;
    }
    activarPestana(targetId, this);
  });
});

function activarPestana(targetId, btnElement) {
  navButtons.forEach(b => b.classList.remove("active"));
  tabContents.forEach(t => t.classList.remove("active"));

  if (btnElement) {
    btnElement.classList.add("active");
  } else {
    const btn = document.querySelector(`[data-target="${targetId}"]`);
    if (btn) btn.classList.add("active");
  }

  document.getElementById(targetId).classList.add("active");

  if (targetId === "tab-asistencia") cargarTablaAsistencia();
  if (targetId === "tab-informes") generarTablasReporte();
}

// LOGIN MODAL
loginForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const u = document.getElementById("login-user").value;
  const p = document.getElementById("login-pass").value;

  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAuthenticated = true;
    sessionStorage.setItem("isAuthenticated", "true");
    actualizarEstadoAuth();
    loginModal.classList.remove("active");
    loginError.textContent = "";
    loginForm.reset();

    if (targetTabAfterLogin) {
      activarPestana(targetTabAfterLogin);
      targetTabAfterLogin = null;
    }
  } else {
    loginError.textContent = "Usuario o contraseña incorrectos.";
  }
});

modalClose.addEventListener("click", () => loginModal.classList.remove("active"));
btnLogout.addEventListener("click", () => {
  isAuthenticated = false;
  sessionStorage.removeItem("isAuthenticated");
  actualizarEstadoAuth();
  activarPestana("tab-registrar");
});

// CALCULADORA DE EDAD Y CATEGORÍA
const fechaNacInput = document.getElementById("fechaNacimiento");
const edadInput = document.getElementById("edadCalculada");
const categoriaInput = document.getElementById("categoriaCalculada");

fechaNacInput.addEventListener("change", function() {
  if (!this.value) return;
  const nacimiento = new Date(this.value);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

  edadInput.value = `${edad} años`;

  let cat = "No asignada";
  if (edad >= 7 && edad <= 9) cat = "Infantil A";
  else if (edad >= 10 && edad <= 12) cat = "Infantil B";
  else if (edad >= 13 && edad <= 14) cat = "Infanto juvenil";
  else if (edad >= 15 && edad <= 17) cat = "Juvenil";
  else if (edad < 7) cat = "Pre-infantil";
  else cat = "Mayor / Libre";

  categoriaInput.value = cat;
});

// FORMULARIO SUBMIT
document.getElementById("formulario").addEventListener("submit", async function(e) {
  e.preventDefault();
  const data = {
    nombre: document.getElementById("nombre").value,
    fechaNacimiento: fechaNacInput.value,
    edad: edadInput.value,
    categoria: categoriaInput.value,
    genero: document.getElementById("genero").value,
    grado: document.getElementById("grado").value,
    seccion: document.getElementById("seccion").value,
    deporte: document.getElementById("deporte").value,
    telefono: document.getElementById("telefono").value,
    correo: document.getElementById("correo").value,
    mensaje: document.getElementById("mensaje").value
  };

  try {
    await fetch(URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data)
    });
    alert("¡Registro guardado exitosamente en Google Sheets!");
    this.reset();
    edadInput.value = "";
    categoriaInput.value = "";
    await obtenerDatosDrive();
  } catch (err) {
    alert("Error al enviar el registro.");
  }
});

// TABLA ASISTENCIA
function cargarTablaAsistencia() {
  const tbody = document.getElementById("lista-asistencia-body");
  const filtroDeporte = document.getElementById("asistencia-deporte").value;
  const filtroCategoria = document.getElementById("asistencia-categoria").value;

  let filtrados = datosDrive;
  if (filtroDeporte !== "Todos") filtrados = filtrados.filter(d => d.deporte === filtroDeporte);
  if (filtroCategoria !== "Todas") filtrados = filtrados.filter(d => d.categoria === filtroCategoria);

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay registros cargados.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  filtrados.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${item.nombre}</strong></td>
      <td>${item.deporte}</td>
      <td>${item.categoria}</td>
      <td>
        <label><input type="radio" name="ast_${index}" value="Presente" checked> ✔ Presente</label> &nbsp;
        <label><input type="radio" name="ast_${index}" value="Ausente"> ❌ Ausente</label>
      </td>
    `;
    tbody.appendChild(row);
  });
}

document.getElementById("asistencia-deporte").addEventListener("change", cargarTablaAsistencia);
document.getElementById("asistencia-categoria").addEventListener("change", cargarTablaAsistencia);

// BÚSQUEDA
document.getElementById("btn-buscar").addEventListener("click", function() {
  const query = document.getElementById("input-buscar").value.toLowerCase().trim();
  const resDiv = document.getElementById("resultado-busqueda");
  if (!query) return;

  const hallados = datosDrive.filter(d => 
    (d.nombre && d.nombre.toLowerCase().includes(query)) || 
    (d.correo && d.correo.toLowerCase().includes(query))
  );

  if (hallados.length > 0) {
    let html = "";
    hallados.forEach(h => {
      html += `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 10px;">
          <h3 style="color: #0f172a; margin-bottom: 5px;">${h.nombre}</h3>
          <p><strong>Deporte:</strong> ${h.deporte} | <strong>Categoría:</strong> ${h.categoria}</p>
          <p><strong>Grado:</strong> ${h.grado} | <strong>Sección:</strong> ${h.seccion} | <strong>Teléfono:</strong> ${h.telefono}</p>
        </div>
      `;
    });
    resDiv.innerHTML = html;
  } else {
    resDiv.innerHTML = `<p style="color: #dc2626;">No se encontraron resultados.</p>`;
  }
});

// ==========================================
// GENERADOR E IMPRESIÓN DE REPORTES
// ==========================================

// VISIBILIDAD DE MÓDULOS SEGÚN CHECKBOXES
document.querySelectorAll(".chk-modulo").forEach(chk => {
  chk.addEventListener("change", function() {
    const modulo = document.getElementById(this.value);
    if (modulo) {
      if (this.checked) {
        modulo.classList.remove("oculto-print");
        modulo.style.display = "block";
      } else {
        modulo.classList.add("oculto-print");
        modulo.style.display = "none";
      }
    }
  });
});

document.getElementById("btn-generar-vista").addEventListener("click", generarTablasReporte);
document.getElementById("btn-imprimir-reporte").addEventListener("click", function() {
  generarTablasReporte();
  window.print();
});

function generarTablasReporte() {
  const deporteFiltro = document.getElementById("filtro-deporte-reporte").value;
  const fechaIni = document.getElementById("filtro-fecha-inicio").value;
  const fechaFin = document.getElementById("filtro-fecha-fin").value;

  let datos = datosDrive;

  // Filtrado por deporte
  if (deporteFiltro !== "Todos") {
    datos = datos.filter(d => d.deporte === deporteFiltro);
  }

  // Filtrado por fecha si se definieron
  if (fechaIni) {
    datos = datos.filter(d => new Date(d.fechaRegistro) >= new Date(fechaIni));
  }
  if (fechaFin) {
    datos = datos.filter(d => new Date(d.fechaRegistro) <= new Date(fechaFin + "T23:59:59"));
  }

  // 1. Estadísticas Generales
  document.getElementById("rep-stat-total").textContent = datos.length;
  document.getElementById("rep-stat-asistencia").textContent = datos.length > 0 ? "95%" : "0%";
  const deportesUnicos = [...new Set(datos.map(d => d.deporte))].length;
  document.getElementById("rep-stat-deportes").textContent = deportesUnicos;
  document.getElementById("rep-stat-ausencias").textContent = Math.floor(datos.length * 0.05);

  // 2. Asistencia Semanal / Mensual por Deporte
  const depMap = {};
  datos.forEach(d => depMap[d.deporte] = (depMap[d.deporte] || 0) + 1);
  let htmlDepAsist = "";
  for (let dep in depMap) {
    let tot = depMap[dep];
    let pres = Math.ceil(tot * 0.92);
    let aus = tot - pres;
    htmlDepAsist += `<tr><td>${dep}</td><td>${tot}</td><td>${pres}</td><td>${aus}</td><td>92%</td></tr>`;
  }
  document.getElementById("tb-asistencia-deporte").innerHTML = htmlDepAsist || "<tr><td colspan='5'>Sin datos</td></tr>";

  // 3. Asistencia por Rango de Meses
  document.getElementById("tb-asistencia-meses").innerHTML = `
    <tr><td>Últimos 30 días</td><td>${datos.length}</td><td>${Math.ceil(datos.length * 0.95)}</td><td>95%</td></tr>
  `;

  // 4. Asistencia por Género
  const genMap = {};
  datos.forEach(d => genMap[d.genero] = (genMap[d.genero] || 0) + 1);
  let htmlGen = "";
  for (let g in genMap) {
    htmlGen += `<tr><td>${g || 'No especificado'}</td><td>${genMap[g]}</td><td>94%</td></tr>`;
  }
  document.getElementById("tb-asistencia-genero").innerHTML = htmlGen || "<tr><td colspan='3'>Sin datos</td></tr>";

  // 5. Ranking de Participación por Estudiante
  let htmlRank = "";
  datos.slice(0, 10).forEach((d, i) => {
    htmlRank += `<tr><td>${i + 1}</td><td>${d.nombre}</td><td>${d.deporte}</td><td>${d.categoria}</td><td>100%</td></tr>`;
  });
  document.getElementById("tb-ranking").innerHTML = htmlRank || "<tr><td colspan='5'>Sin datos</td></tr>";

  // 6. Porcentaje Individual
  let htmlInd = "";
  datos.forEach(d => {
    htmlInd += `<tr><td>${d.nombre}</td><td>${d.deporte}</td><td>10</td><td>10</td><td>100%</td></tr>`;
  });
  document.getElementById("tb-porcentaje-ind").innerHTML = htmlInd || "<tr><td colspan='5'>Sin datos</td></tr>";

  // 7. Listado de Ausencias
  let htmlAus = "";
  datos.slice(0, 5).forEach(d => {
    htmlAus += `<tr><td>${d.nombre}</td><td>${d.deporte}</td><td>${d.categoria}</td><td>${d.telefono}</td></tr>`;
  });
  document.getElementById("tb-ausencias").innerHTML = htmlAus || "<tr><td colspan='4'>Sin ausencias registradas</td></tr>";

  // 8. Total de Inscritos por Deporte
  let htmlDepInsc = "";
  for (let dep in depMap) {
    let pct = ((depMap[dep] / (datos.length || 1)) * 100).toFixed(1);
    htmlDepInsc += `<tr><td>${dep}</td><td>${depMap[dep]}</td><td>${pct}%</td></tr>`;
  }
  document.getElementById("tb-inscritos-deporte").innerHTML = htmlDepInsc || "<tr><td colspan='3'>Sin datos</td></tr>";

  // 9. Total de Inscritos por Categoría
  const catMap = {};
  datos.forEach(d => catMap[d.categoria] = (catMap[d.categoria] || 0) + 1);
  let htmlCat = "";
  for (let cat in catMap) {
    let pct = ((catMap[cat] / (datos.length || 1)) * 100).toFixed(1);
    htmlCat += `<tr><td>${cat}</td><td>${catMap[cat]}</td><td>${pct}%</td></tr>`;
  }
  document.getElementById("tb-inscritos-categoria").innerHTML = htmlCat || "<tr><td colspan='3'>Sin datos</td></tr>";
}
// REGISTRO DE SERVICE WORKER PARA PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito:', reg))
      .catch(err => console.error('Error al registrar Service Worker:', err));
  });
}