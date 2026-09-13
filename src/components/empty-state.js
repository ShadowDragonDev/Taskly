import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import { store } from "../core/store.js";
import {
  createEvent,
  createTemplate,
  getSystemTheme,
} from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `:host {
    display: block;
  }

  :host([hidden]) {
    display: none !important;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 400px;
    margin: 3rem auto;
    text-align: center;
  }

  .empty-state__image {
    margin-bottom: 2rem;
  }

  .empty-state__message {
    margin-bottom: 1.5rem;
    color: var(--color-text-muted);
    text-wrap: pretty;
  }

  .empty-state__button {
    display: flex;
    column-gap: 0.25rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-information);
    color: hsl(215 15% 90%);
    border: none;
    border-radius: 0.5rem;
    stroke: currentColor;
    stroke-width: 1px;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 150ms, transform 150ms;
  }

  .empty-state__button[hidden] {
    display: none !important;
  }

  .empty-state__button:hover {
    background-color: hsl(from var(--color-information) h s calc(l + 4));
  }

  .empty-state__button:active {
    background-color: hsl(from var(--color-information) h s calc(l + 2));
    transform: scale(0.95);
  }
  `,
);

const template = createTemplate(
  `<div id="empty-state" class="empty-state">
    <img src="" alt="" id="empty-state-image" class="empty-state__image" />
    <h3 id="empty-state-title" class="empty-state__title"></h3>
    <p id="empty-state-message" class="empty-state__message"></p>
    <button id="empty-state-button" class="empty-state__button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon">
        <path fill="currentColor" d="M11 13H6q-.425 0-.712-.288T5 12t.288-.712T6 11h5V6q0-.425.288-.712T12 5t.713.288T13 6v5h5q.425 0 .713.288T19 12t-.288.713T18 13h-5v5q0 .425-.288.713T12 19t-.712-.288T11 18z"/>
      </svg>
      Add task
    </button>
  </div>`,
);

class EmptyState extends HTMLElement {
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
      reason: "",
      theme: "",
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

    this.imageElement = this.shadowRoot.querySelector("#empty-state-image");
    this.titleElement = this.shadowRoot.querySelector("#empty-state-title");
    this.messageElement = this.shadowRoot.querySelector("#empty-state-message");
    this.buttonElement = this.shadowRoot.querySelector("#empty-state-button");

    this.buttonElement.addEventListener(
      "click",
      () => {
        this.dispatchEvent(createEvent("task-saver: open"));
      },
      { signal: this.#abortController.signal },
    );

    store.addEventListener("store: settings-changed", this.updateTheme, {
      signal: this.#abortController.signal,
    });

    this.updateTheme();
    this.render();
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  updateTheme = () => {
    const settings = store.getSettings();

    if (settings.theme === "system") {
      this.state = { theme: getSystemTheme() };
      return;
    }

    this.state = { theme: settings.theme };
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    this.hidden = false;

    if (!this.#state.reason) {
      this.hidden = true;
      return;
    }

    if (this.#state.reason === "welcome") {
      this.imageElement.src = `../../assets/images/empty-state-welcome-${this.#state.theme}.png`;
      this.titleElement.textContent = "Ready to get things done?";
      this.messageElement.textContent =
        "This list is empty. Add a task to clear your mind and plan your day.";
      this.buttonElement.hidden = false;
      return;
    }

    if (this.#state.reason === "no-tasks") {
      this.imageElement.src = `../../assets/images/empty-state-${this.#state.theme}.png`;
      this.titleElement.textContent = "Clear slate, clear mind";
      this.messageElement.textContent =
        "Your list is completely empty. Create a task to start organizing your day.";
      this.buttonElement.hidden = false;
      return;
    }

    if (this.#state.reason === "no-tasks--complete") {
      this.imageElement.src = `../../assets/images/empty-state-complete-${this.#state.theme}.png`;
      this.titleElement.textContent = "No checked boxes yet";
      this.messageElement.textContent =
        "You haven't finished any tasks today. Pick one from your list to get started!";
      this.buttonElement.hidden = true;
      return;
    }

    if (this.#state.reason === "no-tasks--search") {
      this.imageElement.src = `../../assets/images/empty-state-search-${this.#state.theme}.png`;
      this.titleElement.textContent = "We couldn't find a match";
      this.messageElement.textContent =
        "No tasks match your search. Try checking your spelling.";
      this.buttonElement.hidden = true;
      return;
    }

    this.hidden = true;
  }
}

customElements.define("empty-state", EmptyState);
