import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Mismas familias de marca que en globals.css (Hanken Grotesk para títulos,
// Inter para texto de cuerpo). @react-pdf/renderer no puede usar las
// variables de next/font, así que se registran acá a partir de los mismos
// archivos TTF de Google Fonts, embebidos localmente para no depender de
// una descarga por request.
const FONTS_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

let registrado = false;

export function registrarFuentesPdf() {
  if (registrado) return;
  registrado = true;

  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(FONTS_DIR, "inter-400.ttf"), fontWeight: 400 },
      { src: path.join(FONTS_DIR, "inter-700.ttf"), fontWeight: 700 },
      {
        src: path.join(FONTS_DIR, "inter-400-italic.ttf"),
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Hanken Grotesk",
    fonts: [
      { src: path.join(FONTS_DIR, "hanken-grotesk-600.ttf"), fontWeight: 600 },
      { src: path.join(FONTS_DIR, "hanken-grotesk-700.ttf"), fontWeight: 700 },
    ],
  });
}
