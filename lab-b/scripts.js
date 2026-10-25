// Kod wygenerowany przy użyciu Cursor AI
class Todo {
  constructor() {
    this.tasks = [];

    this.term = "";
  }

  validate(name, date) {
    name = name.trim();

    if (name.length < 3 || name.length > 255) {
      alert("Nazwa zadania musi mieć od 3 do 255 znaków.");
      return false;
    }

    if (date) {
      const selectedDate = new Date(date);

      if (
        Number.isNaN(selectedDate.getTime()) ||
        selectedDate <= new Date()
      ) {
        alert("Data wykonania musi być w przyszłości.");
        return false;
      }
    }

    return true;
  }

  add(name, date) {
    name = name.trim();

    if (!this.validate(name, date)) {
      return false;
    }

    const task = {
      id: crypto.randomUUID(),
      name: name,
      date: date
    };

    this.tasks.push(task);

    this.save();
    this.draw();

    return true;
  }

  remove(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);

    this.save();
    this.draw();
  }

  edit(id, name, date) {
    name = name.trim();

    if (!this.validate(name, date)) {
      return false;
    }

    const task = this.tasks.find(task => task.id === id);

    if (!task) {
      return false;
    }

    task.name = name;
    task.date = date;

    this.save();
    this.draw();

    return true;
  }

  save() {
    localStorage.setItem(
      "tasks",
      JSON.stringify(this.tasks)
    );
  }

  load() {
    const data = localStorage.getItem("tasks");

    if (data) {
      try {
        const parsed = JSON.parse(data);

        this.tasks = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Błąd odczytu LocalStorage:", error);
        this.tasks = [];
      }
    }

    this.draw();
  }

  getFilteredTasks() {
    if (this.term.length < 2) {
      return this.tasks;
    }

    return this.tasks.filter(task =>
      task.name.toLowerCase().includes(
        this.term.toLowerCase()
      )
    );
  }

  formatDate(date) {
    if (!date) {
      return "Brak terminu";
    }

    return new Date(date).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  highlightText(element, text) {
    const term = this.term;

    if (term.length < 2) {
      element.textContent = text;
      return;
    }

    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();

    let start = 0;
    let index = lowerText.indexOf(lowerTerm, start);

    while (index !== -1) {
      element.appendChild(
        document.createTextNode(
          text.slice(start, index)
        )
      );

      const mark = document.createElement("mark");

      mark.textContent = text.slice(
        index,
        index + term.length
      );

      element.appendChild(mark);

      start = index + term.length;
      index = lowerText.indexOf(lowerTerm, start);
    }

    element.appendChild(
      document.createTextNode(text.slice(start))
    );
  }

  startEdit(task, taskElement) {
    // Nie otwieramy kilku edycji jednocześnie
    if (document.querySelector(".task.editing")) {
      return;
    }

    taskElement.classList.add("editing");

    const content = taskElement.querySelector(".task-content");
    const deleteButton = taskElement.querySelector(".delete-btn");

    content.innerHTML = "";

    const editFields = document.createElement("div");
    editFields.className = "task-edit-fields";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = task.name;
    nameInput.maxLength = 255;

    const dateInput = document.createElement("input");
    dateInput.type = "datetime-local";
    dateInput.value = task.date || "";

    editFields.appendChild(nameInput);
    editFields.appendChild(dateInput);

    content.appendChild(editFields);

    deleteButton.style.display = "none";

    nameInput.focus();

    let finished = false;

    const handleOutsideClick = (event) => {
      if (taskElement.contains(event.target)) {
        return;
      }

      if (finished) {
        return;
      }

      const success = this.edit(
        task.id,
        nameInput.value,
        dateInput.value
      );

      if (success) {
        finished = true;
        document.removeEventListener(
          "click",
          handleOutsideClick,
          true
        );
      } else {
        nameInput.focus();
      }
    };

    const handleKeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        const success = this.edit(
          task.id,
          nameInput.value,
          dateInput.value
        );

        if (success) {
          finished = true;
          document.removeEventListener(
            "click",
            handleOutsideClick,
            true
          );
        }
      }

      if (event.key === "Escape") {
        finished = true;

        document.removeEventListener(
          "click",
          handleOutsideClick,
          true
        );

        this.draw();
      }
    };

    nameInput.addEventListener("keydown", handleKeydown);
    dateInput.addEventListener("keydown", handleKeydown);

    setTimeout(() => {
      if (!finished) {
        document.addEventListener(
          "click",
          handleOutsideClick,
          true
        );
      }
    }, 0);
  }

  draw() {
    const list = document.getElementById("taskList");

    list.innerHTML = "";

    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      const message = document.createElement("div");
      message.className = "empty-message";

      message.textContent = this.term.length >= 2
        ? "Nie znaleziono zadań."
        : "Brak zadań na liście.";

      list.appendChild(message);
      return;
    }

    filteredTasks.forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.className = "task";

      const content = document.createElement("div");
      content.className = "task-content";

      const nameElement = document.createElement("span");
      nameElement.className = "task-name";

      this.highlightText(nameElement, task.name);

      const dateElement = document.createElement("span");
      dateElement.className = "task-date";
      dateElement.textContent = this.formatDate(task.date);

      content.appendChild(nameElement);
      content.appendChild(dateElement);

      content.addEventListener("click", () => {
        this.startEdit(task, taskElement);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "Usuń";

      deleteButton.addEventListener("click", () => {
        this.remove(task.id);
      });

      taskElement.appendChild(content);
      taskElement.appendChild(deleteButton);

      list.appendChild(taskElement);
    });
  }
}

document.todo = new Todo();

document.todo.load();

document.getElementById("addForm")
  .addEventListener("submit", function(event) {
    event.preventDefault();

    const nameInput = document.getElementById("taskName");
    const dateInput = document.getElementById("taskDate");

    const success = document.todo.add(
      nameInput.value,
      dateInput.value
    );

    if (success) {
      nameInput.value = "";
      dateInput.value = "";
      nameInput.focus();
    }
  });

document.getElementById("search")
  .addEventListener("input", function(event) {
    document.todo.term = event.target.value;
    document.todo.draw();
  });
// End
