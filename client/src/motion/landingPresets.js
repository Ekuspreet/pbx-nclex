export const viewportOnce = {
  once: true,
  amount: 0.22,
}

export const sectionIntro = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportOnce,
  transition: { duration: 0.46, ease: 'easeOut' },
}

export const heroIntro = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
}

export const cardIntro = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: viewportOnce,
  transition: { duration: 0.38, ease: 'easeOut' },
}

export const softHover = {
  whileHover: { y: -4 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18, ease: 'easeOut' },
}

export const floatingVector = {
  animate: { y: [0, -10, 0] },
  transition: {
    duration: 5.5,
    ease: 'easeInOut',
    repeat: Infinity,
  },
}

export const pulseVector = {
  animate: { opacity: [0.72, 1, 0.72] },
  transition: {
    duration: 2.4,
    ease: 'easeInOut',
    repeat: Infinity,
  },
}

export function withDelay(preset, delay = 0) {
  return {
    ...preset,
    transition: {
      ...preset.transition,
      delay,
    },
  }
}
