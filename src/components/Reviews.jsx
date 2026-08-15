import { useEffect, useState } from "react";
import { createReview, getFeaturedReviews, getReviewInvite } from "../api/client";
import { useInView } from "../hooks/useInView";
import "./Reviews.css";

function Stars({ rating }) {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="reviews__stars" aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <span className="reviews__stars-empty">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function readInviteToken() {
  if (typeof window === "undefined") return "";
  const fromSearch = new URLSearchParams(window.location.search).get("invite");
  if (fromSearch) return fromSearch.trim();
  const hash = window.location.hash || "";
  const q = hash.indexOf("?");
  if (q >= 0) {
    return (new URLSearchParams(hash.slice(q + 1)).get("invite") || "").trim();
  }
  return "";
}

const emptyForm = {
  author_name: "",
  author_email: "",
  author_phone: "",
  rating: 5,
  body: "",
  website: "",
};

export default function Reviews() {
  const { ref: headerRef, isInView: headerInView } = useInView({ threshold: 0.3 });
  const { ref: bodyRef, isInView: bodyInView } = useInView({ threshold: 0.15 });
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteOk, setInviteOk] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFeaturedReviews()
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "No se pudieron cargar las reseñas");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = readInviteToken();
    if (!token) return;
    let cancelled = false;
    setInviteToken(token);
    getReviewInvite(token)
      .then((inv) => {
        if (cancelled) return;
        setInviteOk(true);
        setInviteMsg("Invitación válida: podés dejar tu reseña de la operación.");
        setForm((f) => ({
          ...f,
          author_name: inv.client_name || f.author_name,
          author_email: inv.client_email || f.author_email,
          author_phone: inv.client_phone || f.author_phone,
        }));
        document.getElementById("resenas")?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch((err) => {
        if (cancelled) return;
        setInviteOk(false);
        setInviteMsg(err.message || "Invitación no válida");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormOk("");
    setSubmitting(true);
    try {
      const payload = {
        author_name: form.author_name.trim(),
        author_email: form.author_email.trim(),
        author_phone: form.author_phone.trim() || undefined,
        rating: Number(form.rating),
        body: form.body.trim(),
        website: form.website,
      };
      if (inviteToken && inviteOk) payload.invite_token = inviteToken;
      const res = await createReview(payload);
      setFormOk(res.detail || "Gracias. Revisaremos tu reseña antes de publicarla.");
      setForm(emptyForm);
      setInviteToken("");
      setInviteOk(false);
      setInviteMsg("");
    } catch (err) {
      setFormError(err.message || "No se pudo enviar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section reviews texture-bone" id="resenas" aria-labelledby="reviews-title">
      <div className="container">
        <header
          ref={headerRef}
          className={`reviews__header reveal${headerInView ? " reveal--visible" : ""}`}
        >
          <p className="reviews__eyebrow">
            <span className="reviews__eyebrow-line" aria-hidden />
            Lo que dicen de nosotros
          </p>
          <h2 id="reviews-title" className="section-title reviews__title">
            Reseñas
          </h2>
          <p className="section-subtitle reviews__subtitle">
            Conocé la experiencia de quienes han confiado en LRV para encontrar la propiedad adecuada.
          </p>
        </header>

        <div
          ref={bodyRef}
          className={`reviews__layout reveal${bodyInView ? " reveal--visible" : ""}`}
        >
          <div className="reviews__list" aria-live="polite">
            {loadError && <p className="reviews__msg reviews__msg--error">{loadError}</p>}
            {!loadError && items.length === 0 && (
              <p className="reviews__msg">Pronto vas a ver acá las opiniones de nuestros clientes.</p>
            )}
            {items.map((item) => (
              <article key={item.id} className="reviews__card">
                <Stars rating={item.rating} />
                <blockquote className="reviews__quote">“{item.body}”</blockquote>
                <p className="reviews__author">{item.author_name}</p>
              </article>
            ))}
          </div>

          <form className="reviews__form" onSubmit={onSubmit} noValidate>
            <h3 className="reviews__form-title">Dejá tu reseña</h3>
            <p className="reviews__form-lead">
              {inviteOk
                ? "Recibiste un link de LRV tras tu operación. Completá y enviá: queda en revisión antes de publicarse."
                : "Si te invitaron con un link post-venta, abrilo desde ese mensaje. También aceptamos reseñas de visitas confirmadas (mismo email o teléfono)."}
            </p>

            {inviteMsg && (
              <p className={`reviews__msg ${inviteOk ? "reviews__msg--ok" : "reviews__msg--error"}`}>
                {inviteMsg}
              </p>
            )}

            <label className="reviews__hp" aria-hidden="true">
              Sitio web
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>

            <label>
              Nombre *
              <input
                required
                value={form.author_name}
                onChange={(e) => update("author_name", e.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              Email *
              <input
                required
                type="email"
                value={form.author_email}
                onChange={(e) => update("author_email", e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Teléfono (opcional)
              <input
                type="tel"
                value={form.author_phone}
                onChange={(e) => update("author_phone", e.target.value)}
                maxLength={40}
              />
            </label>
            <label>
              Calificación *
              <select
                value={form.rating}
                onChange={(e) => update("rating", Number(e.target.value))}
                required
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "estrella" : "estrellas"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tu experiencia *
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={(e) => update("body", e.target.value)}
                maxLength={800}
                placeholder="Contanos cómo fue la atención y la operación…"
              />
            </label>

            {formError && <p className="reviews__msg reviews__msg--error">{formError}</p>}
            {formOk && <p className="reviews__msg reviews__msg--ok">{formOk}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar reseña"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
