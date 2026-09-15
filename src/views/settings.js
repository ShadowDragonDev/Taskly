import { store } from "../core/store.js";
import { createTemplate } from "../utilities/misc.js";

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

  .settings {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 1rem;
    list-style: none;
  }

  .settings__group {
    display: grid;
    grid-template-columns: subgrid;
    align-items: center;
    grid-column: 1 / -1;
    padding: 1rem 1rem 1rem 1.5rem;
    border-radius: 0.5rem;
    background-color: var(--color-background-lighter);
    transition: background-color 150ms;
  }

  .settings__group:hover {
    background-color: hsl(from var(--color-background-lighter) h s calc(l + 1));
  }

  .settings__group[hidden] {
    display: none !important;
  }

  .settings__input {
    padding: 0.25rem 0.5rem;
    background-color: hsl(from var(--color-background-lighter) h s calc(l + 4));
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
  }`,
);

const template = createTemplate(
  `<div class="viewport__container">
    <div class="viewport__header">
      <h2 id="viewport-name" class="viewport__name"></h2>
    </div>

    <form id="settings" class="settings">
      <div class="settings__group">
        <label for="theme" class="settings__label">Theme</label>
        <select name="theme" id="theme" class="settings__input">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </form>
  </div>`,
);

export class SettingsView {
  static #abortController;
  static #viewport = document.querySelector("#viewport");

  static mount(viewName) {
    // Data initialization
    SettingsView.#abortController = new AbortController();

    // View foundation
    document.adoptedStyleSheets = [styleSheet];
    SettingsView.#viewport.append(template.content.cloneNode(true));

    // DOM references
    SettingsView.viewportName =
      SettingsView.#viewport.querySelector("#viewport-name");
    SettingsView.settingsForm =
      SettingsView.#viewport.querySelector("#settings");
    SettingsView.themeElement = SettingsView.#viewport.querySelector("#theme");

    // View initialization
    SettingsView.viewportName.textContent = viewName;
    SettingsView.themeElement.value = store.getSettings().theme;

    // View life
    SettingsView.settingsForm.addEventListener(
      "change",
      () => {
        const settingsData = new FormData(SettingsView.settingsForm);
        store.setSettings({ theme: settingsData.get("theme") });
      },
      { signal: this.#abortController.signal },
    );
  }

  static unmount() {
    SettingsView.#abortController?.abort();
    SettingsView.#viewport.replaceChildren();
  }
}
