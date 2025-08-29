// omr.js — bubble detection using OpenCV.js
const bin = new cv.Mat();
cv.GaussianBlur(img, img, new cv.Size(5,5), 0);
cv.adaptiveThreshold(img, bin, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 31, 10);


const scaleX = mat.cols / cfg.imageWidth;
const scaleY = mat.rows / cfg.imageHeight;


function sampleCircle(cx, cy, r) {
// sample fill ratio in a disk
let filled = 0, total = 0;
const R = Math.round(r);
for (let dy = -R; dy <= R; dy++) {
for (let dx = -R; dx <= R; dx++) {
if (dx*dx + dy*dy <= R*R) {
total++;
const x = Math.min(Math.max(0, Math.round(cx + dx)), bin.cols - 1);
const y = Math.min(Math.max(0, Math.round(cy + dy)), bin.rows - 1);
const v = bin.ucharPtr(y, x)[0];
if (v > 0) filled++;
}
}
}
return filled / Math.max(1, total);
}


const bubbleR = cfg.bubble.r;
const thr = cfg.bubble.threshold; // how filled to count as marked
const minMargin = cfg.manualReview.minBubbleMargin; // difference between top two choices


// Parts 1–5 (OMR)
for (const pid of ["1","2","3","4","5"]) {
const p = cfg.parts[pid];
const { qStart, qEnd, choices, grid } = p;
const nQ = qEnd - qStart + 1;


for (let i = 0; i < nQ; i++) {
const qNum = qStart + i;
// Each row per question, columns per choice
const rowY = (grid.y + i * grid.dy) * scaleY;


let best = { choice: null, ratio: 0 };
let second = { choice: null, ratio: 0 };
const scores = {};


choices.forEach((ch, cIdx) => {
const cx = (grid.x + cIdx * grid.dx) * scaleX;
const cy = rowY;
const r = bubbleR * Math.min(scaleX, scaleY);
const ratio = sampleCircle(cx, cy, r);
scores[ch] = ratio;
if (ratio > best.ratio) { second = best; best = { choice: ch, ratio }; }
else if (ratio > second.ratio) { second = { choice: ch, ratio }; }
});


let choice = null, manual = false;
if (best.ratio >= thr && (best.ratio - second.ratio) >= minMargin) {
choice = best.choice;
} else if (best.ratio < thr) {
manual = true; // too