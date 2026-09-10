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

  .tasks-refiner-menu {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1.5rem;
    margin-top: 0.5rem;
    padding: 1rem;
    background-color: var(--color-background);
    color: var(--color-text);
    border: 2px solid var(--color-border);
    border-radius: 1rem;
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem)
  }

  .tasks-refiner-menu__fieldset {
    display: grid;
    grid-template-columns: subgrid;
    gap: 0.5rem 1rem;
    align-items: center;
    grid-column: 1 / -1;
  }

  .tasks-refiner-menu__legend {
    grid-column: 1 / -1;
    font-weight: 600;
  }

  .tasks-refiner-menu__input {
    padding: 0.25rem 0.5rem;
    background-color: var(--color-background-lighter);
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
  }`,
);

const template = createTemplate(
  `<form id="tasks-refiner-menu" class="tasks-refiner-menu">
    <div role="group" aria-labelledby="sort-legend" class="tasks-refiner-menu__fieldset">
      <legend id="sort-legend" class="tasks-refiner-menu__legend">
        Sort
      </legend>

      <label for="sort-type" class="tasks-refiner-menu__label">
        Sort Type
      </label>
      <select name="sort-type" id="sort-type" class="tasks-refiner-menu__input">
        <option value="due-date" selected>Due Date</option>
        <option value="priority">Priority</option>
        <option value="create-date">Date Created</option>
        <option value="title">Title</option>
      </select>

      <label for="sort-order" class="tasks-refiner-menu__label">
        Sort Order
      </label>
      <select name="sort-order" id="sort-order" class="tasks-refiner-menu__input">
        <option value="ascending" selected>Ascending</option>
        <option value="descending">Descending</option>
      </select>
    </div>

    <div role="group" aria-labelledby="filter-legend" class="tasks-refiner-menu__fieldset">
      <legend id="filter-legend" class="tasks-refiner-menu__legend">
        Filter
      </legend>

      <label for="filter-status" class="tasks-refiner-menu__label">
        Status
      </label>
      <select name="filter-status" id="filter-status" class="tasks-refiner-menu__input">
        <option value="both" selected>Both</option>
        <option value="complete">Complete</option>
        <option value="incomplete">Incomplete</option>
      </select>
    </div>
  </form>`,
);

export class TasksRefinerMenu extends HTMLElement {
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
      tasksFilterData: { status: "both" },
      tasksSorterData: { type: "due-date", order: "ascending" },
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

    this.tasksRefinerMenu = this.shadowRoot.querySelector(
      "#tasks-refiner-menu",
    );
    this.filterStatusElement = this.shadowRoot.querySelector("#filter-status");
    this.sortTypeElement = this.shadowRoot.querySelector("#sort-type");
    this.sortOrderElement = this.shadowRoot.querySelector("#sort-order");

    this.shadowRoot.addEventListener("change", this.handleChange, {
      signal: this.#abortController.signal,
    });
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  handleChange = () => {
    const tasksRefinerMenuData = new FormData(this.tasksRefinerMenu);

    this.#state = {
      tasksFilterData: { status: tasksRefinerMenuData.get("filter-status") },
      tasksSorterData: {
        type: tasksRefinerMenuData.get("sort-type"),
        order: tasksRefinerMenuData.get("sort-order"),
      },
    };

    this.dispatchEvent(
      createEvent("tasks-refiner-menu: tasks-refinements-changed", {
        tasksFilterData: this.state.tasksFilterData,
        tasksSorterData: this.state.tasksSorterData,
      }),
    );
  };

  render() {
    if (!this.isConnected) {
      return;
    }

    this.filterStatusElement.value = this.#state.tasksFilterData.status;
    this.sortTypeElement.value = this.#state.tasksSorterData.type;
    this.sortOrderElement.value = this.#state.tasksSorterData.order;
  }
}

customElements.define("tasks-refiner-menu", TasksRefinerMenu);
