import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import "../components/empty-state.js";
import "../components/searchbar.js";
import "../components/task-actions-menu.js";
import "../components/task-saver.js";
import "../components/task-viewer.js";
import "../components/tasks-list.js";
import "../components/tasks-refiner-menu.js";
import { store } from "../core/store.js";
import { createTemplate, sleep } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `.viewport__container {
    margin-inline: auto;
    max-width: 600px;
  }

  .viewport__header {
    display: grid;
    grid-template-columns: 1fr repeat(2, auto);
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 2rem;
  }

  .viewport__name {
    margin-right: 1.5rem;
  }

  .viewport__button {
    padding: 0.5rem;
    background-color: var(--color-background);
    border: none;
    border-radius: 999999999px;
    cursor: pointer;
    transition:
      background-color 150ms,
      transform 150ms;
  }

  .viewport__button:hover {
    background-color: var(--color-background-lighter);
  }

  .viewport__button:active {
    background-color: hsl(from var(--color-background-lighter) h s calc(l - 2));
    transform: scale(0.95);
  }

  .viewport__button:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .create-task-button {
    position: fixed;
    bottom: 3rem;
    right: 3rem;
    padding: 1.5rem;
    background-color: var(--color-information);
    color: hsl(215 15% 90%);
    border: none;
    border-radius: 999999999px;
    stroke: hsl(215 15% 90%);
    stroke-width: 1px;
    cursor: pointer;
    transition:
      background-color 150ms,
      transform 150ms;
  }

  .create-task-button:hover {
    background-color: hsl(from var(--color-information) h s calc(l + 4));
  }

  .create-task-button:active {
    background-color: hsl(from var(--color-information) h s calc(l + 2));
    transform: scale(0.95);
  }

  .create-task-button:disabled {
    opacity: 0.5;
    pointer-events: none;
  }`,
);

const template = createTemplate(
  `<div class="viewport__container">
    <div class="viewport__header">
      <h2 id="viewport-name" class="viewport__name"></h2>

      <search-bar id="searchbar"></search-bar>

      <button aria-label="Toggle filter and sort menu" popovertarget="tasks-refiner-menu" id="tasks-refiner-menu-toggle" class="viewport__button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
          <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path fill="currentColor"
            d="M14 9q-.425 0-.712-.288T13 8t.288-.712T14 7h2V4q0-.425.288-.712T17 3t.713.288T18 4v3h2q.425 0 .713.288T21 8t-.288.713T20 9zm3 12q-.425 0-.712-.288T16 20v-8q0-.425.288-.712T17 11t.713.288T18 12v8q0 .425-.288.713T17 21M7 21q-.425 0-.712-.288T6 20v-3H4q-.425 0-.712-.288T3 16t.288-.712T4 15h6q.425 0 .713.288T11 16t-.288.713T10 17H8v3q0 .425-.288.713T7 21m0-8q-.425 0-.712-.288T6 12V4q0-.425.288-.712T7 3t.713.288T8 4v8q0 .425-.288.713T7 13" />
        </svg>
      </button>

      <tasks-refiner-menu popover id="tasks-refiner-menu"></tasks-refiner-menu>
    </div>

    <tasks-list id="tasks-list"></tasks-list>
    <task-actions-menu popover id="task-actions-menu"></task-actions-menu>

    <empty-state id="empty-state"></empty-state>

    <task-saver id="task-saver"></task-saver>
    <task-viewer id="task-viewer"></task-viewer>

    <button aria-label="Add task" id="create-task-button" class="create-task-button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
        <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
        <path fill="currentColor"
          d="M12 21q-.425 0-.712-.288T11 20v-7H4q-.425 0-.712-.288T3 12t.288-.712T4 11h7V4q0-.425.288-.712T12 3t.713.288T13 4v7h7q.425 0 .713.288T21 12t-.288.713T20 13h-7v7q0 .425-.288.713T12 21" />
      </svg>
    </button>
  </div>`,
);

export class HorizonView {
  static #abortController;
  static #viewport = document.querySelector("#viewport");

  static mount(viewName) {
    // Data initialization
    HorizonView.#abortController = new AbortController();

    // View foundation
    document.adoptedStyleSheets = [globalStyleSheet, styleSheet];
    HorizonView.#viewport.append(template.content.cloneNode(true));

    // DOM references
    HorizonView.viewportName =
      HorizonView.#viewport.querySelector("#viewport-name");
    HorizonView.searchbar = HorizonView.#viewport.querySelector("#searchbar");
    HorizonView.tasksRefinerMenu = HorizonView.#viewport.querySelector(
      "#tasks-refiner-menu",
    );
    HorizonView.tasksRefinerMenuToggle = HorizonView.#viewport.querySelector(
      "#tasks-refiner-menu-toggle",
    );
    HorizonView.tasksList = HorizonView.#viewport.querySelector("#tasks-list");
    HorizonView.taskActionsMenu =
      HorizonView.#viewport.querySelector("#task-actions-menu");
    HorizonView.emptyState =
      HorizonView.#viewport.querySelector("#empty-state");
    HorizonView.createTaskButton = HorizonView.#viewport.querySelector(
      "#create-task-button",
    );
    HorizonView.taskSaver = HorizonView.#viewport.querySelector("#task-saver");
    HorizonView.taskViewer =
      HorizonView.#viewport.querySelector("#task-viewer");

    // View initialization
    HorizonView.viewportName.textContent = viewName;
    updateEmptyState();

    const {
      tasksFilterData: { title, ...tasksFilters },
      tasksSorterData,
    } = store.getTasksRefinements();

    HorizonView.searchbar.state = {
      search: title,
    };

    HorizonView.tasksRefinerMenu.state = {
      tasksFilterData: tasksFilters,
      tasksSorterData,
    };

    HorizonView.tasksList.state = {
      tasks: store.getTasks({ refined: true }),
    };

    // View life
    function updateEmptyState() {
      const tasks = store.getTasks();
      const tasksRefined = store.getTasks({ refined: true });
      const tasksRefinements = store.getTasksRefinements();

      HorizonView.createTaskButton.hidden = !tasksRefined.length;

      if (!HorizonView.taskSaver.hidden) {
        HorizonView.emptyState.state = { reason: "" };
        return;
      }

      HorizonView.emptyState.state = { reason: "no-tasks" };

      if (!tasks.length) {
        if (!localStorage.getItem("isWelcome")) {
          HorizonView.emptyState.state = { reason: "welcome" };
        }

        return;
      }

      localStorage.setItem("isWelcome", "nah");

      if (tasksRefined.length) {
        HorizonView.emptyState.state = { reason: "" };
        return;
      }

      if (tasksRefinements.tasksFilterData.title) {
        HorizonView.emptyState.state = { reason: "no-tasks--search" };

        return;
      }

      if (tasksRefinements.tasksFilterData.status === "complete") {
        HorizonView.emptyState.state = { reason: "no-tasks--complete" };
        return;
      }
    }

    function openTaskSaver(task = {}, taskItem) {
      HorizonView.searchbar.disabled = true;
      HorizonView.tasksRefinerMenuToggle.disabled = true;
      HorizonView.createTaskButton.disabled = true;
      HorizonView.tasksList.disabled = true;

      if (taskItem) {
        taskItem.hidden = true;
        taskItem.insertAdjacentElement("afterend", HorizonView.taskSaver);
      } else {
        HorizonView.tasksList.insertAdjacentElement(
          "afterend",
          HorizonView.taskSaver,
        );
      }

      HorizonView.taskSaver.state = {
        isOpen: true,
        task,
        dueDateStatusFilter:
          store.getTasksRefinements().tasksFilterData.dueDateStatus,
      };

      updateEmptyState();
    }

    function closeTaskSaver() {
      HorizonView.searchbar.disabled = false;
      HorizonView.tasksRefinerMenuToggle.disabled = false;
      HorizonView.createTaskButton.disabled = false;
      HorizonView.tasksList.disabled = false;
      updateEmptyState();
    }

    store.addEventListener(
      "store: tasks-changed",
      () => {
        this.tasksList.state = { tasks: store.getTasks({ refined: true }) };
        updateEmptyState();
      },
      { signal: this.#abortController.signal },
    );

    store.addEventListener(
      "store: tasks-refinements-changed",
      ({
        detail: {
          tasksFilterData: { title },
        },
      }) => {
        this.tasksList.state = {
          tasks: store.getTasks({ refined: true }),
          search: title,
        };
        updateEmptyState();
      },
      { signal: this.#abortController.signal },
    );

    HorizonView.searchbar.addEventListener(
      "search-bar: search-changed",
      ({ detail: { search } }) => {
        store.setTasksRefinements({ tasksFilterData: { title: search } });
      },
    );

    HorizonView.tasksRefinerMenu.addEventListener(
      "tasks-refiner-menu: tasks-refinements-changed",
      ({ detail }) => {
        store.setTasksRefinements(detail);
      },
    );

    HorizonView.tasksList.addEventListener(
      "task-item: changed",
      async ({ detail: { task } }) => {
        await sleep(200);
        store.updateTask(task.id, task);
        updateEmptyState();
      },
      { signal: this.#abortController.signal },
    );

    HorizonView.taskActionsMenu.addEventListener(
      "click",
      () => {
        const { taskItem, action } = HorizonView.taskActionsMenu.state;
        const task = store.getTask(taskItem.id);

        if (action === "read") {
          HorizonView.taskViewer.state = { isOpen: true, task };
        }

        if (action === "update") {
          openTaskSaver(task, taskItem);
        }

        if (action === "delete") {
          store.deleteTask(taskItem.id);
        }
      },
      { signal: this.#abortController.signal },
    );

    HorizonView.createTaskButton.addEventListener("click", openTaskSaver, {
      signal: this.#abortController.signal,
    });

    HorizonView.emptyState.addEventListener("task-saver: open", openTaskSaver, {
      signal: this.#abortController.signal,
    });

    HorizonView.taskSaver.addEventListener(
      "task-saver: close",
      () => {
        HorizonView.tasksList.render();
        closeTaskSaver();
      },
      { signal: this.#abortController.signal },
    );

    HorizonView.taskSaver.addEventListener(
      "task-saver: submit",
      ({ detail }) => {
        const task = detail.task;

        if (!task.id) {
          store.addTask(task);
          return;
        }

        store.updateTask(task.id, task);
        closeTaskSaver();
      },
      { signal: this.#abortController.signal },
    );
  }

  static unmount() {
    HorizonView.#abortController?.abort();
    HorizonView.#viewport.replaceChildren();
  }
}
