/** Relativo `/api` → mismo origen (Vite proxy → backend :4000 en dev). */
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const IS_DEV = import.meta.env.DEV;
const PROFILE_KEY = "lrv_admin_profile";
const BLOCKED_REMOTE_IMAGE_HOSTS = ["fbcdn.net", "cdninstagram.com"];

function getApiOrigin() {
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  try {
    return new URL(API_BASE, fallbackOrigin).origin;
  } catch {
    return fallbackOrigin;
  }
}

function isBlockedRemoteImageUrl(url) {
  if (typeof url !== "string") return false;
  const value = url.trim();
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return BLOCKED_REMOTE_IMAGE_HOSTS.some(
      (blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`),
    );
  } catch {
    return false;
  }
}

export function isUnsupportedRemoteImageUrl(url) {
  return isBlockedRemoteImageUrl(url);
}

/** Público: convierte `/uploads/...` en URL absoluta para `<img src>`. */
export function resolveImageUrl(url) {
  if (typeof url !== "string" || !url.trim()) return url;
  if (isBlockedRemoteImageUrl(url)) return null;
  if (/^(data:|blob:)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const path = url.startsWith("uploads/") ? `/${url}` : url.startsWith("/uploads/") ? url : null;
  if (!path) return url;

  const apiBase = String(API_BASE || "").trim();
  // API relativa (/api) → mismo origen que la página (Vite proxy /uploads o Express en prod)
  if (typeof window !== "undefined" && apiBase.startsWith("/")) {
    return `${window.location.origin}${path}`;
  }

  const apiOrigin = getApiOrigin();
  return `${apiOrigin}${path}`;
}

function normalizeListingImages(listing) {
  if (!listing || !Array.isArray(listing.images)) return listing;
  return {
    ...listing,
    images: listing.images
      .map(resolveImageUrl)
      .filter((img) => typeof img === "string" && img.trim().length > 0),
  };
}

function getToken() {
  return localStorage.getItem("lrv_admin_token");
}

export function getStoredAdminProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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
  if (data.user) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
  return data;
}

export async function refreshAdminProfile() {
  const res = await apiFetch("/auth/me");
  if (!res || !res.ok) return null;
  const u = await res.json();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(u));
  return u;
}

export function logout() {
  localStorage.removeItem("lrv_admin_token");
  localStorage.removeItem(PROFILE_KEY);
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
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeListingImages) : data;
}

// Listado público (sin auth, para landing)
export async function getPublicListings(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/listings/public?${q}`);
  if (!res.ok) throw new Error("Error al cargar anuncios");
  const data = await res.json();
  if (!data || !Array.isArray(data.items)) return data;
  return {
    ...data,
    items: data.items.map(normalizeListingImages),
  };
}

export async function getListing(id) {
  const res = await apiFetch(`/listings/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Anuncio no encontrado");
    throw new Error("Error al cargar anuncio");
  }
  return normalizeListingImages(await res.json());
}

/** Detalle público (solo activas), sin auth. Para portal cliente. */
export async function getPublicListing(id) {
  const res = await fetch(`${API_BASE}/listings/public/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Anuncio no encontrado");
    throw new Error("Error al cargar anuncio");
  }
  return normalizeListingImages(await res.json());
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
  const data = await res.json();
  return Array.isArray(data) ? data.map(resolveImageUrl) : data;
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
  return normalizeListingImages(await res.json());
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
  return normalizeListingImages(await res.json());
}

export async function deleteListing(id) {
  const res = await apiFetch(`/listings/${id}`, { method: "DELETE" });
  if (!res) return;
  if (!res.ok) throw new Error("Error al eliminar");
}

// Visitas (público: crear; admin: listar, actualizar)
/** Turnos ya tomados (pending/confirmed) para no solapar solicitudes. Público, sin auth. */
export async function getOccupiedVisitSlots() {
  const res = await fetch(`${API_BASE}/visits/occupied-slots`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "No se pudo cargar la disponibilidad");
  }
  return res.json();
}

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
    const msg = err.detail || "Error al enviar solicitud";
    const e = new Error(msg);
    e.status = res.status;
    throw e;
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
  const zeros = { pending_visits: 0, pending_listings: 0, total: 0 };
  try {
    const res = await apiFetch("/notifications/counts");
    if (!res || !res.ok) return zeros;
    return await res.json();
  } catch {
    return zeros;
  }
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

// Usuarios (solo rol admin en el backend)
export async function getUsers() {
  const res = await apiFetch("/users");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al cargar usuarios");
  }
  return res.json();
}

export async function inviteUser(email, role) {
  const res = await apiFetch("/users/invite", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
  const errBody = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errBody.detail || "No se pudo enviar la invitación");
  return errBody;
}

export async function resendUserInvite(userId) {
  const res = await apiFetch(`/users/${userId}/resend-invite`, { method: "POST" });
  const errBody = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errBody.detail || "No se pudo reenviar el correo");
  return errBody;
}

/** Activa cuenta desde enlace del correo (sin sesión). */
export async function completeAccountActivation(token, password) {
  const res = await fetch(`${API_BASE}/auth/complete-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "Error al activar la cuenta");
  return body;
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "No se pudo procesar la solicitud");
  return body;
}

export async function resetPasswordWithToken(token, password) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "Error al restablecer la contraseña");
  return body;
}

export async function changePassword(currentPassword, newPassword) {
  const res = await apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (!res) return;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || "No se pudo cambiar la contraseña");
  return body;
}
