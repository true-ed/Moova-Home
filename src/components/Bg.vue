<template>
  <div
    class="lens-wrapper"
    :class="{
      'lens-wrapper_theme_accent-1':
        store.state.watchingSection == ESection.Home,
      'lens-wrapper_theme_black':
        store.state.watchingSection == ESection.Feature,
      'lens-wrapper_theme_red-wheat':
        store.state.watchingSection == ESection.Contacts,
    }"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    ref="wrapperRef"
  >
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import store, { ESection } from "@/store";
import { ref, onMounted, onUnmounted, reactive, shallowRef } from "vue";

interface GridCell {
  char: string;
  color: string;
  isAccent: boolean;
}

const vw = Math.max(window.innerWidth / 50, 18);
const vh = Math.max(window.innerHeight / 50, 12);

const GRID_WIDTH = 120;
const GRID_HEIGHT = 80;
const FONT_SIZE = Math.floor(vw);
const LINE_HEIGHT = Math.floor(vh * 2);
const CELL_WIDTH = Math.floor(vw);
const HIGHLIGHT_RADIUS = 75;
const ZOOM_SCALE = 1.01;
const DEFAULT_SCALE = 0.5;
const DEFAULT_CHAR = "+";
const SPECIAL_CHAR = "Moova";

const OPACITY_DEFAULT = 0.4;
const OPACITY_HIGHLIGHT = 0.9;
const COLOR_DEFAULT = "#001923";
const COLOR_HIGHLIGHT_BASE = "#ffffff";

const ACCENT_COLORS = ["#FF0055", "#00FF99", "#00CCFF", "#FFCC00", "#9900FF"];

const COLOR_PROBABILITY = 0.05;
const BLOOM_STRENGTH = 15;

const EASING_SPEED_IN = 0.1;
const EASING_SPEED_OUT = 0.05;
const HIGHLIGHT_RADIUS_EASING_SPEED_IN = 0.02;
const HIGHLIGHT_RADIUS_EASING_SPEED_OUT = 0.5;
const SNAP_THRESHOLD = 0.001;

const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const grid = shallowRef<GridCell[][]>([]);
const mouseInteracted = ref(false);

const ctx = shallowRef<CanvasRenderingContext2D | null>(null);
let offscreenCanvas: HTMLCanvasElement | null = null;

const transform = reactive({
  scale: 4,
  offsetX: 0,
  offsetY: 0,
  highlightRadius: HIGHLIGHT_RADIUS,
});

let mouseX = -9999;
let mouseY = -9999;

const contentTotalWidth = GRID_WIDTH * CELL_WIDTH;
const contentTotalHeight = GRID_HEIGHT * LINE_HEIGHT;
const targetResetScale = DEFAULT_SCALE;

let wrapperRectWidth = 0;
let wrapperRectHeight = 0;
let targetScale = DEFAULT_SCALE;
let targetOffsetX = 0;
let targetOffsetY = 0;
let autoDrawAFId: number | null = null;

const generateGrid = () => {
  const lines: GridCell[][] = [];
  const specialX = Math.floor(Math.random() * GRID_WIDTH);
  const specialY = Math.floor(Math.random() * GRID_HEIGHT);

  for (let i = 0; i < GRID_HEIGHT; i++) {
    const row: GridCell[] = [];
    for (let j = 0; j < GRID_WIDTH; j++) {
      const isSpecial = i === specialY && j === specialX;

      const isRandomAccent = Math.random() < COLOR_PROBABILITY;
      let cellColor = COLOR_DEFAULT;
      let isAccent = false;

      if (isSpecial) {
        cellColor = "#FFFFFF";
        isAccent = true;
      } else if (isRandomAccent) {
        const randColorIndex = Math.floor(Math.random() * ACCENT_COLORS.length);
        cellColor = ACCENT_COLORS[randColorIndex];
        isAccent = true;
      }

      row.push({
        char: isSpecial ? SPECIAL_CHAR : DEFAULT_CHAR,
        color: cellColor,
        isAccent: isAccent,
      });
    }
    lines.push(row);
  }
  grid.value = lines;
};

const renderStaticLayer = () => {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = contentTotalWidth;
    offscreenCanvas.height = contentTotalHeight;
  }

  const osCtx = offscreenCanvas.getContext("2d", { alpha: true });
  if (!osCtx) return;

  osCtx.clearRect(0, 0, contentTotalWidth, contentTotalHeight);
  osCtx.font = `${FONT_SIZE}px monospace`;
  osCtx.textAlign = "left";
  osCtx.textBaseline = "top";
  osCtx.globalAlpha = OPACITY_DEFAULT;

  const gridData = grid.value;

  for (let rowIndex = 0; rowIndex < GRID_HEIGHT; rowIndex++) {
    for (let colIndex = 0; colIndex < GRID_WIDTH; colIndex++) {
      const cell = gridData[rowIndex][colIndex];

      osCtx.fillStyle = cell.isAccent ? cell.color : COLOR_DEFAULT;

      osCtx.fillText(cell.char, colIndex * CELL_WIDTH, rowIndex * LINE_HEIGHT);
    }
  }
};

const warmUpMath = () => {
  const dummyX = 0.5;
  const dummyY = 0.5;
  const xy = dummyX * dummyY;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _expr =
    (Math.pow(1 - 1 / xy, 2) + (1 + 1 / xy)) *
    Math.sqrt(dummyX * dummyX + dummyY * dummyY);
};

const draw = () => {
  if (!ctx.value || !canvasRef.value || !offscreenCanvas) return;

  const context = ctx.value;
  const canvas = canvasRef.value;
  const currentScale = transform.scale;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(
    Math.floor(transform.offsetX),
    Math.floor(transform.offsetY)
  );
  context.scale(currentScale, currentScale);

  context.drawImage(offscreenCanvas, 0, 0);

  if (currentScale > 1.0 + SNAP_THRESHOLD) {
    const curRadius = transform.highlightRadius;
    const mouseGridX = (mouseX - transform.offsetX) / currentScale;
    const mouseGridY = (mouseY - transform.offsetY) / currentScale;
    const radiusGrid = curRadius / currentScale;

    const searchPad = Math.max(radiusGrid * 2.5, CELL_WIDTH * 12);

    const startCol = Math.max(
      0,
      Math.floor((mouseGridX - searchPad) / CELL_WIDTH)
    );
    const endCol = Math.min(
      GRID_WIDTH,
      Math.ceil((mouseGridX + searchPad) / CELL_WIDTH)
    );
    const startRow = Math.max(
      0,
      Math.floor((mouseGridY - searchPad) / LINE_HEIGHT)
    );
    const endRow = Math.min(
      GRID_HEIGHT,
      Math.ceil((mouseGridY + searchPad) / LINE_HEIGHT)
    );

    context.font = `${FONT_SIZE}px monospace`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.globalAlpha = OPACITY_HIGHLIGHT;

    const gridData = grid.value;
    const radiusSq = radiusGrid * radiusGrid;

    for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
      const cellY = rowIndex * LINE_HEIGHT;
      const cellCenterY = cellY + LINE_HEIGHT / 2;
      const dy = mouseGridY - cellCenterY;

      for (let colIndex = startCol; colIndex < endCol; colIndex++) {
        const cellX = colIndex * CELL_WIDTH;
        const cellCenterX = cellX + CELL_WIDTH / 2;
        const dx = mouseGridX - cellCenterX;

        const distSq = dx * dx + dy * dy;
        let shouldDraw = false;

        if (distSq < radiusSq) {
          shouldDraw = true;
        } else {
          const x = dx / radiusGrid;
          const y = dy / radiusGrid;

          if (Math.abs(x * y) > 0.001) {
            const xy = x * y;
            const expr =
              (Math.pow(1 - 1 / xy, 2) + (1 + 1 / xy)) *
              Math.sqrt(x * x + y * y);
            if (expr < 4) shouldDraw = true;
          }
        }

        if (shouldDraw) {
          const cell = gridData[rowIndex][colIndex];

          context.save();

          if (cell.isAccent) {
            context.fillStyle = cell.color;
            context.shadowColor = cell.color;
            context.shadowBlur = BLOOM_STRENGTH;
          } else {
            context.fillStyle = COLOR_HIGHLIGHT_BASE;
            context.shadowColor = COLOR_HIGHLIGHT_BASE;
            context.shadowBlur = BLOOM_STRENGTH / 2;
          }

          context.fillText(cell.char, cellX, cellY);
          context.restore();
        }
      }
    }
  }

  context.restore();
  context.globalAlpha = 1.0;
};

const autoDraw = () => {
  let targetR = 0;

  if (mouseInteracted.value) {
    targetScale = ZOOM_SCALE;
    targetR = HIGHLIGHT_RADIUS;
  } else {
    targetScale = targetResetScale;
    if (wrapperRectWidth > 0) {
      const midX = wrapperRectWidth / 2;
      const midY = wrapperRectHeight / 2;
      const gridCenterX = (midX / wrapperRectWidth) * contentTotalWidth;
      const gridCenterY = (midY / wrapperRectHeight) * contentTotalHeight;
      targetOffsetX = midX - gridCenterX * DEFAULT_SCALE;
      targetOffsetY = midY - gridCenterY * DEFAULT_SCALE;
    }
    targetR = 0;
  }

  const speed = mouseInteracted.value ? EASING_SPEED_IN : EASING_SPEED_OUT;
  transform.scale += (targetScale - transform.scale) * speed;
  transform.offsetX += (targetOffsetX - transform.offsetX) * speed;
  transform.offsetY += (targetOffsetY - transform.offsetY) * speed;

  const rSpeed = mouseInteracted.value
    ? HIGHLIGHT_RADIUS_EASING_SPEED_IN
    : HIGHLIGHT_RADIUS_EASING_SPEED_OUT;
  transform.highlightRadius += (targetR - transform.highlightRadius) * rSpeed;

  draw();
  autoDrawAFId = requestAnimationFrame(autoDraw);
};

const updateInteraction = (e: MouseEvent) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;

  if (mouseX === undefined && wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  const contentX = (mouseX / wrapperRectWidth) * contentTotalWidth;
  const contentY = (mouseY / wrapperRectHeight) * contentTotalHeight;

  targetOffsetX = mouseX - contentX * ZOOM_SCALE;
  targetOffsetY = mouseY - contentY * ZOOM_SCALE;
};

const handleMouseEnter = (e: MouseEvent) => {
  mouseInteracted.value = true;
  updateInteraction(e);
};

const handleMouseMove = (e: MouseEvent) => {
  mouseInteracted.value = true;
  updateInteraction(e);
};

const handleMouseLeave = () => {
  mouseInteracted.value = false;
  mouseX = -9999;
};

const handleResize = () => {
  if (wrapperRef.value && canvasRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    canvasRef.value.width = rect.width;
    canvasRef.value.height = rect.height;
    wrapperRectWidth = rect.width;
    wrapperRectHeight = rect.height;
  }
};

onMounted(() => {
  if (canvasRef.value && wrapperRef.value) {
    const context2D = canvasRef.value.getContext("2d", { alpha: true });

    handleResize();
    window.addEventListener("resize", handleResize);

    if (context2D) {
      ctx.value = context2D;
      generateGrid();
      renderStaticLayer();
      warmUpMath();
      autoDrawAFId = requestAnimationFrame(autoDraw);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (autoDrawAFId) cancelAnimationFrame(autoDrawAFId);
});
</script>

<style scoped lang="scss">
@import "../scss/components/bg";
</style>
