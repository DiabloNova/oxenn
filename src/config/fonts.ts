import localFont from "next/font/local";

/** The only Persian typeface used by the application. */
export const persianPrimary = localFont({
  src: [
    { path: "../../public/fonts/YekanBakhFaNum-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/YekanBakhFaNum-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-persian-primary",
  display: "swap",
});

// Legacy import compatibility; this is the exact same Yekan Bakh font, not a second family.
export const persianDisplay = persianPrimary;
