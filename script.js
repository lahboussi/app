/* script.js
   Updated to:
   1) Evaluate req7 inputs (جيد / سيء) and set varGood / varBad
   2) New monthly average formula and adjustment by varGood/varBad
   3) Preserve save/load/autosave behaviour
*/

/* ---------- Configuration ---------- */
/* coefficients for Required1..Required5 */
const COEFFICIENTS = [5,7,1,2,5]; // sum used where needed
const DAYS = ['السّبت','الأحد','الإثنين','الثّلاثاء','الأربعاء','الخميس'];
const NUM_REQUIRED = 5;
const requiredNames = [' الحفظ و التّلخيص','المراجعة','حفظ المتن و الحديث','مراجعة المتن','السّلوك'];


/* element refs */
const weeksContainer = document.getElementById('weeks');
const req6Input = document.getElementById('req6_mark');
const req7Inputs = Array.from(document.querySelectorAll('input[data-req7]'));
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');
const studentNameInput = document.getElementById('studentName');
const monthNameInput = document.getElementById('monthName');
const teacherNameInput = document.getElementById('teacherName');
const weekAveragesDisplay = document.getElementById('weekAveragesDisplay');
const monthlyAvgDisplay = document.getElementById('monthlyAvgDisplay');
const calcAllWeeksBtn = document.getElementById('calcAllWeeks');
const calcMonthlyBtn = document.getElementById('calcMonthly');

const STORAGE_KEY = 'student_ave_current_v1';

/* ---------- State for req7 evaluation ---------- */
let varGood = false; // true if all req7 are "جيد"
let varBad = false;  // true if any req7 contains "سيء"

/* ---------- Build 4 week tables ---------- */
for (let w = 1; w <= 4; w++) {
  weeksContainer.appendChild(buildWeekTable(w));
}

function buildWeekTable(weekIndex) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `week-card-${weekIndex}`;

  const h = document.createElement('h3');
  h.textContent = `الأسبوع ${weekIndex}`;
  card.appendChild(h);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');

  const th1 = document.createElement('th');
  th1.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;">
                     <div><strong>الأيام</strong></div>
                     <div style="font-size:12px;color:rgba(0,0,0,0.6)">المطلوب</div>
                   </div>`;
  hrow.appendChild(th1);

  for (let r = 0; r < requiredNames.length; r++) {
    const th = document.createElement('th');
    th.textContent = requiredNames[r];
    hrow.appendChild(th);
  }
  thead.appendChild(hrow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
    const tr = document.createElement('tr');
    // const tdDay = document.createElement('td');
    // tdDay.textContent = DAYS[dayIndex];
    // tr.appendChild(tdDay);

    const tdDay = document.createElement('td');
tdDay.style.position = 'relative';

/* Day text */
const dayLabel = document.createElement('span');
dayLabel.textContent = DAYS[dayIndex];

/* Comment icon */
const icon = document.createElement('span');
icon.textContent = '🗨️';
icon.className = 'day-comment-icon';

/* Bubble */
const bubble = document.createElement('div');
bubble.className = 'comment-bubble';

const textarea = document.createElement('textarea');
textarea.placeholder = 'اكتب ملاحظة اليوم...';
textarea.dataset.week = weekIndex;
textarea.dataset.day = dayIndex;

/* Save on input */
textarea.addEventListener('input', autosaveToLocal);

bubble.appendChild(textarea);

/* Toggle bubble */
icon.addEventListener('click', (e) => {
  e.stopPropagation();
  bubble.style.display = bubble.style.display === 'block' ? 'none' : 'block';
});

/* Close when clicking outside */
document.addEventListener('click', () => {
  bubble.style.display = 'none';
});

tdDay.appendChild(icon);
tdDay.appendChild(dayLabel);
tdDay.appendChild(bubble);
tr.appendChild(tdDay);


    for (let col = 1; col <= NUM_REQUIRED; col++) {
      const td = document.createElement('td');

      // black cell: Thursday & required3
      if (dayIndex === 5 && col === 3) {
        td.className = 'black-cell';
        td.innerHTML = '';
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.min = 0;
        input.className = 'input-cell';
        input.dataset.week = weekIndex;
        input.dataset.day = dayIndex;
        input.dataset.req = col;
        input.addEventListener('input', handleInputChange);
        td.appendChild(input);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // coefficients row
  const trCoef = document.createElement('tr');
  const tdCoefLabel = document.createElement('td');
  tdCoefLabel.textContent = 'المعاملات';
  tdCoefLabel.className = 'coef-cell';
  trCoef.appendChild(tdCoefLabel);

  for (let i = 0; i < NUM_REQUIRED; i++) {
    const td = document.createElement('td');
    td.className = 'coef-cell';
    td.textContent = COEFFICIENTS[i];
    td.dataset.coef = COEFFICIENTS[i];
    trCoef.appendChild(td);
  }
  tbody.appendChild(trCoef);

  // averages row
  const trAvg = document.createElement('tr');
  const tdAvgLabel = document.createElement('td');
  tdAvgLabel.textContent = 'المجموع';
  tdAvgLabel.className = 'avg-cell';
  trAvg.appendChild(tdAvgLabel);

  for (let req = 1; req <= NUM_REQUIRED; req++) {
    const td = document.createElement('td');
    td.className = 'avg-cell';
    const span = document.createElement('span');
    span.id = `week${weekIndex}-avg-req${req}`;
    span.textContent = '-';
    td.appendChild(span);
    trAvg.appendChild(td);
  }
  tbody.appendChild(trAvg);

  table.appendChild(tbody);
  card.appendChild(table);

  const btn = document.createElement('button');
  btn.textContent = `حساب معدّل الأسبوع  ${weekIndex} `;
  btn.addEventListener('click', () => {
    const avg = calculateWeekAverage(weekIndex);
    let display = card.querySelector('.week-average-display');
    if (!display) {
      display = document.createElement('div');
      display.className = 'week-average-display';
      display.style.marginTop = '8px';
      display.style.fontWeight = '700';
      card.appendChild(display);
    }
    display.textContent = `Week ${weekIndex} average: ${isNaN(avg) ? '-' : avg.toFixed(2)}`;
    updateWeekAveragesDisplay();
    autosaveToLocal();
  });
  card.appendChild(btn);

  return card;
}

/* ---------- Week navigation (show one week at a time) ---------- */
let currentWeek = 1;
const totalWeeks = 4;

// hide all weeks and show current
for (let w = 1; w <= totalWeeks; w++) {
  const card = document.getElementById(`week-card-${w}`);
  if (card) card.style.display = 'none';
}
const firstCard = document.getElementById(`week-card-${currentWeek}`);
if (firstCard) firstCard.style.display = 'block';
const currentWeekLabelEl = document.getElementById('currentWeekLabel');
if (currentWeekLabelEl) currentWeekLabelEl.textContent = `الأسبوع ${currentWeek}`;

const prevBtn = document.getElementById('prevWeekBtn');
const nextBtn = document.getElementById('nextWeekBtn');
if (prevBtn) prevBtn.addEventListener('click', () => {
  if (currentWeek > 1) {
    const prevCard = document.getElementById(`week-card-${currentWeek}`);
    if (prevCard) prevCard.style.display = 'none';
    currentWeek--;
    const newCard = document.getElementById(`week-card-${currentWeek}`);
    if (newCard) newCard.style.display = 'block';
    if (currentWeekLabelEl) currentWeekLabelEl.textContent = `الأسبوع ${currentWeek}`;
  }
});
if (nextBtn) nextBtn.addEventListener('click', () => {
  if (currentWeek < totalWeeks) {
    const prevCard = document.getElementById(`week-card-${currentWeek}`);
    if (prevCard) prevCard.style.display = 'none';
    currentWeek++;
    const newCard = document.getElementById(`week-card-${currentWeek}`);
    if (newCard) newCard.style.display = 'block';
    if (currentWeekLabelEl) currentWeekLabelEl.textContent = `الأسبوع ${currentWeek}`;
  }
});

/* ---------- Event handlers ---------- */
function handleInputChange() {
  autosaveToLocal();
}

/* ---------- Calculation functions ---------- */

function calculateWeekAverage(weekIndex) {
  const perReqAverages = [];
  for (let req = 1; req <= NUM_REQUIRED; req++) {
    let sumMarks = 0;
    for (let day = 0; day < DAYS.length; day++) {
      if (day === 5 && req === 3) continue;
      const input = document.querySelector(`input[data-week="${weekIndex}"][data-day="${day}"][data-req="${req}"]`);
      const val = input && input.value !== '' ? parseFloat(input.value) : 0;
      sumMarks += isNaN(val) ? 0 : val;
    }
    const coef = COEFFICIENTS[req-1];
    const denom = (req === 3) ? 5 : 6;
    const avgVal = (sumMarks * coef) / denom;
    perReqAverages.push(avgVal);
    const span = document.getElementById(`week${weekIndex}-avg-req${req}`);
    if (span) span.textContent = isNaN(avgVal) ? '-' : avgVal.toFixed(2);
  }

  const numerator = perReqAverages.reduce((a,b) => a+b, 0);
  const denomTotal = COEFFICIENTS.reduce((a,b) => a+b, 0);
  const weekAvg = denomTotal === 0 ? 0 : numerator / denomTotal;

  const card = document.getElementById(`week-card-${weekIndex}`);
  const display = card ? card.querySelector('.week-average-display') : null;
  if (display) display.textContent = `Week ${weekIndex} average: ${isNaN(weekAvg) ? '-' : weekAvg.toFixed(2)}`;

  return weekAvg;
}

function calculateAllWeeks() {
  const weeks = [];
  for (let w = 1; w <= 4; w++) {
    const avg = calculateWeekAverage(w);
    weeks.push(isNaN(avg) ? 0 : avg);
  }
  updateWeekAveragesDisplay();
  autosaveToLocal();
  return weeks;
}

function updateWeekAveragesDisplay() {
  const weekAvgs = [];
  for (let w = 1; w <= 4; w++) {
    const card = document.getElementById(`week-card-${w}`);
    const display = card ? card.querySelector('.week-average-display') : null;
    if (display) {
      const text = display.textContent || '';
      const match = text.match(/average:\s*([0-9.\-]+)/i);
      const num = match ? parseFloat(match[1]) : NaN;
      weekAvgs.push(isNaN(num) ? '-' : num.toFixed(2));
    } else {
      weekAvgs.push('-');
    }
  }
  weekAveragesDisplay.textContent = weekAvgs.join(' | ');
}

/* ---------- req7 evaluation ---------- */
/* Evaluate req7 inputs:
   - if all are "جيد" -> varGood = true
   - if any contains "سيء" -> varBad = true
   stores a status string for saving ("good"/"bad"/"")
*/
function normalizeArabic(s) {
  if (!s && s !== 0) return '';
  return String(s).trim();
}

function evaluateReq7() {
  // read values
  const vals = req7Inputs.map(i => normalizeArabic(i.value));
  // default
  varGood = false;
  varBad = false;

  // if any contains "سيء" (exact substring) -> varBad
  for (const v of vals) {
    if (!v) continue;
    if (v.indexOf('سيء') !== -1) {
      varBad = true;
      break;
    }
  }

  // varGood only if none empty and all equal "جيد" (exact)
  if (!varBad) {
    const allGood = vals.length > 0 && vals.every(v => v === 'جيد');
    if (allGood) varGood = true;
  }

  // return status for informational use
  if (varBad) return 'bad';
  if (varGood) return 'good';
  return '';
}

/* ---------- Monthly average (new formula) ----------
   new: ((sum of 4 week averages * 8) + (req6 * 10)) / 44.23
   then +1 if varGood, -1 if varBad
*/
function calculateMonthlyAverage() {
  // ensure week averages are up-to-date
  const weeks = calculateAllWeeks(); // numeric values
  const sumWeeks = weeks.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0);

  // parse req6 as number
  const req6 = req6Input.value !== '' ? parseFloat(req6Input.value) : 0;

  // compute
  const numerator = (sumWeeks * 8) + (req6 * 10);
  let monthly = 44.23 === 0 ? 0 : numerator / 44.23;

  // evaluate req7 status
  const status = evaluateReq7();
  if (status === 'good') monthly += 1;
  else if (status === 'bad') monthly -= 1;

  // round to 2 decimals
  const final = isNaN(monthly) ? '-' : Number(monthly.toFixed(2));
  monthlyAvgDisplay.textContent = (final === '-') ? '-' : final.toFixed(2);

  // store req7Status if needed in autosave
  autosaveToLocal();
  return final;
}

/* ---------- Save / Load (localStorage & file) ---------- */

function buildDataObject() {
  const data = {
    meta: {
      student: studentNameInput.value || '',
      month: monthNameInput.value || '',
      teacher: teacherNameInput.value || '',
      title: document.getElementById('main-title').textContent || ''
    },
    weeks: {},
    req6: req6Input.value || '',
    req7: req7Inputs.map(i => i.value || ''),
    weekAverages: []
  };

  for (let w = 1; w <= 4; w++) {
    const weekArray = [];
    for (let day = 0; day < DAYS.length; day++) {
      const row = [];
      for (let req = 1; req <= NUM_REQUIRED; req++) {
        if (day === 5 && req === 3) {
          row.push(null);
        } else {
          const input = document.querySelector(`input[data-week="${w}"][data-day="${day}"][data-req="${req}"]`);
          row.push(input && input.value !== '' ? input.value : '');
        }
      }
      weekArray.push(row);
    }
    data.weeks[`week${w}`] = weekArray;
  }

  for (let w = 1; w <= 4; w++) {
    const card = document.getElementById(`week-card-${w}`);
    const display = card ? card.querySelector('.week-average-display') : null;
    if (display) {
      const match = display.textContent.match(/average:\s*([0-9.\-]+)/i);
      data.weekAverages.push(match ? match[1] : '');
    } else {
      data.weekAverages.push('');
    }
  }

  data.monthlyDisplay = monthlyAvgDisplay.textContent || '';

  // save comments
  data.comments = {
    comment1: document.getElementById('comment1').value || '',
    comment2: document.getElementById('comment2').value || '',
    comment3: document.getElementById('comment3').value || ''
  };


  data.dayComments = {};

for (let w = 1; w <= 4; w++) {
  data.dayComments[`week${w}`] = {};
  for (let d = 0; d < DAYS.length; d++) {
    const ta = document.querySelector(
      `textarea[data-week="${w}"][data-day="${d}"]`
    );
    if (ta && ta.value.trim() !== '') {
      data.dayComments[`week${w}`][`day${d}`] = ta.value;
    }
  }
}

  // save req7 status (derived)
  data.req7Status = evaluateReq7(); // "good" | "bad" | ""

  return data;
}

function autosaveToLocal() {
  try {
    const data = buildDataObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Autosave failed', err);
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    populateFromData(data);
  } catch (err) {
    console.error('Load failed', err);
  }
}

function populateFromData(data) {
  if (!data) return;
  studentNameInput.value = data.meta?.student || '';
  monthNameInput.value = data.meta?.month || '';
  teacherNameInput.value = data.meta?.teacher || '';
  if (data.meta?.title) document.getElementById('main-title').textContent = data.meta.title;

  for (let w = 1; w <= 4; w++) {
    const weekArray = data.weeks?.[`week${w}`] || [];
    for (let day = 0; day < DAYS.length; day++) {
      const row = weekArray[day] || [];
      for (let req = 1; req <= NUM_REQUIRED; req++) {
        if (day === 5 && req === 3) continue;
        const val = row[req-1] !== undefined ? row[req-1] : '';
        const input = document.querySelector(`input[data-week="${w}"][data-day="${day}"][data-req="${req}"]`);
        if (input) input.value = val;
      }
    }
  }

  req6Input.value = data.req6 || '';
  req7Inputs.forEach((el, idx) => el.value = (data.req7 && data.req7[idx]) ? data.req7[idx] : '');

  if (Array.isArray(data.weekAverages)) {
    for (let w = 1; w <= 4; w++) {
      const card = document.getElementById(`week-card-${w}`);
      let display = card ? card.querySelector('.week-average-display') : null;
      if (!display && card) {
        display = document.createElement('div');
        display.className = 'week-average-display';
        display.style.marginTop = '8px';
        display.style.fontWeight = '700';
        card.appendChild(display);
      }
      if (display) display.textContent = data.weekAverages[w-1] ? `Week ${w} average: ${data.weekAverages[w-1]}` : '';
    }
    updateWeekAveragesDisplay();
  }

  if (data.monthlyDisplay) monthlyAvgDisplay.textContent = data.monthlyDisplay;

  // restore comments
  if (data.comments) {
    document.getElementById('comment1').value = data.comments.comment1 || '';
    document.getElementById('comment2').value = data.comments.comment2 || '';
    document.getElementById('comment3').value = data.comments.comment3 || '';
  }

  // restore req7 status (derived) - update varGood/varBad
  evaluateReq7();

  if (data.dayComments) {
  for (const weekKey in data.dayComments) {
    for (const dayKey in data.dayComments[weekKey]) {
      const w = weekKey.replace('week','');
      const d = dayKey.replace('day','');
      const ta = document.querySelector(
        `textarea[data-week="${w}"][data-day="${d}"]`
      );
      if (ta) ta.value = data.dayComments[weekKey][dayKey];
    }
  }
}


}

/* Download JSON file for saving student */
function downloadDataAsFile() {
  // ensure latest req7 evaluation saved
  evaluateReq7();

  const data = buildDataObject();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const student = (data.meta.student || 'student').replace(/\s+/g,'_');
  const month = (data.meta.month || 'month').replace(/\s+/g,'_');
  a.href = url;
  a.download = `${student}_${month}_marks.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Handle uploaded JSON file to open student */
function handleFileOpen(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      populateFromData(obj);
      autosaveToLocal();
      alert('Student data loaded.');
    } catch (err) {
      alert('Failed to read file: not valid JSON.');
    }
  };
  reader.readAsText(file);
}

/* ---------- Wire up buttons & events ---------- */
saveBtn.addEventListener('click', () => {
  downloadDataAsFile();
});

openBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (f) handleFileOpen(f);
  fileInput.value = '';
});

calcAllWeeksBtn.addEventListener('click', () => {
  calculateAllWeeks();
  alert('All weeks calculated and displayed.');
});

calcMonthlyBtn.addEventListener('click', () => {
  const val = calculateMonthlyAverage();
  alert(`Monthly average: ${isNaN(val) ? '-' : val.toFixed(2)}`);
});

[studentNameInput, monthNameInput, teacherNameInput].forEach(el => el.addEventListener('input', autosaveToLocal));
req6Input.addEventListener('input', autosaveToLocal);

// call evaluateReq7 when any req7 input changes
req7Inputs.forEach(i => {
  i.addEventListener('input', () => {
    evaluateReq7();
    autosaveToLocal();
  });
});

/* ---------- On load ---------- */
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocal();
  updateWeekAveragesDisplay();
});


window.addEventListener('load', () => {
    localStorage.clear(); // this removes all saved marks
});
