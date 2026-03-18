import VisitRequestForm from "./VisitRequestForm";
import "./Contact.css";

const WHATSAPP_NUMBER = import.meta.env.VITE_AGENCY_WHATSAPP || "5493804545701";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quería consultar sobre una propiedad.")}`;

export default function Contact() {
  return (
    <section className="section contact" id="contacto" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact__grid">
          {/* ── Columna izquierda: info ───────────────────────────────── */}
          <div className="contact__info">
            <p className="contact__eyebrow">Contacto</p>
            <h2 id="contact-title" className="contact__title">
              ¿Te interesa
              <br />
              alguna propiedad?
            </h2>
            <p className="contact__body">
              Completá el formulario y te contactamos para coordinar la visita. También podés
              escribirnos directo por WhatsApp.
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="contact__wa-btn"
              aria-label="Abrir chat de WhatsApp con la agencia"
            >
              <svg className="contact__wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.848L.057 23.786a.5.5 0 0 0 .614.631l6.088-1.592A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.81 9.81 0 0 1-5.003-1.367l-.359-.213-3.717.972.991-3.624-.234-.372A9.818 9.818 0 1 1 12 21.818z" />
              </svg>
              Escribir por WhatsApp
            </a>

            <div className="contact__meta">
              <div className="contact__meta-item">
                <span className="contact__meta-label">Ubicación</span>
                <span>La Rioja, Argentina</span>
              </div>
              <div className="contact__meta-item">
                <span className="contact__meta-label">Horario</span>
                <span>Lun – Vie · 9:00 a 18:00</span>
              </div>
              <div className="contact__meta-item">
                <span className="contact__meta-label">Anticipación</span>
                <span>
                  Las visitas requieren al menos <strong>48 hs</strong> de aviso.
                </span>
              </div>
            </div>
          </div>

          {/* ── Columna derecha: formulario ───────────────────────────── */}
          <div className="contact__form-wrap">
            <VisitRequestForm submitLabel="Solicitar visita" />
          </div>
        </div>
      </div>
    </section>
  );
}
