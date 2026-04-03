import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "./context/ToastContext";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TooltipProvider delayDuration={200}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
