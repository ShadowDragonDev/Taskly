const createTaskButton = document.querySelector("#create-task-button");
const taskActionsMenu = document.querySelector("#task-actions-menu");
const tasksList = document.querySelector("#tasks-list");
const taskSaver = document.querySelector("#task-saver");
const taskSaverRejectButton = document.querySelector(
  "#task-saver-reject-button",
);
const taskSaverAcceptButton = document.querySelector(
  "#task-saver-accept-button",
);
const taskViewer = document.querySelector("#task-viewer");
const taskViewerCloseButton = document.querySelector(
  "#task-viewer-close-button",
);
const taskRefinerButton = document.querySelector("#task-refiner-button");
const taskRefiner = document.querySelector("#task-refiner");

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

    if (!taskObject.dueDate) {
      taskDueDate.classList.add("task__due-date--muted");
    }

    taskPriority.classList.add(`task__priority--${taskObject.priority}`);

    fragment.append(task);
  }

  tasksList.replaceChildren();
  tasksList.append(fragment);
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
  const taskRefinerData = new FormData(taskRefiner);

  const filter = {
    status: taskRefinerData.get("filter-status"),
  };

  const sort = {
    type: taskRefinerData.get("sort-type"),
    order: taskRefinerData.get("sort-order"),
  };

  if (filter.status !== "both") {
    refinedTasks = refinedTasks.filter(
      (taskObject) => taskObject.status === filter.status,
    );
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
  taskSaver.reset();
  taskSaver.dataset.taskId = taskID;
  taskSaverAcceptButton.disabled = true;
  createTaskButton.disabled = true;
  taskRefinerButton.disabled = true;

  if (taskID) {
    const taskObject = tasks.find((taskObject) => taskObject.id === taskID);

    if (!taskObject) {
      closeTaskSaver();
      return;
    }

    taskSaver.querySelector("#task-saver-title").value = taskObject.title;
    taskSaver.querySelector("#task-saver-description").value =
      taskObject.description;
    taskSaver.querySelector("#task-saver-due-date").value = taskObject.dueDate;
    taskSaver.querySelector("#task-saver-priority").value = taskObject.priority;

    document.getElementById(String(taskObject.id)).replaceWith(taskSaver);
    taskSaverAcceptButton.disabled = false;
  } else {
    tasksList.insertAdjacentElement("afterend", taskSaver);
  }

  taskSaver.classList.add("task-saver--open");
  taskSaver.querySelector("#task-saver-title").focus();
}

function closeTaskSaver() {
  taskSaver.reset();
  taskSaver.classList.remove("task-saver--open");
  createTaskButton.disabled = false;
  taskRefinerButton.disabled = false;
  renderTasks();
}

function openTaskViewer(taskID = "") {
  taskViewer.dataset.taskId = taskID;

  const taskObject = taskID
    ? tasks.find((taskObject) => taskObject.id === taskID)
    : new Task(undefined, "Title", "", undefined, undefined, "low");

  const taskViewerTitle = taskViewer.querySelector("#task-viewer-title");
  const taskViewerDescription = taskViewer.querySelector(
    "#task-viewer-description",
  );
  const taskViewerDueDate = taskViewer.querySelector("#task-viewer-due-date");
  const taskViewerPriority = taskViewer.querySelector("#task-viewer-priority");

  taskViewerTitle.textContent = taskObject.title;
  taskViewerDescription.textContent = taskObject.getFormattedDescription();
  taskViewerDueDate.textContent = taskObject.getFormattedDueDate();
  taskViewerPriority.textContent = taskObject.getFormattedPriority();

  if (taskObject.description) {
    taskViewerDescription.classList.remove("task-viewer__description--muted");
  } else {
    taskViewerDescription.classList.add("task-viewer__description--muted");
  }

  if (taskObject.dueDate) {
    taskViewer
      .querySelector(".task-viewer__due-date")
      .classList.remove("task-viewer__due-date--muted");
  } else {
    taskViewer
      .querySelector(".task-viewer__due-date")
      .classList.add("task-viewer__due-date--muted");
  }

  taskViewer
    .querySelector(".task-viewer__priority")
    .classList.add(`task-viewer__priority--${taskObject.priority}`);

  taskViewer.showModal();
}

function closeTaskViewer() {
  taskViewer.close();
}

createTaskButton.addEventListener("click", () => {
  openTaskSaver();
});

taskSaver.addEventListener("input", () => {
  taskSaverAcceptButton.disabled = !taskSaver.checkValidity();
});

taskSaverRejectButton.addEventListener("click", () => {
  closeTaskSaver();
});

taskSaver.addEventListener("submit", (event) => {
  event.preventDefault();
  const taskID = taskSaver.dataset.taskId;
  const taskSaverData = new FormData(taskSaver);
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
    Object.assign(previousTaskObject, taskObject);
    closeTaskSaver();
  } else {
    tasks.push(taskObject);
    openTaskSaver();
  }

  renderTasks();
});

tasksList.addEventListener("click", ({ target }) => {
  if (target.classList.contains("task__button")) {
    activeTaskID = target.closest(".task").id;
  }
});

taskActionsMenu.addEventListener("click", ({ target }) => {
  if (!target.classList.contains("task-actions-menu__button")) {
    return;
  }

  const taskOP = target.id.split("-")[0];
  taskActionsMenu.hidePopover();

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

taskViewerCloseButton.addEventListener("click", () => {
  closeTaskViewer();
});

taskRefiner.addEventListener("change", () => {
  renderTasks();
});
