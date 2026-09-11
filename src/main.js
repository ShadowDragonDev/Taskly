import { store } from "./core/store.js";
import "./router.js";

const DOM = {
  documentRoot: document.documentElement,
  sidebar: document.querySelector("#sidebar"),
  sidebarExpandButton: document.querySelector("#sidebar-expand-button"),
  sidebarCollapseButton: document.querySelector("#sidebar-collapse-button"),
};

const preferDarkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const mobileMediaQuery = window.matchMedia("(width <= 768px)");

function updateTheme() {
  let theme = store.getSettings().theme;

  if (theme === "system") {
    theme = preferDarkMediaQuery.matches ? "dark" : "light";
  }

  document.startViewTransition(() => {
    DOM.documentRoot.setAttribute("data-theme", theme);
  });
}

function updateSidebarFocusTrap() {
  const sidebarCollapsed = DOM.sidebar.classList.contains("sidebar--hidden");
  DOM.sidebar.inert = sidebarCollapsed;

  if (!mobileMediaQuery.matches) {
    setInert("body > :not(.sidebar)", false);
    return;
  }

  setInert("body > :not(.sidebar)", !sidebarCollapsed);
}

function setInert(selector = ":not(*)", inert = false) {
  const elements = document.querySelectorAll(selector) || [];
  for (const element of elements) {
    element.inert = inert;
  }
}

updateTheme();
updateSidebarFocusTrap();

preferDarkMediaQuery.addEventListener("change", updateTheme);
mobileMediaQuery.addEventListener("change", updateSidebarFocusTrap);

store.addEventListener(
  "store: pathname-changed",
  ({ detail: { pathname } }) => {
    const sidebarTabs = DOM.sidebar.querySelectorAll(".sidebar__tab");

    sidebarTabs.forEach((sidebarTab) => {
      if (sidebarTab.querySelector(`[href="${pathname}"]`)) {
        sidebarTab.classList.add("sidebar__tab--active");
      } else {
        sidebarTab.classList.remove("sidebar__tab--active");
      }
    });
  },
);

store.addEventListener("store: settings-changed", ({ detail }) => {
  updateTheme(detail.theme);
});

DOM.sidebarExpandButton.addEventListener("click", () => {
  DOM.sidebar.classList.remove("sidebar--hidden");
  DOM.sidebarExpandButton.classList.add(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap();
  DOM.sidebarCollapseButton.focus();
});

DOM.sidebarCollapseButton.addEventListener("click", () => {
  DOM.sidebar.classList.add("sidebar--hidden");
  DOM.sidebarExpandButton.classList.remove(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap();
  DOM.sidebarExpandButton.focus();
});
