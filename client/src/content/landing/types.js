/**
 * @typedef {Object} NavigationItem
 * @property {string} label
 * @property {string} href
 * @property {boolean} [isPlaceholder]
 */

/**
 * @typedef {Object} CallToAction
 * @property {string} label
 * @property {string} href
 * @property {string} ariaLabel
 * @property {'primary' | 'secondary' | 'ghost'} [variant]
 * @property {boolean} [isPlaceholder]
 */

/**
 * @typedef {Object} Feature
 * @property {string} title
 * @property {string} subheading
 * @property {{ariaLabel: string, label: string, title: string, rows: string[]}} visual
 */

/**
 * @typedef {Object} PricingPlan
 * @property {string} name
 * @property {string} price
 * @property {string} cadence
 * @property {string} description
 * @property {string[]} features
 * @property {CallToAction} cta
 * @property {string} [badge]
 */

/**
 * @typedef {Object} FooterGroup
 * @property {string} title
 * @property {NavigationItem[]} links
 */

export {}
