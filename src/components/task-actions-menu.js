import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import { createEvent, createTemplate } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `:host {
    background-color: transparent;
    border: none;
  }

  :host(:popover-open) {
    position: fixed;
    position-anchor: auto;
    inset: unset;
    top: anchor(bottom);
    right: anchor(right);
  }

  .task-actions-menu {
    display: grid;
    grid-template-rows: repeat(3, auto);
    grid-template-columns: auto 1fr;
    margin-top: 0.5rem;
    padding: 0.25rem;
    background-color: var(--color-background-lighter);
    color: var(--color-text);
    border: 2px solid var(--color-border);
    border-radius: 0.75rem;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem)
  }

  .task-actions-menu__button {
    display: grid;
    grid-template-columns: subgrid;
    gap: 0.5rem;
    place-items: center start;
    grid-column: 1 / -1;
    padding: 0.25rem 0.5rem;
    background-color: var(--color-background-lighter);
    color: var(--color-text);
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 150ms, transform 150ms;
  }

  .task-actions-menu__button:hover {
    background-color: hsl(from var(--color-background-lighter) h s calc(l + 4));
  }

  .task-actions-menu__button:active {
    background-color: hsl(from var(--color-background-lighter) h s calc(l + 2));
    transform: scale(0.95);
  }

  #delete {
    color: var(--color-error);
  }`,
);

const template = createTemplate(
  `<div id="task-actions-menu" class="task-actions-menu">
    <button id="read" class="task-actions-menu__button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
        <path fill="currentColor"
          d="M8 16h12V6H8zm0 2q-.825 0-1.412-.587T6 16V4q0-.825.588-1.412T8 2h12q.825 0 1.413.588T22 4v12q0 .825-.587 1.413T20 18zm-4 4q-.825 0-1.412-.587T2 20V7q0-.425.288-.712T3 6t.713.288T4 7v13h13q.425 0 .713.288T18 21t-.288.713T17 22zM8 4v12z" />
      </svg>
      View
    </button>

    <button id="update" class="task-actions-menu__button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
        <path fill="currentColor"
          d="m10 21l4-4h6q.825 0 1.413.588T22 19q0 .825-.588 1.413T20 21H10Zm-6-2h1.4l8.625-8.625l-1.4-1.4L4 17.6V19ZM18.3 8.925l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L18.3 8.925ZM3 21q-.425 0-.713-.288T2 20v-2.825q0-.2.075-.388t.225-.337l10.3-10.3l4.25 4.25l-10.3 10.3q-.15.15-.337.225T5.825 21H3ZM13.325 9.675l-.7-.7l1.4 1.4l-.7-.7Z" />
      </svg>
      Edit
    </button>

    <button id="delete" class="task-actions-menu__button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
        <path fill="currentColor"
          d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z" />
      </svg>
      Delete
    </button>
  </div>`,
);

export class TaskActionsMenu extends HTMLElement {
  #internals;
  #abortController;
  #state;

  constructor() {
    super();

    this.#internals = this.attachInternals();
    this.#internals.role = "menu";

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalStyleSheet, styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.#state = {
      taskItem: null,
      action: "",
    };
  }

  get state() {
    return { ...this.#state };
  }

  set state(state = {}) {
    this.#state = { ...this.#state, ...state };
  }

  connectedCallback() {
    this.#abortController = new AbortController();

    this.addEventListener("beforetoggle", this.handleBeforeToggle, {
      signal: this.#abortController.signal,
    });

    this.shadowRoot.addEventListener("click", this.handleClick, {
      signal: this.#abortController.signal,
    });
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleBeforeToggle = (event) => {
    if (event.newState === "open") {
      const taskItem = event.source.closest("task-item");
      this.#state.taskItem = taskItem;
    }
  };

  handleClick = ({ target }) => {
    if (target.classList.contains("task-actions-menu__button")) {
      this.#state.action = target.id;
      this.dispatchEvent(
        createEvent("task-actions-menu: action-selected", {
          taskItem: this.state.taskItem,
          action: this.state.action,
        }),
      );
      this.hidePopover();
    }
  };
}

customElements.define("task-actions-menu", TaskActionsMenu);
