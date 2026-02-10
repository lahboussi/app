/* script.js - محدث
   - جدول كامل (5 متطلبات) — default
   - جدول 3 متطلبات منفصل (req: 1,2,5 with coeffs 5,7,5)
   - toggle modes, saving/loading both modes
   - present circle behavior
   - req7 logic: any "سيء" -> -1 ; all "جيد" -> +1
   - START FRESH ON EACH PAGE LOAD: saved key is removed immediately and no automatic loadFromLocal()
*/

const COEFFICIENTS_FULL = [5,7,1,2,5]; // req1..req5
const COEFFICIENTS_THREE = [5,7,5];     // for req1,req2,req5 (we'll map them)
const DAYS = ['السّبت','الأحد','الإثنين','الثّلاثاء','الأربعاء','الخميس'];

const STORAGE_KEY = 'student_ave_current_v2';

// --- Ensure a fresh start on every page load ---
// Remove the stored student data immediately so refresh starts blank.
try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }

/* DOM refs */
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

/* mode state */
let currentMode = 'full'; // 'full' or 'three'
let totalWeeks = 4;
let currentWeek = 1;

/* req7 state */
let varGood = false;
let varBad = false;

/* hold references to created cards for each mode to ease toggling */
const fullCards = {};
const threeCards = {};

/* ---- helpers ---- */
function q(sel) { return document.querySelector(sel); }
function qAll(sel) { return Array.from(document.querySelectorAll(sel)); }

/* toggle monthly comment bubble */
monthlyCommentBtn && monthlyCommentBtn.addEventListener('click', () => {
  monthlyCommentBubble.classList.toggle('hidden');
  if (!monthlyCommentBubble.classList.contains('hidden')) monthlyCommentText.focus();
});

/* wire quick-set buttons (جيد/سيء) */
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t.matches && t.matches('.req7-btn')) {
    const val = t.dataset.set;
    const forId = t.dataset.for;
    const input = document.getElementById(forId);
    if (input) {
      input.value = val;
      input.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }
});

/* build and render tables for full mode (5 reqs) */
function buildFullTables() {
  weeksContainer.innerHTML = ''; // clear
  for (let w = 1; w <= totalWeeks; w++) {
    const card = buildWeekTableFull(w);
    fullCards[w] = card;
    weeksContainer.appendChild(card);
  }
  showOnlyWeek(currentWeek, 'full');
}

/* build and render tables for three-req mode (3 reqs) */
function buildThreeReqTables() {
  weeksContainer.innerHTML = '';
  for (let w = 1; w <= totalWeeks; w++) {
    const card = buildWeekTableThree(w);
    threeCards[w] = card;
    weeksContainer.appendChild(card);
  }
  showOnlyWeek(currentWeek, 'three');
}

/* show only one week card depending on mode */
function showOnlyWeek(wIndex, mode) {
  currentWeek = wIndex;
  for (let w = 1; w <= totalWeeks; w++) {
    const full = fullCards[w];
    const three = threeCards[w];
    if (full) full.style.display = (mode === 'full' ? (w === wIndex ? 'block' : 'none') : 'none');
    if (three) three.style.display = (mode === 'three' ? (w === wIndex ? 'block' : 'none') : 'none');
  }
  const lab = document.getElementById('currentWeekLabel');
  if (lab) lab.textContent = `الأسبوع ${currentWeek}`;
}

/* navigation */
document.getElementById('prevWeekBtn').addEventListener('click', () => {
  if (currentWeek > 1) showOnlyWeek(currentWeek-1, currentMode);
});
document.getElementById('nextWeekBtn').addEventListener('click', () => {
  if (currentWeek < totalWeeks) showOnlyWeek(currentWeek+1, currentMode);
});

/* build full week card (5 requirements) */
function buildWeekTableFull(weekIndex) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `full-week-${weekIndex}`;

  const h = document.createElement('h3'); h.textContent = `الأسبوع ${weekIndex}`; card.appendChild(h);

  const table = document.createElement('table');
  const thead = document.createElement('thead'); const trh = document.createElement('tr');
  trh.appendChild(thCell('الأيام'));
  ['الحفظ و التّلخيص','المراجعة','حفظ المتن و الحديث','مراجعة المتن','السّلوك'].forEach(t => trh.appendChild(thCell(t)));
  thead.appendChild(trh); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let d=0; d<DAYS.length; d++) {
    const tr = document.createElement('tr');
    const tdDay = document.createElement('td'); tdDay.style.position='relative';
    const dayLabel = document.createElement('span'); dayLabel.textContent = DAYS[d];
    const icon = document.createElement('span'); icon.className='day-comment-icon'; icon.textContent='🗨️';
    const bubble = document.createElement('div'); bubble.className='comment-bubble';
    const ta = document.createElement('textarea'); ta.placeholder='اكتب ملاحظة اليوم...';
    ta.dataset.week = weekIndex; ta.dataset.day = d; ta.addEventListener('input', autosaveToLocal);
    bubble.appendChild(ta);
    icon.addEventListener('click', (e)=>{ e.stopPropagation(); qAll('.comment-bubble').forEach(b=>b!==bubble && (b.style.display='none')); bubble.style.display = bubble.style.display==='block' ? 'none' : 'block'; });
    document.addEventListener('click', ()=>bubble.style.display='none');
    tdDay.appendChild(icon); tdDay.appendChild(dayLabel); tdDay.appendChild(bubble);
    tr.appendChild(tdDay);

    for (let req=1; req<=5; req++) {
      const td = document.createElement('td');
      if (d===5 && req===3) { td.className='black-cell'; td.innerHTML=''; }
      else {
        const inp = document.createElement('input'); inp.type='number'; inp.step='any'; inp.min=0;
        inp.className='input-cell'; inp.dataset.week=weekIndex; inp.dataset.day=d; inp.dataset.req=req;
        inp.addEventListener('input', autosaveToLocal);
        td.appendChild(inp);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  // coeff row
  const trCoef = document.createElement('tr'); trCoef.appendChild(tdCell('المعاملات','coef-cell'));
  COEFFICIENTS_FULL.forEach(c => trCoef.appendChild(tdCell(c,'coef-cell')));
  tbody.appendChild(trCoef);

  // averages row
  const trAvg = document.createElement('tr'); trAvg.appendChild(tdCell('المجموع','avg-cell'));
  for (let r=1;r<=5;r++){
    const td = tdCell('-', 'avg-cell'); const sp = document.createElement('span'); sp.id = `full-w${weekIndex}-avg-r${r}`; sp.textContent='-';
    td.innerHTML=''; td.appendChild(sp); trAvg.appendChild(td);
  }
  tbody.appendChild(trAvg);

  table.appendChild(tbody); card.appendChild(table);

  const btn = document.createElement('button'); btn.textContent=`حساب معدّل الأسبوع ${weekIndex}`;
  btn.addEventListener('click', ()=>{ const avg = calculateWeekAverageFull(weekIndex); displayWeekAverageCard(card,avg); updateWeekAveragesDisplay(); autosaveToLocal(); });
  card.appendChild(btn);

  return card;
}

/* build three-req week card (columns: الحفظ, المراجعة, السلوك) */
function buildWeekTableThree(weekIndex) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.id = `three-week-${weekIndex}`;

  const h = document.createElement('h3'); h.textContent = `الأسبوع ${weekIndex} `; card.appendChild(h);

  const table = document.createElement('table');
  const thead = document.createElement('thead'); const trh = document.createElement('tr');
  trh.appendChild(thCell('الأيام'));
  ['الحفظ و التّلخيص','المراجعة','السّلوك'].forEach(t => trh.appendChild(thCell(t)));
  thead.appendChild(trh); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let d=0; d<DAYS.length; d++) {
    const tr = document.createElement('tr');
    const tdDay = document.createElement('td'); tdDay.style.position='relative';
    const dayLabel = document.createElement('span'); dayLabel.textContent = DAYS[d];
    const icon = document.createElement('span'); icon.className='day-comment-icon'; icon.textContent='🗨️';
    const bubble = document.createElement('div'); bubble.className='comment-bubble';
    const ta = document.createElement('textarea'); ta.placeholder='اكتب ملاحظة اليوم...';
    ta.dataset.week = weekIndex; ta.dataset.day = d; ta.addEventListener('input', autosaveToLocal);
    bubble.appendChild(ta);
    icon.addEventListener('click', (e)=>{ e.stopPropagation(); qAll('.comment-bubble').forEach(b=>b!==bubble && (b.style.display='none')); bubble.style.display = bubble.style.display==='block' ? 'none' : 'block'; });
    document.addEventListener('click', ()=>bubble.style.display='none');
    tdDay.appendChild(icon); tdDay.appendChild(dayLabel); tdDay.appendChild(bubble);
    tr.appendChild(tdDay);

    // three inputs mapped to req1, req2, req5 (we store data-req as 1,2,5 to make mapping easier)
    [1,2,5].forEach(req => {
      const td = document.createElement('td');
      if (d===5 && req===3) { td.className='black-cell'; td.innerHTML=''; } // not really used here
      else {
        const inp = document.createElement('input'); inp.type='number'; inp.step='any'; inp.min=0;
        inp.className='input-cell'; inp.dataset.week=weekIndex; inp.dataset.day=d; inp.dataset.req=req;
        inp.addEventListener('input', autosaveToLocal);
        td.appendChild(inp);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }

  // coeff row
  const trCoef = document.createElement('tr'); trCoef.appendChild(tdCell('المعاملات','coef-cell'));
  COEFFICIENTS_THREE.forEach(c => trCoef.appendChild(tdCell(c,'coef-cell')));
  tbody.appendChild(trCoef);

  // averages row for 3 reqs (ids map to three-w{w}-avg-r{req})
  const trAvg = document.createElement('tr'); trAvg.appendChild(tdCell('المجموع','avg-cell'));
  [1,2,5].forEach(req => {
    const td = tdCell('-', 'avg-cell');
    const sp = document.createElement('span'); sp.id = `three-w${weekIndex}-avg-r${req}`; sp.textContent='-';
    td.innerHTML=''; td.appendChild(sp); trAvg.appendChild(td);
  });
  tbody.appendChild(trAvg);

  table.appendChild(tbody); card.appendChild(table);

  const btn = document.createElement('button'); btn.textContent=`حساب معدّل الأسبوع ${weekIndex} (3 متطلبات)`;
  btn.addEventListener('click', ()=>{ const avg = calculateWeekAverageThree(weekIndex); displayWeekAverageCard(card,avg); updateWeekAveragesDisplay(); autosaveToLocal(); });
  card.appendChild(btn);

  return card;
}

/* small helpers to create table cells */
function thCell(text) { const th=document.createElement('th'); th.textContent=text; return th; }
function tdCell(text, cls='') { const td=document.createElement('td'); if (cls) td.className=cls; td.textContent=text; return td; }
function displayWeekAverageCard(card, avg) {
  let display = card.querySelector('.week-average-display');
  if (!display) {
    display = document.createElement('div'); display.className='week-average-display'; display.style.marginTop='8px'; display.style.fontWeight='700'; card.appendChild(display);
  }
  display.textContent = `Week ${currentWeek} average: ${isNaN(avg) ? '-' : avg.toFixed(2)}`;
}

/* ---- calculation: full mode (5 reqs) ---- */
function calculateWeekAverageFull(weekIndex) {
  const perReq = [];
  for (let req=1; req<=5; req++) {
    if (req===3) { // req3 uses denom 5 (Thursday removed)
      let sum = 0;
      for (let d=0; d<DAYS.length; d++) {
        if (d===5 && req===3) continue;
        const inp = document.querySelector(`input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
        const val = inp && inp.value !== '' ? parseFloat(inp.value) : 0;
        sum += isNaN(val) ? 0 : val;
      }
      const avg = (sum * COEFFICIENTS_FULL[req-1]) / 5;
      perReq.push(avg);
      const el = document.getElementById(`full-w${weekIndex}-avg-r${req}`); if (el) el.textContent = isNaN(avg) ? '-' : avg.toFixed(2);
    } else {
      let sum = 0;
      for (let d=0; d<DAYS.length; d++) {
        const inp = document.querySelector(`input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
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
  const weekAvg = denom === 0 ? 0 : numerator / denom;
  return weekAvg;
}

/* ---- calculation: three-req mode (req 1,2,5) ---- */
function calculateWeekAverageThree(weekIndex) {
  const reqs = [1,2,5];
  const perReq = [];
  for (const req of reqs) {
    // req 1 and 2 and 5 use denom 6 (no special black cell)
    let sum = 0;
    for (let d=0; d<DAYS.length; d++) {
      const inp = document.querySelector(`input[data-week="${weekIndex}"][data-day="${d}"][data-req="${req}"]`);
      const val = inp && inp.value !== '' ? parseFloat(inp.value) : 0;
      sum += isNaN(val) ? 0 : val;
    }
    // map coefficient: req 1->5, req2->7, req5->5
    const coef = (req===1||req===5) ? 5 : 7;
    const avg = (sum * coef) / 6;
    perReq.push({req,avg,coef});
    const el = document.getElementById(`three-w${weekIndex}-avg-r${req}`); if (el) el.textContent = isNaN(avg) ? '-' : avg.toFixed(2);
  }

  const numerator = perReq.reduce((a,b)=>a + b.avg,0);
  const denom = perReq.reduce((a,b)=>a + b.coef,0); // should be 17
  const weekAvg = denom === 0 ? 0 : numerator / denom;
  return weekAvg;
}

/* calculate all weeks depending on mode */
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

/* update week averages display (string) */
function updateWeekAveragesDisplay(mode = currentMode) {
  const weekAvgs = [];
  for (let w=1; w<=totalWeeks; w++) {
    const card = (mode==='full') ? fullCards[w] : threeCards[w];
    const display = card ? card.querySelector('.week-average-display') : null;
    if (display) {
      const match = display.textContent.match(/average:\s*([0-9.\-]+)/i);
      const num = match ? parseFloat(match[1]) : NaN;
      weekAvgs.push(isNaN(num) ? '-' : num.toFixed(2));
    } else weekAvgs.push('-');
  }
  weekAveragesDisplay.textContent = weekAvgs.join(' | ');
}

/* evaluate req7 (unchanged logic) */
function normalizeArabic(s){ if (!s && s !== 0) return ''; return String(s).trim(); }
function evaluateReq7() {
  const vals = req7Inputs.map(i=>normalizeArabic(i.value));
  varGood=false; varBad=false;
  for (const v of vals) { if (!v) continue; if (v.indexOf('سيء')!==-1) { varBad=true; break; } }
  if (!varBad) {
    const allGood = vals.length>0 && vals.every(v=>v==='جيد');
    if (allGood) varGood=true;
  }
  if (varBad) return 'bad';
  if (varGood) return 'good';
  return '';
}

/* monthly calculation:
   - for full mode: use same formula as before
   - for three mode: adapt denominator scaling (we use explicit denom for three: 44.23 scaled)
   Implementation: compute numerator = (sumWeeks * 8) + (req6 * 10)
   For full: monthly = numerator / 44.23
   For three: scale denom by (sumCoeffs_chosen / sumCoeffs_full)
*/
function calculateMonthlyAverage(mode = currentMode) {
  const weeks = calculateAllWeeks(mode);
  const sumWeeks = weeks.reduce((a,b)=>a + (isNaN(b)?0:b),0);
  const req6 = req6Input && req6Input.value !== '' ? parseFloat(req6Input.value) : 0;
  const numerator = (sumWeeks * 8) + (req6 * 10);

  const totalCoeffsFull = COEFFICIENTS_FULL.reduce((a,b)=>a+b,0); // full total
  let chosenSum = totalCoeffsFull;
  if (mode === 'three') chosenSum = 5+7+5; // 17
  const denomScale = chosenSum / totalCoeffsFull;
  const denominator = 44.23 * denomScale;
  let monthly = denominator === 0 ? 0 : numerator / denominator;

  // req7 adjustment
  const status = evaluateReq7();
  if (status === 'good') monthly += 1;
  else if (status === 'bad') monthly -= 1;

  const final = isNaN(monthly) ? '-' : Number(monthly.toFixed(2));
  monthlyAvgDisplay.textContent = (final === '-') ? '-' : final.toFixed(2);
  autosaveToLocal();
  return final;
}

/* ---- saving & loading ---- */

function buildDataObject() {
  const data = {
    meta: {
      student: studentNameInput.value || '',
      month: monthNameInput.value || '',
      teacher: teacherNameInput.value || '',
      title: document.getElementById('main-title').textContent || ''
    },
    mode: currentMode, // 'full' or 'three'
    weeksFull: {},
    weeksThree: {},
    req6: req6Input.value || '',
    req7: req7Inputs.map(i=>i.value||''),
    weekAveragesFull: [],
    weekAveragesThree: [],
    monthlyDisplay: monthlyAvgDisplay.textContent || '',
    comments: {
      comment1: document.getElementById('comment1').value || '',
      comment2: document.getElementById('comment2').value || '',
      comment3: document.getElementById('comment3').value || ''
    },
    dayCommentsFull: {},
    dayCommentsThree: {},
    monthlyComment: monthlyCommentText.value || '',
    present: {
      line1: presentLine1 ? presentLine1.value || '' : '',
      line2: presentLine2 ? presentLine2.value || '' : ''
    }
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

  // week averages (extract if present)
  for (let w=1; w<=totalWeeks; w++) {
    const fullCard = fullCards[w];
    const dispF = fullCard ? fullCard.querySelector('.week-average-display') : null;
    const valF = dispF ? (dispF.textContent.match(/average:\s*([0-9.\-]+)/i) || [])[1] || '' : '';
    data.weekAveragesFull.push(valF);

    const threeCard = threeCards[w];
    const dispT = threeCard ? threeCard.querySelector('.week-average-display') : null;
    const valT = dispT ? (dispT.textContent.match(/average:\s*([0-9.\-]+)/i) || [])[1] || '' : '';
    data.weekAveragesThree.push(valT);
  }

  // day comments full / three (they share same textareas but in this implementation we created separate textareas per card, we'll collect whichever exists)
  data.dayCommentsFull = {};
  data.dayCommentsThree = {};
  for (let w=1; w<=totalWeeks; w++) {
    data.dayCommentsFull[`week${w}`] = {};
    data.dayCommentsThree[`week${w}`] = {};
    for (let d=0; d<DAYS.length; d++) {
      const taF = document.querySelector(`#full-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
      if (taF && taF.value.trim() !== '') data.dayCommentsFull[`week${w}`][`day${d}`] = taF.value;
      const taT = document.querySelector(`#three-week-${w} textarea[data-week="${w}"][data-day="${d}"]`);
      if (taT && taT.value.trim() !== '') data.dayCommentsThree[`week${w}`][`day${d}`] = taT.value;
    }
  }

  return data;
}

function autosaveToLocal() {
  try {
    const data = buildDataObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) { console.error('Autosave failed', err); }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    populateFromData(data);
  } catch (err) { console.error('Load failed', err); }
}

/* populate UI from saved data */
function populateFromData(data) {
  if (!data) return;
  studentNameInput.value = data.meta?.student || '';
  monthNameInput.value = data.meta?.month || '';
  teacherNameInput.value = data.meta?.teacher || '';
  if (data.meta?.title) document.getElementById('main-title').textContent = data.meta.title;

  // set mode
  currentMode = data.mode || 'full';
  if (currentMode === 'full') { buildFullTables(); } else { buildThreeReqTables(); }

  // fill full weeks
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

  // fill three weeks
  for (let w=1; w<=totalWeeks; w++) {
    const weekArr = data.weeksThree?.[`week${w}`] || [];
    for (let d=0; d<DAYS.length; d++) {
      const row = weekArr[d] || [];
      // row corresponds to [req1,req2,req5]
      const reqs = [1,2,5];
      for (let idx=0; idx<reqs.length; idx++) {
        const req = reqs[idx];
        const val = row[idx] !== undefined ? row[idx] : '';
        const inp = document.querySelector(`#three-week-${w} input[data-week="${w}"][data-day="${d}"][data-req="${req}"]`);
        if (inp) inp.value = val;
      }
    }
  }

  // req6, req7, comments
  req6Input.value = data.req6 || '';
  req7Inputs.forEach((el,idx) => el.value = (data.req7 && data.req7[idx]) ? data.req7[idx] : '');
  if (data.comments) {
    document.getElementById('comment1').value = data.comments.comment1 || '';
    document.getElementById('comment2').value = data.comments.comment2 || '';
    document.getElementById('comment3').value = data.comments.comment3 || '';
  }

  // day comments (prefer full then three)
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

  monthlyCommentText.value = data.monthlyComment || '';
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

  if (data.monthlyDisplay) monthlyAvgDisplay.textContent = data.monthlyDisplay;
  if (data.present) {
    if (presentLine1) presentLine1.value = data.present.line1 || '';
    if (presentLine2) presentLine2.value = data.present.line2 || '';
  }

  // set currentMode button states (visual hint)
  highlightModeButton();
  updateWeekAveragesDisplay(currentMode);
}

/* download / open JSON */
function downloadDataAsFile() {
  const data = buildDataObject();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const student = (data.meta.student || 'student').replace(/\s+/g,'_');
  const month = (data.meta.month || 'month').replace(/\s+/g,'_');
  a.href = url; a.download = `${student}_${month}_marks.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

fileInput && fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (f) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const obj = JSON.parse(e.target.result);
        populateFromData(obj);
        autosaveToLocal();
        alert('Student data loaded.');
      } catch (err) { alert('Invalid JSON file'); }
    };
    reader.readAsText(f);
  }
  fileInput.value = '';
});

/* wire top buttons */
saveBtn && saveBtn.addEventListener('click', () => downloadDataAsFile());
openBtn && openBtn.addEventListener('click', () => fileInput.click());

/* calc buttons */
calcAllWeeksBtn && calcAllWeeksBtn.addEventListener('click', () => { calculateAllWeeks(); alert('All weeks calculated and displayed.'); });
calcMonthlyBtn && calcMonthlyBtn.addEventListener('click', () => { const v = calculateMonthlyAverage(); alert(`Monthly average: ${isNaN(v)?'-':v.toFixed(2)}`); });
calc3ReqBtn && calc3ReqBtn.addEventListener('click', () => { const v = calculateMonthlyAverage(currentMode==='full' ? 'three' : currentMode); alert(`معدل 3 المتطلبات: ${isNaN(v)?'-':v.toFixed(2)}`); });

/* mode toggle buttons */
useFullTableBtn && useFullTableBtn.addEventListener('click', () => { currentMode='full'; buildFullTables(); highlightModeButton(); autosaveToLocal(); });
useThreeReqBtn && useThreeReqBtn.addEventListener('click', () => { currentMode='three'; buildThreeReqTables(); highlightModeButton(); autosaveToLocal(); });

function highlightModeButton() {
  if (currentMode==='full') {
    useFullTableBtn.style.opacity = '1'; useThreeReqBtn.style.opacity = '0.6';
  } else {
    useFullTableBtn.style.opacity = '0.6'; useThreeReqBtn.style.opacity = '1';
  }
}

/* present circle behavior */
presentBtn && presentBtn.addEventListener('click', () => {
  // show the circle ready for filling (do not auto-load stored data because page starts fresh)
  if (presentLine1) presentLine1.value = presentLine1.value || ''; // keep existing in-session value
  if (presentLine2) presentLine2.value = presentLine2.value || '';
  presentCircle.classList.remove('hidden');
  presentCircle.setAttribute('aria-hidden','false');
  if (presentLine1) presentLine1.focus();
});
closePresentBtn && closePresentBtn.addEventListener('click', ()=>{ presentCircle.classList.add('hidden'); presentCircle.setAttribute('aria-hidden','true'); });
savePresentBtn && savePresentBtn.addEventListener('click', ()=>{ autosaveToLocal(); presentCircle.classList.add('hidden'); presentCircle.setAttribute('aria-hidden','true'); alert('بيانات العرض محفوظة لهذا الطالب.'); });

/* autosave triggers */
[studentNameInput, monthNameInput, teacherNameInput].forEach(el => el && el.addEventListener('input', autosaveToLocal));
req6Input && req6Input.addEventListener('input', autosaveToLocal);
req7Inputs.forEach(i => i.addEventListener('input', ()=>{ evaluateReq7(); autosaveToLocal(); }));

/* initial build (default full mode) */
buildFullTables();
highlightModeButton();
// NOTE: intentionally do NOT call loadFromLocal() here so the page starts blank on every reload.

/* autosave on every change via buildDataObject called by inputs */

/* ---- utilities to calculate three/full monthly with req7 effect applied ---- */
/* calculateMonthlyAverage overloaded above */

/* helper: clear localStorage (removed automatic clear) */
/* export for console debug if needed */
window.__debug = { calculateAllWeeks, calculateMonthlyAverage, calculateWeekAverageFull, calculateWeekAverageThree, buildFullTables, buildThreeReqTables };

/* ---- end of file ---- */
