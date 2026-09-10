import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import { Task } from "../models/task.js";
import { createEvent, createTemplate } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `.task-viewer {
    display: none;
    width: 90%;
    max-width: 65ch;
    height: 85%;
    margin: auto;
    background-color: var(--color-background);
    color: var(--color-text);
    border: 2px solid var(--color-border);
    border-radius: 1rem;
  }

  .task-viewer[open] {
    display: grid;
    grid-template-rows: 3.25rem 1fr 3.25rem;
  }

  .task-viewer::backdrop {
    background-color: hsl(0 0 0 / 0.5);
  }

  .task-viewer__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.5rem;
    border-bottom: 2px solid var(--color-border);
  }

  .task-viewer__heading {
    margin-left: 0.5rem;
    font-weight: 600;
  }

  .task-viewer__close-button {
    padding: 0.25rem;
    background-color: var(--color-error);
    color: hsl(215 15% 90%);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition:
      background-color 150ms,
      transform 150ms;
  }

  .task-viewer__close-button:hover {
    background-color: hsl(from var(--color-error) h s calc(l + 4));
  }

  .task-viewer__close-button:active {
    background-color: hsl(from var(--color-error) h s calc(l + 2));
    transform: scale(0.95);
  }

  .task-viewer__viewport {
    padding: 1rem 2rem;
    overflow-y: auto;
  }

  .task-viewer__title {
    margin-bottom: 0.5rem;
    text-wrap: balance;
    word-break: break-word;
  }

  .task-viewer__description {
    color: var(--color-text-muted);
  }

  .task-viewer__description--defined {
    color: var(--color-text);
    text-wrap: pretty;
    word-break: break-word;
  }

  .task-viewer__metadata {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-top: 2px solid var(--color-border);
  }

  .task-viewer__due-date,
  .task-viewer__priority {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-muted);
  }

  .task-viewer__due-date {
    border-right: 2px solid var(--color-border);
  }

  .task-viewer__due-date--upcoming,
  .task-viewer__due-date--tomorrow {
    color: var(--color-text);
  }

  .task-viewer__due-date--today {
    color: var(--color-warning);
  }

  .task-viewer__due-date--overdue {
    color: var(--color-error);
  }

  .task-viewer__priority--low {
    color: var(--color-success);
  }

  .task-viewer__priority--moderate {
    color: var(--color-warning);
  }

  .task-viewer__priority--high {
    color: var(--color-error);
  }

  @media (width <=425px) {
    .task-viewer[open] {
      width: 100%;
      max-width: unset;
      height: 100%;
      max-height: unset;
      border: none;
      border-radius: 0;
    }
  }`,
);

const template = createTemplate(
  `<dialog id="task-viewer" class="task-viewer">
    <header class="task-viewer__header">
      <button aria-label="Close task viewer" id="task-viewer-close-button" class="task-viewer__close-button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
          <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path fill="currentColor"
            d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z" />
        </svg>
      </button>
    </header>

    <div class="task-viewer__viewport">
      <h2 id="task-viewer-title" class="task-viewer__title">Title</h2>
      <p id="task-viewer-description" class="task-viewer__description">
        Description
      </p>
    </div>

    <div class="task-viewer__metadata">
      <p class="task-viewer__due-date">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
          <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path fill="currentColor"
            d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V3q0-.425.288-.712T7 2t.713.288T8 3v1h8V3q0-.425.288-.712T17 2t.713.288T18 3v1h1q.825 0 1.413.588T21 6v4.675q0 .425-.288.713t-.712.287t-.712-.288t-.288-.712V10H5v10h5.8q.425 0 .713.288T11.8 21t-.288.713T10.8 22zm13 1q-2.075 0-3.537-1.463T13 18t1.463-3.537T18 13t3.538 1.463T23 18t-1.463 3.538T18 23m.5-5.2v-2.3q0-.2-.15-.35T18 15t-.35.15t-.15.35v2.275q0 .2.075.388t.225.337l1.525 1.525q.15.15.35.15t.35-.15t.15-.35t-.15-.35z" />
        </svg>
        <span id="task-viewer-due-date">DD/MM/YYYY</span>
      </p>

      <p class="task-viewer__priority">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
          <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
          <path fill="currentColor"
            d="M7 14v6q0 .425-.288.713T6 21t-.712-.288T5 20V5q0-.425.288-.712T6 4h7.175q.35 0 .625.225t.35.575L14.4 6H19q.425 0 .713.288T20 7v8q0 .425-.288.713T19 16h-5.175q-.35 0-.625-.225t-.35-.575L12.6 14z" />
        </svg>
        <span id="task-viewer-priority">Priority</span>
      </p>
    </div>
  </dialog>`,
);

export class TaskViewer extends HTMLElement {
  #abortController;
  #state;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalStyleSheet, styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.#state = {
      isOpen: false,
      task: {},
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

    this.taskViewer = this.shadowRoot.querySelector("#task-viewer");
    this.titleElement = this.shadowRoot.querySelector("#task-viewer-title");
    this.descriptionElement = this.shadowRoot.querySelector(
      "#task-viewer-description",
    );
    this.dueDateElement = this.shadowRoot.querySelector(
      "#task-viewer-due-date",
    );
    this.dueDateWrapperElement = this.shadowRoot.querySelector(
      ".task-viewer__due-date",
    );
    this.priorityElement = this.shadowRoot.querySelector(
      "#task-viewer-priority",
    );
    this.priorityWrapperElement = this.shadowRoot.querySelector(
      ".task-viewer__priority",
    );
    this.closeButtonElement = this.shadowRoot.querySelector(
      "#task-viewer-close-button",
    );

    this.shadowRoot.addEventListener("click", this.handleClick, {
      signal: this.#abortController.signal,
    });

    this.render();
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleClick = ({ target }) => {
    if (target === this.closeButtonElement) {
      this.state = { isOpen: false, task: {} };
      this.dispatchEvent(createEvent("task-viewer: close"));
    }
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    if (!this.#state.isOpen) {
      this.taskViewer.close();
      return;
    }

    this.descriptionElement.className = "task-viewer__description";
    this.dueDateWrapperElement.className = "task-viewer__due-date";
    this.priorityWrapperElement.className = "task-viewer__priority";

    try {
      if (!(this.#state.task instanceof Task)) {
        return;
      }

      this.titleElement.textContent = this.#state.task.title;
      this.descriptionElement.textContent = this.#state.task.prettyDescription;
      this.dueDateElement.textContent = this.#state.task.prettyDueDate;
      this.priorityElement.textContent = this.#state.task.prettyPriority;

      if (this.#state.task.description) {
        this.descriptionElement.classList.add(
          `task-viewer__description--defined`,
        );
      }

      this.dueDateWrapperElement.classList.add(
        `task-viewer__due-date--${this.#state.task.dueDateStatus}`,
      );

      this.priorityWrapperElement.classList.add(
        `task-viewer__priority--${this.#state.task.priority}`,
      );
    } finally {
      this.taskViewer.showModal();
    }
  }
}

customElements.define("task-viewer", TaskViewer);
