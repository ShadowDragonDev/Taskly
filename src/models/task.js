export class Task {
  constructor(props) {
    if (!isValid(props)) {
      return;
    }

    this.id = crypto.randomUUID();
    this.status = props.status;
    this.title = props.title.trim();
    this.description = props.description.trim();

    try {
      this.createDate = Temporal.Instant.from(props.createDate);
    } catch {
      this.createDate = Temporal.Now.instant();
    }

    try {
      this.dueDate = Temporal.PlainDate.from(props.dueDate);
    } catch {
      this.dueDate = "";
    }

    this.priority = props.priority;
  }

  get dueDateStatus() {
    if (!this.dueDate) {
      return "undefined";
    }

    const today = Temporal.Now.plainDateISO();
    const difference = today.until(this.dueDate, { largestUnit: "days" });

    switch (true) {
      case difference.sign === -1:
        return "overdue";

      case difference.sign === 0:
        return "today";

      case difference.sign === 1 && difference.days === 1:
        return "tomorrow";

      default:
        return "upcoming";
    }
  }

  get prettyDescription() {
    return this.description || "No Description";
  }

  get prettyDueDate() {
    return (
      this.dueDate.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) || "No Deadline"
    );
  }

  get prettyPriority() {
    return this.priority[0].toUpperCase() + this.priority.slice(1);
  }

  update(newProps) {
    if (!isValid(newProps)) {
      return;
    }

    this.status = newProps.status;
    this.title = newProps.title.trim();
    this.description = newProps.description.trim();

    try {
      this.dueDate = Temporal.PlainDate.from(newProps.dueDate);
    } catch {
      this.dueDate = "";
    }

    this.priority = newProps.priority;
  }
}

function isValid(props = {}) {
  const requiredProps = ["status", "title", "priority"];
  const missingProps = requiredProps.filter(
    (requiredProp) => !Object.hasOwn(props, requiredProp),
  );

  if (missingProps.length) {
    throw new Error(`Properties (${missingProps.join(", ")}) not provided`);
  }

  const nonStringProps = Object.keys(props).filter(
    (key) => typeof props[key] !== "string",
  );

  if (nonStringProps.length) {
    throw new Error(
      `Properties (${nonStringProps.join(", ")}) are not of type String`,
    );
  }

  if (!["complete", "incomplete"].includes(props.status)) {
    throw new Error(
      'Property (status) must be set to either "complete" or "incomplete"',
    );
  }

  if (!props.title) {
    throw new Error("Property (title) must not be empty");
  }

  if (!["low", "moderate", "high"].includes(props.priority)) {
    throw new Error(
      'Property (priority) must be set to either "low", "medium" or "high"',
    );
  }

  return true;
}
