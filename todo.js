const baseTodoId = 'todoitem';
let todoList = JSON.parse(localStorage.getItem('todoList')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let authModal = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeAuthModal();
  setupEventListeners();
  renderAllTasks();
  updateDeleteButtonState();
  updateUserInfo();
  showSection('tasks');
});

function initializeTheme() {
  document.body.className = `${currentTheme}-theme`;
  document.getElementById('themeSelect').value = currentTheme;
}

function initializeAuthModal() {
  authModal = new bootstrap.Modal(document.getElementById('authModal'));
}

function setupEventListeners() {
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedElements);
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('authSubmitBtn').addEventListener('click', handleAuthSubmit);
}

function saveToLocalStorage() {
  localStorage.setItem('todoList', JSON.stringify(todoList));
  if (currentUser) {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
}

function deleteElement(id) {
  const index = todoList.findIndex(item => item.id === id);
  if (index !== -1) {
    todoList.splice(index, 1);
    saveToLocalStorage();
  }
  document.getElementById(baseTodoId + id)?.remove();
  updateDeleteButtonState();
  updateTaskListInSidebar();
}

function deleteSelectedElements() {
  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  checkboxes.forEach(checkbox => {
    const id = parseInt(checkbox.dataset.id);
    deleteElement(id);
  });
}

function updateDeleteButtonState() {
  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  deleteBtn.disabled = checkboxes.length === 0;
}

function toggleTaskCompletion(id, checkbox) {
  const index = todoList.findIndex(item => item.id === id);
  if (index !== -1) {
    todoList[index].completed = checkbox.checked;
    saveToLocalStorage();
    
    const taskElement = document.getElementById(baseTodoId + id);
    if (taskElement) {
      taskElement.classList.toggle('completed', checkbox.checked);
    }
  }
  updateTaskListInSidebar();
}

function addToDo() {
  const form = document.forms.toDoForm;
  const title = form.elements.title.value.trim();
  const date = form.elements.date.value;
  
  if (!title) {
    alert('Пожалуйста, введите название задачи');
    return;
  }

  const newTodo = {
    id: createNewId(),
    title: title,
    color: form.elements.color.value,
    description: form.elements.description.value.trim(),
    date: date,
    completed: false,
    createdAt: new Date().toISOString(),
    userId: currentUser?.id || null
  };

  todoList.push(newTodo);
  saveToLocalStorage();
  addToDoToHtml(newTodo);
  updateTaskListInSidebar();
  
  form.elements.title.value = '';
  form.elements.description.value = '';
  form.elements.title.focus();
}

function createNewId() {
  return todoList.length === 0 ? 
    1 : Math.max(...todoList.map(todo => todo.id)) + 1;
}

function renderAllTasks() {
  const container = document.getElementById('tasksContainer');
  container.innerHTML = '';
  
  let userTasks = todoList;
  if (currentUser) {
    userTasks = todoList.filter(task => task.userId === currentUser.id);
  }
  
  const sortedTasks = [...userTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  sortedTasks.forEach(task => addToDoToHtml(task));
}

function addToDoToHtml(todo) {
  const container = document.getElementById('tasksContainer');
  const div = document.createElement('div');
  div.id = baseTodoId + todo.id;
  div.className = `row my-3 ${todo.completed ? 'completed' : ''}`;
  
  const dateString = todo.date ? new Date(todo.date).toLocaleDateString('ru-RU') : 'Без срока';
  
  div.innerHTML = `
    <div class="col">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center" style="background-color: ${todo.color}">
          <small class="text-white">${dateString}</small>
          <div class="form-check">
            <input class="form-check-input task-checkbox" type="checkbox" 
                   data-id="${todo.id}" ${todo.completed ? 'checked' : ''}
                   onchange="toggleTaskCompletion(${todo.id}, this); updateDeleteButtonState()">
          </div>
        </div>
        <div class="card-body">
          <h5 class="card-title">${todo.title}</h5>
          <p class="card-text">${todo.description || 'Нет описания'}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">Создано: ${new Date(todo.createdAt).toLocaleString('ru-RU')}</small>
            <button type="button" class="btn btn-link text-danger" 
                    onclick="deleteElement(${todo.id})" aria-label="Удалить задачу">
              <i class="bi bi-trash"></i> Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(div);
}

function updateTaskListInSidebar() {
  const taskItemsContainer = document.querySelector('#sidebar ul.components');
  const taskItems = taskItemsContainer.querySelectorAll('li.task-item');
  taskItems.forEach(item => item.remove());
  
  let userTasks = todoList;
  if (currentUser) {
    userTasks = todoList.filter(task => task.userId === currentUser.id);
  }
  
  const recentTasks = userTasks
    .filter(task => !task.completed)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  
  recentTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <a href="#" onclick="scrollToTask(${task.id})" aria-label="Перейти к задаче: ${task.title}">
        <i class="bi bi-circle-fill" style="color: ${task.color}"></i>
        <span>${task.title}</span>
      </a>
    `;
    taskItemsContainer.appendChild(li);
  });
}

function scrollToTask(id) {
  const taskElement = document.getElementById(baseTodoId + id);
  if (taskElement) {
    taskElement.scrollIntoView({ behavior: 'smooth' });
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionId}-section`).classList.add('active');
  document.getElementById('currentSectionTitle').textContent = 
    document.querySelector(`a[href="#${sectionId}"] span`).textContent;
  document.querySelectorAll('#sidebar ul li').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`a[href="#${sectionId}"]`).parentElement.classList.add('active');
  
  if (sectionId === 'statistics') {
    updateCharts();
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  document.body.className = `${currentTheme}-theme`;
  document.getElementById('themeSelect').value = currentTheme;
}

function changeTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('theme', currentTheme);
  document.body.className = `${currentTheme}-theme`;
}

function showAuthModal(type) {
  const modalTitle = document.getElementById('authModalTitle');
  const registerFields = document.getElementById('registerFields');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  
  if (type === 'register') {
    modalTitle.textContent = 'Регистрация';
    registerFields.style.display = 'block';
    authSubmitBtn.textContent = 'Зарегистрироваться';
  } else {
    modalTitle.textContent = 'Авторизация';
    registerFields.style.display = 'none';
    authSubmitBtn.textContent = 'Войти';
  }
  
  authModal.show();
}

function handleAuthSubmit() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('registerName')?.value;
  const errorElement = document.getElementById('loginError');
  
  errorElement.classList.add('d-none');
  
  if (document.getElementById('authModalTitle').textContent === 'Регистрация') {
    if (!name) {
      showAuthError('Введите имя');
      return;
    }
    
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
      showAuthError('Пользователь с таким email уже существует');
      return;
    }
    
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    authModal.hide();
    updateUserInfo();
    renderAllTasks();
    updateTaskListInSidebar();
  } else {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.email === email && user.password === password);
    
    if (!user) {
      showAuthError('Неверный email или пароль');
      return;
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    authModal.hide();
    updateUserInfo();
    renderAllTasks();
    updateTaskListInSidebar();
  }
}

function showAuthError(message) {
  const errorElement = document.getElementById('loginError');
  errorElement.textContent = message;
  errorElement.classList.remove('d-none');
}

function updateUserInfo() {
  const userNameElement = document.getElementById('userName');
  const userEmailElement = document.getElementById('userEmail');
  const authButtons = document.querySelector('.auth-buttons');
  
  if (currentUser) {
    userNameElement.textContent = currentUser.name;
    userEmailElement.textContent = currentUser.email;
    authButtons.style.display = 'none';
  } else {
    userNameElement.textContent = 'Гость';
    userEmailElement.textContent = 'Не авторизован';
    authButtons.style.display = 'block';
  }
}

function updateCharts() {
  let userTasks = todoList;
  if (currentUser) {
    userTasks = todoList.filter(task => task.userId === currentUser.id);
  }
  
  const completedCount = userTasks.filter(task => task.completed).length;
  const pendingCount = userTasks.filter(task => !task.completed).length;
  
  const tasksStatusCtx = document.getElementById('tasksStatusChart').getContext('2d');
  new Chart(tasksStatusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Выполнено', 'В процессе'],
      datasets: [{
        data: [completedCount, pendingCount],
        backgroundColor: ['#198754', '#ffc107'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        }
      }
    }
  });
}