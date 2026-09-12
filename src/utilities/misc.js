export function createTemplate(HTML = "") {
  const template = document.createElement("template");
  template.innerHTML = HTML;
  return template;
}

export function createEvent(message, data = {}) {
  return new CustomEvent(message, {
    detail: data,
    bubbles: true,
    composed: true,
  });
}

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
