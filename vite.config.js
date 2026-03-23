import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@mui/x-data-grid") || id.includes("@mui/x-charts")) return "mui-x";
          if (id.includes("@mui") || id.includes("@emotion")) return "mui";
          if (id.includes("leaflet") || id.includes("react-leaflet")) return "maps";
          if (id.includes("swiper")) return "swiper";
          if (id.includes("react-big-calendar")) return "calendar";
          if (id.includes("date-fns")) return "date-fns";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
