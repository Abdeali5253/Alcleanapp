import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { authService } from "./lib/auth";

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Application root element is missing");

  const root = createRoot(rootElement);
  root.render(
    <main
      aria-label="Starting AlClean"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
        color: "#374151",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="AlClean" width="112" height="48" />
        <p>Starting securely…</p>
      </div>
    </main>,
  );

  try {
    await authService.whenReady();
  } catch (error) {
    // Authentication hydration fails closed to a logged-out session. The app
    // must still render so a native plugin/configuration problem is recoverable.
    console.error("[Bootstrap] Authentication initialization failed:", error);
  }

  root.render(<App />);
}

void bootstrap().catch((error) => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.textContent = "AlClean could not start. Please reinstall or update the app.";
  }
  console.error("[Bootstrap] Fatal startup error:", error);
});
