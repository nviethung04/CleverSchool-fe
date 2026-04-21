// utils/avatar.ts
// Utility functions for generating avatar URLs and colors

export function getGravatarUrl(name: string, size = 80, bgColor?: string, color?: string) {
  // Không cần hash, chỉ dùng tên để tạo avatar
  const bg = bgColor || randomColor();
  const fg = color || (isDark(bg) ? "fff" : "222");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=${bg}&color=${fg}&size=${size}`;
}

export function randomColor() {
  // Trả về mã hex không quá sáng cũng không quá tối
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 20); // 60-80%
  const l = 40 + Math.floor(Math.random() * 20); // 40-60%
  // Chuyển HSL sang hex
  return hslToHex(h, s, l).replace("#", "");
}

export function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c/2;
  let r=0, g=0, b=0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function isDark(hex: string) {
  // hex: "fff" or "ffffff" or "#fff"
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map(x => x + x).join("");
  const r = parseInt(c.substring(0,2), 16);
  const g = parseInt(c.substring(2,4), 16);
  const b = parseInt(c.substring(4,6), 16);
  // Tính độ sáng
  return (r*0.299 + g*0.587 + b*0.114) < 186;
}
