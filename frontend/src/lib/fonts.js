export const FONT_LIST = [
  "Outfit", "Inter", "JetBrains Mono", "Space Grotesk", "Bebas Neue", "Playfair Display", "Orbitron", "Sora", "Poppins", "Chakra Petch",
  "Anton", "Archivo Black", "Bricolage Grotesque", "DM Mono", "DM Sans", "Fira Code", "IBM Plex Mono", "Manrope", "Rubik Mono One", "Unbounded",
];

export function injectCustomFonts(fonts) {
  let el = document.getElementById("swat-custom-fonts");
  if (!fonts || !fonts.length) {
    el?.remove();
    return;
  }
  if (!el) { el = document.createElement("style"); el.id = "swat-custom-fonts"; document.head.appendChild(el); }
  el.textContent = fonts.map((f) => `@font-face{font-family:"${f.name}";src:url("${f.url}");font-display:swap;}`).join("\n");
}
