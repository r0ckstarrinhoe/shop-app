import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { CartProvider } from "./context/CartContext";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "40px",
            fontFamily: "Arial, sans-serif",
            background: "#f8fafc",
            color: "#111827",
          }}
        >
          <h1 style={{ marginTop: 0 }}>Błąd aplikacji</h1>
          <p>Frontend się uruchomił, ale wystąpił błąd renderowania.</p>
          <pre
            style={{
              background: "#111827",
              color: "#f9fafb",
              padding: "16px",
              borderRadius: "12px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.errorMessage}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function FullScreenMessage({ text }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
        color: "#111827",
        padding: "24px",
      }}
    >
      <div>{text}</div>
    </div>
  );
}

function RootLoader() {
  const [LoadedComponent, setLoadedComponent] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const path = window.location.pathname;
    const isAdminRoute = path.startsWith("/admin");

    async function loadPage() {
      try {
        if (isAdminRoute) {
          const module = await import("./admin/AdminPanel");
          setLoadedComponent(() => module.default);
        } else {
          const module = await import("./App");
          setLoadedComponent(() => module.default);
        }
      } catch (error) {
        console.error("Module load error:", error);
        setLoadError(error?.message || "Nie udało się załadować modułu.");
      }
    }

    loadPage();
  }, []);

  if (loadError) {
    return <FullScreenMessage text={`Błąd ładowania modułu: ${loadError}`} />;
  }

  if (!LoadedComponent) {
    return <FullScreenMessage text="Ładowanie..." />;
  }

  return (
    <CartProvider>
      <LoadedComponent />
    </CartProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RootLoader />
    </ErrorBoundary>
  </React.StrictMode>
);