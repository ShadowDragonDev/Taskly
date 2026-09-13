import { store } from "./core/store.js";
import "./router.js";
import { getSystemTheme } from "./utilities/misc.js";

const documentRoot = document.documentElement;
const sidebar = document.querySelector("#sidebar");
const sidebarExpandButton = document.querySelector("#sidebar-expand-button");
const sidebarCollapseButton = document.querySelector(
  "#sidebar-collapse-button",
);

const mobileMediaQuery = window.matchMedia("(width <= 768px)");

function updateTheme() {
  const theme = store.getSettings().theme;
  let explicitTheme;

  if (theme === "system") {
    explicitTheme = getSystemTheme();
  }

  document.startViewTransition(() => {
    document.body.classList.add("static");
    documentRoot.setAttribute("data-theme", explicitTheme);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove("static");
      });
    });
  });
}

function updateSidebarFocusTrap() {
  const sidebarCollapsed = sidebar.classList.contains("sidebar--hidden");
  sidebar.inert = sidebarCollapsed;

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

mobileMediaQuery.addEventListener("change", updateSidebarFocusTrap);

store.addEventListener(
  "store: pathname-changed",
  ({ detail: { pathname } }) => {
    const sidebarTabs = sidebar.querySelectorAll(".sidebar__tab");

    sidebarTabs.forEach((sidebarTab) => {
      if (sidebarTab.querySelector(`[href="${pathname}"]`)) {
        sidebarTab.classList.add("sidebar__tab--active");
      } else {
        sidebarTab.classList.remove("sidebar__tab--active");
      }
    });
  },
);

store.addEventListener("store: settings-changed", updateTheme);

sidebarExpandButton.addEventListener("click", () => {
  sidebar.classList.remove("sidebar--hidden");
  sidebarExpandButton.classList.add(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap();
  sidebarCollapseButton.focus();
});

sidebarCollapseButton.addEventListener("click", () => {
  sidebar.classList.add("sidebar--hidden");
  sidebarExpandButton.classList.remove(
    "site-header__sidebar-expand-button--hidden",
  );

  updateSidebarFocusTrap();
  sidebarExpandButton.focus();
});
