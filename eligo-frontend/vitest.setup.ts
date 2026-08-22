import "@testing-library/jest-dom/vitest"

// jsdom does not implement scrollIntoView; provide a no-op so focus
// management in components under test does not throw.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
