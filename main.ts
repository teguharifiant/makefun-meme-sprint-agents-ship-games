// Meme Sprint: AI Agents Ship Games
// SPDX-License-Identifier: MIT
//
// Draws one meme image entirely in code (shapes + a built-in 5x7 bitmap
// font) and writes it as a PNG to $MAKEFUN_OUTPUT_DIR/entry.png.
// Node 22+ stdlib only, no network, fully deterministic.
//
// Concept: two-panel expectation vs reality.
//   Top:    "ME: BUILD ME AN EPIC GAME" over a hand-drawn epic open world
//           (sun, mountains, castle, trees, hero).
//   Bottom: "THE AGENT, 4 SECONDS LATER:" over one big grey rectangle
//           labelled "THE GAME" with a single tiny player square and the
//           line "REST COMING IN V2".
// The joke: the agent "ships" the game in 4 seconds, and the game is a
// grey box.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// Pixel buffer (RGB, 8 bit per channel)
// ---------------------------------------------------------------------------

const buf = new Uint8Array(W * H * 3);

type RGB = [number, number, number];

const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [126, 200, 227];
const SUN: RGB = [255, 214, 64];
const HILL1: RGB = [86, 160, 90];
const HILL2: RGB = [64, 138, 72];
const MOUNTAIN: RGB = [120, 130, 150];
const SNOW: RGB = [255, 255, 255];
const CASTLE: RGB = [150, 120, 90];
const CASTLE_DARK: RGB = [120, 95, 70];
const TREE: RGB = [34, 110, 50];
const TRUNK: RGB = [110, 70, 30];
const HERO: RGB = [220, 60, 60];
const DARK: RGB = [34, 34, 38];
const GREY_BOX: RGB = [170, 170, 170];
const GREY_EDGE: RGB = [120, 120, 120];
const PLAYER: RGB = [220, 40, 40];
const YELLOW_BAND: RGB = [255, 214, 64];

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(x, y, c);
    }
  }
}

function fillTriangle(
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  c: RGB,
): void {
  const minX = Math.max(0, Math.min(x1, x2, x3));
  const maxX = Math.min(W - 1, Math.max(x1, x2, x3));
  const minY = Math.max(0, Math.min(y1, y2, y3));
  const maxY = Math.min(H - 1, Math.max(y1, y2, y3));
  const d = (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  if (d === 0) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x - x3) * (y2 - y3) - (x2 - x3) * (y - y3)) / d;
      const b = ((x1 - x3) * (y - y3) - (x - x3) * (y1 - y3)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) setPx(x, y, c);
    }
  }
}

// ---------------------------------------------------------------------------
// Built-in 5x7 bitmap font. Each glyph is 7 rows of 5 cells ("#" = on).
// ---------------------------------------------------------------------------

const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00000", "00100"],
  ",": ["00000", "00000", "00000", "00000", "00100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  ":": ["00000", "00100", "00000", "00000", "00000", "00100", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawCenteredText(
  s: string, y: number, scale: number, c: RGB, x0 = 0, x1 = W,
): void {
  const w = textWidth(s, scale);
  drawText(s, x0 + Math.floor((x1 - x0 - w) / 2), y, scale, c);
}

// ---------------------------------------------------------------------------
// The meme
// ---------------------------------------------------------------------------

function draw(): void {
  // Background + outer frame.
  fillRect(0, 0, W, H, WHITE);
  fillRect(0, 0, W, 10, BLACK);
  fillRect(0, H - 10, W, 10, BLACK);
  fillRect(0, 0, 10, H, BLACK);
  fillRect(W - 10, 0, 10, H, BLACK);

  // ======================= TOP PANEL: the dream =======================
  // Sky.
  fillRect(10, 10, W - 20, 502, SKY);
  // Sun.
  fillCircle(880, 130, 62, SUN);
  fillCircle(880, 130, 48, [255, 230, 120]);
  // Far mountains (snow-capped).
  fillTriangle(40, 470, 260, 220, 480, 470, MOUNTAIN);
  fillTriangle(200, 250, 260, 220, 320, 250, SNOW);
  fillTriangle(420, 470, 640, 200, 860, 470, MOUNTAIN);
  fillTriangle(580, 235, 640, 200, 700, 235, SNOW);
  // Hills.
  fillCircle(180, 560, 190, HILL1);
  fillCircle(850, 570, 210, HILL2);
  // Ground.
  fillRect(10, 430, W - 20, 82, HILL1);
  // Castle on the right hill.
  fillRect(700, 300, 160, 130, CASTLE);
  fillRect(690, 260, 30, 170, CASTLE_DARK);
  fillRect(830, 260, 30, 170, CASTLE_DARK);
  fillRect(690, 260, 30, 18, CASTLE_DARK);
  fillRect(830, 260, 30, 18, CASTLE_DARK);
  fillRect(740, 230, 80, 200, CASTLE);
  fillRect(740, 230, 80, 16, CASTLE_DARK);
  fillRect(772, 330, 16, 40, BLACK); // door
  fillRect(716, 320, 14, 14, BLACK); // windows
  fillRect(800, 320, 14, 14, BLACK);
  fillRect(772, 250, 14, 14, BLACK);
  // Trees.
  for (const [tx, ty] of [[130, 380], [220, 400], [560, 390]] as const) {
    fillRect(tx - 4, ty + 18, 8, 30, TRUNK);
    fillTriangle(tx - 26, ty + 22, tx, ty - 34, tx + 26, ty + 22, TREE);
  }
  // Hero with a sword, bottom centre-left.
  fillCircle(430, 408, 13, HERO); // head
  fillRect(422, 421, 16, 32, HERO); // body
  fillRect(422, 453, 6, 20, BLACK); // legs
  fillRect(432, 453, 6, 20, BLACK);
  fillRect(438, 416, 44, 5, BLACK); // sword arm + blade
  // Header band + caption.
  fillRect(10, 10, W - 20, 66, YELLOW_BAND);
  drawCenteredText("ME: BUILD ME AN EPIC GAME", 24, 6, BLACK);

  // Divider between panels.
  fillRect(0, 512, W, 10, BLACK);

  // ===================== BOTTOM PANEL: the delivery =====================
  fillRect(10, 522, W - 20, 492, DARK);
  drawCenteredText("THE AGENT, 4 SECONDS LATER:", 548, 5, WHITE);

  // The shipped game: one big grey rectangle.
  const bx = 162;
  const by = 640;
  const bw = 700;
  const bh = 260;
  fillRect(bx - 8, by - 8, bw + 16, bh + 16, GREY_EDGE);
  fillRect(bx, by, bw, bh, GREY_BOX);
  // The entire gameplay: one tiny red player square, top-left of the box.
  fillRect(bx + 40, by + 40, 20, 20, PLAYER);
  drawCenteredText("THE GAME", 748, 7, BLACK, bx, bx + bw);

  // Punchline footer.
  drawCenteredText("WHERE'S THE REST?", 930, 5, WHITE);
  drawCenteredText("REST COMING IN V2", 972, 4, [180, 180, 180]);

  // Redraw the outer frame last so hill circles can't poke past the edges.
  fillRect(0, 0, W, 10, BLACK);
  fillRect(0, H - 10, W, 10, BLACK);
  fillRect(0, 0, 10, H, BLACK);
  fillRect(W - 10, 0, 10, H, BLACK);
}

// ---------------------------------------------------------------------------
// PNG encoder (filter 0 scanlines, zlib DEFLATE, CRC32)
// ---------------------------------------------------------------------------

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
draw();
const png = encodePNG();
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
console.log(`wrote ${join(outDir, "entry.png")} (${png.length} bytes, ${W}x${H})`);
