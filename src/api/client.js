const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const IS_DEV = import.meta.env.DEV;

function getToken() {
  return localStorage.getItem("lrv_admin_token");
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al iniciar sesión");
  }
  const data = await res.json();
  localStorage.setItem("lrv_admin_token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("lrv_admin_token");
}

export function isAuthenticated() {
  return !!getToken();
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const fullUrl = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(fullUrl, { ...options, headers });
  } catch (networkErr) {
    console.error(`[apiFetch] Error de red → ${fullUrl}:`, networkErr.message);
    throw networkErr;
  }
  if (res.status === 404) {
    console.error(`[apiFetch] 404 Not Found → ${options.method || "GET"} ${fullUrl}`);
    const body = await res
      .clone()
      .json()
      .catch(() => null);
    if (body) console.error("[apiFetch] Respuesta 404:", body);
  }
  if (res.status === 401) {
    logout();
    window.location.href = "/admin/login";
    return;
  }
  return res;
}

// Listados (admin, con auth)
export async function getListings(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/listings?${q}`);
  if (!res.ok) throw new Error("Error al cargar anuncios");
  return res.json();
}

// Listado público (sin auth, para landing)
export async function getPublicListings(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/listings/public?${q}`);
  if (!res.ok) throw new Error("Error al cargar anuncios");
  return res.json();
}

export async function getListing(id) {
  const res = await apiFetch(`/listings/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Anuncio no encontrado");
    throw new Error("Error al cargar anuncio");
  }
  return res.json();
}

/** Detalle público (solo activas), sin auth. Para portal cliente. */
export async function getPublicListing(id) {
  const res = await fetch(`${API_BASE}/listings/public/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Anuncio no encontrado");
    throw new Error("Error al cargar anuncio");
  }
  return res.json();
}

/** Sube imágenes; devuelve array de URLs. Requiere auth. */
export async function uploadListingImages(files) {
  const token = getToken();
  const form = new FormData();
  for (let i = 0; i < files.length; i++) form.append("files", files[i]);
  const res = await fetch(`${API_BASE}/listings/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    if (res.status === 401) {
      logout();
      window.location.href = "/admin/login";
      return;
    }
    throw new Error("Error al subir imágenes");
  }
  return res.json();
}

export async function createListing(data) {
  const res = await apiFetch("/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.msg || err.detail || "Error al crear");
  }
  return res.json();
}

export async function updateListing(id, data) {
  const res = await apiFetch(`/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.msg || err.detail || "Error al actualizar");
  }
  return res.json();
}

export async function deleteListing(id) {
  const res = await apiFetch(`/listings/${id}`, { method: "DELETE" });
  if (!res) return;
  if (!res.ok) throw new Error("Error al eliminar");
}

// Visitas (público: crear; admin: listar, actualizar)
export async function createVisitRequest(data) {
  const url = `${API_BASE}/visits`;
  if (IS_DEV) {
    console.group("[createVisitRequest]");
    console.log("URL:", url);
    // Evitar loguear PII en prod; en dev puede ayudar al debugging
    console.log("Payload:", JSON.stringify(data, null, 2));
  }
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (networkErr) {
    console.error("Error de red (backend no responde):", networkErr.message);
    if (IS_DEV) console.groupEnd();
    throw new Error(
      "No se pudo conectar al servidor. Verificá que el backend esté corriendo en " + API_BASE,
    );
  }
  if (IS_DEV) console.log("Status HTTP:", res.status, res.statusText);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Respuesta de error:", err);
    if (IS_DEV) console.groupEnd();
    throw new Error(err.detail || "Error al enviar solicitud");
  }
  const result = await res.json();
  if (IS_DEV) console.log("Visita creada:", result);
  if (IS_DEV) console.groupEnd();
  return result;
}

export async function getVisits(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/visits?${q}`);
  if (!res.ok) throw new Error("Error al cargar visitas");
  return res.json();
}

export async function updateVisit(id, data) {
  const res = await apiFetch(`/visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al actualizar");
  }
  return res.json();
}

// Contabilidad (admin)
export async function getTransactions(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/transactions?${q}`);
  if (!res.ok) throw new Error("Error al cargar movimientos");
  return res.json();
}

export async function getBalance(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/transactions/balance?${q}`);
  if (!res.ok) throw new Error("Error al cargar balance");
  return res.json();
}

export async function createTransaction(data) {
  const res = await apiFetch("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al crear");
  }
  return res.json();
}

export async function updateTransaction(id, data) {
  const res = await apiFetch(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al actualizar");
  }
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await apiFetch(`/transactions/${id}`, { method: "DELETE" });
  if (!res) return;
  if (!res.ok) throw new Error("Error al eliminar");
}

export async function getNotificationCounts() {
  const res = await apiFetch("/notifications/counts");
  if (!res.ok) return { pending_visits: 0, pending_listings: 0, total: 0 };
  return res.json();
}

export async function getDashboardStats() {
  const res = await apiFetch("/dashboard/stats");
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json();
}

export async function getVisitsByListing(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/dashboard/visits-by-listing?${q}`);
  if (!res.ok) throw new Error("Error al cargar ranking");
  return res.json();
}

export async function exportTransactionsCsv(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch(`/transactions/export/csv?${q}`);
  if (!res.ok) throw new Error("Error al exportar");
  return res.blob();
}
