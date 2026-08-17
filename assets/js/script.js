const DOM = {
  tasksList: document.querySelector("#tasks-list"),
  createTaskButton: document.querySelector("#create-task-button"),
  taskActionsMenu: document.querySelector("#task-actions-menu"),
  taskSaver: document.querySelector("#task-saver"),
  taskSaverTitle: document.querySelector("#task-saver-title"),
  taskSaverDescription: document.querySelector("#task-saver-description"),
  taskSaverDueDate: document.querySelector("#task-saver-due-date"),
  taskSaverPriority: document.querySelector("#task-saver-priority"),
  taskSaverRejectButton: document.querySelector("#task-saver-reject-button"),
  taskSaverAcceptButton: document.querySelector("#task-saver-accept-button"),
  taskViewer: document.querySelector("#task-viewer"),
  taskViewerTitle: document.querySelector("#task-viewer-title"),
  taskViewerDescription: document.querySelector("#task-viewer-description"),
  taskViewerDueDate: document.querySelector("#task-viewer-due-date"),
  taskViewerPriority: document.querySelector("#task-viewer-priority"),
  taskViewerCloseButton: document.querySelector("#task-viewer-close-button"),
  taskRefiner: document.querySelector("#task-refiner"),
  taskRefinerButton: document.querySelector("#task-refiner-button"),
  searchbar: document.querySelector("#searchbar"),
  searchbox: document.querySelector("#searchbox"),
};

DOM.taskViewerDueDateWrapper = DOM.taskViewerDueDate.closest(
  ".task-viewer__due-date",
);

DOM.taskViewerPriorityWrapper = DOM.taskViewerPriority.closest(
  ".task-viewer__priority",
);

const STATUS_WEIGHTS = {
  complete: 2,
  incomplete: 1,
};

const PRIORITY_WEIGHTS = {
  high: 3,
  moderate: 2,
  low: 1,
};

const tasks = [];
let activeTaskID = "";

class Task {
  constructor(status, title, description, createDate, dueDate, priority) {
    this.id = crypto.randomUUID();
    this.status = status ?? "incomplete";
    this.title = title.trim();
    this.description = description.trim();

    try {
      this.createDate = Temporal.Instant.from(createDate);
    } catch {
      this.createDate = Temporal.Now.instant();
    }

    try {
      this.dueDate = Temporal.PlainDate.from(dueDate);
    } catch {
      this.dueDate = null;
    }

    this.priority = priority;
  }

  getFormattedDescription() {
    return this.description || "No description";
  }

  getFormattedDueDate() {
    return (
      this.dueDate?.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "No deadline"
    );
  }

  getFormattedPriority() {
    return this.priority[0].toUpperCase() + this.priority.slice(1);
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function renderTasks() {
  const fragment = new DocumentFragment();
  const refinedTasks = getRefinedTasks();

  for (const taskObject of refinedTasks) {
    const task = (await getHTMLTemplate("task")).querySelector(".task");
    const taskStatus = task.querySelector(".task__status");
    const taskTitle = task.querySelector(".task__title");
    const taskDueDate = task.querySelector(".task__due-date");
    const taskPriority = task.querySelector(".task__priority");

    task.id = taskObject.id;
    taskStatus.checked = taskObject.status === "complete";
    taskTitle.textContent = taskObject.title;
    taskDueDate.textContent = taskObject.getFormattedDueDate();
    taskPriority.textContent = taskObject.getFormattedPriority();

    taskStatus.id = `task-status-${taskObject.id}`;
    taskTitle.htmlFor = `task-status-${taskObject.id}`;

    const search = getSearchData();

    if (search !== "") {
      const regex = new RegExp(`(${search})`, "i");
      const textFragments = taskObject.title.split(regex);
      taskTitle.replaceChildren();

      for (const textFragment of textFragments.filter(Boolean)) {
        if (textFragment === search) {
          const markElement = document.createElement("mark");
          markElement.textContent = textFragment;
          taskTitle.append(markElement);
        } else {
          const textNode = document.createTextNode(textFragment);
          taskTitle.append(textNode);
        }
      }
    }

    if (taskObject.dueDate) {
      const today = Temporal.Now.plainDateISO();
      const comparison = Temporal.PlainDate.compare(taskObject.dueDate, today);

      if (comparison === 0) {
        taskDueDate.classList.add("task__due-date--today");
      } else if (comparison < 0) {
        taskDueDate.classList.add("task__due-date--overdue");
      }
    } else {
      taskDueDate.classList.add("task__due-date--muted");
    }

    taskPriority.classList.add(`task__priority--${taskObject.priority}`);

    fragment.append(task);
  }

  DOM.tasksList.replaceChildren();
  DOM.tasksList.append(fragment);
}

async function getHTMLTemplate(templateName) {
  try {
    const response = await fetch(`./assets/templates/${templateName}.html`);

    if (!response.ok) {
      throw new Error(`Could not fetch HTML template (${templateName}.html)`);
    }

    const responseText = await response.text();
    const HTML = new DOMParser().parseFromString(responseText, "text/html");

    return HTML.body;
  } catch (error) {
    console.error("Error: ", error);
  }
}

function getRefinedTasks() {
  let refinedTasks = [...tasks];
  const { filter, sort } = getRefinerData();

  if (filter.status !== "both") {
    refinedTasks = refinedTasks.filter(
      (taskObject) => taskObject.status === filter.status,
    );
  }

  if (filter.title) {
    refinedTasks = refinedTasks.filter((taskObject) => {
      const search = filter.title;
      return taskObject.title.toLowerCase().trim().includes(search);
    });
  }

  if (sort.type === "due-date") {
    refinedTasks.sort(
      composeSort(sortStatus, sortDueDate, sortPriority, sortTitle),
    );
  }

  if (sort.type === "priority") {
    refinedTasks.sort(
      composeSort(sortStatus, sortPriority, sortDueDate, sortTitle),
    );
  }

  if (sort.type === "create-date") {
    refinedTasks.sort(
      composeSort(sortStatus, sortCreateDate, sortPriority, sortTitle),
    );
  }

  if (sort.type === "title") {
    refinedTasks.sort(
      composeSort(sortStatus, sortTitle, sortDueDate, sortPriority),
    );
  }

  return sort.order === "descending" ? refinedTasks.reverse() : refinedTasks;
}

function getRefinerData() {
  const taskRefinerData = new FormData(DOM.taskRefiner);

  const filter = {
    status: taskRefinerData.get("filter-status"),
    title: getSearchData(),
  };

  const sort = {
    type: taskRefinerData.get("sort-type"),
    order: taskRefinerData.get("sort-order"),
  };

  return { filter, sort };
}

function getSearchData() {
  const searchbarData = new FormData(DOM.searchbar);
  return searchbarData.get("search").toLowerCase().trim();
}

function composeSort(...sortFunctions) {
  return (a, b) => {
    for (const sortFunction of sortFunctions) {
      const result = sortFunction(a, b);

      if (result !== 0) {
        return result;
      }
    }

    return 0;
  };
}

function sortStatus(a, b) {
  const statusWeightA = STATUS_WEIGHTS[a.status];
  const statusWeightB = STATUS_WEIGHTS[b.status];
  return statusWeightA - statusWeightB;
}

function sortTitle(a, b) {
  return a.title.localeCompare(b.title);
}

function sortCreateDate(a, b) {
  return Temporal.Instant.compare(a.createDate, b.createDate);
}

function sortDueDate(a, b) {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) {
      return 1;
    }

    if (!b.dueDate) {
      return -1;
    }

    return Temporal.PlainDate.compare(a.dueDate, b.dueDate);
  }

  return 0;
}

function sortPriority(a, b) {
  const priorityWeightA = PRIORITY_WEIGHTS[a.priority];
  const priorityWeightB = PRIORITY_WEIGHTS[b.priority];
  return priorityWeightB - priorityWeightA;
}

function openTaskSaver(taskID = "") {
  DOM.taskSaver.reset();
  DOM.taskSaver.dataset.taskId = taskID;
  DOM.taskSaverAcceptButton.disabled = true;
  DOM.createTaskButton.disabled = true;
  DOM.taskRefinerButton.disabled = true;
  DOM.searchbox.readOnly = true;

  if (taskID) {
    const taskObject = tasks.find((taskObject) => taskObject.id === taskID);

    if (!taskObject) {
      closeTaskSaver();
      return;
    }

    DOM.taskSaverTitle.value = taskObject.title;
    DOM.taskSaverDescription.value = taskObject.description;
    DOM.taskSaverDueDate.value = taskObject.dueDate;
    DOM.taskSaverPriority.value = taskObject.priority;

    document.getElementById(String(taskObject.id)).replaceWith(DOM.taskSaver);
    DOM.taskSaverAcceptButton.disabled = false;
  } else {
    DOM.tasksList.insertAdjacentElement("afterend", DOM.taskSaver);
  }

  DOM.taskSaver.classList.add("task-saver--open");
  DOM.taskSaver.querySelector("#task-saver-title").focus();
}

function closeTaskSaver() {
  DOM.taskSaver.classList.remove("task-saver--open");
  DOM.createTaskButton.disabled = false;
  DOM.taskRefinerButton.disabled = false;
  DOM.searchbox.readOnly = false;
  renderTasks();
}

function openTaskViewer(taskID = "") {
  DOM.taskViewer.dataset.taskId = taskID;

  const taskObject = taskID
    ? tasks.find((taskObject) => taskObject.id === taskID)
    : new Task(undefined, "Title", "", undefined, undefined, "low");

  DOM.taskViewerTitle.textContent = taskObject.title;
  DOM.taskViewerDescription.textContent = taskObject.getFormattedDescription();
  DOM.taskViewerDueDate.textContent = taskObject.getFormattedDueDate();
  DOM.taskViewerPriority.textContent = taskObject.getFormattedPriority();

  DOM.taskViewerDescription.className = "task-viewer__description";
  DOM.taskViewerDueDateWrapper.className = "task-viewer__due-date";
  DOM.taskViewerPriorityWrapper.className = "task-viewer__priority";

  if (!taskObject.description) {
    DOM.taskViewerDescription.classList.add("task-viewer__description--muted");
  }

  if (taskObject.dueDate) {
    const today = Temporal.Now.plainDateISO();
    const comparison = Temporal.PlainDate.compare(taskObject.dueDate, today);

    if (comparison === 0) {
      DOM.taskViewerDueDateWrapper.classList.add(
        "task-viewer__due-date--today",
      );
    } else if (comparison < 0) {
      DOM.taskViewerDueDateWrapper.classList.add(
        "task-viewer__due-date--overdue",
      );
    }
  } else {
    DOM.taskViewerDueDateWrapper.classList.add("task-viewer__due-date--muted");
  }

  DOM.taskViewerPriorityWrapper.classList.add(
    `task-viewer__priority--${taskObject.priority}`,
  );

  DOM.taskViewer.showModal();
}

function closeTaskViewer() {
  DOM.taskViewer.close();
}

DOM.createTaskButton.addEventListener("click", () => {
  openTaskSaver();
});

DOM.taskSaver.addEventListener("input", () => {
  DOM.taskSaverAcceptButton.disabled = !DOM.taskSaver.checkValidity();
});

DOM.taskSaverRejectButton.addEventListener("click", () => {
  closeTaskSaver();
});

DOM.taskSaver.addEventListener("submit", (event) => {
  event.preventDefault();
  const taskID = DOM.taskSaver.dataset.taskId;
  const taskSaverData = new FormData(DOM.taskSaver);
  const taskObject = new Task(
    undefined,
    taskSaverData.get("title"),
    taskSaverData.get("description"),
    undefined,
    taskSaverData.get("due-date"),
    taskSaverData.get("priority"),
  );

  if (taskID) {
    const previousTaskObject = tasks.find(
      (taskObject) => taskObject.id === taskID,
    );

    taskObject.status = previousTaskObject.status;
    taskObject.createDate = previousTaskObject.createDate;
    Object.assign(previousTaskObject, taskObject);
    closeTaskSaver();
  } else {
    tasks.push(taskObject);
    openTaskSaver();
  }

  renderTasks();
});

DOM.tasksList.addEventListener("click", ({ target }) => {
  if (target.classList.contains("task__button")) {
    activeTaskID = target.closest(".task").id;
  }
});

DOM.taskActionsMenu.addEventListener("click", ({ target }) => {
  if (!target.classList.contains("task-actions-menu__button")) {
    return;
  }

  const taskOP = target.id.split("-")[0];
  DOM.taskActionsMenu.hidePopover();

  if (taskOP === "read") {
    closeTaskSaver();
    openTaskViewer(activeTaskID);
  }

  if (taskOP === "update") {
    openTaskSaver(activeTaskID);
  }

  if (taskOP === "delete") {
    const taskObjectIndex = tasks.findIndex(
      (taskObject) => taskObject.id === activeTaskID,
    );
    tasks.splice(taskObjectIndex, 1);
    document.getElementById(String(activeTaskID)).remove();
  }
});

DOM.taskViewerCloseButton.addEventListener("click", () => {
  closeTaskViewer();
});

DOM.taskRefiner.addEventListener("change", () => {
  renderTasks();
});

DOM.tasksList.addEventListener("click", async ({ target }) => {
  if (!target.classList.contains("task__status")) {
    return;
  }

  const taskID = target.closest(".task").id;
  const taskObject = tasks.find((taskObject) => taskObject.id === taskID);
  taskObject.status = target.checked ? "complete" : "incomplete";

  await delay(150);
  renderTasks();
});

DOM.searchbar.addEventListener("input", ({ target }) => {
  if (target.id === "searchbox") {
    renderTasks();
  }
});

DOM.searchbar.addEventListener("submit", (event) => {
  event.preventDefault();
});
