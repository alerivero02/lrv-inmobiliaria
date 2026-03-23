/**
 * VisitRequestForm — Formulario de solicitud de visita reutilizable.
 * Usado en: Contact.jsx, PropertyDetailModal.jsx, RequestVisitPage.jsx
 */
import { useState, useMemo, useRef, useEffect, useCallback, useId } from "react";
import { format, startOfDay } from "date-fns";
import FDatepicker from "@liedekef/fdatepicker";
import { createVisitRequest, getOccupiedVisitSlots } from "../api/client";
import "../vendor/fdatepicker.css";
import "./VisitRequestForm.css";

const TIME_OPTIONS = [];
for (let h = 8; h <= 18; h++) {
  for (const m of ["00", "30"]) {
    if (h === 18 && m === "30") break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

const FDATEPICKER_ES = {
  days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
  months: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  today: "Hoy",
  clear: "Borrar",
  close: "Cerrar",
  format: "D j M Y · H:i",
  firstDayOfWeek: 1,
  noDatesSelected: "No hay fechas seleccionadas",
  singleDateSelected: "1 fecha seleccionada",
  multipleDatesSelected: "{count} fechas seleccionadas",
  datesSelected: "Fechas seleccionadas ({0}):",
};

const EMPTY_FORM = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  fecha: "",
  hora: "10:00",
  mensaje: "",
};

function slotKey(fecha, hora) {
  return `${fecha}|${hora}`;
}

/** Horarios posibles para un día según regla de 48 h. */
function getTimesForDay(ds, minAllowed) {
  const minDay = startOfDay(minAllowed);
  const selDay = startOfDay(new Date(`${ds}T12:00:00`));
  if (selDay.getTime() < minDay.getTime()) return [];
  if (selDay.getTime() === minDay.getTime()) {
    return TIME_OPTIONS.filter((t) => new Date(`${ds}T${t}:00`).getTime() >= minAllowed.getTime());
  }
  return [...TIME_OPTIONS];
}

/** Primer día y hora posibles a partir de minAllowed (≥ 48 h), sin cruzar ocupados. */
function getNextVisitSlot(minAllowed, maxBookEndDay, occupiedSet) {
  const minMs = minAllowed.getTime();
  const startDay = startOfDay(minAllowed);
  const endDay = startOfDay(maxBookEndDay);
  for (let i = 0; i < 130; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    if (startOfDay(d) > endDay) break;
    const ds = format(d, "yyyy-MM-dd");
    for (const t of getTimesForDay(ds, minAllowed)) {
      const dt = new Date(`${ds}T${t}:00`);
      if (dt.getTime() >= minMs && !occupiedSet.has(slotKey(ds, t))) {
        return { fecha: ds, hora: t };
      }
    }
  }
  return { fecha: format(minAllowed, "yyyy-MM-dd"), hora: "10:00" };
}

/** Primer hueco válido en rejilla (48 h + 8–18), sin filtrar ocupación — para clamp interno. */
function getNextSlotAfterMin(minAllowed) {
  const minMs = minAllowed.getTime();
  const startDay = startOfDay(minAllowed);
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    const ds = format(d, "yyyy-MM-dd");
    for (const t of TIME_OPTIONS) {
      const dt = new Date(`${ds}T${t}:00`);
      if (dt.getTime() >= minMs) return new Date(`${ds}T${t}:00`);
    }
  }
  return new Date(minAllowed);
}

/** Ajusta a rejilla 30 min, horario 8–18 y regla de 48 h (sin mirar ocupación). */
function clampVisitDate(d, minAllowed) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  x.setMilliseconds(0);
  const mins = x.getHours() * 60 + x.getMinutes();
  const snappedTotal = Math.round(mins / 30) * 30;
  let h = Math.floor(snappedTotal / 60);
  let m = snappedTotal % 60;
  if (h < 8) {
    h = 8;
    m = 0;
  }
  if (h > 18 || (h === 18 && m > 0)) {
    h = 18;
    m = 0;
  }
  x.setHours(h, m, 0, 0);
  if (x.getTime() < minAllowed.getTime()) {
    return getNextSlotAfterMin(minAllowed);
  }
  return x;
}

/** Próximo turno libre desde una fecha/hora (puede ser el mismo si ya está libre). */
function findNextFreeSlot(fromDate, minAllowed, maxBookEndDay, occupiedSet) {
  let cursor = clampVisitDate(new Date(fromDate), minAllowed);
  if (cursor.getTime() < minAllowed.getTime()) cursor = new Date(minAllowed);
  const endDay = startOfDay(maxBookEndDay);
  for (let step = 0; step < 400; step++) {
    cursor = clampVisitDate(cursor, minAllowed);
    if (startOfDay(cursor) > endDay) return null;
    const fecha = format(cursor, "yyyy-MM-dd");
    const hora = `${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`;
    if (!TIME_OPTIONS.includes(hora)) {
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
      continue;
    }
    if (new Date(`${fecha}T${hora}:00`).getTime() < minAllowed.getTime()) {
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
      continue;
    }
    if (!occupiedSet.has(slotKey(fecha, hora))) {
      return { fecha, hora, date: new Date(`${fecha}T${hora}:00`) };
    }
    cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
  }
  return null;
}

function computeFullyBookedDays(minAllowed, maxBookEndDay, occupiedSet) {
  const out = [];
  let d = startOfDay(minAllowed);
  const endDay = startOfDay(maxBookEndDay);
  while (d <= endDay) {
    const ds = format(d, "yyyy-MM-dd");
    const times = getTimesForDay(ds, minAllowed);
    const anyFree = times.some((t) => {
      if (new Date(`${ds}T${t}:00`).getTime() < minAllowed.getTime()) return false;
      return !occupiedSet.has(slotKey(ds, t));
    });
    if (times.length > 0 && !anyFree) out.push(ds);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function VisitRequestForm({
  listingId = null,
  onSuccess,
  submitLabel = "Solicitar visita",
  className = "",
}) {
  const bookingRef = useRef(null);
  if (!bookingRef.current) {
    const minAllowed = new Date();
    minAllowed.setHours(minAllowed.getHours() + 48);
    const maxBook = new Date(minAllowed);
    maxBook.setDate(maxBook.getDate() + 120);
    bookingRef.current = {
      minAllowed,
      maxBook,
    };
  }
  const { minAllowed, maxBook } = bookingRef.current;
  const maxBookEndDay = useMemo(() => startOfDay(maxBook), [maxBook]);

  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const occupiedSet = useMemo(() => {
    const s = new Set();
    for (const x of occupiedSlots) {
      if (x?.date && x?.time) s.add(slotKey(String(x.date).slice(0, 10), String(x.time).slice(0, 5)));
    }
    return s;
  }, [occupiedSlots]);

  const fullyBookedDays = useMemo(
    () => computeFullyBookedDays(minAllowed, maxBookEndDay, occupiedSet),
    [minAllowed, maxBookEndDay, occupiedSet],
  );

  const firstSlot = useMemo(
    () => getNextVisitSlot(minAllowed, maxBookEndDay, occupiedSet),
    [minAllowed, maxBookEndDay, occupiedSet],
  );

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    fecha: "",
    hora: "10:00",
  }));

  const formInitializedRef = useRef(false);
  useEffect(() => {
    if (!slotsLoaded || formInitializedRef.current) return;
    formInitializedRef.current = true;
    setForm((f) => ({
      ...f,
      fecha: firstSlot.fecha,
      hora: firstSlot.hora,
    }));
  }, [slotsLoaded, firstSlot.fecha, firstSlot.hora]);

  const [error, setError] = useState("");
  /** Avisos de fecha/hora (picker y validación de turno) — inline bajo el calendario */
  const [bookingNotice, setBookingNotice] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const bookingNoticeRef = useRef(null);
  const bookingNoticeId = useId();
  useEffect(() => {
    if (!bookingNotice?.text) return;
    bookingNoticeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [bookingNotice]);

  const fDateInputRef = useRef(null);
  const pickerInstRef = useRef(null);
  const minAllowedRef = useRef(minAllowed);
  const maxBookEndDayRef = useRef(maxBookEndDay);
  const occupiedSetRef = useRef(occupiedSet);
  minAllowedRef.current = minAllowed;
  maxBookEndDayRef.current = maxBookEndDay;
  occupiedSetRef.current = occupiedSet;

  useEffect(() => {
    let cancelled = false;
    getOccupiedVisitSlots()
      .then((r) => {
        if (!cancelled) setOccupiedSlots(Array.isArray(r?.slots) ? r.slots : []);
      })
      .catch(() => {
        if (!cancelled) setOccupiedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availableTimes = useMemo(() => {
    if (!form.fecha) return TIME_OPTIONS;
    return getTimesForDay(form.fecha, minAllowed).filter((t) => !occupiedSet.has(slotKey(form.fecha, t)));
  }, [form.fecha, minAllowed, occupiedSet]);

  useEffect(() => {
    if (!slotsLoaded || !form.fecha) return;
    if (availableTimes.length === 0) {
      const next = findNextFreeSlot(new Date(`${form.fecha}T12:00:00`), minAllowed, maxBookEndDay, occupiedSet);
      if (next) {
        setBookingNotice({
          type: "info",
          text: "Ese día ya no tiene turnos libres. Te mostramos el próximo disponible.",
        });
        setForm((f) => ({ ...f, fecha: next.fecha, hora: next.hora }));
      }
      return;
    }
    if (!availableTimes.includes(form.hora)) {
      setForm((f) => ({ ...f, hora: availableTimes[0] }));
    }
  }, [form.fecha, availableTimes, form.hora, slotsLoaded, minAllowed, maxBookEndDay, occupiedSet]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const syncFromPicker = useCallback((rawDate, inst) => {
    if (!rawDate || Number.isNaN(new Date(rawDate).getTime())) {
      setBookingNotice({ type: "error", text: "Fecha u hora no válida. Elegí otra combinación." });
      return;
    }
    const minA = minAllowedRef.current;
    const endD = maxBookEndDayRef.current;
    const occ = occupiedSetRef.current;

    let picked = clampVisitDate(new Date(rawDate), minA);

    if (startOfDay(picked) > endD) {
      setBookingNotice({
        type: "error",
        text: "La fecha está fuera del rango permitido para agendar visitas.",
      });
      return;
    }

    let fecha = format(picked, "yyyy-MM-dd");
    let hora = `${String(picked.getHours()).padStart(2, "0")}:${String(picked.getMinutes()).padStart(2, "0")}`;

    if (!TIME_OPTIONS.includes(hora)) {
      setBookingNotice({
        type: "error",
        text: "El horario debe ser entre las 8:00 y las 18:00, en intervalos de 30 minutos.",
      });
      return;
    }

    if (new Date(`${fecha}T${hora}:00`).getTime() < minA.getTime()) {
      setBookingNotice({
        type: "info",
        text: "La visita debe ser al menos 48 horas desde ahora. Ajustamos al próximo turno disponible.",
      });
      const next = findNextFreeSlot(minA, minA, endD, occ);
      if (next) {
        picked = next.date;
        fecha = next.fecha;
        hora = next.hora;
        setForm((f) => ({ ...f, fecha, hora }));
        queueMicrotask(() => inst?.setDate(picked, false));
      }
      return;
    }

    if (occ.has(slotKey(fecha, hora))) {
      const next = findNextFreeSlot(new Date(picked.getTime() + 30 * 60 * 1000), minA, endD, occ);
      if (next) {
        setBookingNotice({
          type: "info",
          text: "Ese día y horario ya están ocupados. Te sugerimos este otro turno.",
        });
        picked = next.date;
        setForm((f) => ({ ...f, fecha: next.fecha, hora: next.hora }));
        queueMicrotask(() => inst?.setDate(picked, false));
      } else {
        setBookingNotice({
          type: "error",
          text: "No hay turnos libres en las fechas disponibles. Contactanos por otro medio.",
        });
      }
      return;
    }

    setBookingNotice(null);
    setForm((f) => ({ ...f, fecha, hora }));
    queueMicrotask(() => inst?.setDate(picked, false));
  }, []);

  const syncFromPickerRef = useRef(syncFromPicker);
  syncFromPickerRef.current = syncFromPicker;

  useEffect(() => {
    const el = fDateInputRef.current;
    if (!el) return;

    FDatepicker.setMessages(FDATEPICKER_ES);

    const keepTriggerReadOnly = () => {
      el.readOnly = true;
      el.setAttribute("readonly", "readonly");
    };

    const dp = new FDatepicker(el, {
      format: "D j M Y · H:i",
      minDate: startOfDay(minAllowed),
      maxDate: maxBook,
      disabledDates: fullyBookedDays.length ? [...fullyBookedDays] : [],
      timepicker: true,
      ampm: false,
      autoClose: false,
      minutesStep: 30,
      hoursStep: 1,
      minHours: 8,
      maxHours: 18,
      minMinutes: 0,
      maxMinutes: 30,
      clearButton: false,
      closeButton: true,
      todayButton: true,
      timepickerDefaultNow: false,
      onOpen() {
        keepTriggerReadOnly();
        setBookingNotice(null);
      },
      onSelect(_formatted, date) {
        if (!date) return;
        syncFromPickerRef.current(date, pickerInstRef.current);
      },
      onClose() {
        keepTriggerReadOnly();
        const inst = pickerInstRef.current;
        if (!inst?.selectedDate) return;
        syncFromPickerRef.current(inst.selectedDate, inst);
      },
    });

    keepTriggerReadOnly();

    pickerInstRef.current = dp;

    return () => {
      dp.destroy();
      pickerInstRef.current = null;
    };
  }, []);

  useEffect(() => {
    const inst = pickerInstRef.current;
    if (!inst) return;
    inst.update("disabledDates", fullyBookedDays.length ? [...fullyBookedDays] : []);
  }, [fullyBookedDays]);

  useEffect(() => {
    if (!slotsLoaded || !form.fecha) return;
    const inst = pickerInstRef.current;
    if (!inst) return;
    const d = new Date(`${form.fecha}T${form.hora}:00`);
    if (Number.isNaN(d.getTime())) return;
    inst.setDate(clampVisitDate(d, minAllowed), false);
  }, [form.fecha, form.hora, minAllowed, slotsLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBookingNotice(null);

    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      setError("Completá los campos obligatorios: nombre, email y teléfono.");
      return;
    }
    if (!form.fecha) {
      setBookingNotice({ type: "error", text: "Seleccioná una fecha de visita." });
      return;
    }

    const visitDate = new Date(`${form.fecha}T${form.hora}:00`);
    if (visitDate < minAllowed) {
      setBookingNotice({
        type: "error",
        text: "La visita debe ser al menos 48 horas desde ahora. Elegí otra fecha u hora.",
      });
      return;
    }

    if (startOfDay(visitDate) > maxBookEndDay) {
      setBookingNotice({
        type: "error",
        text: "La fecha está fuera del rango permitido para agendar.",
      });
      return;
    }

    if (!TIME_OPTIONS.includes(form.hora)) {
      setBookingNotice({
        type: "error",
        text: "El horario debe ser entre las 8:00 y las 18:00, cada 30 minutos.",
      });
      return;
    }

    if (occupiedSet.has(slotKey(form.fecha, form.hora))) {
      setBookingNotice({
        type: "error",
        text: "Ese día y horario ya tienen una visita solicitada o confirmada. Elegí otro turno.",
      });
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
      const msg = err.message || "No se pudo enviar. Intentá de nuevo.";
      if (err.status === 409) {
        setError("");
        setBookingNotice({ type: "error", text: msg });
      } else {
        setError(msg);
      }
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

      <div className="vrf__datetime-block">
        <span className="vrf__label" id="vrf-dt-label">
          Fecha y hora preferida{" "}
          <span className="vrf__req" aria-hidden>
            *
          </span>
          <span className="vrf__hint"> (mín. 48 hs desde ahora)</span>
        </span>
        <div className="vrf__datetime-row">
          <div className="vrf__fdatepicker-wrap">
            <input
              ref={fDateInputRef}
              type="text"
              className="vrf__fdatepicker-input"
              aria-labelledby="vrf-dt-label"
              aria-describedby={bookingNotice ? bookingNoticeId : undefined}
              aria-invalid={bookingNotice?.type === "error" ? true : undefined}
              aria-haspopup="dialog"
              autoComplete="off"
              spellCheck={false}
              inputMode="none"
              readOnly
            />
          </div>
        </div>
        {bookingNotice?.text && (
          <p
            ref={bookingNoticeRef}
            id={bookingNoticeId}
            className={`vrf__booking-notice vrf__booking-notice--${bookingNotice.type}`}
            role={bookingNotice.type === "error" ? "alert" : "status"}
          >
            {bookingNotice.text}
          </p>
        )}
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
