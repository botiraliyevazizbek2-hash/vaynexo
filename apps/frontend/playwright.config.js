import { defineConfig } from "@playwright/test";
const python = process.env.E2E_PYTHON || "python";
const adminKey =
  process.env.E2E_ADMIN_KEY || "local-e2e-admin-key-for-tests-only-123456";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 30000,
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: `${python} -m alembic upgrade head && ${python} -m apps.api.seed && ${python} -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000`,
          cwd: "../..",
          url: "http://127.0.0.1:8000/api/health",
          timeout: 30000,
          env: {
            APP_ENV: "development",
            DEMO_LOGIN_ENABLED: "true",
            DATABASE_URL: "sqlite:///./e2e.db",
            ADMIN_KEY: adminKey,
            SESSION_SECRET: "local-e2e-session-secret-for-tests-only-123456",
          },
        },
        {
          command: "npm run dev -- --port 5173 --strictPort",
          url: "http://127.0.0.1:5173",
          timeout: 30000,
        },
      ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    launchOptions: process.env.CHROMIUM_EXECUTABLE
      ? {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--disable-gpu",
            "--disable-software-rasterizer",
          ],
        }
      : {},
  },
});
