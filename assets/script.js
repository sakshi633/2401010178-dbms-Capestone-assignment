const isLocalStaticPreview = window.location.port === "5500";
const isGithubPages = window.location.hostname.includes("github.io");
const isFileMode = window.location.protocol === "file:";
const isStaticMode = isGithubPages || isFileMode;
const apiBase = isLocalStaticPreview ? "http://localhost:8080" : window.location.origin;
const patientsKey = "citycare_patients";
const appointmentsKey = "citycare_appointments";
const treatmentsKey = "citycare_treatments";
const usersKey = "citycare_users";
const tokenKey = "citycare_auth_token";
let useFallback = isStaticMode;
let authToken = localStorage.getItem(tokenKey) || "";

const authShell = document.getElementById("authShell");
const appShell = document.getElementById("appShell");
const currentUser = document.getElementById("currentUser");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const cards = document.querySelectorAll(".card");
const patientTable = document.getElementById("patientTable");
const appointmentTable = document.getElementById("appointmentTable");
const treatmentTable = document.getElementById("treatmentTable");
const statusText = document.getElementById("apiStatus");
const kpiPatients = document.getElementById("kpiPatients");
const kpiAppointments = document.getElementById("kpiAppointments");
const kpiTreatments = document.getElementById("kpiTreatments");

function setAuthView(showApp) {
  authShell.classList.toggle("hidden", showApp);
  appShell.classList.toggle("hidden", !showApp);
}

function showAuthPanel(panel) {
  const isLogin = panel === "login";
  showLoginBtn.classList.toggle("active", isLogin);
  showRegisterBtn.classList.toggle("active", !isLogin);
  loginPanel.classList.toggle("active", isLogin);
  registerPanel.classList.toggle("active", !isLogin);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.remove("active"));
    cards.forEach((card) => card.classList.remove("active"));
    button.classList.add("active");
    const target = document.getElementById(button.dataset.target);
    if (target) target.classList.add("active");
  });
});

function notify(message) {
  window.alert(message);
}

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

function setApiStatus(online) {
  statusText.classList.remove("online", "offline");
  if (online) {
    statusText.textContent = "API: connected";
    statusText.classList.add("online");
  } else {
    statusText.textContent = "API: demo mode (offline)";
    statusText.classList.add("offline");
  }
}

function getFallbackPatients() {
  const cached = localStorage.getItem(patientsKey);
  return cached ? JSON.parse(cached) : [];
}

function saveFallbackPatients(patients) {
  localStorage.setItem(patientsKey, JSON.stringify(patients));
}

function getFallbackAppointments() {
  const cached = localStorage.getItem(appointmentsKey);
  return cached ? JSON.parse(cached) : [];
}

function saveFallbackAppointments(appointments) {
  localStorage.setItem(appointmentsKey, JSON.stringify(appointments));
}

function getFallbackTreatments() {
  const cached = localStorage.getItem(treatmentsKey);
  return cached ? JSON.parse(cached) : [];
}

function saveFallbackTreatments(treatments) {
  localStorage.setItem(treatmentsKey, JSON.stringify(treatments));
}

function getLocalUsers() {
  const cached = localStorage.getItem(usersKey);
  return cached ? JSON.parse(cached) : [];
}

function saveLocalUsers(users) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

function validatePatient(data) {
  if (!data.name || !data.name.trim()) return "Please enter patient name.";
  if (!data.age || Number(data.age) < 1 || Number(data.age) > 120) return "Please enter a valid age.";
  if (!/^\d{10}$/.test(data.phone)) return "Phone number must be exactly 10 digits.";
  return "";
}

async function checkApi() {
  if (isStaticMode) {
    useFallback = true;
    setApiStatus(false);
    return;
  }

  try {
    const response = await fetch(`${apiBase}/health`, { method: "GET" });
    if (!response.ok) throw new Error("not ok");
    useFallback = false;
    setApiStatus(true);
  } catch (error) {
    useFallback = true;
    setApiStatus(false);
  }
}

async function registerUser() {
  const full_name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  if (!full_name || !email || password.length < 6) {
    notify("Enter full name, valid email, and password (min 6 chars).");
    return;
  }
  if (useFallback) {
    const users = getLocalUsers();
    const normalizedEmail = email.toLowerCase();
    const existing = users.find((user) => user.email === normalizedEmail);
    if (existing) {
      notify("Email already exists. Please login.");
      return;
    }
    const nextUserId = users.length ? Math.max(...users.map((u) => u.user_id)) + 1 : 1;
    users.push({
      user_id: nextUserId,
      full_name,
      email: normalizedEmail,
      password
    });
    saveLocalUsers(users);
    notify("Registration successful. Please login.");
    showAuthPanel("login");
    return;
  }

  const response = await fetch(`${apiBase}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password })
  });
  const body = await response.json();
  if (!response.ok) {
    notify(body.error || "Registration failed.");
    return;
  }
  notify("Registration successful. Please login.");
  showAuthPanel("login");
}

async function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) {
    notify("Enter email and password.");
    return;
  }
  if (useFallback) {
    const users = getLocalUsers();
    const normalizedEmail = email.toLowerCase();
    const user = users.find((item) => item.email === normalizedEmail && item.password === password);
    if (!user) {
      notify("Invalid credentials.");
      return;
    }
    authToken = `local-${Date.now()}`;
    localStorage.setItem(tokenKey, authToken);
    currentUser.textContent = user.full_name || "User";
    setAuthView(true);
    await refreshDashboard();
    return;
  }

  const response = await fetch(`${apiBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const body = await response.json();
  if (!response.ok) {
    notify(body.error || "Login failed.");
    return;
  }
  authToken = body.token || "";
  localStorage.setItem(tokenKey, authToken);
  currentUser.textContent = body.user?.full_name || "User";
  setAuthView(true);
  await checkApi();
  await refreshDashboard();
}

async function logoutUser() {
  try {
    if (authToken && !useFallback) {
      await fetch(`${apiBase}/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    }
  } catch (error) {
    // no-op
  }
  authToken = "";
  localStorage.removeItem(tokenKey);
  currentUser.textContent = "Guest";
  setAuthView(false);
}

async function checkSession() {
  await checkApi();

  if (!authToken) {
    setAuthView(false);
    return;
  }

  if (useFallback) {
    currentUser.textContent = "Local User";
    setAuthView(true);
    await refreshDashboard();
    return;
  }

  try {
    const response = await fetch(`${apiBase}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const body = await response.json();
    if (!response.ok || !body.authenticated) {
      throw new Error("Session expired");
    }
    currentUser.textContent = body.user?.full_name || "User";
    setAuthView(true);
    await checkApi();
    await refreshDashboard();
  } catch (error) {
    authToken = "";
    localStorage.removeItem(tokenKey);
    setAuthView(false);
  }
}

function renderPatients(patients) {
  kpiPatients.textContent = String(patients.length);
  if (!patients.length) {
    patientTable.innerHTML = '<tr><td class="empty-state" colspan="5">No patients available.</td></tr>';
    return;
  }

  patientTable.innerHTML = patients
    .map(
      (patient) => `
      <tr>
        <td>${patient.patient_id ?? "-"}</td>
        <td>${patient.name ?? "-"}</td>
        <td>${patient.age ?? "-"}</td>
        <td>${patient.gender ?? "-"}</td>
        <td>${patient.phone ?? "-"}</td>
      </tr>
    `
    )
    .join("");
}

function renderAppointments(appointments) {
  kpiAppointments.textContent = String(appointments.length);
  if (!appointments.length) {
    appointmentTable.innerHTML = '<tr><td class="empty-state" colspan="4">No appointments available.</td></tr>';
    return;
  }

  appointmentTable.innerHTML = appointments
    .map(
      (appointment) => `
      <tr>
        <td>${appointment.appointment_id ?? "-"}</td>
        <td>${appointment.patient_id ?? "-"}</td>
        <td>${appointment.doctor_id ?? "-"}</td>
        <td>${appointment.date ?? "-"}</td>
      </tr>
    `
    )
    .join("");
}

function renderTreatments(treatments) {
  kpiTreatments.textContent = String(treatments.length);
  if (!treatments.length) {
    treatmentTable.innerHTML = '<tr><td class="empty-state" colspan="4">No treatments available.</td></tr>';
    return;
  }

  treatmentTable.innerHTML = treatments
    .map(
      (treatment) => `
      <tr>
        <td>${treatment.treatment_id ?? "-"}</td>
        <td>${treatment.patient_id ?? "-"}</td>
        <td>${treatment.description ?? "-"}</td>
        <td>${treatment.cost ?? "-"}</td>
      </tr>
    `
    )
    .join("");
}

async function loadPatients() {
  if (!useFallback) {
    try {
      const response = await fetch(`${apiBase}/getPatients`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error("Failed to load patients");
      const patients = await response.json();
      renderPatients(Array.isArray(patients) ? patients : []);
      return;
    } catch (error) {
      useFallback = true;
      setApiStatus(false);
    }
  }
  renderPatients(getFallbackPatients());
}

async function loadAppointments() {
  if (useFallback) {
    renderAppointments(getFallbackAppointments());
    return;
  }
  try {
    const response = await fetch(`${apiBase}/getAppointments`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to load appointments");
    const appointments = await response.json();
    renderAppointments(Array.isArray(appointments) ? appointments : []);
  } catch (error) {
    useFallback = true;
    setApiStatus(false);
    renderAppointments([]);
  }
}

async function loadTreatments() {
  if (useFallback) {
    renderTreatments(getFallbackTreatments());
    return;
  }
  try {
    const response = await fetch(`${apiBase}/getTreatments`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to load treatments");
    const treatments = await response.json();
    renderTreatments(Array.isArray(treatments) ? treatments : []);
  } catch (error) {
    useFallback = true;
    setApiStatus(false);
    renderTreatments([]);
  }
}

async function refreshDashboard() {
  await loadPatients();
  await loadAppointments();
  await loadTreatments();
}

async function addPatient() {
  const data = {
    name: document.getElementById("pname").value.trim(),
    age: Number(document.getElementById("page").value),
    gender: document.getElementById("pgender").value,
    phone: document.getElementById("pphone").value.trim()
  };
  const validationError = validatePatient(data);
  if (validationError) {
    notify(validationError);
    return;
  }

  if (!useFallback) {
    try {
      const response = await fetch(`${apiBase}/addPatient`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to add patient");
      notify("Patient added successfully.");
      await refreshDashboard();
      return;
    } catch (error) {
      useFallback = true;
      setApiStatus(false);
    }
  }

  const patients = getFallbackPatients();
  const nextId = patients.length ? Math.max(...patients.map((p) => p.patient_id)) + 1 : 1;
  patients.push({ patient_id: nextId, ...data });
  saveFallbackPatients(patients);
  notify("Patient saved successfully.");
  await refreshDashboard();
}

async function bookAppointment() {
  const data = {
    patient_id: Number(document.getElementById("apatient").value),
    doctor_id: Number(document.getElementById("adoctor").value),
    date: document.getElementById("adate").value
  };
  if (!data.patient_id || !data.doctor_id || !data.date) {
    notify("Please fill all appointment fields.");
    return;
  }

  if (!useFallback) {
    try {
      const response = await fetch(`${apiBase}/bookAppointment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to book appointment");
      notify("Appointment booked successfully.");
      await refreshDashboard();
      return;
    } catch (error) {
      useFallback = true;
      setApiStatus(false);
    }
  }

  const appointments = getFallbackAppointments();
  const nextId = appointments.length ? Math.max(...appointments.map((a) => a.appointment_id)) + 1 : 1;
  appointments.push({
    appointment_id: nextId,
    patient_id: data.patient_id,
    doctor_id: data.doctor_id,
    date: data.date
  });
  saveFallbackAppointments(appointments);
  notify("Appointment saved successfully.");
  await refreshDashboard();
}

async function addTreatment() {
  const data = {
    patient_id: Number(document.getElementById("tpatient").value),
    description: document.getElementById("tdesc").value.trim(),
    cost: Number(document.getElementById("tcost").value)
  };
  if (!data.patient_id || !data.description || data.cost < 0 || Number.isNaN(data.cost)) {
    notify("Please enter valid treatment details.");
    return;
  }

  if (!useFallback) {
    try {
      const response = await fetch(`${apiBase}/addTreatment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to add treatment");
      notify("Treatment added successfully.");
      await refreshDashboard();
      return;
    } catch (error) {
      useFallback = true;
      setApiStatus(false);
    }
  }

  const treatments = getFallbackTreatments();
  const nextId = treatments.length ? Math.max(...treatments.map((t) => t.treatment_id)) + 1 : 1;
  treatments.push({
    treatment_id: nextId,
    patient_id: data.patient_id,
    description: data.description,
    cost: data.cost
  });
  saveFallbackTreatments(treatments);
  notify("Treatment saved successfully.");
  await refreshDashboard();
}

document.getElementById("addPatientBtn").addEventListener("click", addPatient);
document.getElementById("bookAppointmentBtn").addEventListener("click", bookAppointment);
document.getElementById("addTreatmentBtn").addEventListener("click", addTreatment);
document.getElementById("loadPatientsBtn").addEventListener("click", loadPatients);
document.getElementById("loadAppointmentsBtn").addEventListener("click", loadAppointments);
document.getElementById("loadTreatmentsBtn").addEventListener("click", loadTreatments);
showLoginBtn.addEventListener("click", () => showAuthPanel("login"));
showRegisterBtn.addEventListener("click", () => showAuthPanel("register"));
loginBtn.addEventListener("click", loginUser);
registerBtn.addEventListener("click", registerUser);
logoutBtn.addEventListener("click", logoutUser);

checkSession();
