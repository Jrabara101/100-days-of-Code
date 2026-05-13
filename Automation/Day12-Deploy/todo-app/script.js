const addBtn = document.getElementById("add-btn");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") addTask();
});

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  const li = document.createElement("li");
  li.className = "task";

  li.innerHTML = `
    <span class="task-text">${taskText}</span>
    <button class="delete-btn">Delete</button>
  `;

  li.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
      li.remove();
    } else {
      li.classList.toggle("completed");
    }
  });

  taskList.appendChild(li);
  taskInput.value = "";
}
