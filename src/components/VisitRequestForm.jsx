/**
 * VisitRequestForm — Formulario de solicitud de visita reutilizable.
 * Usado en: Contact.jsx, PropertyDetailModal.jsx, RequestVisitPage.jsx
 *
 * Props:
 *   listingId?   number | string  — ID de propiedad a vincular (opcional)
 *   onSuccess?   () => void       — Callback tras envío exitoso
 *   submitLabel? string           — Texto del botón (default: "Solicitar visita")
 *   className?   string           — Clase CSS extra para el formulario
 */
import { useState, useMemo } from "react";
import { format } from "date-fns";
import CalendarInline from "./CalendarInline";
import { createVisitRequest } from "../api/client";
import "./VisitRequestForm.css";

const TIME_OPTIONS = [];
for (let h = 8; h <= 18; h++) {
  for (const m of ["00", "30"]) {
    if (h === 18 && m === "30") break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  fecha: "",
  hora: "10:00",
  mensaje: "",
};

export default function VisitRequestForm({
  listingId = null,
  onSuccess,
  submitLabel = "Solicitar visita",
  className = "",
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const minDateStr = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + 48);
    return d.toISOString().slice(0, 10);
  }, []);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      setError("Completá los campos obligatorios: nombre, email y teléfono.");
      return;
    }
    if (!form.fecha) {
      setError("Seleccioná una fecha de visita.");
      return;
    }

    const visitDate = new Date(`${form.fecha}T${form.hora}:00`);
    const minAllowed = new Date();
    minAllowed.setHours(minAllowed.getHours() + 48);
    if (visitDate < minAllowed) {
      setError("La visita debe ser al menos 48 horas desde ahora.");
      return;
    }

    setSending(true);
    try {
      await createVisitRequest({
        listing_id: listingId ? Number(listingId) : null,
        name: `${form.nombre.trim()} ${form.apellido.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.telefono.trim(),
        preferred_date: form.fecha,
        preferred_time: form.hora,
        message: form.mensaje.trim() || null,
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "No se pudo enviar. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="vrf__success" role="status">
        <span className="vrf__success-icon" aria-hidden>
          ✓
        </span>
        <p>¡Solicitud enviada! Te contactaremos para confirmar la visita. Revisá tu email.</p>
      </div>
    );
  }

  return (
    <form className={`vrf ${className}`} onSubmit={handleSubmit} noValidate>
      <div className="vrf__row">
        <label className="vrf__field">
          <span className="vrf__label">
            Nombre{" "}
            <span className="vrf__req" aria-hidden>
              *
            </span>
          </span>
          <input
            className="vrf__input"
            type="text"
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            required
            autoComplete="given-name"
            placeholder="Tu nombre"
          />
        </label>
        <label className="vrf__field">
          <span className="vrf__label">Apellido</span>
          <input
            className="vrf__input"
            type="text"
            value={form.apellido}
            onChange={(e) => update("apellido", e.target.value)}
            autoComplete="family-name"
            placeholder="Tu apellido"
          />
        </label>
      </div>

      <label className="vrf__field">
        <span className="vrf__label">
          Email{" "}
          <span className="vrf__req" aria-hidden>
            *
          </span>
        </span>
        <input
          className="vrf__input"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
          autoComplete="email"
          placeholder="tu@email.com"
        />
      </label>

      <label className="vrf__field">
        <span className="vrf__label">
          Teléfono{" "}
          <span className="vrf__req" aria-hidden>
            *
          </span>
        </span>
        <input
          className="vrf__input"
          type="tel"
          value={form.telefono}
          onChange={(e) => update("telefono", e.target.value)}
          required
          autoComplete="tel"
          placeholder="(0) 380 123 4567"
        />
      </label>

      <div className="vrf__date-row">
        <CalendarInline
          label="Fecha preferida * (mín. 48 hs desde hoy)"
          value={form.fecha}
          minDate={minDateStr}
          onChange={(date) => update("fecha", format(date, "yyyy-MM-dd"))}
        />
        <label className="vrf__field vrf__field--time">
          <span className="vrf__label">Hora preferida</span>
          <select
            className="vrf__input vrf__select"
            value={form.hora}
            onChange={(e) => update("hora", e.target.value)}
            aria-label="Hora de visita"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="vrf__field">
        <span className="vrf__label">Mensaje (opcional)</span>
        <textarea
          className="vrf__input vrf__textarea"
          value={form.mensaje}
          onChange={(e) => update("mensaje", e.target.value)}
          rows={3}
          placeholder="¿Querés agregar algún comentario o indicar la propiedad que te interesa?"
        />
      </label>

      {error && (
        <p className="vrf__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary vrf__submit" disabled={sending}>
        {sending ? "Enviando…" : submitLabel}
      </button>
    </form>
  );
}
