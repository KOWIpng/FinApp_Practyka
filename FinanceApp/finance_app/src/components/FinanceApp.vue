<template>
  <div class="app-container">
    <!-- Registration Modal -->
    <div v-if="showRegistration" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">Реєстрація</h2>
        <form @submit.prevent="register">
          <div class="form-group">
            <label>Email</label>
            <!--            <input type="email" v-model="registerForm.email" required />-->
            <input type="text" v-model="registerForm.name" required />
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" v-model="registerForm.password" required />
          </div>
          <div class="form-group">
            <label>Підтвердіть пароль</label>
            <input type="password" v-model="registerForm.confirmPassword" required />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showRegistration = false">
              Скасувати
            </button>
            <button type="submit" class="btn btn-primary">
              Зареєструватися
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Main App -->
    <div v-if="isLoggedIn" class="main-app">
      <!-- Header -->
      <header class="app-header">
        <div class="header-container">
          <div class="logo">FinanceTracker</div>
          <div class="user-menu">



            <div class="theme-toggle" @click="toggleTheme">
              <div class="toggle-track-triple">
                <div class="toggle-thumb-triple" :class="theme"></div>
                <div class="toggle-option">🌞</div>
                <div class="toggle-option">🌙</div>
                <div class="toggle-option">🌸</div>
              </div>
            </div>

            <button @click="logout" class="btn-logout">
              Вийти
            </button>

            <div>
              <!-- Аватар користувача -->
              <div class="user-avatar" @click="toggleTokenForm">
                {{ userInitials }}
              </div>

              <!-- Модальне вікно форми -->
              <div v-if="showTokenForm" class="modal-overlay">
                <div class="modal-content">
                  <h3>Прив'язка банківського акаунту</h3>

                  <input type="text" v-model="bankToken" placeholder="Введіть ваш токен" class="token-input" />

                  <label>Дата початку:</label>
                  <input type="date" v-model="dateFrom" class="token-input" />

                  <label>Дата завершення:</label>
                  <input type="date" v-model="dateTo" class="token-input" />

                  <button @click="saveBankToken" class="btn btn-secondary">Зберегти токен</button>
                  <button @click="fetchTransactions" class="btn btn-secondary">Отримати транзакції</button>
                  <button @click="showTokenForm = false" class="btn btn-secondary">Закрити</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-container">
          <!-- Navigation Tabs -->
          <div class="tabs-navigation">
            <button @click="activeTab = 'home'" :class="['tab-button', activeTab === 'home' ? 'active' : '']">
              Головна сторінка
            </button>
            <button @click="activeTab = 'analytics'" :class="['tab-button', activeTab === 'analytics' ? 'active' : '']">
              Графіки та аналітика
            </button>
            <button @click="activeTab = 'transactions'"
              :class="['tab-button', activeTab === 'transactions' ? 'active' : '']">
              Витрати та доходи
            </button>
            <button @click="activeTab = 'savings'" :class="['tab-button', activeTab === 'savings' ? 'active' : '']">
              Накопичення
            </button>
          </div>

          <!-- Home Tab -->
          <div v-if="activeTab === 'home'" class="tab-content">
            <!-- Total Capital Card -->
            <div class="card capital-card">
              <h2 class="card-title">Загальний капітал</h2>
              <p class="capital-amount" :class="{'positive': totalCapital>=0, 'negative': totalCapital<0}">₴ {{
                formatNumber(totalCapital) }}</p>
              <div class="capital-trend" :class="{'positive': currentMonthDelta>0, 'negative': currentMonthDelta<0}">
                <svg class="trend-icon" viewBox="0 0 24 24">
                  <path v-if="currentMonthDelta>0" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  <path v-if="currentMonthDelta<0" d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(180, 12, 12)"></path>
                </svg>
                ₴{{ formatNumber(currentMonthDelta) }} цього місяця
              </div>
            </div>

            <div>
              <button v-if="!showTargetForm" class="add-transaction-button" @click="showTargetForm = true">
                <span class="plus-icon">⚙</span>
              </button>
            </div>

            <div>
              <div v-if="showTargetForm" class="transaction-form-overlay">
                <div class="transaction-form-container">
                  <div class="card">
                    <h2 class="card-title">Управління лімітами по категоріях</h2>
                    <div class="transaction-form">
                      <div class="form-group" v-for="category in budgetCategories" :key="category.code">
                        <label>{{ category.name }}</label>
                        <input type="number" v-model.number="category.target" placeholder="0.00" />
                        <button @click="updateCategoryTarget(category)" class="btn btn-primary">Зберегти</button>
                        <button @click="deleteCategory(category)" class="btn btn-danger">Видалити</button>
                      </div>
                      <div class="form-group">
                        <button @click="showTargetForm = false; loadCategories()"
                          class="btn btn-secondary btn-full">Закрити</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>




            <!-- Budget Categories -->
            <h2 class="section-title">Категорії бюджету на місяць</h2>
            <div class="budget-categories">
              <div v-for="(category, index) in budgetCategories.filter(c => c.direction === 'expense')" :key="index"
                class="card category-card">
                <div class="category-header">
                  <h3 class="category-name">{{ category.name }}</h3>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar" :class="getProgressColor(category.spent, category.budget)"
                    :style="{ width: `${Math.min(100, (category.spent / category.budget) * 100)}%` }"></div>
                </div>
                <div class="category-remaining">
                  Залишилось: ₴{{ formatNumber(category.budget - category.spent) }}
                </div>
              </div>
            </div>

            <!-- Quick Add Transaction -->
            <div class="card">
              <h2 class="card-title">Додати транзакцію</h2>
              <div class="quick-transaction-form">
                <div class="form-group">
                  <label>Сума</label>
                  <input type="number" v-model="newTransaction.amount" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label>Категорія</label>
                  <select v-model="newTransaction.category">
                    <option v-for="(category, index) in budgetCategories" :key="index" :value="category.name">
                      {{ category.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <button @click="addTransaction" class="btn btn-primary btn-full">
                    Додати
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Analytics Tab -->
          <div v-if="activeTab === 'analytics'" class="tab-content">
            <!-- Date filters -->
            <div class="filters-container">
              <div class="card">
                <h2 class="card-title">Фільтри</h2>
                <div class="filters-grid">
                  <div class="form-group">
                    <label>Рік</label>
                    <select v-model="selectedYear">
                      <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Місяць</label>
                    <select v-model="selectedMonth">
                      <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                        {{ month.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <button @click="loadChartData(); renderCharts()" class="btn btn-primary">
                      Оновити
                    </button>
                  </div>
                  <div class="form-group">
                    <button @click="exportChartsToPDF" class="btn btn-secondary">
                      Експортувати в PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Category Expenses Chart -->
            <div class="card">
              <h2 class="card-title">Витрати за категоріями</h2>
              <div class="chart-container">
                <canvas id="categoryExpensesChart"></canvas>
              </div>
            </div>

            <!-- Income vs Expense Chart -->
            <div class="card">
              <h2 class="card-title">Доходи vs Витрати</h2>
              <div class="chart-container">
                <canvas id="incomeVsExpenseChart"></canvas>
              </div>
            </div>

            <!-- Expense Trend Chart -->
            <div class="card">
              <h2 class="card-title">Тренд витрат</h2>
              <div class="chart-container">
                <canvas id="expenseTrendChart"></canvas>
              </div>
            </div>
          </div>
          <!-- Transactions Tab -->
          <div v-if="activeTab === 'transactions'" class="tab-content">
            <div class="card">
              <div class="transactions-header">
                <h2 class="card-title">Останні транзакції</h2>
                <div class="transaction-filters">
                  <button @click="transactionType = 'all'"
                    :class="['filter-button', transactionType === 'all' ? 'active' : '']">
                    Всі
                  </button>
                  <button @click="transactionType = 'expense'"
                    :class="['filter-button', transactionType === 'expense' ? 'active' : '']">
                    Витрати
                  </button>
                  <button @click="transactionType = 'income'"
                    :class="['filter-button', transactionType === 'income' ? 'active' : '']">
                    Доходи
                  </button>
                  <button @click="downloadExcel" class="btn btn-primary">
                    ⬇️ Завантажити звіт (.xlsx)
                  </button>

                </div>
              </div>



              <div class="transactions-table-container">
                <table class="transactions-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Категорія</th>
                      <th>Опис</th>
                      <th class="amount-column">Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(transaction, index) in filteredTransactions" :key="index">
                      <td>{{ transaction.date }}</td>
                      <td>{{ transaction.category }}</td>
                      <td>{{ transaction.description }}</td>
                      <td class="amount-column"
                        :class="transaction.type === 'income' ? 'income-amount' : 'expense-amount'">
                        {{ transaction.type === 'income' ? '+' : '-' }}₴{{ formatNumber(transaction.amount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button v-if="!showTransactionForm" class="add-transaction-button" @click="showTransactionForm = true">
              <span class="plus-icon">+</span>
            </button>

            <div v-if="showTransactionForm" class="transaction-form-overlay">
              <div class="transaction-form-container">
                <div class="card">
                  <h2 class="card-title">Додати нову транзакцію</h2>
                  <div class="transaction-form">
                    <div class="form-group">
                      <label>Тип</label>
                      <div class="transaction-type-buttons">
                        <button @click="newTransaction.type = 'expense'"
                          :class="['type-button', newTransaction.type === 'expense' ? 'active' : '']">
                          Витрата
                        </button>
                        <button @click="newTransaction.type = 'income'"
                          :class="['type-button', newTransaction.type === 'income' ? 'active' : '']">
                          Дохід
                        </button>
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Сума</label>
                      <input type="number" v-model="newTransaction.amount" placeholder="0.00" />
                    </div>
                    <div class="form-group">
                      <label>Категорія</label>
                      <select v-model="newTransaction.category">
                        <option v-for="(category, index) in filteredCategories" :key="index" :value="category.name">
                          {{ category.name }}
                        </option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Опис</label>
                      <input type="text" v-model="newTransaction.description" placeholder="Опис транзакції" />
                    </div>
                    <div class="form-group">
                      <input v-model="newCategoryName" placeholder="Нова категорія" />
                    </div>
                    <div class="form-group">
                      <button @click="addNewCategory" class="btn btn-primary btn-full">
                        Додати категорію
                      </button>
                    </div>
                    <div class="form-group">
                      <button @click="addTransaction" class="btn btn-primary btn-full">
                        Додати транзакцію
                      </button>
                    </div>
                    <div class="form-group">
                      <button @click="showTransactionForm = false" class="btn btn-secondary btn-full">
                        Відміна
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Savings Tab -->
          <div v-if="activeTab === 'savings'" class="tab-content">
            <div class="savings-summary">
              <div class="card">
                <h2 class="card-title">Загальні накопичення</h2>
                <p class="savings-amount">₴ {{ formatNumber(totalSavings) }}</p>
              </div>

              <div class="card">
                <h2 class="card-title">Додати до накопичень</h2>
                <div class="add-savings-form">
                  <div class="form-group">
                    <select v-model="selectedGoalId">
                      <option v-for="(goal, index) in savingsGoals" :key="index" :value="goal.id">
                        {{ goal.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <input type="number" v-model="savingsAmount" placeholder="0.00" />
                  </div>
                  <button @click="addToSavings" class="btn btn-primary">
                    Додати
                  </button>

                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title">Цілі накопичень</h2>
              <div class="savings-goals">
                <div v-for="(goal, index) in savingsGoals" :key="index" class="savings-goal"
                  @dblclick="deleteGoal(goal.id)">
                  <div class="goal-header">
                    <h3 class="goal-name">{{ goal.name }}</h3>
                    <span class="goal-progress">
                      {{ formatNumber(goal.current) }} / {{ formatNumber(goal.target) }}
                    </span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar progress-green"
                      :style="{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }"></div>
                  </div>
                  <div class="goal-details">
                    <span class="goal-percentage">{{ Math.round((goal.current / goal.target) * 100) }}%</span>
                    <span class="goal-remaining">Залишилось: ₴{{ formatNumber(goal.target - goal.current) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title">Створити нову ціль</h2>
              <div class="new-goal-form">
                <div class="form-group">
                  <label>Назва</label>
                  <input type="text" v-model="newGoal.name" placeholder="Назва цілі" />
                </div>
                <div class="form-group">
                  <label>Цільова сума</label>
                  <input type="number" v-model="newGoal.target" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <button @click="addSavingsGoal" class="btn btn-primary btn-full">
                    Створити ціль
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Login Screen -->
    <div v-if="!isLoggedIn && !showRegistration" class="login-container">
      <div class="login-form-container">
        <div class="login-header">
          <h2 class="app-title">FinanceTracker</h2>
          <p class="login-subtitle">
            Увійдіть до свого облікового запису
          </p>
        </div>
        <form class="login-form" @submit.prevent="login">
          <div class="login-inputs">
            <div class="form-group">
              <label for="email-address" class="sr-only">Email</label>
              <!--              <input id="email-address" name="email" type="email" required v-model="loginForm.email" placeholder="Email" />-->
              <input id="email-address" name="name" type="text" required v-model="loginForm.name"
                placeholder="Ім'я користувача" />
            </div>
            <div class="form-group">
              <label for="password" class="sr-only">Пароль</label>
              <input id="password" name="password" type="password" required v-model="loginForm.password"
                placeholder="Пароль" />
            </div>
          </div>

          <div class="login-options">
            <!--            <div class="remember-me">-->
            <!--              <input id="remember-me" name="remember-me" type="checkbox" />-->
            <!--              <label for="remember-me">-->
            <!--                Запам'ятати мене-->
            <!--              </label>-->
            <!--            </div>-->

            <div class="forgot-password">
              <a href="#">Забули пароль?</a>
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary btn-full">
              Увійти
            </button>
          </div>
        </form>
        <div class="register-link">
          <button @click="showRegistration = true" class="btn-link">
            Створити новий обліковий запис
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';

const showTokenForm = ref(false);
// Auth state
const isLoggedIn = ref(false);
const error = ref(null);
// const router = useRouter();
const showRegistration = ref(false);
const loginForm = ref({
  email: '',
  password: '1234',
  name: 'user'
});
const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
});

// User data
const user = ref({
  name: null,
  id: null
});

const userInitials = computed(() => {
  return user.value.name.charAt(0).toUpperCase();
});

const categoryExpenses = ref([]);  // Змінна для витрат за категоріями

// App state
const showTransactionForm = ref(false);
const activeTab = ref('home');
const transactionType = ref('all');
const totalCapital = ref(0);
const currentMonthDelta = ref(0);
const totalSavings = ref(0);
const savingsAmount = ref(null);
const selectedGoalId = ref(null);
const newTransaction = ref({
  type: 'expense',
  amount: null,
  category: '',
  description: '',
  date: new Date().toLocaleDateString('uk-UA')
});
const newGoal = ref({
  name: '',
  target: null,
  current: 0
});


// Budget categories
const budgetCategories = ref([]);
const filteredCategories = computed(() => {
  if (newTransaction.value.type === 'expense') {
    return budgetCategories.value.filter(c => c.direction === 'expense');
  } else if (newTransaction.value.type === 'income') {
    return budgetCategories.value.filter(c => c.direction === 'income');
  } else {
    return [];
  }
});


// Transactions
const transactions = ref([]);

// Savings goals
const savingsGoals = ref([]);

//grafics
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const availableYears = ref([]);
const availableMonths = ref([
  { value: 1, name: 'Січень' },
  { value: 2, name: 'Лютий' },
  { value: 3, name: 'Березень' },
  { value: 4, name: 'Квітень' },
  { value: 5, name: 'Травень' },
  { value: 6, name: 'Червень' },
  { value: 7, name: 'Липень' },
  { value: 8, name: 'Серпень' },
  { value: 9, name: 'Вересень' },
  { value: 10, name: 'Жовтень' },
  { value: 11, name: 'Листопад' },
  { value: 12, name: 'Грудень' }
]);
const categoryExpensesChart = ref(null);
const incomeVsExpenseChart = ref(null);
const expenseTrendChart = ref(null);
const incomeVsExpenseData = ref([]);
const expenseTrendData = ref([]);
const newCategoryName = ref('');
const showTargetForm = ref(false);

// const userId = localStorage.getItem('userId');

// Computed properties

const getUniqueYears = computed(() => {
  const years = transactions.value.map(t => {
    // Extract year from date (assuming format DD.MM.YYYY)
    const dateParts = t.date.split('.');
    return parseInt(dateParts[2]);
  });
  return [...new Set(years)].sort((a, b) => a - b);
});


const filteredTransactions = computed(() => {
  if (transactionType.value === 'all') {
    return transactions.value;
  }
  return transactions.value.filter(t => t.type === transactionType.value);
});


//  a watch to update availableYears when transactions change
watch(transactions, () => {
  availableYears.value = getUniqueYears.value;
  if (!availableYears.value.includes(selectedYear.value)) {
    selectedYear.value = availableYears.value[availableYears.value.length - 1] || new Date().getFullYear();
  }
}, { deep: true });

//  a watch to reload charts when filters change
watch([selectedYear, selectedMonth], () => {
  loadChartData();
  renderCharts();
}, { deep: true });

watch(activeTab, (newVal) => {
  if (newVal === 'analytics') {
    setTimeout(() => {
      renderCharts();
    }, 500);
  }
});

const bankToken = ref ('');
const dateFrom = ref('');
const dateTo = ref('');
// Methods

function toggleTokenForm() {
  showTokenForm.value = !showTokenForm.value;
}

async function saveBankToken() {
  if (!bankToken.value.trim()) {
    alert('Будь ласка, введіть токен.');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/monobank/token/${user.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ token: bankToken.value }),
    });

    const data = await res.json();
    if (data.message === 'Токен збережено') {
      alert('Токен збережено!');
      showTokenForm.value = false;
      bankToken.value = '';
    } else {
      alert('Помилка збереження токена');
    }
  } catch (err) {
    console.error(err);
    alert('Помилка з’єднання з сервером');
  }
}


const mccCategories = {
  // Продукти
  5411: 'Продукти',
  5499: 'Делікатеси / Магазини здорової їжі',

  // Ресторани та кафе
  5812: 'Ресторани',
  5814: 'Фастфуд',
  5811: 'Кейтеринг',

  // Одяг та взуття
  5651: 'Одяг',
  5661: 'Взуття',

  // Покупки та супермаркети
  5311: 'Універмаги',
  5399: 'Магазини товарів загального призначення',
  5941: 'Канцелярія',
  5942: 'Книгарні',
  5943: 'Паперові вироби / Сувеніри',
  5999: 'Інші роздрібні магазини',

  // Транспорт
  4111: 'Автобуси',
  4121: 'Таксі',
  4789: 'Інші транспортні послуги',
  5541: 'АЗС',
  5542: 'Паливо (самообслуговування)',
  7512: 'Оренда авто',

  // Комунальні послуги
  4900: 'Комунальні платежі',
  4814: 'Телефонія / Інтернет',

  // Житло
  7011: 'Готелі / Проживання',
  6513: 'Оренда житла',

  // Аптеки та медицина
  5912: 'Аптеки',
  8062: 'Медичні послуги',
  8011: 'Лікарі',

  // Розваги
  7832: 'Кінотеатри',
  7922: 'Театри / Концерти',
  7996: 'Парки розваг',
  7994: 'Ігрові клуби',
  7995: 'Гемблінг / Азартні ігри',

  // Спорт
  7941: 'Спортивні події',
  7997: 'Клуби здоровʼя / Фітнес',
  7999: 'Інші розваги',

  // Освіта
  8211: 'Школи',
  8220: 'Коледжі / Університети',
  8299: 'Інші освітні послуги',

  // Перекази
  4829: 'Перекази',
  6536: 'Грошові перекази',
  6012: 'Фінансові послуги',
  6051: 'Небанківські перекази',

  // Зняття готівки
  6011: 'Зняття готівки в банкоматі',

  // Подорожі
  4722: 'Туристичні агенції',
  4511: 'Авіалінії',
  3000: 'Готелі / Курорти',
  3501: 'Оренда авто',
  4411: 'Круїзи',

  // Платежі онлайн / Підписки
  4899: 'Онлайн-сервіси / Підписки',
  5734: 'Цифрові продукти',
  5815: 'Цифрові гаманці (наприклад, PayPal)',

  // Інше
  9999: 'Інше',
};



const fetchTransactions = async () => {
    if (!dateFrom.value || !dateTo.value) {
      alert('Введіть обидві дати');
      return;
    }
    const fromTimestamp = Math.floor(new Date(dateFrom.value).getTime());
    const toTimestamp = Math.floor(new Date(dateTo.value).getTime());

    const res = await fetch(`http://localhost:3000/api/monobank/transactions/${user.value.id}/${fromTimestamp}/${toTimestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await res.json();
    //
    console.log('Статус відповіді сервера:', res.status);
    console.log('Дані, які ми намагаємось перебрати:', data);
    // -----------------------------------

    // Перевірка: якщо data не є масивом, зупиняємо функцію, щоб не було помилки "not iterable"
    if (!Array.isArray(data)) {
        console.error('Очікувався масив, але отримано:', typeof data);
        return; // Виходимо з функції
    }

    for (const item of data) {
      newTransaction.value = {
        type: 'expense',
        amount: null,
        category: '',
        description: '',
        date: new Date().toLocaleDateString('uk-UA')
      };

      newTransaction.value.type = item.amount < 0 ? "expense" : "income";
      newTransaction.value.amount = Number(Math.abs(item.amount)/100);
      newTransaction.value.monobank_id = item.id;//поломане айді 
      newTransaction.value.date = new Date(item.time * 1000).toLocaleDateString('uk-UA');
      newTransaction.value.user = user.value.id;
      newTransaction.value.currency = 'UAH';
      //newTransaction.value.category = item.amount < 0 ? "Продукти" : "Зарплата";
      newTransaction.value.category = mccCategories[item.mcc] || 'Інше';
      newTransaction.value.description = item.description;
      addTransaction();
    }


    if (res.ok) {
      console.log("Транзакції:", data);
      alert("Транзакції успішно отримані!");
    } else {
      alert(data.message || 'Помилка отримання транзакцій');
    }
  };

async function addNewCategory() {
  try {

    const direction = newTransaction.value.type;
    console.log("type of transaction:", direction)

    const res = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      
      body: JSON.stringify({ name: newCategoryName.value, userId: user.value.id,  direction: direction })
    });

    const text = await res.text();
    console.log('Сирий текст з респонсу:', text);

    try {
      const data = JSON.parse(text);
      if (data.success) {
        alert('Категорію додано!');
        await loadCategories();
      } else {
        console.error('Помилка з сервера:', data.message);
      }
    } catch (err) {
      console.error('❌ Неможливо розпарсити JSON:', err);
      alert('Сталася помилка. Сервер не повернув JSON.');
    }
  } catch (err) {
    console.error('❌ Запит не відбувся:', err);
  }
}

const themes = ['light', 'dark', 'pink']
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  const currentIndex = themes.indexOf(theme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  theme.value = themes[nextIndex]
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

async function updateCategoryTarget(category) {
  console.log("category = ", category);
  const res = await fetch('http://localhost:3000/api/categories/target', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ categoryId: category.id, target: category.target, userId: user.value.id })
  });

  const data = await res.json();
  if (data.success) alert('Ліміт оновлено!');
  else alert('Помилка оновлення');
}

async function deleteCategory(category) {
  const confirmed = confirm("Ви впевнені, що хочете видалити категорію?");
  if (!confirmed) return;
  

  const res = await fetch(`http://localhost:3000/api/categories/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({categoryId: category.id, userId: user.value.id})
  });

  const data = await res.json();
  if (data.success) {
    alert('Категорію видалено!');
    await loadCategories();
  } else {
    alert('Помилка видалення');
  }
}

async function addTransaction() {
  if (!newTransaction.value.amount || !newTransaction.value.category) {
    alert('Будь ласка, заповніть всі обов\'язкові поля');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const category = budgetCategories.value.find(c => c.name === newTransaction.value.category);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const response = await fetch(`http://localhost:3000/api/operations/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          date: newTransaction.value.date,
          categoryId: category.id,
          amount: Number(newTransaction.value.amount),
          currency: 'UAH',
          description: newTransaction.value.description
        })
      });
      // console.log('Транзакція:', response);
      if (response.ok) {
        // const data = await response.json();
        // console.log('Транзакція додана:', data);

        // Скинути форму
        newTransaction.value = {
          type: 'expense',
          amount: null,
          category: '',
          description: '',
          date: new Date().toLocaleDateString('uk-UA')
        };

        loadTransactions();
        loadUserInfo();

        showTransactionForm.value = false;
      } else {
        console.error('Помилка додавання транзакції');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function downloadExcel() {
  try {
    const res = await fetch(`http://localhost:3000/api/operations/export/${user.value.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) throw new Error('Помилка експорту');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Помилка при завантаженні: ' + err.message);
  }
}

const exportChartsToPDF = () => {
  const doc = new jsPDF();

  const charts = [
    { id: 'categoryExpensesChart', title: 'Витрати за категоріями' },
    { id: 'incomeVsExpenseChart', title: 'Доходи vs Витрати' },
    { id: 'expenseTrendChart', title: 'Тренд витрат' }
  ];

  let yOffset = 10;

  charts.forEach((chart) => {
    const canvas = document.getElementById(chart.id);
    if (canvas) {
      const imageData = canvas.toDataURL("image/png");
      doc.setFontSize(16);
      doc.text(chart.title, 10, yOffset);
      doc.addImage(imageData, "PNG", 10, yOffset + 5, 180, 80);
      yOffset += 90;
    }
  });

  doc.save("Фінансова-аналітика.pdf");
};

async function addSavingsGoal() {
  if (!newGoal.value.name || !newGoal.value.target) {
    alert('Будь ласка, заповніть всі поля');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;

    const response = await fetch(`http://localhost:3000/api/savings/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newGoal.value.name,
        target: Number(newGoal.value.target)
      })
    });

    if (response.ok) {
      loadSavings();

      // Скинути форму
      newGoal.value = {
        name: '',
        target: null,
        current: 0
      };
    } else {
      console.error('Помилка додавання мети накопичень');
    }
  } catch (error) {
    console.error(error);
  }
}

async function addToSavings() {
  // Перевірка, чи введена сума
  if (!savingsAmount.value) {
    alert('Будь ласка, введіть суму');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    isLoggedIn.value = false;
    localStorage.removeItem('token');
  } else {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const response = await fetch(`http://localhost:3000/api/savings/${userId}/${selectedGoalId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(savingsAmount.value)
        })
      });

      if (response.ok) {
        loadSavings();
        // Скидання форми
        savingsAmount.value = null;
        selectedGoalId.value = null;
      } else {
        console.error('Помилка додавання до накопичень');
        alert('Не вдалося додати суму до накопичень. Спробуйте ще раз.');
      }
    } catch (error) {
      console.error(error);
      alert('Сталася помилка. Спробуйте ще раз.');
    }
  }
}

async function deleteGoal(goalId) {
  if (confirm('Чи точно видалити цю ціль накопичення?')) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        isLoggedIn.value = false;
        localStorage.removeItem('token');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const response = await fetch(`http://localhost:3000/api/savings/${userId}/${goalId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Накопичення видалено:', data);

        loadSavings();
      } else {
        console.error('Помилка видалення накопичення');
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function formatNumber(number) {
  return number.toLocaleString('uk-UA');
}

function getProgressColor(spent, budget) {
  const percentage = (spent / budget) * 100;
  if (percentage < 50) return 'progress-green';
  if (percentage < 75) return 'progress-yellow';
  return 'progress-red';
}

async function login() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      isLoggedIn.value = true;
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;
      loadTransactions();
      loadCategories();
      loadUserInfo();
      loadReports();
      loadChartData();
    } else {
      const data = await response.text();
      error.value = data;
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error(error);
    error.value = 'Помилка мережі';
  }
}

async function logout() {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`}
      });
      localStorage.removeItem('token');
      isLoggedIn.value = false;
      user.value.name = null;
      user.value.id = null;
    }
  } catch (error) {
    console.error(error);
  }
}

async function register() {
  try {
    if (registerForm.value.password === registerForm.value.confirmPassword) {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm.value)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        // isLoggedIn.value = true;
        showRegistration.value = false;
        // router.push('/protected');
      } else {
        localStorage.removeItem('token');
        const data = await response.text();
        alert(data);
      }
    } else {
      alert('Паролі не співпадають');
    }
  } catch (error) {
    console.error(error);
    alert('Помилка реєстрації');
  }
}

async function loadTransactions() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;

      const response = await fetch(`http://localhost:3000/api/operations/${user.value.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        transactions.value = data.map(operation => ({
          date: operation.Operation_date,
          category: operation.Operation_category,
          description: operation.Operation_description,
          amount: operation.Amount,
          type: operation.Operation_direction
        }));
      } else {
        console.error('Помилка отримання операцій');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadCategories() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;

      const response = await fetch(`http://localhost:3000/api/categories/${user.value.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        budgetCategories.value = data.map(category => ({
          id: category.code,
          name: category.name,
          budget: category.target,
          spent: category.spent,
          direction: category.direction
        }));
      } else {
        console.error('Помилка отримання операцій');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadSavings() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;

      const response = await fetch(`http://localhost:3000/api/savings/${user.value.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // console.log(data);
        savingsGoals.value = data.map(saving => ({
          id: saving.code,
          name: saving.title,
          target: saving.target,
          current: saving.current
        }));
      } else {
        console.error('Помилка отримання накопичень');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadReports() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;

      const response = await fetch(`http://localhost:3000/api/reports/category-expenses/${user.value.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("report:", response);
      if (response.ok) {
        const data = await response.json();
        categoryExpenses.value = data.map(report => ({
          category: report.category_name,
          amount: report.total_amount
        }));
        console.log('Category expences: ', categoryExpenses);
      } else {
        console.error('Помилка отримання витрат за категоріями');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadCategoryExpenses() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token not found');

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    if (!userId) throw new Error('User ID not found in token');

    const response = await fetch(`http://localhost:3000/api/reports/category-expenses/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("report:", response);

    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`HTTP ${response.status}: ${msg}`);
    }

    const data = await response.json();
    categoryExpenses.value = data;
    console.log('Завантажено categoryExpenses:', data);
  } catch (err) {
    console.error('Помилка при завантаженні витрат за категоріями:', err.message);
  }
}

async function loadUserInfo() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
    } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user.value.name = payload.name;
      user.value.id = payload.id;

      const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
        headers: {Authorization: `Bearer ${token}`}
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          totalCapital.value = data[0].amount;
          currentMonthDelta.value = data[0].current_month;
          totalSavings.value = data[0].savings;
        } else {
          console.error('Відповідь порожня');
        }
      } else {
        console.error('Помилка отримання даних');
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function loadChartData() {
  const now = new Date();
  const year = selectedYear?.value || now.getFullYear();
  const month = selectedMonth?.value || (now.getMonth() + 1);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      isLoggedIn.value = false;
      localStorage.removeItem('token');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;

    // Load category expenses
    const categoryResponse = await fetch(`http://localhost:3000/api/reports/category-expenses/${userId}?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (categoryResponse.ok) {
      const data = await categoryResponse.json();
      categoryExpenses.value = data.map(report => ({
        category: report.category_name,
        amount: report.total_amount
      }));
    }

    // Load income vs expense data
    const incomeVsExpenseResponse = await fetch(`http://localhost:3000/api/reports/incvsexp/${userId}?year=${selectedYear.value}&month=${selectedMonth.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (incomeVsExpenseResponse.ok) {
      incomeVsExpenseData.value = await incomeVsExpenseResponse.json();
    }

    // Load expense trend data (last 6 months)
    const trendResponse = await fetch(`http://localhost:3000/api/reports/expense-trend/${userId}?year=${selectedYear.value}&month=${selectedMonth.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (trendResponse.ok) {
      expenseTrendData.value = await trendResponse.json();
    }
  } catch (error) {
    console.error('Error loading chart data:', error);
  }
}

function renderCharts() {
  renderCategoryExpensesChart();
  renderIncomeVsExpenseChart();
  renderExpenseTrendChart();
}

function renderCategoryExpensesChart() {
  const ctx = document.getElementById('categoryExpensesChart');
  if (!ctx) return;
  
  if (categoryExpensesChart.value) {
    categoryExpensesChart.value.destroy();
  }
  
  if (categoryExpenses.value.length === 0) return;
  
  categoryExpensesChart.value = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categoryExpenses.value.map(item => item.category),
      datasets: [{
        data: categoryExpenses.value.map(item => item.amount),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC249', '#EA526F', '#25CCF7', '#FD7272'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        title: {
          display: true,
          text: 'Витрати за категоріями'
        }
      }
    }
  });
}

function renderIncomeVsExpenseChart() {
  const ctx = document.getElementById('incomeVsExpenseChart');
  if (!ctx) return;
  
  if (incomeVsExpenseChart.value) {
    incomeVsExpenseChart.value.destroy();
  }
  
  if (incomeVsExpenseData.value.length === 0) return;
  
  // Process data for chart
  const incomeData = {};
  const expenseData = {};
  
  incomeVsExpenseData.value.forEach(item => {
    if (item.direction === 'income') {
      incomeData[item.month] = item.total_amount;
    } else {
      expenseData[item.month] = item.total_amount;
    }
  });

  const months = [...new Set(incomeVsExpenseData.value.map(item => item.month))].sort();

  incomeVsExpenseChart.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Доходи',
          data: months.map(month => incomeData[month] || 0),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        },
        {
          label: 'Витрати',
          data: months.map(month => expenseData[month] || 0),
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Сума (UAH)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Місяць'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Доходи vs Витрати'
        }
      }
    }
  });
}

function renderExpenseTrendChart() {
  const ctx = document.getElementById('expenseTrendChart');
  if (!ctx) return;

  if (expenseTrendChart.value) {
    expenseTrendChart.value.destroy();
  }

  if (expenseTrendData.value.length === 0) return;

  // Sort data by date
  const sortedData = [...expenseTrendData.value].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  expenseTrendChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedData.map(item => item.date),
      datasets: [{
        label: 'Витрати',
        data: sortedData.map(item => item.amount),
        fill: false,
        borderColor: '#ef4444',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Сума (UAH)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Дата'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Тренд витрат'
        }
      }
    }
  });
}

onMounted(() => {
 document.documentElement.setAttribute('data-theme', theme.value)
  loadTransactions();
  loadCategories();
  loadCategoryExpenses(); 
  loadUserInfo();
  loadSavings();
  //loadReports();
  loadChartData();
});
</script>

<style>
.transaction-form-container {
  max-height: 80vh; /* 80% висоти вікна */
  overflow-y: auto; /* Вертикальний скрол, якщо не вміщується */
  padding: 1rem;
  box-sizing: border-box;
}

/* Заокруглення картки, тінь, і щоб виглядало приємно */
.card {
  background-color: #fff;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* Опціонально — щоб вміст всередині не виростав за межі */
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Темна тема */
[data-theme="dark"] {
  background-color: #111827;
  color: #f9fafb;
}

[data-theme="dark"] body {
  background-color: #111827;
  color: #f9fafb;
}

[data-theme="dark"] .card,
[data-theme="dark"] .modal-content,
[data-theme="dark"] .transactions-table th,
[data-theme="dark"] .transactions-table td {
  background-color: #1f2937;
  color: #f9fafb;
}

[data-theme="dark"] .app-header {
  background-color: #1f2937;
  box-shadow: none;
}

[data-theme="dark"] .btn-secondary {
  background-color: #374151;
  color: #f9fafb;
  border: 1px solid #6c7a8f;
}

[data-theme="dark"] h1,
[data-theme="dark"] h2,
[data-theme="dark"] h3,
[data-theme="dark"] p,
[data-theme="dark"] span,
[data-theme="dark"] label {
  color: #f3f4f6;
}

/* Рожева тема */
[data-theme="pink"] {
  background-color: #ffe4f0;
  color: #4a0033;
}

[data-theme="pink"] body {
  background-color: #ffe4f0;
  color: #4a0033;
}

[data-theme="pink"] .card,
[data-theme="pink"] .modal-content,
[data-theme="pink"] .transactions-table th,
[data-theme="pink"] .transactions-table td {
  background-color: #ffcce0;
  color: #4a0033;
}

[data-theme="pink"] .app-header {
  background-color: #ffb6d2;
  box-shadow: none;
}

[data-theme="pink"] .btn-secondary {
  background-color: #f48fb1;
  color: white;
  border: 1px solid #ec407a;
}

[data-theme="pink"] h1,
[data-theme="pink"] h2,
[data-theme="pink"] h3,
[data-theme="pink"] p,
[data-theme="pink"] span,
[data-theme="pink"] label {
  color: #4a0033;
}

[data-theme="pink"] .toggle-track {
  background-color: #f8bbd0;
}

[data-theme="pink"] .toggle-thumb {
  background-color: #880e4f;
}
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%; /* вирівнювання з іншими елементами в header */
}
.toggle-track-triple {
  display: flex;
  align-items: center;
  position: relative;
  width: 150px;
  height: 40px;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
  z-index: 0;
}

.toggle-option {
  flex: 1;
  text-align: center;
  z-index: 2;
  font-size: 18px;
  pointer-events: none;
}
.toggle-track-triple {
  display: flex;
  align-items: center;
  position: relative;
  width: 120px; /* раніше було 150px */
  height: 36px;  /* раніше 40px */
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

/* Рух залежно від теми */
.toggle-thumb-triple {
  position: absolute;
  top: 2px;
  width: 36px; /* зменшено */
  height: 32px; /* відповідно до нової висоти */
  background-color: white;
  border-radius: 9999px;
  transition: transform 0.3s ease;
  z-index: 1;
}

/* Адаптуємо позиції */
.toggle-thumb-triple.light {
  transform: translateX(2px);
}
.toggle-thumb-triple.dark {
  transform: translateX(42px); /* 36 + 4 (відступ) */
}
.toggle-thumb-triple.pink {
  transform: translateX(82px);
}

/* Темні теми — фон тоді трохи змінюється */
[data-theme="dark"] .toggle-track-triple {
  background-color: #4b5563;
}

[data-theme="pink"] .toggle-track-triple {
  background-color: #f8bbd0;
}

[data-theme="dark"] .toggle-thumb-triple {
  background-color: #f9fafb;
}

[data-theme="pink"] .toggle-thumb-triple {
  background-color: #880e4f;
}


/* Reset and base styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

/* App Container */
.app-container {
  min-height: 100vh;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 24px;
  width: 100%;
  max-width: 480px;
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

/* Main App Layout */
.main-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  height: 64px;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #10b981;
}

.user-menu {
  display: flex;
  align-items: center;
}

.btn-logout {
  margin-right: 16px;
  padding: 4px 12px;
  font-size: 14px;
  border-radius: 4px;
  background: none;
  border: none;
  color: #4b5563;
  cursor: pointer;
}

.btn-logout:hover {
  background-color: #f3f4f6;
}
.user-avatar {
  cursor: pointer;
  background: #444;
  color: white;
  padding: 10px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.token-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
}

.modal-buttons button {
  margin: 0 0.5rem;
}


/* Main Content */
.main-content {
  flex: 1;
  overflow: auto;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Tabs Navigation */
.tabs-navigation {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
  display: flex;
  overflow-x: auto;
}

.tab-button {
  padding: 16px 4px;
  margin-right: 32px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
}

.tab-button:hover {
  color: #4b5563;
  border-bottom-color: #d1d5db;
}

.tab-button.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

/* Cards */
.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 16px;
}

/* Capital Card */
.capital-card {
  margin-bottom: 24px;
}

.capital-amount {
  font-size: 32px;
  font-weight: bold;
  color: #10b981;
}

.capital-trend {
  margin-top: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.capital-trend.positive, .capital-amount.positive {
  color: #10b981;
}

.capital-trend.negative, .capital-amount.negative {
  color: #ef4444;
}

.trend-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

/* Section Titles */
.section-title {
  font-size: 18px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 16px;
}

/* Budget Categories */
.budget-categories {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .budget-categories {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .budget-categories {
    grid-template-columns: repeat(3, 1fr);
  }
}

.category-card {
  padding: 16px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-name {
  font-weight: 500;
}

.category-amount {
  font-size: 14px;
  color: #6b7280;
}

.progress-bar-bg {
  width: 100%;
  height: 10px;
  background-color: #e5e7eb;
  border-radius: 9999px;
  margin-bottom: 8px;
}

.progress-bar {
  height: 10px;
  border-radius: 9999px;
}

.progress-green {
  background-color: #10b981;
}

.progress-yellow {
  background-color: #f59e0b;
}

.progress-red {
  background-color: #ef4444;
}

.category-remaining {
  font-size: 14px;
  color: #6b7280;
}

/* Quick Transaction Form */
.quick-transaction-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .quick-transaction-form {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Analytics */
.analytics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-placeholder {
  height: 256px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 8px;
}

.chart-icon-container {
  display: flex;
  justify-content: center;
}

.chart-icon {
  width: 48px;
  height: 48px;
  stroke: #9ca3af;
  stroke-width: 2;
  fill: none;
}

.chart-placeholder-text {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

/* Transactions */
.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.transaction-filters {
  display: flex;
  gap: 8px;
}

.filter-button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  background-color: #e5e7eb;
  color: #4b5563;
  border: none;
  cursor: pointer;
}

.filter-button.active {
  background-color: #10b981;
  color: white;
}

.transactions-table-container {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th {
  padding: 12px 24px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  background-color: #f9fafb;
}

.transactions-table td {
  padding: 16px 24px;
  font-size: 14px;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
}

.amount-column {
  text-align: right;
}

.income-amount {
  color: #10b981;
}

.expense-amount {
  color: #ef4444;
}

/* Transaction Form */
.transaction-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .transaction-form {
    grid-template-columns: repeat(2, 1fr);
  }
}

.transaction-type-buttons {
  display: flex;
  gap: 8px;
}

.type-button {
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  background-color: #e5e7eb;
  color: #4b5563;
  border: none;
  cursor: pointer;
}

.type-button.active {
  background-color: #10b981;
  color: white;
}

/* Savings */
.savings-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .savings-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

.savings-amount {
  font-size: 32px;
  font-weight: bold;
  color: #10b981;
}

.savings-trend {
  margin-top: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.savings-trend.positive {
  color: #10b981;
}

.add-savings-form {
  display: flex;
  gap: 16px;
}

.add-savings-form input {
  flex: 1;
}

.savings-goals {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .savings-goals {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .savings-goals {
    grid-template-columns: repeat(3, 1fr);
  }
}

.savings-goal {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.goal-name {
  font-weight: 500;
}

.goal-progress {
  font-size: 14px;
  color: #6b7280;
}

.goal-details {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
}

.new-goal-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .new-goal-form {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Login */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 48px 16px;
}

.login-form-container {
  max-width: 400px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 30px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.login-form {
  margin-top: 32px;
  margin-bottom: 24px;
}

.login-inputs {
  margin-bottom: 24px;
}

.login-inputs .form-group:first-child input {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.login-inputs .form-group:last-child input {
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  height: 16px;
  width: 16px;
  margin-right: 8px;
}

.remember-me label {
  font-size: 14px;
  color: #111827;
}

.forgot-password a {
  font-size: 14px;
  color: #10b981;
  text-decoration: none;
}

.register-link {
  text-align: center;
}

.btn-link {
  background: none;
  border: none;
  color: #10b981;
  font-weight: 500;
  cursor: pointer;
}

/* Form Elements */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

input:focus, select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  font-size: 14px;
}

.btn-primary {
  background-color: #10b981;
  color: white;
}

.btn-primary:hover {
  background-color: #059669;
}

.btn-secondary {
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-full {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

.plus-icon {
  font-size: 24px;
}

.add-transaction-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.transaction-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.transaction-form-container {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

/* Analytics Filter */
.analytics-filter {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

.analytics-filter label {
  font-weight: 500;
}

/* Filters Container */
.filters-container {
  margin-bottom: 24px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-container {
  position: relative;
  height: 500px;
  width: 100%;
  flex-grow: 1;
}

/* Make the third chart (expense trend) span full width on larger screens */
@media (min-width: 768px) {
  .charts-grid .chart-card:nth-child(3) {
    grid-column: span 2;
  }
}
</style>