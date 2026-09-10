import { Task } from "../models/task.js";
import { composeSort, TaskSorter } from "../utilities/sorter.js";

class Store extends EventTarget {
  #state = {
    pathname: window.location.pathname,
    settings: { theme: "system" },
    tasks: [],
    tasksFilterData: { status: "both", title: "", dueDateStatus: "" },
    tasksSorterData: { type: "due-date", order: "ascending" },
  };

  constructor() {
    super();
  }

  getPathname() {
    return this.#state.pathname;
  }

  setPathname(pathname) {
    this.#state.pathname = pathname;
    this.#notify("store: pathname-changed", { pathname });
  }

  getSettings() {
    return { ...this.#state.settings };
  }

  setSettings(settings) {
    this.#state.settings = { ...this.#state.settings, ...settings };
  }

  getTasks({ refined = false } = {}) {
    if (!refined) {
      return [...this.#state.tasks];
    }

    const { tasksFilterData, tasksSorterData } = this.getTasksRefinements();
    const sortFunc = () => {
      switch (tasksSorterData.type) {
        case "priority":
          return composeSort(
            TaskSorter.status,
            TaskSorter.priority,
            TaskSorter.dueDate,
            TaskSorter.title,
          );

        case "create-date":
          return composeSort(
            TaskSorter.status,
            TaskSorter.createDate,
            TaskSorter.priority,
            TaskSorter.title,
          );

        case "title":
          return composeSort(
            TaskSorter.status,
            TaskSorter.title,
            TaskSorter.dueDate,
            TaskSorter.priority,
          );

        default:
          return composeSort(
            TaskSorter.status,
            TaskSorter.dueDate,
            TaskSorter.priority,
            TaskSorter.title,
          );
      }
    };

    const refinedTasks = this.#state.tasks
      .filter((task) => {
        const matchesStatus =
          tasksFilterData.status === "both" ||
          task.status === tasksFilterData.status;

        const matchesTitle = task.title
          .toLowerCase()
          .includes(tasksFilterData.title);

        const matchesDueDateStatus =
          !tasksFilterData.dueDateStatus ||
          task.dueDateStatus === tasksFilterData.dueDateStatus;

        return matchesStatus && matchesTitle && matchesDueDateStatus;
      })
      .toSorted(sortFunc());

    return tasksSorterData.order === "descending"
      ? refinedTasks.toReversed()
      : refinedTasks;
  }

  getTask(taskId) {
    return this.getTasks().find((task) => task.id === taskId);
  }

  addTask({ title, description, dueDate, priority } = {}) {
    this.#state.tasks.push(
      new Task({
        status: "incomplete",
        title,
        description,
        createDate: "",
        dueDate,
        priority,
      }),
    );

    this.#notify("store: tasks-changed", this.getTasks({ refined: true }));
  }

  updateTask(taskId, { status, title, description, dueDate, priority } = {}) {
    const task = this.#state.tasks.find((task) => task.id === taskId);

    if (task) {
      task.update({ status, title, description, dueDate, priority });
      this.#notify("store: tasks-changed", this.getTasks({ refined: true }));
    }
  }

  deleteTask(taskId) {
    const taskIndex = this.#state.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== undefined) {
      this.#state.tasks.splice(taskIndex, 1);
      this.#notify("store: tasks-changed", this.getTasks({ refined: true }));
    }
  }

  getTasksRefinements() {
    return {
      tasksFilterData: structuredClone(this.#state.tasksFilterData),
      tasksSorterData: structuredClone(this.#state.tasksSorterData),
    };
  }

  setTasksRefinements({ tasksFilterData = {}, tasksSorterData = {} } = {}) {
    this.#state.tasksFilterData = {
      ...this.#state.tasksFilterData,
      ...tasksFilterData,
    };

    this.#state.tasksSorterData = {
      ...this.#state.tasksSorterData,
      ...tasksSorterData,
    };

    this.#notify(
      "store: tasks-refinements-changed",
      this.getTasksRefinements(),
    );
  }

  #notify(message, data) {
    this.dispatchEvent(
      new CustomEvent(message, {
        detail: data,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export const store = new Store();
