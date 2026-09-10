import globalStyleSheet from "../../assets/css/global.css" with { type: "css" };
import { createEvent, createTemplate } from "../utilities/misc.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `:host {
    min-width: 0;
  }

  .searchbar {
    display: flex;
    column-gap: 0.5rem;
    align-items: center;
    min-width: 0;
    max-width: 400px;
    height: 100%;
    padding: 0.25rem 0.75rem;
    background-color: var(--color-background-lighter);
    border: 2px solid var(--color-border);
    border-radius: 999999999px;
  }

  .searchbar:has(.searchbox:read-only) {
    opacity: 0.5;
  }

  .search-icon {
    flex: 0 0 auto;
  }

  .searchbox {
    flex: 1;
    min-width: 0;
    background-color: transparent;
    border: none;
    outline: none;
  }

  .searchbox::placeholder {
    color: var(--color-text-muted);
  }`,
);

const template = createTemplate(
  `<div id="searchbar" class="searchbar">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon search-icon">
      <path fill="currentColor"
        d="M9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.6 5.6q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-5.6-5.6q-.75.6-1.725.95T9.5 16m0-2q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14" />
    </svg>

    <label for="searchbox" class="sr-only">Search tasks</label>
    <input type="search" name="search" id="searchbox" class="searchbox" placeholder="Search" />
  </div>`,
);

class SearchBar extends HTMLElement {
  #internals;
  #abortController;
  #state;

  static get observedAttributes() {
    return ["disabled"];
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
    this.#internals.role = "search";

    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalStyleSheet, styleSheet];
    this.shadowRoot.append(template.content.cloneNode(true));

    this.#state = {
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
    this.searchbox = this.shadowRoot.querySelector("#searchbox");

    this.shadowRoot.addEventListener("input", this.handleInput, {
      signal: this.#abortController.signal,
    });

    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (name === "disabled") {
      this.searchbox.readOnly = newValue !== null;
    }
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleInput = () => {
    this.#state.search = this.searchbox.value.trim();
    this.dispatchEvent(
      createEvent("search-bar: search-changed", { search: this.state.search }),
    );
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    this.searchbox.value = this.#state.search;
  }
}

customElements.define("search-bar", SearchBar);
