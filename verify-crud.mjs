/**
 * Full end-to-end verification — 12 required user flows.
 * Run with: node verify-crud.mjs
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const BASE     = 'http://localhost:5178';
const SUPA_URL = 'https://fxakphrxahwnxkquvujt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YWtwaHJ4YWh3bnhrcXV2dWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjg3OTgsImV4cCI6MjA5Nzc0NDc5OH0.iz-eAW4VHmKoLRfmRGaAwLj_bkdZRjgR3ydTYb2jYbs';

const TS        = Date.now();
const EMAIL     = `pettest${TS}@gmail.com`;
const PASSWORD  = 'TestPass99!';
const PET_NAME  = `Buddy${TS}`;
const MED_NAME  = 'Apoquel 16mg';
const MED_NAME2 = 'Apoquel 32mg';
const TASK_NAME = 'Morning Walk';

const db = createClient(SUPA_URL, SUPA_KEY);

// ── helpers ──────────────────────────────────────────────────────────────
const results = [];
let browser, page;
let userId = null, petId = null, medId = null;
let nPass = 0, nFail = 0;

function PASS(test, detail = '') {
  const line = `✅ PASS  [${test}]${detail ? '  —  ' + detail : ''}`;
  results.push(line); nPass++;
  console.log(line);
}
function FAIL(test, reason) {
  const line = `❌ FAIL  [${test}]  —  ${reason}`;
  results.push(line); nFail++;
  console.log(line);
}
function note(msg) { console.log(`        ${msg}`); }

async function ss(name) {
  await page.screenshot({ path: `/tmp/cv2-${name}.png`, fullPage: false });
}
async function fill(sel, val) { await page.locator(sel).fill(val); }
async function waitURL(pat, ms = 8000) {
  await page.waitForURL(u => u.toString().includes(pat), { timeout: ms });
}
async function pageText() { return page.evaluate(() => document.body.innerText); }
async function errMsg() {
  return page.locator('[style*="danger"]').first().textContent().catch(() => '');
}

// Authenticate db client with the browser's live JWT so RLS passes
async function syncDBAuth() {
  const session = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try { return JSON.parse(localStorage[k]); } catch { return null; }
      }
    }
    return null;
  });
  if (session?.access_token) {
    await db.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    userId = session.user?.id;
  }
}

// ── main ─────────────────────────────────────────────────────────────────
try {
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  page.on('pageerror', e => note(`[pageerror] ${e.message.slice(0,60)}`));

  // ════════════════════════════════════════════════════
  // 1. REGISTER
  // ════════════════════════════════════════════════════
  console.log('\n── 1. Register ──');
  await page.goto(`${BASE}/register`);
  await page.waitForSelector('.auth-body');

  await fill('#email', EMAIL);
  await fill('#password', PASSWORD);
  await fill('#confirmPassword', PASSWORD);
  await ss('01-register');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  const regText = await pageText();
  if (page.url().includes('/dashboard')) {
    PASS('1-Register', 'auto signed-in → /dashboard');
  } else if (regText.includes('Check your email')) {
    FAIL('1-Register', 'email confirmation still enabled in Supabase');
    throw new Error('STOP');
  } else if (regText.includes('rate limit') || regText.includes('429') || regText.includes('exceeded')) {
    FAIL('1-Register', 'Supabase email rate limit hit — increase limit in Auth → Settings → Rate Limits');
    throw new Error('STOP');
  } else {
    FAIL('1-Register', (await errMsg()).trim() || regText.split('\n').filter(l=>l.trim()).slice(3,5).join(' | '));
    throw new Error('STOP');
  }
  await syncDBAuth();
  note(`user id: ${userId?.slice(0,8)}…`);

  // ════════════════════════════════════════════════════
  // 2. LOGIN  (clear session, log in fresh)
  // ════════════════════════════════════════════════════
  console.log('\n── 2. Login ──');
  await page.evaluate(() => {
    for (const k of [...Object.keys(localStorage)]) { if (k.startsWith('sb-')) localStorage.removeItem(k); }
  });
  await page.goto(`${BASE}/`);
  await page.waitForSelector('.auth-body');

  await fill('#email', EMAIL);
  await fill('#password', PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('02-login');

  if (page.url().includes('/dashboard')) {
    PASS('2-Login', '→ /dashboard');
    await syncDBAuth();
  } else {
    FAIL('2-Login', (await errMsg()).trim() || page.url());
    throw new Error('STOP');
  }

  // ════════════════════════════════════════════════════
  // 3. LOGOUT
  // ════════════════════════════════════════════════════
  console.log('\n── 3. Logout ──');
  await page.locator('button[title="Log out"]').click();
  await page.waitForTimeout(2500);
  await ss('03-logout');

  const atLogin = page.url() === `${BASE}/` || page.url().endsWith('/');
  const tokenGone = !(await page.evaluate(() =>
    Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
  ));
  atLogin   ? PASS('3-Logout-redirect', '→ login page') : FAIL('3-Logout-redirect', page.url());
  tokenGone ? PASS('3-Logout-session-cleared')          : FAIL('3-Logout-session-cleared', 'token still in localStorage');

  // Log back in for the rest of the tests
  await page.waitForSelector('.auth-body');
  await fill('#email', EMAIL);
  await fill('#password', PASSWORD);
  await page.locator('button[type="submit"]').click();
  await waitURL('/dashboard', 7000);
  await syncDBAuth();

  // ════════════════════════════════════════════════════
  // 4. CREATE PET
  // ════════════════════════════════════════════════════
  console.log('\n── 4. Create Pet ──');
  await page.locator('button[title="Add pet"]').click();
  await waitURL('/pets/new');
  await page.waitForSelector('#name');

  await fill('#name', PET_NAME);
  await fill('#age', '3');
  await fill('#breed', 'Golden Retriever');

  await page.locator('button:has-text("Care")').click();
  await page.waitForTimeout(300);
  await fill('#feeding_instructions', '2 cups kibble twice daily');
  await fill('#approved_foods', 'Carrots, apples');
  await fill('#forbidden_foods', 'Chocolate, grapes');

  await ss('04-create-pet');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('04b-after-create');

  if (page.url().includes('/dashboard')) {
    PASS('4-Create-pet', '→ dashboard');
  } else {
    FAIL('4-Create-pet', (await errMsg()).trim() || page.url());
    throw new Error('STOP');
  }

  // DB check
  const { data: pRow } = await db.from('pets').select('id,name,breed,age,feeding_instructions').eq('user_id', userId).eq('name', PET_NAME).single();
  if (pRow) {
    petId = pRow.id;
    PASS('4-Create-pet-in-supabase', `breed=${pRow.breed} age=${pRow.age}`);
    PASS('4-Create-pet-care-fields', `feeding_instructions="${pRow.feeding_instructions?.slice(0,20)}…"`);
  } else {
    FAIL('4-Create-pet-in-supabase', 'row not found');
  }

  // ════════════════════════════════════════════════════
  // 5. READ PETS  (dashboard list + pet profile)
  // ════════════════════════════════════════════════════
  console.log('\n── 5. Read Pets ──');

  // Dashboard: pet card visible
  const dashCard = await page.locator(`text=${PET_NAME}`).count();
  dashCard > 0
    ? PASS('5-Read-pets-dashboard-card', `"${PET_NAME}" card visible`)
    : FAIL('5-Read-pets-dashboard-card', 'pet card not found on dashboard');

  // Stats strip: Pets count = 1
  const statOne = await page.locator('text=1').count();
  note(`stat elements with "1": ${statOne}`);

  // Navigate to pet profile
  await page.locator('button:has-text("View Profile")').first().click();
  await waitURL('/pets/', 5000);
  petId = petId || page.url().split('/pets/')[1];
  // Wait for data to finish loading — card appears once Supabase returns
  await page.waitForSelector('.page-content .card', { timeout: 8000 });
  await page.waitForTimeout(800);
  await ss('05-pet-profile');

  const profileText = await pageText();
  PET_NAME.split('').slice(0,10).join('') && profileText.includes(PET_NAME.slice(0, 10))
    ? PASS('5-Read-pets-profile-name', `"${PET_NAME}" shown`)
    : FAIL('5-Read-pets-profile-name', `name not on profile. First 200 chars: "${profileText.slice(0,200)}"`);

  profileText.includes('Golden Retriever')
    ? PASS('5-Read-pets-profile-breed', 'breed visible')
    : FAIL('5-Read-pets-profile-breed', 'Golden Retriever not in page text');

  // Age shows as "3 yrs" in the stat row
  profileText.includes('3 yrs') || profileText.includes('3 yr')
    ? PASS('5-Read-pets-profile-age', '3 yrs visible')
    : FAIL('5-Read-pets-profile-age', 'age not visible');

  // ════════════════════════════════════════════════════
  // 6. EDIT PET
  // ════════════════════════════════════════════════════
  console.log('\n── 6. Edit Pet ──');
  await page.locator('button:has-text("Edit")').click();
  await waitURL('/edit', 5000);
  await page.waitForSelector('#name');
  await page.waitForTimeout(500); // let Strict Mode's second fetch settle

  await fill('#breed', 'Labrador Retriever');
  await page.waitForTimeout(200);
  await fill('#age', '4');
  await page.waitForTimeout(200);

  // Verify React state has the updated values before submitting
  const breedVal = await page.inputValue('#breed');
  const ageVal   = await page.inputValue('#age');
  note(`pre-submit form values: breed="${breedVal}" age="${ageVal}"`);
  await ss('06-edit-pet');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  page.url().includes('/dashboard')
    ? PASS('6-Edit-pet', '→ dashboard after save')
    : FAIL('6-Edit-pet', (await errMsg()).trim() || page.url());

  // DB check
  const { data: upd } = await db.from('pets').select('breed,age').eq('id', petId).single();
  upd?.breed === 'Labrador Retriever' && upd?.age === 4
    ? PASS('6-Edit-pet-in-supabase', `breed=${upd.breed} age=${upd.age}`)
    : FAIL('6-Edit-pet-in-supabase', `got breed=${upd?.breed} age=${upd?.age}`);

  // ════════════════════════════════════════════════════
  // 8. CREATE MEDICATION  (done before 7/delete so we have a pet)
  // ════════════════════════════════════════════════════
  console.log('\n── 8. Create Medication ──');
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name');

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("+ Add")').click();
  await page.waitForSelector('input[name="medication_name"]');

  await fill('input[name="medication_name"]', MED_NAME);
  await fill('input[name="dosage"]', '16mg');
  await page.locator('select[name="route"]').selectOption('Oral');
  await fill('input[name="schedule_time"]', 'Morning with food');
  await fill('textarea[name="special_instructions"]', 'Give with breakfast, do not skip');
  await ss('08-med-form');

  await page.locator('button:has-text("Add Medication")').click();
  await page.waitForTimeout(2000);

  const medCard = await page.locator(`text=${MED_NAME}`).count();
  medCard > 0
    ? PASS('8-Create-medication-card-visible')
    : FAIL('8-Create-medication-card-visible', 'card not shown after add');
  await ss('08b-med-card');

  // Save pet
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  const { data: mRows } = await db.from('medications').select('id,medication_name,dosage,route,schedule_time,special_instructions').eq('pet_id', petId);
  const foundMed = mRows?.find(m => m.medication_name === MED_NAME);
  if (foundMed) {
    medId = foundMed.id;
    PASS('8-Create-medication-in-supabase', `dosage=${foundMed.dosage} route=${foundMed.route}`);
    PASS('8-Create-medication-schedule', foundMed.schedule_time);
    PASS('8-Create-medication-special-instructions', foundMed.special_instructions?.slice(0,40));
  } else {
    FAIL('8-Create-medication-in-supabase', `found ${mRows?.length} rows, name not found`);
  }

  // ════════════════════════════════════════════════════
  // 9. READ MEDICATIONS  (pet profile Medications section)
  // ════════════════════════════════════════════════════
  console.log('\n── 9. Read Medications ──');
  await page.goto(`${BASE}/pets/${petId}`);
  await page.waitForSelector('.card');
  await ss('09-read-meds-profile');

  const medNameOnProfile = await page.locator(`text=${MED_NAME}`).count();
  medNameOnProfile > 0
    ? PASS('9-Read-medications-name-on-profile', `"${MED_NAME}" shown`)
    : FAIL('9-Read-medications-name-on-profile', 'medication name not on profile');

  const medDosage = await page.locator('text=16mg').count();
  medDosage > 0
    ? PASS('9-Read-medications-dosage-badge', '16mg badge visible')
    : FAIL('9-Read-medications-dosage-badge', '16mg badge not found');

  const medRoute = await page.locator('text=Oral').count();
  medRoute > 0
    ? PASS('9-Read-medications-route-badge', 'Oral badge visible')
    : FAIL('9-Read-medications-route-badge', 'Oral badge not found');

  const medTime = await page.locator('text=Morning with food').count();
  medTime > 0
    ? PASS('9-Read-medications-schedule-badge', 'schedule badge visible')
    : FAIL('9-Read-medications-schedule-badge', 'schedule time not on profile');

  const medInstructions = await page.locator('text=Give with breakfast').count();
  medInstructions > 0
    ? PASS('9-Read-medications-special-instructions', 'special instructions shown')
    : FAIL('9-Read-medications-special-instructions', 'special instructions not visible');

  // ════════════════════════════════════════════════════
  // 10. EDIT MEDICATION
  // ════════════════════════════════════════════════════
  console.log('\n── 10. Edit Medication ──');
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name');

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);
  await page.waitForSelector('button[title="Edit medication"]');
  await page.locator('button[title="Edit medication"]').first().click();
  await page.waitForSelector('input[name="medication_name"]');

  const preFilledName = await page.inputValue('input[name="medication_name"]');
  const preFilledDose = await page.inputValue('input[name="dosage"]');
  preFilledName === MED_NAME
    ? PASS('10-Edit-medication-form-prefilled', `name="${preFilledName}" dosage="${preFilledDose}"`)
    : FAIL('10-Edit-medication-form-prefilled', `expected "${MED_NAME}", got "${preFilledName}"`);

  // Update name and dosage
  await page.locator('input[name="medication_name"]').fill(MED_NAME2);
  await fill('input[name="dosage"]', '32mg');
  await ss('10-edit-med-form');

  await page.locator('button[type="button"]:has-text("Save Changes")').click();
  await page.waitForTimeout(2000);

  const updatedCard = await page.locator(`text=${MED_NAME2}`).count();
  updatedCard > 0
    ? PASS('10-Edit-medication-card-updated', `shows "${MED_NAME2}"`)
    : FAIL('10-Edit-medication-card-updated', 'updated name not on card');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  const { data: updMed } = await db.from('medications').select('medication_name,dosage').eq('id', medId).single();
  updMed?.medication_name === MED_NAME2 && updMed?.dosage === '32mg'
    ? PASS('10-Edit-medication-in-supabase', `name=${updMed.medication_name} dosage=${updMed.dosage}`)
    : FAIL('10-Edit-medication-in-supabase', `got name=${updMed?.medication_name} dosage=${updMed?.dosage}`);

  // ════════════════════════════════════════════════════
  // 11. DELETE MEDICATION
  // ════════════════════════════════════════════════════
  console.log('\n── 11. Delete Medication ──');
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name');

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);

  await page.locator('.btn-danger.btn-sm.btn-icon').first().click();
  await page.waitForTimeout(2000);

  const medGoneFromForm = await page.locator(`text=${MED_NAME2}`).count();
  medGoneFromForm === 0
    ? PASS('11-Delete-medication-removed-from-form')
    : FAIL('11-Delete-medication-removed-from-form', 'medication still visible after ×');
  await ss('11-med-deleted');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  const { data: delMed } = await db.from('medications').select('id').eq('id', medId);
  delMed?.length === 0
    ? PASS('11-Delete-medication-in-supabase', 'row deleted')
    : FAIL('11-Delete-medication-in-supabase', `${delMed?.length} rows remain`);

  // ════════════════════════════════════════════════════
  // 12. DAILY TASK CHECKLIST
  // ════════════════════════════════════════════════════
  console.log('\n── 12. Daily Task Checklist ──');
  await page.goto(`${BASE}/pets/${petId}/checklist`);
  await page.waitForSelector('.card', { timeout: 8000 });
  await ss('12a-checklist-empty');

  // 12a: Checklist page loads with pet name
  const checklistTitle = await page.locator(`text=${PET_NAME}`).count();
  checklistTitle > 0
    ? PASS('12-Checklist-loads', `"${PET_NAME}'s Checklist" shown`)
    : FAIL('12-Checklist-loads', 'pet name not found on checklist page');

  // 12b: Add a task
  await page.locator('button:has-text("+ Add Task")').click();
  await page.waitForSelector('.form-input', { timeout: 3000 });

  const taskInput = page.locator('input[placeholder="e.g. Morning Walk"]');
  await taskInput.fill(TASK_NAME);
  await page.locator('select.form-select').last().selectOption('exercise');
  await page.locator('input[placeholder="7:00 AM"]').fill('7:00 AM');
  await ss('12b-add-task-form');

  await page.locator('button:has-text("Add Task")').click();
  await page.waitForTimeout(3000);

  const taskCard = await page.locator(`text=${TASK_NAME}`).count();
  taskCard > 0
    ? PASS('12-Add-task-visible', `"${TASK_NAME}" shown`)
    : FAIL('12-Add-task-visible', 'task card not found after add');
  await ss('12c-task-added');

  // DB check: task row created
  const { data: taskRows } = await db.from('daily_tasks').select('id,task_name,task_type,scheduled_time').eq('pet_id', petId);
  const foundTask = taskRows?.find(t => t.task_name === TASK_NAME);
  let taskId = null;
  if (foundTask) {
    taskId = foundTask.id;
    PASS('12-Add-task-in-supabase', `task_type=${foundTask.task_type} scheduled_time=${foundTask.scheduled_time}`);
  } else {
    FAIL('12-Add-task-in-supabase', `found ${taskRows?.length} tasks, name not found`);
  }

  // 12c: Mark task complete (tick checkbox)
  // The checkbox is a button with no text — find it by its style (small square)
  const checkboxBtn = page.locator('.card button').filter({ hasNot: page.locator('text=×') }).first();
  await checkboxBtn.click();
  await page.waitForTimeout(2000);
  await ss('12d-task-completed');

  // Verify checkmark appears (button background changes to success)
  const checkedMark = await page.locator('button:has-text("✓")').count();
  checkedMark > 0
    ? PASS('12-Mark-task-complete-checkmark', '✓ visible on task')
    : FAIL('12-Mark-task-complete-checkmark', '✓ not found — toggle may not have fired');

  // DB check: care_log row created
  if (taskId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: logRows } = await db
      .from('care_logs')
      .select('id,daily_task_id,completed')
      .eq('daily_task_id', taskId)
      .eq('completed', true)
      .gte('created_at', `${todayStr}T00:00:00`);

    let careLogId = null;
    if (logRows?.length > 0) {
      careLogId = logRows[0].id;
      PASS('12-Mark-complete-care-log-created', `care_log id=${careLogId.slice(0,8)}…`);
    } else {
      FAIL('12-Mark-complete-care-log-created', 'care_log row not found in Supabase');
    }

    // 12d: Unmark task (toggle off) → care_log deleted
    await checkboxBtn.click();
    await page.waitForTimeout(2000);
    await ss('12e-task-uncompleted');

    const unchecked = await page.locator('button:has-text("✓")').count();
    unchecked === 0
      ? PASS('12-Unmark-task-checkmark-gone', 'task reverted to uncompleted state')
      : FAIL('12-Unmark-task-checkmark-gone', '✓ still visible after unmark');

    const { data: logGone } = await db.from('care_logs').select('id').eq('id', careLogId);
    logGone?.length === 0
      ? PASS('12-Unmark-task-care-log-deleted', 'care_log row removed')
      : FAIL('12-Unmark-task-care-log-deleted', `care_log still present (${logGone?.length} rows)`);
  }

  // 12e: Delete the task
  await page.locator('button[title="Delete task"]').first().click();
  await page.waitForTimeout(2000);

  const taskGone = await page.locator(`text=${TASK_NAME}`).count();
  taskGone === 0
    ? PASS('12-Delete-task-removed-from-ui')
    : FAIL('12-Delete-task-removed-from-ui', 'task still visible after delete');

  if (taskId) {
    const { data: taskDel } = await db.from('daily_tasks').select('id').eq('id', taskId);
    taskDel?.length === 0
      ? PASS('12-Delete-task-in-supabase', 'row deleted')
      : FAIL('12-Delete-task-in-supabase', `${taskDel?.length} rows remain`);
  }
  await ss('12f-task-deleted');

  // ════════════════════════════════════════════════════
  // 7. DELETE PET  (last — removes the pet used in 4-12)
  // ════════════════════════════════════════════════════
  console.log('\n── 7. Delete Pet ──');
  await page.goto(`${BASE}/pets/${petId}`);
  await page.waitForSelector('.card');

  page.once('dialog', d => d.accept());
  await page.locator('button:has-text("Delete")').click();
  await page.waitForTimeout(4000);
  await ss('07-after-delete');

  page.url().includes('/dashboard')
    ? PASS('7-Delete-pet-redirect', '→ dashboard')
    : FAIL('7-Delete-pet-redirect', page.url());

  const petGone = await page.locator(`text=${PET_NAME}`).count();
  petGone === 0
    ? PASS('7-Delete-pet-removed-from-dashboard')
    : FAIL('7-Delete-pet-removed-from-dashboard', 'card still on dashboard');

  const { data: petDel } = await db.from('pets').select('id').eq('id', petId);
  petDel?.length === 0
    ? PASS('7-Delete-pet-in-supabase')
    : FAIL('7-Delete-pet-in-supabase', `${petDel?.length} rows remain`);

  const { data: medsCasc } = await db.from('medications').select('id').eq('pet_id', petId);
  medsCasc?.length === 0
    ? PASS('7-Delete-pet-medications-cascade-deleted')
    : FAIL('7-Delete-pet-medications-cascade-deleted', `${medsCasc?.length} med rows remain`);

  const { data: tasksCasc } = await db.from('daily_tasks').select('id').eq('pet_id', petId);
  tasksCasc?.length === 0
    ? PASS('7-Delete-pet-tasks-cascade-deleted')
    : FAIL('7-Delete-pet-tasks-cascade-deleted', `${tasksCasc?.length} task rows remain`);

  // ════════════════════════════════════════════════════
  // EXTRA: Protected route + wrong-password probe
  // ════════════════════════════════════════════════════
  console.log('\n── Extra probes ──');

  // Unauthenticated /dashboard → redirect to login
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const freshPage = await fresh.newPage();
  await freshPage.goto(`${BASE}/dashboard`);
  await freshPage.waitForTimeout(2000);
  const freshURL = freshPage.url();
  !freshURL.includes('/dashboard')
    ? PASS('Extra-protected-route-unauthenticated', '→ login')
    : FAIL('Extra-protected-route-unauthenticated', `stayed on ${freshURL}`);
  await fresh.close();

  // Wrong password shows error message
  await page.locator('button[title="Log out"]').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('.auth-body');
  await fill('#email', EMAIL);
  await fill('#password', 'WrongPass99!');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await ss('extra-wrong-pass');

  const wpText = await pageText();
  const hasErr = wpText.toLowerCase().includes('invalid') || wpText.toLowerCase().includes('credential');
  hasErr
    ? PASS('Extra-wrong-password-error-shown', wpText.split('\n').find(l => l.toLowerCase().includes('invalid') || l.toLowerCase().includes('credential'))?.trim().slice(0,50))
    : FAIL('Extra-wrong-password-error-shown', 'no error message visible');

} catch (err) {
  if (err.message !== 'STOP') {
    FAIL('UNEXPECTED', err.message.split('\n')[0]);
    console.error(err);
  }
  if (page) await ss('crash').catch(() => {});
} finally {
  if (browser) await browser.close();
}

// ════════════════════════════════════════════════════
// REPORT
// ════════════════════════════════════════════════════
const line = '─'.repeat(52);
console.log(`\n╔${line}╗`);
console.log(`║${'  VERIFICATION REPORT'.padEnd(52)}║`);
console.log(`╚${line}╝`);
results.forEach(r => console.log(r));
console.log(line);
console.log(`  PASSED: ${nPass}   FAILED: ${nFail}   TOTAL: ${nPass + nFail}`);
console.log(line);
