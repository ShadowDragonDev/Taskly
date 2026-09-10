export function composeSort(...sortFunctions) {
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

export class TaskSorter {
  static #statusWeights = {
    incomplete: 2,
    complete: 1,
  };

  static #priorityWeights = {
    high: 3,
    moderate: 2,
    low: 1,
  };

  static status(a, b) {
    const statusWeightA = TaskSorter.#statusWeights[a.status];
    const statusWeightB = TaskSorter.#statusWeights[b.status];
    return statusWeightB - statusWeightA;
  }

  static title(a, b) {
    return a.title.localeCompare(b.title);
  }

  static createDate(a, b) {
    return Temporal.Instant.compare(a.createDate, b.createDate);
  }

  static dueDate(a, b) {
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

  static priority(a, b) {
    const priorityWeightA = TaskSorter.#priorityWeights[a.priority];
    const priorityWeightB = TaskSorter.#priorityWeights[b.priority];
    return priorityWeightB - priorityWeightA;
  }
}
