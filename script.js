/**
 * DailyTask – Smart To-Do & Productivity Tracker
 * Pure Vanilla JavaScript Implementation
 * 
 * Features:
 * - Deterministic daily motivational quote based on calendar date
 * - Real-time date and day updates
 * - User profile & goals with localStorage persistence
 * - Full CRUD tasks (Add, Edit, Delete with confirmation, Complete toggle)
 * - Intelligent deadline detection (Overdue, Due Today, Due Tomorrow, Upcoming)
 * - Real-time live search and multi-filtering (All, Completed, Pending, Priorities)
 * - Productivity dashboard (Total, Completed, Pending, Completion Rate %)
 * - Day-over-day productivity tracking & comparison (BETTER, GOOD, NEEDS IMPROVEMENT)
 * - Motivational completion toast feedback & canvas confetti
 * - Secure DOM manipulation (zero unsafe innerHTML injection of user text)
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & STORAGE KEYS
     ========================================================================== */
  const STORAGE_KEYS = {
    PROFILE: 'dailytask_profile',
    TASKS: 'dailytask_tasks',
    HISTORY: 'dailytask_history'
  };

  // Curated motivational quotes for daily inspiration
  const MOTIVATIONAL_QUOTES = [
    { text: "Small steps every day lead to big results.", author: "Productivity Wisdom" },
    { text: "Small progress is still progress.", author: "Daily Reminder" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Consistency is what transforms average into excellence.", author: "Anonymous" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.", author: "Leo Babauta" },
    { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
    { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
    { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
    { text: "One day or day one. You decide.", author: "Paulo Coelho" },
    { text: "Productivity is never an accident. It is always the result of commitment.", author: "Paul J. Meyer" },
    { text: "Make each day your masterpiece.", author: "John Wooden" },
    { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", author: "William Butler Yeats" },
    { text: "Nothing will work unless you do.", author: "Maya Angelou" }
  ];

  // Random encouraging feedback messages on task completion
  const COMPLETION_MESSAGES = [
    "Great job! One step closer to your goal.",
    "Keep going! You're making progress.",
    "Well done! Your consistency is building success.",
    "Excellent! Keep the momentum going.",
    "Fantastic effort! Every finished task counts.",
    "Boom! Another goal accomplished.",
    "Way to go! You're crushing your to-do list.",
    "Inspiring focus! Keep up the brilliant pace."
  ];

  /* ==========================================================================
     2. APPLICATION STATE
     ========================================================================== */
  let appState = {
    profile: {
      name: "Guest Planner",
      goal: "Organize my day and make steady progress!"
    },
    tasks: [],
    filter: "all",      // 'all' | 'completed' | 'pending' | 'high' | 'medium' | 'low'
    searchQuery: "",
    taskToDeleteId: null
  };

  /* ==========================================================================
     3. DOM ELEMENT REFERENCES
     ========================================================================== */
  const elements = {
    // Header & Date
    headerDay: document.getElementById('headerDay'),
    headerDate: document.getElementById('headerDate'),
    dailyQuoteText: document.getElementById('dailyQuoteText'),
    dailyQuoteAuthor: document.getElementById('dailyQuoteAuthor'),

    // Profile Elements
    profileNameDisplay: document.getElementById('profileNameDisplay'),
    profileGoalDisplay: document.getElementById('profileGoalDisplay'),
    openProfileModalBtn: document.getElementById('openProfileModalBtn'),
    profileModal: document.getElementById('profileModal'),
    profileForm: document.getElementById('profileForm'),
    profileNameInput: document.getElementById('profileNameInput'),
    profileGoalInput: document.getElementById('profileGoalInput'),
    closeProfileModalBtn: document.getElementById('closeProfileModalBtn'),
    cancelProfileBtn: document.getElementById('cancelProfileBtn'),

    // Dashboard Stats
    statTotal: document.getElementById('statTotal'),
    statCompleted: document.getElementById('statCompleted'),
    statPending: document.getElementById('statPending'),
    statRate: document.getElementById('statRate'),
    progressPercentageBadge: document.getElementById('progressPercentageBadge'),
    progressTrack: document.getElementById('progressTrack'),
    progressFill: document.getElementById('progressFill'),
    comparisonStatusPill: document.getElementById('comparisonStatusPill'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    comparisonMessageText: document.getElementById('comparisonMessageText'),

    // Add Task Form
    addTaskForm: document.getElementById('addTaskForm'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskPriorityInput: document.getElementById('taskPriorityInput'),
    taskDateInput: document.getElementById('taskDateInput'),
    taskTimeInput: document.getElementById('taskTimeInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    clearFormBtn: document.getElementById('clearFormBtn'),
    titleError: document.getElementById('titleError'),

    // Search & Filter
    taskSearchInput: document.getElementById('taskSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterBtns: document.querySelectorAll('.filter-btn'),

    // Task List & Containers
    tasksContainer: document.getElementById('tasksContainer'),
    tasksFoundCount: document.getElementById('tasksFoundCount'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateSubtitle: document.getElementById('emptyStateSubtitle'),

    // Edit Task Modal
    editTaskModal: document.getElementById('editTaskModal'),
    editTaskForm: document.getElementById('editTaskForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskTitleInput: document.getElementById('editTaskTitleInput'),
    editTaskPriorityInput: document.getElementById('editTaskPriorityInput'),
    editTaskDateInput: document.getElementById('editTaskDateInput'),
    editTaskTimeInput: document.getElementById('editTaskTimeInput'),
    editTaskDescInput: document.getElementById('editTaskDescInput'),
    editTitleError: document.getElementById('editTitleError'),
    closeEditTaskModalBtn: document.getElementById('closeEditTaskModalBtn'),
    cancelEditTaskBtn: document.getElementById('cancelEditTaskBtn'),

    // Delete Confirmation Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteTaskTitlePreview: document.getElementById('deleteTaskTitlePreview'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Toast & Canvas
    toastContainer: document.getElementById('toastContainer'),
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  /* ==========================================================================
     4. DATE UTILITIES & DAILY QUOTE ENGINE
     ========================================================================== */
  
  /**
   * Returns a standard YYYY-MM-DD string for a given Date object
   */
  function formatDateKey(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Initializes header date and day display
   */
  function updateCurrentDateDisplay() {
    const now = new Date();

    // Day of the week (e.g. "Saturday")
    const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
    // Formatted date (e.g. "12 September 2026")
    const dateFormatted = now.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (elements.headerDay) elements.headerDay.textContent = dayName;
    if (elements.headerDate) elements.headerDate.textContent = dateFormatted;

    // Set default min date for date inputs to today
    const todayKey = formatDateKey(now);
    if (elements.taskDateInput && !elements.taskDateInput.value) {
      elements.taskDateInput.value = todayKey;
    }
  }

  /**
   * Computes a deterministic daily quote based on the current calendar day.
   * Stays the same on reload throughout the day; updates on a new day.
   */
  function renderDailyQuote() {
    const now = new Date();
    // Deterministic hash based on year, month, and day
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Unique deterministic formula for day-of-year index
    const dateSeed = (year * 372) + (month * 31) + day;
    const quoteIndex = Math.abs(dateSeed) % MOTIVATIONAL_QUOTES.length;
    const chosenQuote = MOTIVATIONAL_QUOTES[quoteIndex];

    if (elements.dailyQuoteText) {
      elements.dailyQuoteText.textContent = `“${chosenQuote.text}”`;
    }
    if (elements.dailyQuoteAuthor) {
      elements.dailyQuoteAuthor.textContent = `– ${chosenQuote.author}`;
    }
  }

  /* ==========================================================================
     5. LOCAL STORAGE SYNC
     ========================================================================== */

  /**
   * Loads saved data from localStorage safely
   */
  function loadFromStorage() {
    try {
      // Profile
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile && typeof parsedProfile === 'object') {
          appState.profile = {
            name: parsedProfile.name || "Guest Planner",
            goal: parsedProfile.goal || "Organize my day and make steady progress!"
          };
        }
      }

      // Tasks
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) {
          appState.tasks = parsedTasks;
        }
      } else {
        // Provide starter tasks for immediate beginner-friendly demonstration
        appState.tasks = createDefaultTasks();
        saveTasksToStorage();
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
  }

  /**
   * Sample starter tasks so first-time visitors see a populated dashboard
   */
  function createDefaultTasks() {
    const now = new Date();
    const todayStr = formatDateKey(now);
    
    // Tomorrow date string
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = formatDateKey(tomorrow);

    return [
      {
        id: 'task_' + (Date.now() - 2000),
        title: "Complete Java Assignment",
        description: "Finish inheritance and polymorphism program with edge-case tests",
        dueDate: todayStr,
        dueTime: "20:00",
        priority: "high",
        completed: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: null
      },
      {
        id: 'task_' + (Date.now() - 1000),
        title: "Finish Project Report",
        description: "Draft executive summary, architecture diagram and conclusion",
        dueDate: todayStr,
        dueTime: "18:00",
        priority: "medium",
        completed: true,
        createdAt: new Date(Date.now() - 72000000).toISOString(),
        completedAt: new Date().toISOString()
      },
      {
        id: 'task_' + Date.now(),
        title: "Read Chapter 4 of Systems Design",
        description: "Study caching strategies, CDNs, and database partitioning",
        dueDate: tomorrowStr,
        dueTime: "11:00",
        priority: "low",
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      }
    ];
  }

  /**
   * Persists profile data
   */
  function saveProfileToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(appState.profile));
    } catch (e) {
      console.warn("Error saving profile to localStorage:", e);
    }
  }

  /**
   * Persists tasks data and updates daily productivity history
   */
  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(appState.tasks));
      recordTodayProductivitySnapshot();
    } catch (e) {
      console.warn("Error saving tasks to localStorage:", e);
    }
  }

  /**
   * Records today's completion rate snapshot in history table
   */
  function recordTodayProductivitySnapshot() {
    try {
      const todayKey = formatDateKey(new Date());
      let history = {};
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (storedHistory) {
        history = JSON.parse(storedHistory) || {};
      }

      const total = appState.tasks.length;
      const completed = appState.tasks.filter(t => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      history[todayKey] = {
        total,
        completed,
        rate,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn("Error updating productivity snapshot:", e);
    }
  }

  /* ==========================================================================
     6. DEADLINE EVALUATION LOGIC
     ========================================================================== */

  /**
   * Analyzes a task's due date and time against current time
   * Returns: { status: 'overdue'|'today'|'tomorrow'|'upcoming'|'none', label: string, className: string }
   */
  function calculateDeadlineStatus(task) {
    if (!task.dueDate) {
      return { status: 'none', label: 'No Deadline', className: 'badge-deadline-upcoming' };
    }

    const now = new Date();
    const todayKey = formatDateKey(now);

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = formatDateKey(tomorrow);

    const taskDateKey = task.dueDate;

    // Construct full deadline Date object for precise comparison
    let deadlineDate;
    if (task.dueTime) {
      deadlineDate = new Date(`${task.dueDate}T${task.dueTime}`);
    } else {
      // If no time is specified, deadline is considered end of that day (23:59:59)
      deadlineDate = new Date(`${task.dueDate}T23:59:59`);
    }

    const isPast = deadlineDate < now;

    // If past and not completed, mark as Overdue
    if (isPast && !task.completed) {
      return {
        status: 'overdue',
        label: 'Overdue',
        className: 'badge-deadline-overdue'
      };
    }

    if (taskDateKey === todayKey) {
      return {
        status: 'today',
        label: 'Due Today',
        className: 'badge-deadline-today'
      };
    }

    if (taskDateKey === tomorrowKey) {
      return {
        status: 'tomorrow',
        label: 'Due Tomorrow',
        className: 'badge-deadline-tomorrow'
      };
    }

    if (taskDateKey > todayKey) {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        className: 'badge-deadline-upcoming'
      };
    }

    // Default fallback
    return {
      status: 'upcoming',
      label: 'Upcoming',
      className: 'badge-deadline-upcoming'
    };
  }

  /**
   * Formats 24h time "18:30" into friendly 12h format "6:30 PM"
   */
  function formatFriendlyTime(timeStr) {
    if (!timeStr) return '';
    const [hoursStr, minsStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const mins = minsStr || '00';
    if (isNaN(hours)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be '12'
    return `${hours}:${mins} ${ampm}`;
  }

  /**
   * Formats YYYY-MM-DD into readable date (e.g. "12 Sep 2026")
   */
  function formatFriendlyDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ==========================================================================
     7. PRODUCTIVITY & PERFORMANCE COMPARISON
     ========================================================================== */

  /**
   * Updates all dashboard statistics cards, progress bar, and day-over-day status
   */
  function updateProductivityDashboard() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update numbers in DOM
    if (elements.statTotal) elements.statTotal.textContent = total;
    if (elements.statCompleted) elements.statCompleted.textContent = completed;
    if (elements.statPending) elements.statPending.textContent = pending;
    if (elements.statRate) elements.statRate.textContent = `${rate}%`;

    // Update Progress Bar
    if (elements.progressPercentageBadge) {
      elements.progressPercentageBadge.textContent = `${rate}%`;
    }
    if (elements.progressFill) {
      elements.progressFill.style.width = `${rate}%`;
    }
    if (elements.progressTrack) {
      elements.progressTrack.setAttribute('aria-valuenow', rate);
    }

    // Evaluate Day-Over-Day Performance Comparison
    evaluateDailyComparison(rate, total);
  }

  /**
   * Compares today's productivity percentage with yesterday's stored record
   */
  function evaluateDailyComparison(todayRate, totalTasks) {
    let history = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) history = JSON.parse(stored) || {};
    } catch (e) {
      console.warn("History parse error:", e);
    }

    // Determine yesterday's date key
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const yesterdayRecord = history[yesterdayKey];

    let status = "GOOD";
    let statusClass = "status-good";
    let dot = "🟢";
    let message = "Every day is a fresh start. Let's make today count!";

    if (totalTasks === 0) {
      status = "GOOD";
      statusClass = "status-good";
      dot = "🟢";
      message = "Start your day with purpose! Add your top tasks above.";
    } else if (yesterdayRecord !== undefined && typeof yesterdayRecord.rate === 'number') {
      const diff = todayRate - yesterdayRecord.rate;

      if (diff > 5) {
        // Today is meaningfully higher
        status = "BETTER";
        statusClass = "status-better";
        dot = "🟡";
        message = `You're doing better than yesterday (${yesterdayRecord.rate}%)! Keep going!`;
      } else if (diff < -10 && todayRate < 50) {
        // Noticeably lower
        status = "NEEDS IMPROVEMENT";
        statusClass = "status-needs-improvement";
        dot = "🔴";
        message = "Every day has opportunities. Take on one task at a time to build momentum!";
      } else {
        // Comparable or solid rate
        status = "GOOD";
        statusClass = "status-good";
        dot = "🟢";
        message = "Consistent progress builds excellence! You are on a solid path.";
      }
    } else {
      // First day tracking or no yesterday record
      if (todayRate >= 75) {
        status = "BETTER";
        statusClass = "status-better";
        dot = "🟡";
        message = "Outstanding progress today! You're operating at peak efficiency.";
      } else if (todayRate > 0) {
        status = "GOOD";
        statusClass = "status-good";
        dot = "🟢";
        message = "Great start today! Keep ticking off those goals.";
      } else {
        status = "GOOD";
        statusClass = "status-good";
        dot = "🟢";
        message = "A fresh day ahead. Select a task and take your first step!";
      }
    }

    // Apply updates to DOM
    if (elements.comparisonStatusPill) {
      elements.comparisonStatusPill.className = `comparison-status-pill ${statusClass}`;
    }
    if (elements.statusDot) elements.statusDot.textContent = dot;
    if (elements.statusText) elements.statusText.textContent = status;
    if (elements.comparisonMessageText) elements.comparisonMessageText.textContent = message;
  }

  /* ==========================================================================
     8. TOAST NOTIFICATIONS & CONFETTI CELEBRATION
     ========================================================================== */

  /**
   * Displays non-intrusive motivational feedback toast
   */
  function showMotivationalToast(customMessage) {
    if (!elements.toastContainer) return;

    const message = customMessage || COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = '🌟';

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(msgSpan);

    elements.toastContainer.appendChild(toast);

    // Auto-remove after animation completes
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  /**
   * Pure Vanilla HTML5 Canvas Confetti Effect (100% offline, lightweight)
   */
  function triggerCelebrationConfetti() {
    const canvas = elements.confettiCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = 45;
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2 + (Math.random() * 200 - 100),
        y: height * 0.4 + (Math.random() * 100 - 50),
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleInc: (Math.random() * 0.07) + 0.05,
        tiltAngle: 0,
        speedX: Math.random() * 6 - 3,
        speedY: Math.random() * -5 - 2,
        gravity: 0.18,
        opacity: 1
      });
    }

    let animationFrame;
    const startTime = Date.now();

    function renderConfetti() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleInc;
        p.speedY += p.gravity;
        p.x += p.speedX;
        p.y += p.speedY;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      });

      // Fade out over 2 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed > 1200) {
        particles.forEach(p => p.opacity = Math.max(0, p.opacity - 0.03));
      }

      if (elapsed < 2400) {
        animationFrame = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, width, height);
        cancelAnimationFrame(animationFrame);
      }
    }

    renderConfetti();
  }

  /* ==========================================================================
     9. SAFE TASK CARD RENDERING (Zero unsafe innerHTML)
     ========================================================================== */

  /**
   * Filters and renders tasks according to current filter and search query
   */
  function renderTaskList() {
    if (!elements.tasksContainer) return;

    // Filter tasks
    const query = appState.searchQuery.trim().toLowerCase();

    const filteredTasks = appState.tasks.filter((task) => {
      // Search matching
      const matchesSearch = !query || 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Status/Priority filter matching
      switch (appState.filter) {
        case 'completed':
          return task.completed === true;
        case 'pending':
          return task.completed === false;
        case 'high':
          return task.priority === 'high';
        case 'medium':
          return task.priority === 'medium';
        case 'low':
          return task.priority === 'low';
        case 'all':
        default:
          return true;
      }
    });

    // Update count badge
    if (elements.tasksFoundCount) {
      elements.tasksFoundCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;
    }

    // Clear existing container safely
    while (elements.tasksContainer.firstChild) {
      elements.tasksContainer.removeChild(elements.tasksContainer.firstChild);
    }

    // Handle empty state
    if (filteredTasks.length === 0) {
      if (elements.emptyState) elements.emptyState.style.display = 'block';
      if (query) {
        if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = "No matching tasks";
        if (elements.emptyStateSubtitle) elements.emptyStateSubtitle.textContent = `No tasks found matching "${query}". Try clear search.`;
      } else if (appState.filter !== 'all') {
        if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = "No tasks in this category";
        if (elements.emptyStateSubtitle) elements.emptyStateSubtitle.textContent = `No tasks matching the "${appState.filter}" filter.`;
      } else {
        if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = "Your task list is empty";
        if (elements.emptyStateSubtitle) elements.emptyStateSubtitle.textContent = "Add your first task above to start organizing your day!";
      }
      return;
    }

    if (elements.emptyState) elements.emptyState.style.display = 'none';

    // Build task cards using safe DOM methods
    filteredTasks.forEach((task) => {
      const card = createTaskCardElement(task);
      elements.tasksContainer.appendChild(card);
    });
  }

  /**
   * Constructs a single task card DOM node using strict DOM methods to prevent XSS
   */
  function createTaskCardElement(task) {
    const card = document.createElement('article');
    card.className = `task-card ${task.completed ? 'is-completed' : ''}`;
    card.setAttribute('data-task-id', task.id);

    // Main Row
    const mainRow = document.createElement('div');
    mainRow.className = 'task-card-main';

    // 1. Checkbox wrap
    const checkWrap = document.createElement('div');
    checkWrap.className = 'task-checkbox-wrap';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = !!task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`);
    checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

    checkWrap.appendChild(checkbox);

    // 2. Task Content Container
    const content = document.createElement('div');
    content.className = 'task-content';

    // Task Title
    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title; // Safe textContent avoids XSS
    content.appendChild(title);

    // Task Description (optional)
    if (task.description && task.description.trim() !== '') {
      const desc = document.createElement('p');
      desc.className = 'task-description';
      desc.textContent = task.description; // Safe textContent avoids XSS
      content.appendChild(desc);
    }

    // Metadata Row
    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta-row';

    // Date display
    if (task.dueDate) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'meta-item';
      dateSpan.textContent = `📅 ${formatFriendlyDate(task.dueDate)}`;
      metaRow.appendChild(dateSpan);
    }

    // Deadline time display
    if (task.dueTime) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'meta-item';
      timeSpan.textContent = `⏰ ${formatFriendlyTime(task.dueTime)}`;
      metaRow.appendChild(timeSpan);
    }

    // Priority badge
    const priorityBadge = document.createElement('span');
    const prio = task.priority || 'medium';
    priorityBadge.className = `badge badge-priority-${prio}`;
    priorityBadge.textContent = `⭐ ${prio.charAt(0).toUpperCase() + prio.slice(1)}`;
    metaRow.appendChild(priorityBadge);

    // Deadline Status badge (Overdue, Due Today, Due Tomorrow, Upcoming)
    const deadlineInfo = calculateDeadlineStatus(task);
    if (deadlineInfo.status !== 'none') {
      const deadlineBadge = document.createElement('span');
      deadlineBadge.className = `badge ${deadlineInfo.className}`;
      deadlineBadge.textContent = deadlineInfo.label;
      metaRow.appendChild(deadlineBadge);
    }

    content.appendChild(metaRow);

    // 3. Actions Row (Edit & Delete buttons)
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn action-btn-edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      <span>Edit</span>
    `;
    editBtn.addEventListener('click', () => openEditTaskModal(task.id));

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-btn action-btn-delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      <span>Delete</span>
    `;
    deleteBtn.addEventListener('click', () => openDeleteModal(task.id, task.title));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // Assemble Card
    mainRow.appendChild(checkWrap);
    mainRow.appendChild(content);
    mainRow.appendChild(actions);

    card.appendChild(mainRow);
    return card;
  }

  /* ==========================================================================
     10. TASK ACTIONS (ADD, TOGGLE, EDIT, DELETE)
     ========================================================================== */

  /**
   * Handles adding a new task from the form
   */
  function handleAddTaskSubmit(e) {
    e.preventDefault();

    const titleInput = elements.taskTitleInput;
    const titleVal = titleInput.value.trim();

    // Input validation
    if (!titleVal) {
      if (elements.titleError) elements.titleError.textContent = "Please enter a task name.";
      titleInput.focus();
      return;
    }

    if (elements.titleError) elements.titleError.textContent = "";

    const newTask = {
      id: 'task_' + Date.now(),
      title: titleVal,
      description: elements.taskDescInput.value.trim(),
      dueDate: elements.taskDateInput.value || "",
      dueTime: elements.taskTimeInput.value || "",
      priority: elements.taskPriorityInput.value || "medium",
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    // Prepend to list
    appState.tasks.unshift(newTask);
    saveTasksToStorage();

    // Clear form
    elements.taskTitleInput.value = "";
    elements.taskDescInput.value = "";
    elements.taskPriorityInput.value = "medium";
    // Keep today's date selected for quick sequential adds
    elements.taskTimeInput.value = "";

    // Refresh UI
    updateProductivityDashboard();
    renderTaskList();

    showMotivationalToast(`Added "${newTask.title}" to your tasks!`);
  }

  /**
   * Toggles completion status of a task
   */
  function toggleTaskCompletion(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    saveTasksToStorage();
    updateProductivityDashboard();
    renderTaskList();

    if (task.completed) {
      showMotivationalToast();
      
      // If all tasks are completed, trigger grand celebration
      const allCompleted = appState.tasks.length > 0 && appState.tasks.every(t => t.completed);
      if (allCompleted) {
        setTimeout(() => {
          showMotivationalToast("🎉 Incredible! You completed all tasks today!");
        }, 1500);
      }
      triggerCelebrationConfetti();
    }
  }

  /**
   * Opens the Edit Task Modal with prepopulated values
   */
  function openEditTaskModal(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;

    elements.editTaskId.value = task.id;
    elements.editTaskTitleInput.value = task.title;
    elements.editTaskPriorityInput.value = task.priority || "medium";
    elements.editTaskDateInput.value = task.dueDate || "";
    elements.editTaskTimeInput.value = task.dueTime || "";
    elements.editTaskDescInput.value = task.description || "";
    if (elements.editTitleError) elements.editTitleError.textContent = "";

    elements.editTaskModal.style.display = 'flex';
    elements.editTaskTitleInput.focus();
  }

  /**
   * Closes the Edit Task Modal
   */
  function closeEditTaskModal() {
    elements.editTaskModal.style.display = 'none';
  }

  /**
   * Handles submission of edited task
   */
  function handleEditTaskSubmit(e) {
    e.preventDefault();

    const taskId = elements.editTaskId.value;
    const titleVal = elements.editTaskTitleInput.value.trim();

    if (!titleVal) {
      if (elements.editTitleError) elements.editTitleError.textContent = "Task name cannot be empty.";
      elements.editTaskTitleInput.focus();
      return;
    }

    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = titleVal;
      task.priority = elements.editTaskPriorityInput.value;
      task.dueDate = elements.editTaskDateInput.value;
      task.dueTime = elements.editTaskTimeInput.value;
      task.description = elements.editTaskDescInput.value.trim();

      saveTasksToStorage();
      updateProductivityDashboard();
      renderTaskList();
      closeEditTaskModal();
      showMotivationalToast(`Updated "${task.title}".`);
    }
  }

  /**
   * Opens delete confirmation modal
   */
  function openDeleteModal(taskId, taskTitle) {
    appState.taskToDeleteId = taskId;
    if (elements.deleteTaskTitlePreview) {
      elements.deleteTaskTitlePreview.textContent = `"${taskTitle}"`;
    }
    elements.deleteModal.style.display = 'flex';
    elements.confirmDeleteBtn.focus();
  }

  /**
   * Closes delete confirmation modal safely
   */
  function closeDeleteModal() {
    appState.taskToDeleteId = null;
    elements.deleteModal.style.display = 'none';
  }

  /**
   * Executes deletion after user confirmation
   */
  function handleConfirmDelete() {
    if (!appState.taskToDeleteId) return;

    const task = appState.tasks.find(t => t.id === appState.taskToDeleteId);
    const title = task ? task.title : 'Task';

    appState.tasks = appState.tasks.filter(t => t.id !== appState.taskToDeleteId);
    saveTasksToStorage();

    closeDeleteModal();
    updateProductivityDashboard();
    renderTaskList();

    showMotivationalToast(`Deleted "${title}".`);
  }

  /* ==========================================================================
     11. PROFILE MANAGEMENT
     ========================================================================== */

  /**
   * Updates profile information displayed on the page
   */
  function renderProfile() {
    if (elements.profileNameDisplay) {
      elements.profileNameDisplay.textContent = appState.profile.name || "Guest Planner";
    }
    if (elements.profileGoalDisplay) {
      elements.profileGoalDisplay.textContent = appState.profile.goal || "Make steady progress today!";
    }
  }

  function openProfileModal() {
    elements.profileNameInput.value = appState.profile.name || "";
    elements.profileGoalInput.value = appState.profile.goal || "";
    elements.profileModal.style.display = 'flex';
    elements.profileNameInput.focus();
  }

  function closeProfileModal() {
    elements.profileModal.style.display = 'none';
  }

  function handleProfileSubmit(e) {
    e.preventDefault();

    const nameVal = elements.profileNameInput.value.trim();
    const goalVal = elements.profileGoalInput.value.trim();

    appState.profile.name = nameVal || "Guest Planner";
    appState.profile.goal = goalVal || "Make steady progress today!";

    saveProfileToStorage();
    renderProfile();
    closeProfileModal();
    showMotivationalToast("Profile updated successfully!");
  }

  /* ==========================================================================
     12. SEARCH & FILTER EVENT HANDLERS
     ========================================================================== */

  function setupFiltersAndSearch() {
    // Filter buttons click
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.filter = btn.getAttribute('data-filter') || 'all';
        renderTaskList();
      });
    });

    // Real-time search
    if (elements.taskSearchInput) {
      elements.taskSearchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        if (elements.clearSearchBtn) {
          elements.clearSearchBtn.style.display = appState.searchQuery ? 'block' : 'none';
        }
        renderTaskList();
      });
    }

    // Clear search button
    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.addEventListener('click', () => {
        if (elements.taskSearchInput) {
          elements.taskSearchInput.value = '';
          appState.searchQuery = '';
          elements.clearSearchBtn.style.display = 'none';
          elements.taskSearchInput.focus();
          renderTaskList();
        }
      });
    }

    // Clear Form button
    if (elements.clearFormBtn) {
      elements.clearFormBtn.addEventListener('click', () => {
        elements.addTaskForm.reset();
        updateCurrentDateDisplay();
        if (elements.titleError) elements.titleError.textContent = "";
      });
    }
  }

  /* ==========================================================================
     13. MODAL BACKDROP & KEYBOARD ACCESSIBILITY
     ========================================================================== */

  function setupModals() {
    // Profile Modal
    elements.openProfileModalBtn.addEventListener('click', openProfileModal);
    elements.closeProfileModalBtn.addEventListener('click', closeProfileModal);
    elements.cancelProfileBtn.addEventListener('click', closeProfileModal);
    elements.profileForm.addEventListener('submit', handleProfileSubmit);

    // Edit Task Modal
    elements.closeEditTaskModalBtn.addEventListener('click', closeEditTaskModal);
    elements.cancelEditTaskBtn.addEventListener('click', closeEditTaskModal);
    elements.editTaskForm.addEventListener('submit', handleEditTaskSubmit);

    // Delete Modal
    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    // Close modal on outside click
    [elements.profileModal, elements.editTaskModal, elements.deleteModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          if (modal === elements.deleteModal) appState.taskToDeleteId = null;
        }
      });
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProfileModal();
        closeEditTaskModal();
        closeDeleteModal();
      }
    });
  }

  /* ==========================================================================
     14. APP INITIALIZATION
     ========================================================================== */

  function initApp() {
    // 1. Render date and deterministic daily quote
    updateCurrentDateDisplay();
    renderDailyQuote();

    // 2. Load stored data
    loadFromStorage();
    renderProfile();

    // 3. Connect forms and inputs
    elements.addTaskForm.addEventListener('submit', handleAddTaskSubmit);
    setupFiltersAndSearch();
    setupModals();

    // 4. Render dashboard stats and task cards
    updateProductivityDashboard();
    renderTaskList();

    // Periodic check to keep current time and day fresh if tab is left open
    setInterval(updateCurrentDateDisplay, 60000);
  }

  // Launch when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
