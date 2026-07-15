import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La ruta de exportación a PDF lee los .ttf de marca por filesystem en
  // tiempo de request (@react-pdf/renderer no puede usar next/font); sin
  // esto, el trace de Vercel podría no incluirlos en el deploy.
  outputFileTracingIncludes: {
    "/cotizaciones/**": ["src/lib/pdf/fonts/**/*"],
  },
  experimental: {
    // El default (1MB) rechaza en silencio el request de /marcar apenas
    // se adjunta una foto sacada con la cámara del celular — el rechazo
    // pasa a nivel de Next.js, antes de que el código de la Server Action
    // llegue a correr, así que no hay try/catch de la app que lo agarre.
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
