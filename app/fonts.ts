import { Alegreya, Archivo } from "next/font/google";
import localFont from "next/font/local";

// next/font downloads the Google fonts at build time and serves them from this origin (CSP font-src 'self').
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const alegreya = Alegreya({ variable: "--font-alegreya", subsets: ["latin"], weight: ["500", "600"] });
// Only flavor text is italic, so this face is not preloaded: the browser fetches it when a line is on screen.
const alegreyaItalic = Alegreya({ variable: "--font-alegreya-italic", subsets: ["latin"], weight: "500", style: "italic", preload: false });
// Mana symbol font by Andrew Gioia (SIL OFL 1.1), used for tap and card type symbols.
const mana = localFont({ variable: "--font-mana-symbols", src: "./fonts/mana.woff2", display: "block", preload: false });

/** Class names that define the font CSS variables; set them on `<html>`. */
export const fontVariables = `${archivo.variable} ${alegreya.variable} ${alegreyaItalic.variable} ${mana.variable}`;
