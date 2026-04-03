import { adminContentMaxWidth } from "../../theme/adminTheme";

/** Contenedor principal del panel: mismo ritmo visual que el shell shadcn (espaciado + ancho máximo). */
export default function AdminMain({ children }) {
  return (
    <div
      className="admin-main w-full min-w-0 space-y-6"
      style={{ maxWidth: adminContentMaxWidth, marginInline: "auto" }}
    >
      {children}
    </div>
  );
}
