/* script.js - cleaned & robust version
   Title updates: document.title follows the student name and is saved/loaded.
   Other features preserved (tables, bubbles, save/open, autosave, req7).
*/

/* ---------- Configuration ---------- */
const COEFFICIENTS_FULL = [5,7,1,2,5]; // req1..req5
const COEFFICIENTS_THREE = [5,7,5];     // for req1,req2,req5
const DAYS = ['السّبت','الأحد','الإثنين','الثّلاثاء','الأربعاء','الخميس'];
const STORAGE_KEY = 'student_ave_current_v2';

/* ---------- DOM refs (defensive: may be null) ---------- */
const weeksContainer = document.getElementById('weeks');
const studentNameInput = document.getElementById('studentName');
const monthNameInput = document.getElementById('monthName');
const teacherNameInput = document.getElementById('teacherName');
const req6Input = document.getElementById('req6_mark');
const req7Inputs = Array.from(document.querySelectorAll('input[data-req7]'));
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');

const monthlyCommentBtn = document.getElementById('monthlyCommentBtn');
const monthlyCommentBubble = document.getElementById('monthlyCommentBubble');
const monthlyCommentText = document.getElementById('monthlyCommentText');

const weekAveragesDisplay = document.getElementById('weekAveragesDisplay');
const monthlyAvgDisplay = document.getElementById('monthlyAvgDisplay');

const useFullTableBtn = document.getElementById('useFullTableBtn');
const useThreeReqBtn = document.getElementById('useThreeReqBtn');

const calcAllWeeksBtn = document.getElementById('calcAllWeeks');
const calcMonthlyBtn = document.getElementById('calcMonthly');
const calc3ReqBtn = document.getElementById('calc3Req');

const presentBtn = document.getElementById('presentBtn');
const presentCircle = document.getElementById('presentCircle');
const presentLine1 = document.getElementById('present_line1');
const presentLine2 = document.getElementById('present_line2');
const savePresentBtn = document.getElementById('savePresentBtn');
const closePresentBtn = document.getElementById('closePresent');

/* ---------- State ---------- */
let currentMode = 'full'; // 'full' | 'three'
let totalWeeks = 4;
let currentWeek = 1;
let varGood = false;
let varBad = false;

/* ---------- Title helper (updates main title from student name) ---------- */
function updateMainTitle() {
  const titleEl = document.getElementById('main-title');
  const headTitle = document.getElementById('pageTitle'); // optional
  if (!titleEl) return;
  const name = studentNameInput ? (studentNameInput.value || '').trim() : '';
  const final = name !== '' ? name : 'تقويم الطّالب الشهري';
  titleEl.textContent = final;
  // update browser tab title
  document.title = final;
  if (headTitle) headTitle.textContent = final;
}

/* keep references to rendered cards */
const fullCards = {};
const threeCards = {};

/* small helpers */
function q(sel){ return document.querySelector(sel); }
function qAll(sel){ return Array.from(document.querySelectorAll(sel)); }

/* ---------- Monthly bubble toggle ---------- */
if (monthlyCommentBtn && monthlyCommentBubble && monthlyCommentText) {
  monthlyCommentBtn.addEventListener('click', () => {
    monthlyCommentBubble.classList.toggle('hidden');
    if (!monthlyCommentBubble.classList.contains('hidden')) monthlyCommentText.focus();
  });
  monthlyCommentText.addEventListener('input', autosaveToLocal);
}

/* ---------- quick-set req7 buttons wiring ---------- */
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t && t.matches && t.matches('.req7-btn')) {
    const val = t.dataset.set;
    const forId = t.dataset.for;
    const input = document.getElementById(forId);
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input', {bubbles:true}));
    }
  }
});

/* ---------- Build tables ---------- */
function buildFullTables() {
  if (!weeksContainer) return;
  weeksContainer.innerHTML = '';
  for (let w=1; w<=totalWeeks; w++) {
    const card = buildWeekTableFull(w);
    fullCards[w] = card;
    weeksContainer.appendChild(card);
  }
  showOnlyWeek(currentWeek, 'full');
}

function buildThreeReqTables() {
  if (!weeksContainer) return;
  weeksContainer.innerHTML = '';
  for (let w=1; w<=totalWeeks; w++) {
    const card = buildWeekTableThree(w);
    threeCards[w] = card;
    weeksContainer.appendChild(card);
  }
  showOnlyWeek(currentWeek, 'three');
}

function showOnlyWeek(wIndex, mode) {
  currentWeek = wIndex;
  for (let w=1; w<=totalWeeks; w++) {
    const fc = fullCards[w];
    const tc = threeCards[w];
    if (fc) fc.style.display = (mode === 'full' ? (w===wIndex ? 'block' : 'none') : 'none');
    if (tc) tc.style.display = (mode === 'three' ? (w===wIndex ? 'block' : 'none') : 'none');
  }
  const lab = document.getElementById('currentWeekLabel');
  if (lab) lab.textContent = `الأسبوع ${currentWeek}`;
}

/* ---------- Build single full week card (with day bubbles) ---------- */
function buildWeekTableFull(weekIndex) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `full-week-${weekIndex}`;

  const h = document.createElement('h3'); h.textContent = `الأسبوع ${weekIndex}`; card.appendChild(h);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.appendChild(thCell('الأيام'));
  ['الحفظ و التّلخيص','المراجعة','حفظ المتن و الحديث','مراجعة المتن','السّلوك'].forEach(t => trh.appendChild(thCell(t)));
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let d=0; d<DAYS.length; d++) {
    const tr = document.createElement('tr');

    // day + comment icon + bubble
    const tdDay = document.createElement('td');
    tdDay.style.position = 'relative';
    const dayLabel = document.createElement('span'); dayLabel.textContent = DAYS[d];
    const icon = document.createElement('span'); icon.className = 'day-comment-icon'; icon.textContent = '🗨️';
    const bubble = document.createElement('div'); bubble.className = 'comment-bubble';
    const ta = document.createElement('textarea');
    ta.placeholder = 'اكتب ملاحظة اليوم...';
    ta.dataset.week = weekIndex; ta.dataset.day = d;
    ta.addEventListener('input', autosaveToLocal);
    bubble.appendChild(ta);

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      qAll('.comment-bubble').forEach(b => { if (b !== bubble) b.style.display = 'none'; });
      bubble.style.display = bubble.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { bubble.style.display = 'none'; });

    tdDay.appendChild(icon);
    tdDay.appendChild(dayLabel);
    tdDay.appendChild(bubble);
    tr.appendChild(tdDay);

    // inputs for 5 requirements
    for (let req=1; req<=5; req++) {
      const td = document.createElement('td');
      if (d === 5 && req === 3) {
        td.className = 'black-cell';
        td.innerHTML = '';
      } else {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = 'any';
        inp.min = 0;
        inp.className = 'input-cell';
        inp.dataset.week = weekIndex;
        inp.dataset.day = d;
        inp.dataset.req = req;
        inp.addEventListener('input', autosaveToLocal);
        td.appendChild(inp);
      }
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  // coefficients row
  const trCoef = document.createElement('tr');
  trCoef.appendChild(tdCell('المعاملات', 'coef-cell'));
  COEFFICIENTS_FULL.forEach(c => trCoef.appendChild(tdCell(c, 'coef-cell')));
  tbody.appendChild(trCoef);

  // averages row
  const trAvg = document.createElement('tr');
  trAvg.appendChild(tdCell('المجموع', 'avg-cell'));
  for (let r=1; r<=5; r++) {
    const td = tdCell('-', 'avg-cell');
    td.innerHTML = '';
    const sp = document.createElement('span'); sp.id = `full-w${weekIndex}-avg-r${r}`; sp.textContent = '-';
    td.appendChild(sp);
    trAvg.appendChild(td);
  }
  tbody.appendChild(trAvg);

  table.appendChild(tbody);
  card.appendChild(table);

  const btn = document.createElement('button'); btn.textContent = `حساب معدّل الأسبوع ${weekIndex}`;
  btn.addEventListener('click', () => {
    const avg = calculateWeekAverageFull(weekIndex);
    displayWeekAverageCard(card, avg);
    updateWeekAveragesDisplay('full');
    autosaveToLocal();
  });
  card.appendChild(btn);

  return card;
}

/* ---------- Build three-req week card ---------- */
function buildWeekTableThree(weekIndex) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `three-week-${weekIndex}`;

  const h = document.createElement('h3'); h.textContent = `الأسبوع ${weekIndex}`; card.appendChild(h);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.appendChild(thCell('الأيام'));
  ['الحفظ و التّلخيص','المراجعة','السّلوك'].forEach(t => trh.appendChild(thCell(t)));
  thead.appendChild(trh); table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let d=0; d<DAYS.length; d++) {
    const tr = document.createElement('tr');

    const tdDay = document.createElement('td');
    tdDay.style.position = 'relative';
    const dayLabel = document.createElement('span'); dayLabel.textContent = DAYS[d];
    const icon = document.createElement('span'); icon.className = 'day-comment-icon'; icon.textContent = '🗨️';
    const bubble = document.createElement('div'); bubble.className = 'comment-bubble';
    const ta = document.createElement('textarea'); ta.placeholder = 'اكتب ملاحظة اليوم...';
    ta.dataset.week = weekIndex; ta.dataset.day = d; ta.addEventListener('input', autosaveToLocal);
    bubble.appendChild(ta);
    icon.addEventListener('click', (e)=>{ e.stopPropagation(); qAll('.comment-bubble').forEach(b=>b!==bubble && (b.style.display='none')); bubble.style.display = bubble.style.display==='block' ? 'none' : 'block'; });
    document.addEventListener('click', ()=>bubble.style.display='none');
    tdDay.appendChild(icon); tdDay.appendChild(dayLabel); tdDay.appendChild(bubble);
    tr.appendChild(tdDay);

    // three inputs mapped to req 1,2,5
    [1,2,5].forEach(req => {
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = 'any';
      inp.min = 0;
      inp.className = 'input-cell';
      inp.dataset.week = weekIndex;
      inp.dataset.day = d;
      inp.dataset.req = req;
      inp.addEventListener('input', autosaveToLocal);
      td.appendChild(inp);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  // coeff row
  const trCoef = document.createElement('tr'); trCoef.appendChild(tdCell('المعاملات','coef-cell'));
  COEFFICIENTS_THREE.forEach(c => trCoef.appendChild(tdCell(c,'coef-cell')));
  tbody.appendChild(trCoef);

  // averages row
  const trAvg = document.createElement('tr'); trAvg.appendChild(tdCell('المجموع','avg-cell'));
  [1,2,5].forEach(req => {
    const td = tdCell('-', 'avg-cell');
    td.innerHTML = '';
    const sp = document.createElement('span'); sp.id = `three-w${weekIndex}-avg-r${req}`; sp.textContent='-';
    td.appendChild(sp); trAvg.appendChild(td);
  });
  tbody.appendChild(trAvg);

  table.appendChild(tbody); card.appendChild(table);

  const btn = document.createElement('button'); btn.textContent = `حساب معدّل الأسبوع ${weekIndex} (3 متطلبات)`;
  btn.addEventListener('click', ()=>{ const avg = calculateWeekAverageThree(weekIndex); displayWeekAverageCard(card,avg); updateWeekAveragesDisplay('three'); autosaveToLocal(); });
  card.appendChild(btn);

  return card;
}

/* ---------- small DOM helpers ---------- */
function thCell(text) { const th = document.createElement('th'); th.textContent = text; return th; }
function tdCell(text, cls='') { const td = document.createElement('td'); if (cls) td.className = cls; td.textContent = text; return td; }
function displayWeekAverageCard(card, avg) {
  if (!card) return;
  let display = card.querySelector('.week-average-display');
  if (!display) {
    display = document.createElement('div'); display.className = 'week-average-display';
    display.style.marginTop = '8px'; display.style.fontWeight = '700'; card.appendChild(display);
  }
  display.textContent = `Week ${currentWeek} average: ${isNaN(avg) ? '-' : avg.toFixed(2)}`;
}

/* ---------- calculations ---------- */
function calculateWeekAverageFull(weekIndex) {
  const perReq = [];
  for (let req=1; req<=5; req++) {
    if (req === 3) {
      let sum = 0;
      for (let d=0; d<DAYS.length; d++) {
        if (d === 5 && req === 3) continue;
        const inp = document.querySelector(`#full-week-${weekIndex} input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
        const val = inp && inp.value !== '' ? parseFloat(inp.value) : 0;
        sum += isNaN(val) ? 0 : val;
      }
      const avg = (sum * COEFFICIENTS_FULL[req-1]) / 5;
      perReq.push(avg);
      const el = document.getElementById(`full-w${weekIndex}-avg-r${req}`); if (el) el.textContent = isNaN(avg) ? '-' : avg.toFixed(2);
    } else {
      let sum = 0;
      for (let d=0; d<DAYS.length; d++) {
        const inp = document.querySelector(`#full-week-${weekIndex} input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
        const val = inp && inp.value !== '' ? parseFloat(inp.value) : 0;
        sum += isNaN(val) ? 0 : val;
      }
      const avg = (sum * COEFFICIENTS_FULL[req-1]) / 6;
      perReq.push(avg);
      const el = document.getElementById(`full-w${weekIndex}-avg-r${req}`); if (el) el.textContent = isNaN(avg) ? '-' : avg.toFixed(2);
    }
  }
  const numerator = perReq.reduce((a,b)=>a+b,0);
  const denom = COEFFICIENTS_FULL.reduce((a,b)=>a+b,0);
  return denom === 0 ? 0 : numerator / denom;
}

function calculateWeekAverageThree(weekIndex) {
  const reqs = [1,2,5];
  const perReq = [];
  for (const req of reqs) {
    let sum = 0;
    for (let d=0; d<DAYS.length; d++) {
      const inp = document.querySelector(`#three-week-${weekIndex} input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
      const val = inp && inp.value !== '' ? parseFloat(inp.value) : 0;
      sum += isNaN(val) ? 0 : val;
    }
    const coef = (req===1||req===5) ? 5 : 7;
    const avg = (sum * coef) / 6;
    perReq.push({req, avg, coef});
    const el = document.getElementById(`three-w${weekIndex}-avg-r${req}`); if (el) el.textContent = isNaN(avg) ? '-' : avg.toFixed(2);
  }
  const numerator = perReq.reduce((a,b)=>a + b.avg, 0);
  const denom = perReq.reduce((a,b)=>a + b.coef, 0);
  return denom === 0 ? 0 : numerator / denom;
}

function calculateAllWeeks(mode = currentMode) {
  const arr = [];
  for (let w=1; w<=totalWeeks; w++) {
    const v = (mode === 'full') ? calculateWeekAverageFull(w) : calculateWeekAverageThree(w);
    arr.push(isNaN(v) ? 0 : v);
  }
  updateWeekAveragesDisplay(mode);
  autosaveToLocal();
  return arr;
}

function updateWeekAveragesDisplay(mode = currentMode) {
  const weekAvgs = [];
  for (let w=1; w<=totalWeeks; w++) {
    const card = (mode === 'full') ? fullCards[w] : threeCards[w];
    const display = card ? card.querySelector('.week-average-display') : null;
    if (display) {
      const match = display.textContent.match(/average:\s*([0-9.\-]+)/i);
      const num = match ? parseFloat(match[1]) : NaN;
      weekAvgs.push(isNaN(num) ? '-' : num.toFixed(2));
    } else weekAvgs.push('-');
  }
  if (weekAveragesDisplay) weekAveragesDisplay.textContent = weekAvgs.join(' | ');
}

/* ---------- req7 evaluation ---------- */
function normalizeArabic(s){ if (!s && s !== 0) return ''; return String(s).trim(); }
function evaluateReq7() {
  try {
    const vals = req7Inputs.map(i => normalizeArabic(i.value));
    varGood = false; varBad = false;
    for (const v of vals) { if (!v) continue; if (v.indexOf('سيء') !== -1) { varBad = true; break; } }
    if (!varBad) {
      const allGood = vals.length > 0 && vals.every(v => v === 'جيد');
      if (allGood) varGood = true;
    }
    if (varBad) return 'bad';
    if (varGood) return 'good';
    return '';
  } catch (err) {
    console.error('evaluateReq7 error', err);
    return '';
  }
}

/* ---------- monthly calculation (new formula) ---------- */
function calculateMonthlyAverage(mode = currentMode) {
  const weeks = calculateAllWeeks(mode);
  const sumWeeks = weeks.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0);
  const req6 = req6Input && req6Input.value !== '' ? parseFloat(req6Input.value) : 0;
  const numerator = (sumWeeks * 8) + (req6 * 10);

  const totalCoeffsFull = COEFFICIENTS_FULL.reduce((a,b)=>a+b,0);
  let chosenSum = totalCoeffsFull;
  if (mode === 'three') chosenSum = 5+7+5; // 17
  const denomScale = chosenSum / totalCoeffsFull;
  const denominator = 44.23 * denomScale;
  let monthly = denominator === 0 ? 0 : numerator / denominator;

  const status = evaluateReq7();
  if (status === 'good') monthly += 1;
  else if (status === 'bad') monthly -= 1;

  const final = isNaN(monthly) ? '-' : Number(monthly.toFixed(2));
  if (monthlyAvgDisplay) monthlyAvgDisplay.textContent = (final === '-') ? '-' : final.toFixed(2);
  autosaveToLocal();
  return final;
}

/* ---------- save / load (build data object) ---------- */
function buildDataObject() {
  const data = {
    meta: {
      student: studentNameInput ? studentNameInput.value || '' : '',
      month: monthNameInput ? monthNameInput.value || '' : '',
      teacher: teacherNameInput ? teacherNameInput.value || '' : '',
      title: document.title || ''
    },
    mode: currentMode,
    weeksFull: {},
    weeksThree: {},
    req6: req6Input ? req6Input.value || '' : '',
    req7: req7Inputs.map(i => i.value || ''),
    weekAveragesFull: [],
    weekAveragesThree: [],
    monthlyDisplay: monthlyAvgDisplay ? monthlyAvgDisplay.textContent || '' : '',
    comments: {
      comment1: (document.getElementById('comment1') && document.getElementById('comment1').value) ? document.getElementById('comment1').value : '',
      comment2: (document.getElementById('comment2') && document.getElementById('comment2').value) ? document.getElementById('comment2').value : '',
      comment3: (document.getElementById('comment3') && document.getElementById('comment3').value) ? document.getElementById('comment3').value : ''
    },
    dayCommentsFull: {},
    dayCommentsThree: {},
    monthlyComment: (monthlyCommentText && monthlyCommentText.value) ? monthlyCommentText.value : '',
    present: {
      line1: (presentLine1 && presentLine1.value) ? presentLine1.value : '',
      line2: (presentLine2 && presentLine2.value) ? presentLine2.value : ''
    },
    req7Status: evaluateReq7()
  };

  // collect full table values
  for (let w=1; w<=totalWeeks; w++) {
    const weekArr = [];
    for (let d=0; d<DAYS.length; d++) {
      const row = [];
      for (let req=1; req<=5; req++) {
        if (d===5 && req===3) { row.push(null); continue; }
        const inp = document.querySelector(`#full-week-${w} input[data-week="${w}"][data-day="${d}"][data-req="${req}"]`);
        row.push(inp && inp.value !== '' ? inp.value : '');
      }
      weekArr.push(row);
    }
    data.weeksFull[`week${w}`] = weekArr;
  }

  // collect three table values (req 1,2,5)
  for (let w=1; w<=totalWeeks; w++) {
    const weekArr = [];
    for (let d=0; d<DAYS.length; d++) {
      const row = [];
      [1,2,5].forEach(req => {
        const inp = document.querySelector(`#three-week-${w} input[data-week="${w}"][data-day="${d}"][data-req="${req}"]`);
        row.push(inp && inp.value !== '' ? inp.value : '');
      });
      weekArr.push(row);
    }
    data.weeksThree[`week${w}`] = weekArr;
  }

  // week averages
  for (let w=1; w<=totalWeeks; w++) {
    const fullCard = fullCards[w];
    const dispF = fullCard ? fullCard.querySelector('.week-average-display') : null;
    const valF = (dispF && dispF.textContent.match(/average:\s*([0-9.\-]+)/i)) ? (dispF.textContent.match(/average:\s*([0-9.\-]+)/i))[1] : '';
    data.weekAveragesFull.push(valF || '');

    const threeCard = threeCards[w];
    const dispT = threeCard ? threeCard.querySelector('.week-average-display') : null;
    const valT = (dispT && dispT.textContent.match(/average:\s*([0-9.\-]+)/i)) ? (dispT.textContent.match(/average:\s*([0-9.\-]+)/i))[1] : '';
    data.weekAveragesThree.push(valT || '');
  }

  // day comments (collect from built cards)
  for (let w=1; w<=totalWeeks; w++) {
    data.dayCommentsFull[`week${w}`] = {};
    for (let d=0; d<DAYS.length; d++) {
      const taF = document.querySelector(`#full-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
      if (taF && taF.value.trim() !== '') data.dayCommentsFull[`week${w}`][`day${d}`] = taF.value;
    }
    data.dayCommentsThree[`week${w}`] = {};
    for (let d=0; d<DAYS.length; d++) {
      const taT = document.querySelector(`#three-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
      if (taT && taT.value.trim() !== '') data.dayCommentsThree[`week${w}`][`day${d}`] = taT.value;
    }
  }

  return data;
}

/* ---------- autosave ---------- */
function autosaveToLocal() {
  try {
    const data = buildDataObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) { console.error('Autosave failed', err); }
}

/* ---------- load from local (if user chooses) ---------- */
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    populateFromData(data);
  } catch (err) { console.error('Load failed', err); }
}

/* ---------- populate UI from saved object ---------- */
function populateFromData(data) {
  if (!data) return;
  if (studentNameInput) studentNameInput.value = data.meta?.student || '';
  // update title from student name after populating the name
  updateMainTitle();

  if (monthNameInput) monthNameInput.value = data.meta?.month || '';
  if (teacherNameInput) teacherNameInput.value = data.meta?.teacher || '';

  // set mode and rebuild tables
  currentMode = data.mode || 'full';
  if (currentMode === 'full') buildFullTables();
  else buildThreeReqTables();

  // fill full
  for (let w=1; w<=totalWeeks; w++) {
    const weekArr = data.weeksFull?.[`week${w}`] || [];
    for (let d=0; d<DAYS.length; d++) {
      const row = weekArr[d] || [];
      for (let req=1; req<=5; req++) {
        if (d===5 && req===3) continue;
        const val = row[req-1] !== undefined ? row[req-1] : '';
        const inp = document.querySelector(`#full-week-${w} input[data-week="${w}"][data-day="${d}"][data-req="${req}"]`);
        if (inp) inp.value = val;
      }
    }
  }

  // fill three
  for (let w=1; w<=totalWeeks; w++) {
    const weekArr = data.weeksThree?.[`week${w}`] || [];
    for (let d=0; d<DAYS.length; d++) {
      const row = weekArr[d] || [];
      const reqs = [1,2,5];
      for (let idx=0; idx<reqs.length; idx++) {
        const req = reqs[idx];
        const val = row[idx] !== undefined ? row[idx] : '';
        const inp = document.querySelector(`#three-week-${w} input[data-week="${w}"][data-day="${d}"][data-req="${req}"]`);
        if (inp) inp.value = val;
      }
    }
  }

  if (req6Input) req6Input.value = data.req6 || '';
  req7Inputs.forEach((el,idx) => { if (el) el.value = (data.req7 && data.req7[idx]) ? data.req7[idx] : ''; });

  if (data.comments) {
    const c1 = document.getElementById('comment1'); if (c1) c1.value = data.comments.comment1 || '';
    const c2 = document.getElementById('comment2'); if (c2) c2.value = data.comments.comment2 || '';
    const c3 = document.getElementById('comment3'); if (c3) c3.value = data.comments.comment3 || '';
  }

  // day comments
  if (data.dayCommentsFull) {
    for (const wk in data.dayCommentsFull) {
      for (const dk in data.dayCommentsFull[wk]) {
        const w = wk.replace('week',''); const d = dk.replace('day','');
        const ta = document.querySelector(`#full-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
        if (ta) ta.value = data.dayCommentsFull[wk][dk];
      }
    }
  }
  if (data.dayCommentsThree) {
    for (const wk in data.dayCommentsThree) {
      for (const dk in data.dayCommentsThree[wk]) {
        const w = wk.replace('week',''); const d = dk.replace('day','');
        const ta = document.querySelector(`#three-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
        if (ta) ta.value = data.dayCommentsThree[wk][dk];
      }
    }
  }

  if (monthlyCommentText) monthlyCommentText.value = data.monthlyComment || '';

  // restore displayed averages
  if (Array.isArray(data.weekAveragesFull)) {
    for (let w=1; w<=totalWeeks; w++) {
      const val = data.weekAveragesFull[w-1] || '';
      const card = fullCards[w];
      if (card && val) {
        let disp = card.querySelector('.week-average-display');
        if (!disp) { disp = document.createElement('div'); disp.className='week-average-display'; disp.style.marginTop='8px'; disp.style.fontWeight='700'; card.appendChild(disp); }
        disp.textContent = `Week ${w} average: ${val}`;
      }
    }
  }
  if (Array.isArray(data.weekAveragesThree)) {
    for (let w=1; w<=totalWeeks; w++) {
      const val = data.weekAveragesThree[w-1] || '';
      const card = threeCards[w];
      if (card && val) {
        let disp = card.querySelector('.week-average-display');
        if (!disp) { disp = document.createElement('div'); disp.className='week-average-display'; disp.style.marginTop='8px'; disp.style.fontWeight='700'; card.appendChild(disp); }
        disp.textContent = `Week ${w} average: ${val}`;
      }
    }
  }

  if (data.monthlyDisplay && monthlyAvgDisplay) monthlyAvgDisplay.textContent = data.monthlyDisplay;

  if (data.present) {
    if (presentLine1) presentLine1.value = data.present.line1 || '';
    if (presentLine2) presentLine2.value = data.present.line2 || '';
  }

  highlightModeButton();
  updateWeekAveragesDisplay(currentMode);
}

/* ---------- download (save) with defensive error handling ---------- */
function downloadDataAsFile() {
  try {
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
    setTimeout(() => { URL.revokeObjectURL(url); }, 5000);
  } catch (err) {
    console.error('Save failed', err);
    alert('لا يمكن حفظ بيانات الطالب: ' + (err && err.message ? err.message : 'حدث خطأ غير متوقع'));
  }
}

/* ---------- file open ---------- */
if (fileInput) {
  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const obj = JSON.parse(e.target.result);
          populateFromData(obj);
          autosaveToLocal();
          alert('تم تحميل بيانات الطالب.');
        } catch (err) { alert('الملف غير صالح (JSON غير صحيح)'); }
      };
      reader.readAsText(f);
    }
    fileInput.value = '';
  });
}

/* ---------- top buttons ---------- */
if (saveBtn) saveBtn.addEventListener('click', () => downloadDataAsFile());
if (openBtn) openBtn.addEventListener('click', () => fileInput && fileInput.click());

/* ---------- calc buttons ---------- */
if (calcAllWeeksBtn) calcAllWeeksBtn.addEventListener('click', () => { calculateAllWeeks(); alert('All weeks calculated and displayed.'); });
if (calcMonthlyBtn) calcMonthlyBtn.addEventListener('click', () => { const v = calculateMonthlyAverage(); alert(`Monthly average: ${isNaN(v)?'-':v.toFixed(2)}`); });
if (calc3ReqBtn) calc3ReqBtn.addEventListener('click', () => { const v = calculateMonthlyAverage(currentMode==='full' ? 'three' : currentMode); alert(`معدل 3 المتطلبات: ${isNaN(v)?'-':v.toFixed(2)}`); });

/* ---------- mode toggle ---------- */
if (useFullTableBtn) useFullTableBtn.addEventListener('click', () => { currentMode='full'; buildFullTables(); highlightModeButton(); autosaveToLocal(); });
if (useThreeReqBtn) useThreeReqBtn.addEventListener('click', () => { currentMode='three'; buildThreeReqTables(); highlightModeButton(); autosaveToLocal(); });

function highlightModeButton() {
  if (!useFullTableBtn || !useThreeReqBtn) return;
  if (currentMode === 'full') { useFullTableBtn.style.opacity = '1'; useThreeReqBtn.style.opacity = '0.6'; }
  else { useFullTableBtn.style.opacity = '0.6'; useThreeReqBtn.style.opacity = '1'; }
}

/* ---------- present circle ---------- */
if (presentBtn) {
  presentBtn.addEventListener('click', () => {
    if (presentLine1) presentLine1.value = presentLine1.value || '';
    if (presentLine2) presentLine2.value = presentLine2.value || '';
    if (presentCircle) { presentCircle.classList.remove('hidden'); presentCircle.setAttribute('aria-hidden','false'); }
    if (presentLine1) presentLine1.focus();
  });
}
if (closePresentBtn) closePresentBtn.addEventListener('click', ()=>{ if (presentCircle) { presentCircle.classList.add('hidden'); presentCircle.setAttribute('aria-hidden','true'); } });
if (savePresentBtn) savePresentBtn.addEventListener('click', ()=>{ autosaveToLocal(); if (presentCircle) { presentCircle.classList.add('hidden'); presentCircle.setAttribute('aria-hidden','true'); } alert('بيانات العرض محفوظة لهذا الطالب.'); });

/* ---------- autosave triggers ---------- */
// student name -> update title then autosave
if (studentNameInput) studentNameInput.addEventListener('input', () => { updateMainTitle(); autosaveToLocal(); });
// other metadata
[monthNameInput, teacherNameInput].forEach(el => { if (el) el.addEventListener('input', autosaveToLocal); });
if (req6Input) req6Input.addEventListener('input', autosaveToLocal);
req7Inputs.forEach(i => { if (i) i.addEventListener('input', ()=>{ evaluateReq7(); autosaveToLocal(); }); });

/* ---------- initial render (default full) ---------- */
buildFullTables();
highlightModeButton();
// ensure title reflects studentName (empty -> default)
updateMainTitle();
// NOTE: intentionally not calling loadFromLocal() so page starts blank

/* ---------- expose debug helpers ---------- */
window.__debug = { calculateAllWeeks, calculateMonthlyAverage, calculateWeekAverageFull, calculateWeekAverageThree, buildFullTables, buildThreeReqTables };

/* ---------- end of file ---------- */
