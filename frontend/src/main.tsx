import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { authService } from "./lib/auth";

async function bootstrap(): Promise<void> {
  await authService.whenReady();
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
