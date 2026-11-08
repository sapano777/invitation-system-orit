import { Amatic_SC, Assistant, Bellefair, Frank_Ruhl_Libre, Rubik, Secular_One, Suez_One, Varela_Round } from "next/font/google";

// Hebrew + Latin heading fonts for the templates. Preloading is off: each
// invitation uses one of them, and the browser only downloads fonts that the
// page actually renders.

// next/font needs literal options in each call, so they're repeated.
const frankRuhl = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], display: "swap", preload: false, variable: "--font-frank-ruhl" });
const bellefair = Bellefair({ subsets: ["hebrew", "latin"], display: "swap", preload: false, weight: "400", variable: "--font-bellefair" });
const varelaRound = Varela_Round({ subsets: ["hebrew", "latin"], display: "swap", preload: false, weight: "400", variable: "--font-varela" });
const secularOne = Secular_One({ subsets: ["hebrew", "latin"], display: "swap", preload: false, weight: "400", variable: "--font-secular" });
const suezOne = Suez_One({ subsets: ["hebrew", "latin"], display: "swap", preload: false, weight: "400", variable: "--font-suez" });
const amatic = Amatic_SC({ subsets: ["hebrew", "latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-amatic" });
const rubik = Rubik({ subsets: ["hebrew", "latin"], display: "swap", preload: false, variable: "--font-rubik" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], display: "swap", preload: false, variable: "--font-assistant" });

// Defines every font's CSS variable on an element, for the invitation page
// and the template picker.
export const templateFontVariables = [frankRuhl, bellefair, varelaRound, secularOne, suezOne, amatic, rubik, assistant]
  .map((f) => f.variable)
  .join(" ");
