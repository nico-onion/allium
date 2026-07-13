import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La ruta de exportación a PDF lee los .ttf de marca por filesystem en
  // tiempo de request (@react-pdf/renderer no puede usar next/font); sin
  // esto, el trace de Vercel podría no incluirlos en el deploy.
  outputFileTracingIncludes: {
    "/cotizaciones/**": ["src/lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
