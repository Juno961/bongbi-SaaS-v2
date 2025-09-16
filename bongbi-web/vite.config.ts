import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Vite 전용 env 로드
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_SERVER_URL || "http://127.0.0.1:8000",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("API 프록시 에러:", err);
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log("API 프록시 요청:", req.method, req.url);
            });
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
