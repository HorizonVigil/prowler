import {
  IBM_Plex_Mono as FontMono,
  IBM_Plex_Sans as FontSans,
} from "next/font/google";

// IBM Plex matches the platform shell's tailwind fontFamily, so moving between
// modules changes the features and not the typeface. Neither family ships a
// variable axis on next/font/google, so the weights are listed explicitly.
export const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  preload: false,
  display: "swap",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  preload: false,
});
