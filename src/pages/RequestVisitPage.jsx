import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VisitRequestForm from "../components/VisitRequestForm";
import { getPublicListing } from "../api/client";
import { useSeo } from "../hooks/useSeo";
import { DEFAULT_META_DESCRIPTION } from "../utils/seo";
import "./RequestVisitPage.css";

export default function RequestVisitPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const seoTitle = loading
    ? "Solicitar visita"
    : !listing
      ? "Propiedad no encontrada"
      : success
        ? "Solicitud enviada"
        : `Solicitar visita: ${listing.title}`;

  useSeo({
    title: seoTitle,
    description:
      listing && !success
        ? `Coordiná una visita con LRV Inmobiliaria — ${listing.title} en La Rioja.`
        : DEFAULT_META_DESCRIPTION,
    canonicalPath: id ? `/propiedades/${id}/solicitar-visita` : "/propiedades",
    noIndex: Boolean(!loading && !listing && id),
  });

  useEffect(() => {
    if (!id) return;
    getPublicListing(id)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="request-visit-page">
          <div className="container">
            <p>Cargando…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Header />
        <main className="request-visit-page">
          <div className="container">
            <p className="request-visit-page__error">Propiedad no encontrada.</p>
            <Link to="/propiedades">Ver propiedades</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="request-visit-page">
          <div className="container request-visit-page__card">
            <h1>Solicitud enviada</h1>
            <p>
              Recibimos tu solicitud de visita. Te contactaremos para confirmarla. Revisá tu email.
            </p>
            <Link to="/propiedades" className="btn btn-primary">
              Volver a propiedades
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="request-visit-page">
        <div className="container">
          <h1 className="request-visit-page__title">Solicitar visita</h1>
          <p className="request-visit-page__subtitle">Propiedad: {listing.title}</p>

          <VisitRequestForm
            listingId={id}
            submitLabel="Enviar solicitud"
            onSuccess={() => setSuccess(true)}
            className="request-visit-page__form"
          />

          <div className="request-visit-page__actions">
            <Link to={`/propiedades/${id}`} className="btn btn-outline">
              Cancelar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
