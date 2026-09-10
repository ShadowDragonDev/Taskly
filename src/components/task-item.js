import { Task } from "../models/task.js";
import { createEvent, createTemplate } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `task-item {
    display: grid;
    grid-template-columns: subgrid;
    align-items: center;
    grid-column: 1 / -1;
    padding: 0.5rem;
    border-radius: 0.5rem;
  }

  task-item[hidden] {
    display: none !important;
  }

  .task-item__status-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .task-item__status-wrapper::after {
    content: "";
    position: absolute;
    width: 0.5rem;
    height: 1rem;
    border: solid transparent;
    border-width: 0 0.25rem 0.25rem 0;
    pointer-events: none;
    transition:
      border-color 150ms,
      transform 150ms;
  }

  .task-item__status-wrapper:has(.task-item__status:checked)::after {
    border-color: hsl(215 15% 90%);
    transform: rotateZ(45deg);
  }

  .task-item__status {
    appearance: none;
    width: 2rem;
    height: 2rem;
    background-color: var(--color-background);
    border: 2px solid var(--color-border);
    border-radius: 999999999px;
    cursor: pointer;
    transition:
      background-color 150ms,
      border-color 150ms,
      transform 150ms;
  }

  .task-item__status:hover {
    background-color: var(--color-background-lighter);
  }

  .task-item__status:active {
    background-color: hsl(from var(--color-background-lighter) h s calc(l - 2));
    transform: scale(0.95);
  }

  .task-item__status:checked {
    background-color: var(--color-success);
    border-color: var(--color-success);
  }

  .task-item__title {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .task-item__due-date,
  .task-item__priority {
    color: var(--color-text-muted);
  }

  .task-item__due-date--upcoming,
  .task-item__due-date--tomorrow {
    color: var(--color-text);
  }

  .task-item__due-date--today {
    color: var(--color-warning);
  }

  .task-item__due-date--overdue {
    color: var(--color-error);
  }

  .task-item__priority--low {
    color: var(--color-success);
  }

  .task-item__priority--moderate {
    color: var(--color-warning);
  }

  .task-item__priority--high {
    color: var(--color-error);
  }

  .task-item__button {
    padding: 0.5rem;
    background-color: var(--color-background);
    border: none;
    border-radius: 999999999px;
    cursor: pointer;
    transition:
      background-color 150ms,
      transform 150ms;
  }

  .task-item__button:hover {
    background-color: var(--color-background-lighter);
  }

  .task-item__button:active {
    background-color: hsl(from var(--color-background-lighter) h s calc(l - 2));
    transform: scale(0.95);
  }

  .task-item__button:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @media (width <=425px) {
    .task-item__due-date,
    .task-item__priority {
      display: none;
    }
  }`,
);

const template = createTemplate(
  `<div class="task-item__status-wrapper">
    <input type="checkbox" class="task-item__status" />
  </div>

  <label class="task-item__title"></label>
  <p class="task-item__due-date"></p>
  <p class="task-item__priority"></p>

  <button
    popovertarget="task-actions-menu"
    aria-label="Show task actions menu"
    class="task-item__button"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
      <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
      <path
        fill="currentColor"
        d="M6 14q-.825 0-1.412-.587T4 12t.588-1.412T6 10t1.413.588T8 12t-.587 1.413T6 14m6 0q-.825 0-1.412-.587T10 12t.588-1.412T12 10t1.413.588T14 12t-.587 1.413T12 14m6 0q-.825 0-1.412-.587T16 12t.588-1.412T18 10t1.413.588T20 12t-.587 1.413T18 14"
      />
    </svg>
  </button>`,
);

export class TaskItem extends HTMLElement {
  #internals;
  #abortController;
  #state;

  static get observedAttributes() {
    return ["hidden", "disabled"];
  }

  get hidden() {
    return this.hasAttribute("hidden");
  }

  set hidden(value) {
    this.toggleAttribute("hidden", Boolean(value));
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.#internals.role = "listitem";

    if (!document.adoptedStyleSheets.includes(styleSheet)) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
    }

    this.#state = {
      task: {},
      search: "",
    };
  }

  get state() {
    return { ...this.#state };
  }

  set state(state = {}) {
    this.#state = { ...this.#state, ...state };
    this.render();
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    this.append(template.content.cloneNode(true));

    this.statusElement = this.querySelector(".task-item__status");
    this.titleElement = this.querySelector(".task-item__title");
    this.dueDateElement = this.querySelector(".task-item__due-date");
    this.priorityElement = this.querySelector(".task-item__priority");

    this.statusElement.addEventListener("click", this.handleClick, {
      signal: this.#abortController.signal,
    });

    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === oldValue) {
      return;
    }

    if (name === "disabled") {
      this.querySelector(".task-item__button").disabled = newValue !== null;
    }
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleClick = ({ target }) => {
    if (target === this.statusElement) {
      this.#state.task.status = this.statusElement.checked
        ? "complete"
        : "incomplete";

      const plainTask = this.state.task;
      plainTask.createDate = plainTask.createDate.toString();
      plainTask.dueDate = plainTask.dueDate.toString();

      this.dispatchEvent(
        createEvent("task-item: changed", {
          task: plainTask,
        }),
      );
    }
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    this.dueDateElement.className = "task-item__due-date";
    this.priorityElement.className = "task-item__priority";

    if (!(this.#state.task instanceof Task)) {
      return;
    }

    this.id = this.#state.task.id;
    this.statusElement.id = `task-item-status-${this.#state.task.id}`;
    this.titleElement.htmlFor = `task-item-status-${this.#state.task.id}`;

    this.statusElement.checked = this.#state.task.status === "complete";

    if (this.#state.search) {
      const searchRegex = new RegExp(`(${this.#state.search})`, "i");
      const titleFragments = this.#state.task.title
        .split(searchRegex)
        .filter((titleFragment) => Boolean(titleFragment));

      for (const titleFragment of titleFragments) {
        if (searchRegex.test(titleFragment)) {
          const markElement = document.createElement("mark");
          markElement.textContent = titleFragment;
          this.titleElement.append(markElement);
        } else {
          const textNode = document.createTextNode(titleFragment);
          this.titleElement.append(textNode);
        }
      }
    } else {
      this.titleElement.textContent = this.#state.task.title;
    }

    this.dueDateElement.textContent = this.#state.task.prettyDueDate;
    this.priorityElement.textContent = this.#state.task.prettyPriority;

    this.dueDateElement.classList.add(
      `task-item__due-date--${this.#state.task.dueDateStatus}`,
    );

    this.priorityElement.classList.add(
      `task-item__priority--${this.#state.task.priority}`,
    );
  }
}

customElements.define("task-item", TaskItem);
