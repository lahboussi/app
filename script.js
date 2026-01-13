/* script.js
   Handles:
   - Building the 4 week tables
   - Calculations for per-required averages and week average per your formulas
   - Monthly average calculation (using weeks + req6 + req7 as specified)
   - Autosave/load via localStorage
   - Save as JSON (download) and Open JSON (file upload)

   just ver
*/

/* ---------- Configuration ---------- */
/* coefficients for Required1..Required5 */
const COEFFICIENTS = [5,7,1,2,1]; // sum = 16
const DAYS = ['السّبت','الأحد','الإثنين','الثّلاثاء','الأربعاء','الخميس']; // rows 2..7
const NUM_REQUIRED = 5;
const requiredNames = ['الحفظ','المراجعة','حفظ المتن','مراجعة المتن','السّلوك'];
const r = 4;
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

/* localStorage key */
const STORAGE_KEY = 'student_ave_current_v1';

/* ---------- Build 4 week tables ---------- */
/* We'll generate 4 similar tables (week1..week4) with inputs carrying data-week, data-row, data-col attributes */
for (let w = 1; w <= 4; w++) {
  weeksContainer.appendChild(buildWeekTable(w));
}

function buildWeekTable(weekIndex) {
  // card wrapper
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `week-card-${weekIndex}`;

  const h = document.createElement('h3');
  h.textContent = `الأسبوع ${weekIndex}`;
  card.appendChild(h);

  // build table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');

  // first header cell: Days / Required
  const th1 = document.createElement('th');
  th1.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;">
                     <div><strong>الأيام</strong></div>
                     <div style="font-size:12px;color:rgba(0,0,0,0.6)">المطلوب</div>
                   </div>`;
  hrow.appendChild(th1);

  // required headers 1..5
  // for (let r = 1; r <= NUM_REQUIRED; r++) {
  //   const th = document.createElement('th');
  //   th.textContent = `Required ${r}`;
  //   hrow.appendChild(th);
  ////
  // required headers 1..5 using custom names
  for (let r = 0; r < requiredNames.length; r++) {
    const th = document.createElement('th');
    th.textContent = requiredNames[r]; // use custom names
    hrow.appendChild(th);
  }
  thead.appendChild(hrow);
  table.appendChild(thead);

  // body rows: rows 1..9 (but we create exactly the rows requested)
  const tbody = document.createElement('tbody');

  // rows for days: row indices 2..7 in your spec are actual data rows (6 rows)
  for (let dayIndex = 0; dayIndex < DAYS.length; dayIndex++) {
    const tr = document.createElement('tr');
    // col 1: day name
    const tdDay = document.createElement('td');
    tdDay.textContent = DAYS[dayIndex];
    tr.appendChild(tdDay);

    // columns 2..6 required inputs
    for (let col = 1; col <= NUM_REQUIRED; col++) {
      const td = document.createElement('td');

      // special black cell: box(7,4) -> dayIndex 5 (Thursday) and col=3? careful:
      // dayIndex 5 corresponds to Thursday; column number 4 (per user) => required3 is column index 3 (since col starts 1)
      // user referred to box(7,4) meaning row 7 (Thursday) and column 4 (which is Required3).
      // So if dayIndex = 5 (Thursday) and col === 3 then mark black.
      if (dayIndex === 5 && col === 3) {
        td.className = 'black-cell';
        td.innerHTML = ''; // empty black cell
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.min = 0;
        input.className = 'input-cell';
        // data attributes to locate later
        input.dataset.week = weekIndex;
        input.dataset.day = dayIndex; // 0..5
        input.dataset.req = col; // 1..5
        // listen for changes to autosave
        input.addEventListener('input', handleInputChange);
        td.appendChild(input);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // Coefficients row: box(8,1) 'coefficients' label and box(8,2..6) coefficients
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

  // Averages row: box(9,1) 'Average' label and box(9,2..6) computed averages
  const trAvg = document.createElement('tr');
  const tdAvgLabel = document.createElement('td');
  tdAvgLabel.textContent = 'المجموع';
  tdAvgLabel.className = 'avg-cell';
  trAvg.appendChild(tdAvgLabel);

  for (let req = 1; req <= NUM_REQUIRED; req++) {
    const td = document.createElement('td');
    td.className = 'avg-cell';
    // show computed average here
    const span = document.createElement('span');
    span.id = `week${weekIndex}-avg-req${req}`;
    span.textContent = '-';
    td.appendChild(span);
    trAvg.appendChild(td);
  }
  tbody.appendChild(trAvg);

  table.appendChild(tbody);
  card.appendChild(table);

  // Week buttons: calculate week average + display area
  const btn = document.createElement('button');
  btn.textContent = `حساب معدّل الأسبوع  ${weekIndex} `;
  btn.addEventListener('click', () => {
    const avg = calculateWeekAverage(weekIndex);
    // show week average near the table
    let display = card.querySelector('.week-average-display');
    if (!display) {
      display = document.createElement('div');
      display.className = 'week-average-display';
      display.style.marginTop = '8px';
      display.style.fontWeight = '700';
      card.appendChild(display);
    }
    display.textContent = `Week ${weekIndex} average: ${isNaN(avg) ? '-' : avg.toFixed(2)}`;
    // update global week averages display
    updateWeekAveragesDisplay();
    autosaveToLocal();
  });
  card.appendChild(btn);

  return card;
}

/* ---------- Event handlers ---------- */
function handleInputChange() {
  // autosave on any mark change
  autosaveToLocal();
}

/* ---------- Calculation functions ---------- */

/**
 * calculate per-required averages for a week and then compute the week average per your rules.
 * Also updates the average cells in the DOM.
 * Returns the computed week average number.
 */
function calculateWeekAverage(weekIndex) {
  // for each required (1..5) compute:
  // reqAvg = (sum of marks for that required in allowed days * coefficient) / denom
  // where denom is 6 for requireds 1,2,4,5 and 5 for required3 (since required3 excludes Thursday)
  const perReqAverages = [];
  for (let req = 1; req <= NUM_REQUIRED; req++) {
    let sumMarks = 0;
    let daysCount = 0;
    for (let day = 0; day < DAYS.length; day++) {
      // skip black cell: Thursday (day=5) for required3 (req===3)
      if (day === 5 && req === 3) continue;
      const input = document.querySelector(`input[data-week="${weekIndex}"][data-day="${day}"][data-req="${req}"]`);
      const val = input && input.value !== '' ? parseFloat(input.value) : 0;
      sumMarks += isNaN(val) ? 0 : val;
      daysCount++;
    }
    const coef = COEFFICIENTS[req-1];
    // denominator per your spec:
    let denom;
    if (req === 3) denom = 5; // required3: sum from saturday to wednesday then mult by coef and divide by 5
    else denom = 6;
    // compute average value as the user defined (sum * coef / denom)
    const avgVal = (sumMarks * coef) / denom;
    perReqAverages.push(avgVal);

    // update display cell
    const span = document.getElementById(`week${weekIndex}-avg-req${req}`);
    if (span) span.textContent = isNaN(avgVal) ? '-' : avgVal.toFixed(2);
  }

  // week average = (sum of perReqAverages) / sum of coefficients (which is 16)
  const numerator = perReqAverages.reduce((a,b) => a+b, 0);
  const denomTotal = COEFFICIENTS.reduce((a,b) => a+b, 0); // should be 16
  const weekAvg = denomTotal === 0 ? 0 : numerator / denomTotal;

  // store the week average text inside the card display (if present)
  const card = document.getElementById(`week-card-${weekIndex}`);
  const display = card.querySelector('.week-average-display');
  if (display) display.textContent = `Week ${weekIndex} average: ${isNaN(weekAvg) ? '-' : weekAvg.toFixed(2)}`;

  return weekAvg;
}

/* Calculate all four weeks and update displays */
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
    const display = card.querySelector('.week-average-display');
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

/* Monthly average per user formula:
   monthlyAvg = (sum of the 4 week averages) + (req6_mark * 5) + (sum(req7_marks) * 2)  all divided by 17
*/
function calculateMonthlyAverage() {
  // ensure week averages are up-to-date
  const weeks = calculateAllWeeks(); // returns numeric values
  const sumWeeks = weeks.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0);

  const req6 = req6Input.value !== '' ? parseFloat(req6Input.value) : 0;
  const req7Sum = req7Inputs.reduce((acc, el) => {
    const v = el.value !== '' ? parseFloat(el.value) : 0;
    return acc + (isNaN(v) ? 0 : v);
  }, 0);

  const numerator = sumWeeks + (req6 * 5) + (req7Sum * 2);
  const monthlyAvg = 17 === 0 ? 0 : numerator / 17;

  monthlyAvgDisplay.textContent = isNaN(monthlyAvg) ? '-' : monthlyAvg.toFixed(2);
  autosaveToLocal();
  return monthlyAvg;
}

/* ---------- Save / Load (localStorage & file) ---------- */

/* Build data object representing current page state */
function buildDataObject() {
  const data = {
    meta: {
      student: studentNameInput.value || '',
      month: monthNameInput.value || '',
      teacher: teacherNameInput.value || '',
      title: document.getElementById('main-title').textContent || ''
    },
    weeks: {}, // week1..4: arrays of marks (6 days x 5 required), we'll store as rows of arrays where black cells are null
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
          row.push(null); // black cell
        } else {
          const input = document.querySelector(`input[data-week="${w}"][data-day="${day}"][data-req="${req}"]`);
          row.push(input && input.value !== '' ? input.value : '');
        }
      }
      weekArray.push(row);
    }
    data.weeks[`week${w}`] = weekArray;
  }

  // store displayed week averages too (if present)
  for (let w = 1; w <= 4; w++) {
    const card = document.getElementById(`week-card-${w}`);
    const display = card.querySelector('.week-average-display');
    if (display) {
      const match = display.textContent.match(/average:\s*([0-9.\-]+)/i);
      data.weekAverages.push(match ? match[1] : '');
    } else {
      data.weekAverages.push('');
    }
  }

  // monthly average displayed
  data.monthlyDisplay = monthlyAvgDisplay.textContent || '';
    // --- save comments ---
  data.comments = {
      comment1: document.getElementById('comment1').value || '',
      comment2: document.getElementById('comment2').value || '',
      comment3: document.getElementById('comment3').value || ''
  };

  return data;
}

/* Autosave to localStorage */
function autosaveToLocal() {
  try {
    const data = buildDataObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Autosave failed', err);
  }
}

/* Load from localStorage (if any) */
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

/* Populate page fields from a loaded data object */
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
        if (day === 5 && req === 3) continue; // black cell
        const val = row[req-1] !== undefined ? row[req-1] : '';
        const input = document.querySelector(`input[data-week="${w}"][data-day="${day}"][data-req="${req}"]`);
        if (input) input.value = val;
      }
    }
  }

  req6Input.value = data.req6 || '';
  req7Inputs.forEach((el, idx) => el.value = (data.req7 && data.req7[idx]) ? data.req7[idx] : '');

  // restore displayed weekly averages and monthly if present
  if (Array.isArray(data.weekAverages)) {
    for (let w = 1; w <= 4; w++) {
      const card = document.getElementById(`week-card-${w}`);
      let display = card.querySelector('.week-average-display');
      if (!display) {
        display = document.createElement('div');
        display.className = 'week-average-display';
        display.style.marginTop = '8px';
        display.style.fontWeight = '700';
        card.appendChild(display);
      }
      display.textContent = data.weekAverages[w-1] ? `Week ${w} average: ${data.weekAverages[w-1]}` : '';
    }
    updateWeekAveragesDisplay();
  }

  if (data.monthlyDisplay) monthlyAvgDisplay.textContent = data.monthlyDisplay;

    // --- restore comments ---
  if (data.comments) {
      document.getElementById('comment1').value = data.comments.comment1 || '';
      document.getElementById('comment2').value = data.comments.comment2 || '';
      document.getElementById('comment3').value = data.comments.comment3 || '';
  }


}

/* Download JSON file for saving student */
function downloadDataAsFile() {
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

/* ---------- Wire up buttons ---------- */
saveBtn.addEventListener('click', () => {
  downloadDataAsFile();
});

openBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (f) handleFileOpen(f);
  // clear file input so same file can be re-loaded later if needed
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

/* Save on metadata changes */
[studentNameInput, monthNameInput, teacherNameInput].forEach(el => el.addEventListener('input', autosaveToLocal));

/* Save req6/req7 changes */
req6Input.addEventListener('input', autosaveToLocal);
req7Inputs.forEach(i => i.addEventListener('input', autosaveToLocal));
// LOAD COMMENTS
if (data.comments) {
    document.getElementById('comment1').value = data.comments.comment1 || '';
    document.getElementById('comment2').value = data.comments.comment2 || '';
}


/* ---------- On load: populate from localStorage if present ---------- */
window.addEventListener('DOMContentLoaded', () => {
  loadFromLocal();
  // update any displayed week averages (if present)
  updateWeekAveragesDisplay();
});
// Clear previous saved marks when the page loads
window.addEventListener('load', () => {
    localStorage.clear(); // this removes all saved marks
});
