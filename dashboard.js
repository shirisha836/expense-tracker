/* dashboard.js - Xpenza
   Features:
   - Add / Edit / Delete expenses
   - Persist per-user expenses in localStorage (key: xpenza_expenses_<email>)
   - Update Chart.js donut with neon colors + center text
   - Stats: total month / today / budget left
   - Count-up animation for stats
*/

const expenseName = document.getElementById('expense-name');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('exportBtn');
const expenseList = document.getElementById('expense-list');
const totalEl = document.getElementById('total');
const statMonth = document.getElementById('stat-month');
const statToday = document.getElementById('stat-today');
const statTop = document.getElementById('stat-top');
const statBudget = document.getElementById('stat-budget');
const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget');
const budgetWarning = document.getElementById('budget-warning');

if (!localStorage.getItem('isLoggedIn') || localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'login.html';
}

const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || 'null');
if (!loggedUser) window.location.href = 'login.html';
const userKey = 'xpenza_expenses_' + loggedUser.email;
let expenses = JSON.parse(localStorage.getItem(userKey) || '[]');
let editIndex = -1;
let currentBudget = Number(localStorage.getItem('xpenza_budget_' + loggedUser.email) || 0);

// Category icons map
const catIcon = {
  Food: '🍽️',
  Travel: '🚗',
  Shopping: '🛍️',
  Bills: '💡',
  Other: '✨'
};

// Neon palette (accent A compatible)
const neonColors = {
  Food: '#18d2d6',
  Travel: '#7f8bd3',
  Shopping: '#ff2f92',
  Bills: '#4aa5df',
  Other: '#ff2f92'
};

// CHART SETUP
const ctx = document.getElementById('expenseChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Food','Travel','Shopping','Bills','Other'],
    datasets: [{
      data: [0,0,0,0,0],
      backgroundColor: [neonColors.Food, neonColors.Travel, neonColors.Shopping, neonColors.Bills, neonColors.Other],
      borderColor: '#0b0610',
      borderWidth: 6
    }]
  },
  options: {
    cutout: '62%',
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#efeaff' } },
      tooltip: { bodyColor: '#fff', titleColor: '#fff', backgroundColor: '#0d0716' }
    }
  },
  plugins: [{
    id: 'centerText',
    beforeDraw(chartInstance) {
      const {ctx, chartArea: {left, right, top, bottom, width, height}} = chartInstance;
      ctx.save();
      ctx.fillStyle = '#efeaff';
      ctx.font = '600 20px Poppins';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const total = chartInstance.data.datasets[0].data.reduce((a,b)=>a+(b||0),0);
      ctx.fillText('₹' + Number(total).toFixed(2), left + width/2, top + height/2);
      ctx.restore();
    }
  }]
});

// UTIL: format date
function formatDateISO(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// UTIL: save
function saveExpenses() {
  localStorage.setItem(userKey, JSON.stringify(expenses));
  renderAll();
}

// RENDER EXPENSE LIST
function renderList() {
  expenseList.innerHTML = '';

  expenses.forEach((e, i) => {
    const li = document.createElement('li');
    li.className = 'expense-item';

    const dateText = e.date ? formatDateISO(e.date) : '';
    const icon = catIcon[e.category] || '✨';

    li.innerHTML = `
      <div class="exp-meta" style="display:flex; gap:14px; align-items:center">
        <div style="
          width:48px;
          height:48px;
          border-radius:12px;
          background:rgba(255,255,255,0.04);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:22px;">
          ${icon}
        </div>

        <div>
          <div class="exp-name">${escapeHtml(e.name)}</div>
          <div class="exp-info">${escapeHtml(e.category)} • ${dateText}</div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:14px">
        <div style="font-weight:700; font-size:15px;">₹${Number(e.amount).toFixed(2)}</div>

        <div class="expense-controls">
          <button class="btn btn-edit small" onclick="startEdit(${i})">Edit</button>
          <button class="btn btn-delete small" onclick="removeExpense(${i})">Delete</button>
        </div>
      </div>
    `;

    expenseList.appendChild(li);
  });
}

// ESCAPE HTML helper
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// UPDATE CHART
function updateChart() {
  const totals = {Food:0,Travel:0,Shopping:0,Bills:0,Other:0};
  expenses.forEach(e => totals[e.category] = (totals[e.category]||0) + Number(e.amount || 0));
  const data = [totals.Food, totals.Travel, totals.Shopping, totals.Bills, totals.Other];
  chart.data.datasets[0].data = data;
  chart.update();
  return data;
}

// UPDATE STATS (totals)
function updateStats() {
  const total = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const today = expenses.filter(e => {
    const d = new Date(e.date || e.createdAt||Date.now());
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).reduce((s,e)=>s+Number(e.amount||0),0);

  const totalsByCategory = {};
  expenses.forEach(e => { totalsByCategory[e.category] = (totalsByCategory[e.category]||0) + Number(e.amount||0); });
  const topCategory = Object.keys(totalsByCategory).length ? Object.entries(totalsByCategory).sort((a,b)=>b[1]-a[1])[0][0] : '—';

  // animate counts
  animateValue(statMonth, Number(statMonth.dataset.val||0), total, 700, '₹', (v)=> statMonth.dataset.val = v);
  animateValue(statToday, Number(statToday.dataset.val||0), today, 700, '₹', (v)=> statToday.dataset.val = v);
  statTop.textContent = topCategory;
  currentBudget = Number(localStorage.getItem('xpenza_budget_' + loggedUser.email) || 0);
  const budgetLeft = currentBudget - total;
  animateValue(statBudget, Number(statBudget.dataset.val||0), (budgetLeft>0?budgetLeft:0), 700, '₹', (v)=> statBudget.dataset.val = v);
  totalEl.textContent = '₹' + Number(total).toFixed(2);
  // budget warning
  if (currentBudget && total > currentBudget) {
    budgetWarning.textContent = 'You exceeded the budget!';
  } else {
    budgetWarning.textContent = '';
  }
}

// small count animation
function animateValue(el, start, end, duration=800, prefix='', callback) {
  start = Number(start)||0; end = Number(end)||0;
  const range = end - start;
  const startTime = performance.now();
  function step(now){
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1-progress,3);
    const value = start + (range * ease);
    el.textContent = (prefix||'') + Number(value).toFixed(2);
    if (callback) callback(Number(value).toFixed(2));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ADD / SAVE
addBtn.addEventListener('click', (e) => {
  const name = expenseName.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;
  if (!name || isNaN(amount) || amount <= 0) { alert('Enter valid values'); return; }

  if (editIndex > -1) {
    // save changes
    expenses[editIndex].name = name;
    expenses[editIndex].amount = amount;
    expenses[editIndex].category = category;
    expenses[editIndex].date = new Date().toISOString();
    editIndex = -1;
    addBtn.textContent = 'Add Expense';
    addBtn.classList.remove('btn--save');
  } else {
    // new expense
    const item = { name, amount: amount.toFixed(2), category, date: new Date().toISOString(), createdAt: Date.now() };
    expenses.unshift(item);
  }
  expenseName.value=''; expenseAmount.value=''; expenseCategory.value='Food';
  saveExpenses();
});

// start edit flow
window.startEdit = function(index) {
  const e = expenses[index];
  editIndex = index;
  expenseName.value = e.name;
  expenseAmount.value = Number(e.amount).toFixed(2);
  expenseCategory.value = e.category;
  addBtn.textContent = 'Save Changes';
  // add a subtle visual cue
  addBtn.classList.add('btn--save');
  expenseName.focus();
};

// remove
window.removeExpense = function(i) {
  if (!confirm('Delete this expense?')) return;
  expenses.splice(i,1);
  saveExpenses();
};

// clear all
clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all expenses?')) return;
  expenses = [];
  saveExpenses();
});

// export CSV
exportBtn.addEventListener('click', () => {
  const header = ['Name','Amount','Category','Date'];
  const rows = expenses.map(e => [e.name, e.amount, e.category, e.date || e.createdAt]);
  const csv = [header, ...rows].map(r => r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `xpenza_expenses_${loggedUser.email}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// budget
setBudgetBtn.addEventListener('click', () => {
  const v = Number(budgetInput.value);
  if (isNaN(v) || v < 0) { alert('Enter valid budget'); return; }
  currentBudget = v;
  localStorage.setItem('xpenza_budget_' + loggedUser.email, String(v));
  updateStats();
});

// render everything
function renderAll() {
  renderList();
  updateChart();
  updateStats();
}
renderAll();

// small helper: re-render when window focus (in case storage changed)
window.addEventListener('focus', renderAll);


