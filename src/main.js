import { store } from "./core/store.js";
import "./router.js";

const DOM = {
  documentRoot: document.documentElement,
  sidebar: document.querySelector("#sidebar"),
  sidebarExpandButton: document.querySelector("#sidebar-expand-button"),
  sidebarCollapseButton: document.querySelector("#sidebar-collapse-button"),
};

const mobileMediaQuery = window.matchMedia("(width <= 768px)");

function setTheme(theme) {
  if (theme === "system") {
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    theme = isSystemDark ? "dark" : "light";
  }

  document.startViewTransition(() => {
    DOM.documentRoot.setAttribute("data-theme", theme);
  });
}

function updateSidebarFocusTrap(mediaQuery) {
  const sidebarCollapsed = DOM.sidebar.classList.contains("sidebar--hidden");
  DOM.sidebar.inert = sidebarCollapsed;

  if (!mediaQuery.matches) {
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

setTheme(store.getSettings().theme);
updateSidebarFocusTrap(mobileMediaQuery);

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
  setTheme(detail.theme);
});

DOM.sidebarExpandButton.addEventListener("click", () => {
  DOM.sidebar.classList.remove("sidebar--hidden");
  DOM.sidebarExpandButton.classList.add(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap(mobileMediaQuery);
  DOM.sidebarCollapseButton.focus();
});

DOM.sidebarCollapseButton.addEventListener("click", () => {
  DOM.sidebar.classList.add("sidebar--hidden");
  DOM.sidebarExpandButton.classList.remove(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap(mobileMediaQuery);
  DOM.sidebarExpandButton.focus();
});
