const fs = require("fs");

// 1. crear src/lib/queryClient.js
const qcPath = "src/lib/queryClient.js";
const qcContent = `import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60
    }
  }
});
`;
fs.writeFileSync(qcPath, qcContent);
console.log("creado " + qcPath);

// 2. main.jsx
const mainPath = "src/main.jsx";
let main = fs.readFileSync(mainPath, "utf8");
const importViejo = 'import { QueryClient, QueryClientProvider } from "@tanstack/react-query";';
const importNuevo = 'import { QueryClientProvider } from "@tanstack/react-query";\nimport { queryClient } from "./lib/queryClient.js";';
if (!main.includes(importViejo)) { console.error("main.jsx: NO se encontro el import viejo"); process.exit(1); }
main = main.replace(importViejo, importNuevo);
const bloque = `const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60
    }
  }
});
`;
if (!main.includes(bloque)) { console.error("main.jsx: NO se encontro el bloque const queryClient"); process.exit(1); }
main = main.replace(bloque, "");
fs.writeFileSync(mainPath, main);
console.log("main.jsx OK");

// 3. authStore.js
const authPath = "src/features/auth/authStore.js";
let auth = fs.readFileSync(authPath, "utf8");
const authImportViejo = 'import { create } from "zustand";';
const authImportNuevo = 'import { create } from "zustand";\nimport { queryClient } from "../../lib/queryClient.js";';
if (!auth.includes(authImportViejo)) { console.error("authStore: NO se encontro el import de zustand"); process.exit(1); }
if (!auth.includes("lib/queryClient")) auth = auth.replace(authImportViejo, authImportNuevo);
const setViejo = '    set({ token: "", usuario: null });';
const setNuevo = '    queryClient.clear();\n    set({ token: "", usuario: null });';
if (!auth.includes(setViejo)) { console.error("authStore: NO se encontro el set de cerrarSesion"); process.exit(1); }
auth = auth.replace(setViejo, setNuevo);
fs.writeFileSync(authPath, auth);
console.log("authStore.js OK");

console.log("LISTO");
