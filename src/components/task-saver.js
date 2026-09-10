import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import { Task } from "../models/task.js";
import { createEvent, createTemplate } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `:host {
    display: block;
    grid-column: 1 / -1;
  }

  :host([hidden]) {
    display: none !important;
  }

  .task-saver {
    display: flex;
    flex-direction: column;
    margin-block: 0.5rem;
    padding: 0.5rem;
    border: 2px solid var(--color-border);
    border-radius: 1rem;
  }

  .task-saver__title,
  .task-saver__description {
    margin-inline: 0.25rem;
    background-color: var(--color-background)
  }

  .task-saver__due-date,
  .task-saver__priority {
    background-color: var(--color-background-lighter);
  }

  :where(.task-saver__title, .task-saver__description)::placeholder {
    color: var(--color-text-muted);
  }

  :where(.task-saver__title, .task-saver__description):focus {
    outline: none;
  }

  .task-saver__title {
    border: none;
    font-weight: 600;
  }

  .task-saver__description {
    min-height: 1lh;
    border: none;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem);
    field-sizing: content;
    resize: none;
  }

  .task-saver__metadata {
    display: flex;
    gap: 0.5rem;
    padding-block: 0.5rem;
    border-bottom: 2px solid var(--color-border);
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem);
  }

  .task-saver__due-date,
  .task-saver__priority {
    flex: 1;
    padding: 0.25rem 0.75rem;
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
  }

  .task-saver__buttons-container {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-block: 0.5rem 0;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem);
  }

  .task-saver__reject-button,
  .task-saver__accept-button {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition:
      background-color 150ms,
      transform 150ms;
  }

  .task-saver__reject-button {
    background-color: var(--color-background);
    color: var(--color-text);
  }

  .task-saver__reject-button:hover {
    background-color: var(--color-background-lighter);
  }

  .task-saver__reject-button:active {
    background-color: hsl(from var(--color-background-lighter) h s calc(l - 2));
    transform: scale(0.95);
  }

  .task-saver__accept-button {
    background-color: var(--color-information);
    color: hsl(215 15% 90%);
  }

  .task-saver__accept-button:hover {
    background-color: hsl(from var(--color-information) h s calc(l + 4));
  }

  .task-saver__accept-button:active {
    background-color: hsl(from var(--color-information) h s calc(l + 2));
    transform: scale(0.95);
  }

  .task-saver__accept-button:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  @media (width <=425px) {
    .task-saver__metadata {
      flex-direction: column;
    }
  }`,
);

const template = createTemplate(
  `<form id="task-saver" class="task-saver">
    <label for="task-saver-title" class="sr-only">Title</label>
    <input type="text" name="title" id="task-saver-title" class="task-saver__title"
      placeholder="Enter task title here..." required pattern=".*\\S.*" />

    <label for="task-saver-description" class="sr-only">
      Description
    </label>
    <textarea name="description" id="task-saver-description" class="task-saver__description"
      placeholder="Description..."></textarea>

    <div class="task-saver__metadata">
      <label for="task-saver-due-date" class="sr-only">Due Date</label>
      <input type="date" name="due-date" id="task-saver-due-date" class="task-saver__due-date" />

      <label for="task-saver-priority" class="sr-only">Priority</label>
      <select name="priority" id="task-saver-priority" class="task-saver__priority">
        <option value="low" selected>Low</option>
        <option value="moderate">Moderate</option>
        <option value="high">High</option>
      </select>
    </div>

    <div class="task-saver__buttons-container">
      <button type="button" id="task-saver-reject-button" class="task-saver__reject-button">
        Cancel
      </button>

      <button type="submit" id="task-saver-accept-button" class="task-saver__accept-button">
        Save
      </button>
    </div>
  </form>`,
);

export class TaskSaver extends HTMLElement {
  #abortController;
  #state;

  get hidden() {
    return this.hasAttribute("hidden");
  }

  set hidden(value) {
    this.toggleAttribute("hidden", Boolean(value));
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalStyleSheet, styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.#state = {
      isOpen: false,
      task: {},
      dueDateStatusFilter: "",
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

    this.taskSaver = this.shadowRoot.querySelector("#task-saver");
    this.titleElement = this.shadowRoot.querySelector("#task-saver-title");
    this.descriptionElement = this.shadowRoot.querySelector(
      "#task-saver-description",
    );
    this.dueDateElement = this.shadowRoot.querySelector("#task-saver-due-date");
    this.priorityElement = this.shadowRoot.querySelector(
      "#task-saver-priority",
    );
    this.rejectButtonElement = this.shadowRoot.querySelector(
      "#task-saver-reject-button",
    );
    this.acceptButtonElement = this.shadowRoot.querySelector(
      "#task-saver-accept-button",
    );

    this.shadowRoot.addEventListener("click", this.handleClick, {
      signal: this.#abortController.signal,
    });

    this.shadowRoot.addEventListener("input", this.handleInput, {
      signal: this.#abortController.signal,
    });

    this.shadowRoot.addEventListener("submit", this.handleSubmit, {
      signal: this.#abortController.signal,
    });

    this.render();
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleClick = ({ target }) => {
    if (target === this.rejectButtonElement) {
      this.state = { isOpen: false };
      this.dispatchEvent(createEvent("task-saver: close"));
    }
  };

  handleInput = () => {
    this.acceptButtonElement.disabled = !this.taskSaver.checkValidity();
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const taskSaverData = new FormData(this.taskSaver);

    this.#state.task.title = taskSaverData.get("title");
    this.#state.task.description = taskSaverData.get("description");
    this.#state.task.dueDate = taskSaverData.get("due-date");
    this.#state.task.priority = taskSaverData.get("priority");

    this.dispatchEvent(
      createEvent("task-saver: submit", { task: this.state.task }),
    );

    if (this.#state.task?.id) {
      this.state = { isOpen: false };
    } else {
      this.state = { isOpen: true, task: {} };
    }
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    if (!this.#state.isOpen) {
      this.hidden = true;
      this.#state.task = {};
      return;
    }

    this.taskSaver.reset();
    this.acceptButtonElement.disabled = true;

    try {
      if (!(this.#state.task instanceof Task)) {
        if (!this.#state.dueDateStatusFilter) {
          return;
        }

        const suggestedDueDate = () => {
          switch (this.#state.dueDateStatusFilter) {
            case "today":
              return Temporal.Now.plainDateISO();

            case "tomorrow":
              return Temporal.Now.plainDateISO().add({ days: 1 });

            default:
              return "";
          }
        };

        this.#state.task.dueDate = suggestedDueDate();
        this.dueDateElement.value = this.#state.task.dueDate;
        return;
      }

      this.titleElement.value = this.#state.task.title;
      this.descriptionElement.value = this.#state.task.description;
      this.dueDateElement.value = this.#state.task.dueDate;
      this.priorityElement.value = this.#state.task.priority;
      this.acceptButtonElement.disabled = false;
    } finally {
      this.hidden = false;
      this.titleElement.focus();
    }
  }
}

customElements.define("task-saver", TaskSaver);
