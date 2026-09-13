import { store } from "./core/store.js";
import { HorizonView } from "./views/horizon.js";
import { SettingsView } from "./views/settings.js";

const routes = {
  "/": {
    name: "Inbox",
    view: HorizonView,

    init() {
      store.setTasksRefinements({
        tasksFilterData: {
          dueDateStatus: "",
        },
      });
    },
  },

  "/today": {
    name: "Today",
    view: HorizonView,

    init() {
      store.setTasksRefinements({
        tasksFilterData: {
          dueDateStatus: "today",
        },
      });
    },
  },

  "/tomorrow": {
    name: "Tomorrow",
    view: HorizonView,

    init() {
      store.setTasksRefinements({
        tasksFilterData: {
          dueDateStatus: "tomorrow",
        },
      });
    },
  },

  "/upcoming": {
    name: "Upcoming",
    view: HorizonView,

    init() {
      store.setTasksRefinements({
        tasksFilterData: {
          dueDateStatus: "upcoming",
        },
      });
    },
  },

  "/settings": {
    name: "Settings",
    view: SettingsView,
  },
};

let currentRoute = routes[getPathname()];

function navigateTo(url) {
  window.history.pushState(null, null, url);
  router();
}

function router() {
  document.body.classList.add("static");

  if (!routes[getPathname()]) {
    window.location.replace("/");
  }

  currentRoute.view.unmount();
  currentRoute = routes[getPathname()];
  store.setPathname(getPathname());

  currentRoute.view.mount(currentRoute.name);
  if (currentRoute.init) {
    currentRoute.init();
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove("static");
    });
  });
}

function getPathname() {
  return window.location.pathname;
}

window.addEventListener("DOMContentLoaded", router);
window.addEventListener("popstate", router);

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("sidebar__tab-link")) {
    event.preventDefault();
    navigateTo(event.target.href);
  }
});
