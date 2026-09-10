import "./task-item.js";

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(
  `tasks-list {
    display: grid;
    grid-template-columns: auto 1fr repeat(3, auto);
    column-gap: 1rem;
    list-style: none;
  }

  @media (width <=425px) {
    tasks-list {
      grid-template-columns: auto 1fr auto;
    }
  }`,
);

export class TasksList extends HTMLElement {
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
    this.#internals.role = "list";

    if (!document.adoptedStyleSheets.includes(styleSheet)) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        styleSheet,
      ];
    }

    this.#state = {
      tasks: [],
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
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === oldValue) {
      return;
    }

    if (name === "disabled") {
      [...this.children].forEach((taskItem) => {
        taskItem.disabled = newValue !== null;
      });
    }
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  render() {
    if (!this.isConnected) {
      return;
    }

    const tasks = this.#state.tasks;
    const fragment = new DocumentFragment();

    tasks.forEach((task) => {
      const taskItem = document.createElement("task-item");
      taskItem.state = { task, search: this.#state.search };
      fragment.append(taskItem);
    });

    this.replaceChildren();
    this.append(fragment);

    [...this.children].forEach((taskItem) => {
      taskItem.disabled = this.disabled;
    });
  }
}

customElements.define("tasks-list", TasksList);
