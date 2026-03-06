import sharp from "sharp";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "../public/icons");

await mkdir(outputDir, { recursive: true });

// Standard icon SVG (amber bg, rounded corners, white checkmark)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#d97706"/>
  <path d="M152 256 L216 320 L360 192" stroke="white" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

// Maskable icon SVG (no rounded corners, content in safe zone)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#d97706"/>
  <path d="M172 256 L226 310 L340 206" stroke="white" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const iconBuffer = Buffer.from(iconSvg);
const maskableBuffer = Buffer.from(maskableSvg);

// Generate all icon sizes
await sharp(iconBuffer).resize(192, 192).png().toFile(join(outputDir, "icon-192.png"));
console.log("✓ icon-192.png");

await sharp(iconBuffer).resize(512, 512).png().toFile(join(outputDir, "icon-512.png"));
console.log("✓ icon-512.png");

await sharp(iconBuffer).resize(180, 180).png().toFile(join(outputDir, "icon-180.png"));
console.log("✓ icon-180.png");

await sharp(iconBuffer).resize(72, 72).png().toFile(join(outputDir, "icon-72.png"));
console.log("✓ icon-72.png");

await sharp(maskableBuffer).resize(192, 192).png().toFile(join(outputDir, "icon-maskable-192.png"));
console.log("✓ icon-maskable-192.png");

await sharp(maskableBuffer).resize(512, 512).png().toFile(join(outputDir, "icon-maskable-512.png"));
console.log("✓ icon-maskable-512.png");

console.log("All icons generated successfully!");
