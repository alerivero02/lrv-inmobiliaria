import { createPortal } from "react-dom";
import { useScrollLock } from "../hooks/useScrollLock";
import "./MobileNavDrawer.css";

export default function MobileNavDrawer({ open, onClose, title = "Menú", children, footer }) {
  useScrollLock(open);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="mnd-root" role="presentation">
      <button type="button" className="mnd-backdrop" aria-label="Cerrar menú" onClick={onClose} />
      <div
        id="mobile-nav-drawer"
        className="mnd-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mnd-title"
      >
        <header className="mnd-header">
          <h2 id="mnd-title" className="mnd-title">
            {title}
          </h2>
          <button type="button" className="mnd-close" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        <nav className="mnd-body" aria-label="Principal">
          {children}
        </nav>
        {footer ? <footer className="mnd-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
