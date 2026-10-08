import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite's transform plugin to compile JSX syntax in .js files
function jsxInJs() {
  return {
    name: "jsx-in-js",
    enforce: "pre",
    async transform(code, id) {
      const [file] = id.split("?");
      if (!file.endsWith(".js") && !file.endsWith(".jsx")) return null;
      if (file.includes("node_modules")) return null;
      if (!file.includes("/src/") && !file.includes("\\src\\")) return null;
      return transformWithOxc(code, file, {
        lang: "jsx",
        jsx: { runtime: "automatic" },
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, ["REACT_APP_", "VITE_"]);
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL ||
    env.REACT_APP_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    env.VITE_BACKEND_URL ||
    "https://swatsbio-production.up.railway.app";

  return {
    plugins: [
      jsxInJs(),
      react(),
      tailwindcss(),
    ],
    envPrefix: ["VITE_", "REACT_APP_"],
    define: {
      ...Object.fromEntries(
        Object.entries({ ...process.env, ...env })
          .filter(([key]) => key.startsWith("REACT_APP_") || key.startsWith("VITE_"))
          .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
      ),
      "process.env.REACT_APP_BACKEND_URL": JSON.stringify(backendUrl.replace(/\/+$/, "")),
    },
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "./src") }],
    },
    build: {
      outDir: "dist",
    },
    server: {
      host: true,
      port: 3000,
      cors: true,
    },
  };
});


