// US38: maths for the draggable bars between two panes. Pure, unit tested.

export const MIN_RATIO = 0.25 // neither pane can shrink below a quarter, so nothing disappears
export const MAX_RATIO = 0.75

export function clampRatio(ratio, min = MIN_RATIO, max = MAX_RATIO) {
  return Math.min(max, Math.max(min, ratio))
}

// Where the pointer is inside the container, as a share of its width (or height): 0 … 1, clamped
export function ratioFromPointer(pointer, containerStart, containerSize) {
  if (containerSize <= 0) return 0.5
  return clampRatio((pointer - containerStart) / containerSize)
}
