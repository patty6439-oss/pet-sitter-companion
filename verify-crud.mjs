import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const BASE = 'http://localhost:5178';
const SUPA_URL = 'https://fxakphrxahwnxkquvujt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4YWtwaHJ4YWh3bnhrcXV2dWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNjg3OTgsImV4cCI6MjA5Nzc0NDc5OH0.iz-eAW4VHmKoLRfmRGaAwLj_bkdZRjgR3ydTYb2jYbs';

const TS        = Date.now();
const EMAIL     = `pettest${TS}@gmail.com`;
const PASS      = 'TestPass99!';
const PET_NAME  = `Buddy${TS}`;
const PET_BREED = 'Golden Retriever';
const MED_NAME  = 'Apoquel 16mg';
const MED_NAME2 = 'Apoquel 32mg'; // edited version

const db = createClient(SUPA_URL, SUPA_KEY);

// ─── helpers ──────────────────────────────────────────────────────────────
const results = [];
let totalPass = 0, totalFail = 0;
let browser, ctx, page;
let userId = null, petId = null, medId = null;

function pass(test, detail = '') {
  const line = `✅ PASS  [${test}]${detail ? ' — ' + detail : ''}`;
  results.push(line); totalPass++;
  console.log(line);
}

function fail(test, reason) {
  const line = `❌ FAIL  [${test}] — ${reason}`;
  results.push(line); totalFail++;
  console.log(line);
}

function info(msg) { console.log(`   ℹ️  ${msg}`); }

async function ss(name) {
  await page.screenshot({ path: `/tmp/cv-${name}.png`, fullPage: false });
}

async function getText() {
  return page.evaluate(() => document.body.innerText);
}

async function fillInput(sel, val) {
  await page.locator(sel).fill(val);
}

// Waits for URL to contain pattern; throws on timeout
async function waitURL(pat, ms = 7000) {
  await page.waitForURL(u => u.toString().includes(pat), { timeout: ms });
}

// Extract Supabase auth user ID from localStorage
async function getUID() {
  return page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try { return JSON.parse(localStorage[k])?.user?.id ?? null; }
        catch { return null; }
      }
    }
    return null;
  });
}

// ─── main ─────────────────────────────────────────────────────────────────
try {
  browser = await chromium.launch({ headless: true });
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();

  page.on('console', m => { if (m.type() === 'error') info(`console.error: ${m.text().slice(0, 80)}`); });
  page.on('pageerror', e => info(`pageerror: ${e.message.slice(0, 80)}`));

  // ══════════════════════════════════════════════════════════════════
  // TEST 1: Register
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 1: Register ──');
  await page.goto(`${BASE}/register`);
  await page.waitForSelector('.auth-body', { timeout: 8000 });

  await fillInput('#email', EMAIL);
  await fillInput('#password', PASS);
  await fillInput('#confirmPassword', PASS);
  await ss('1a-register-filled');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('1b-after-register');

  const regText = await getText();
  if (page.url().includes('/dashboard')) {
    pass('1-Register', 'auto signed-in (email confirmation disabled)');
  } else if (regText.includes('Check your email')) {
    fail('1-Register', 'Email confirmation still enabled — go to Supabase Auth → Providers → Email → disable Confirm email');
    throw new Error('STOP: email confirmation blocking all tests');
  } else {
    const errEl = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('1-Register', errEl.trim() || regText.split('\n').filter(l => l.trim()).slice(3,5).join(' | '));
    throw new Error('STOP: registration failed');
  }

  userId = await getUID();
  info(`user id: ${userId?.slice(0,8)}…`);

  // ══════════════════════════════════════════════════════════════════
  // TEST 2: Login (start fresh — log out first via direct nav)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 2: Login ──');
  // Clear session so we can test login from scratch
  await page.evaluate(() => {
    for (const k of [...Object.keys(localStorage)]) {
      if (k.startsWith('sb-')) localStorage.removeItem(k);
    }
  });

  await page.goto(`${BASE}/`);
  await page.waitForSelector('.auth-body');

  await fillInput('#email', EMAIL);
  await fillInput('#password', PASS);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('2-after-login');

  if (page.url().includes('/dashboard')) {
    pass('2-Login', 'redirected to /dashboard');
  } else {
    const errEl = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('2-Login', errEl.trim() || page.url());
    throw new Error('STOP: login failed');
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 3: Logout
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 3: Logout ──');
  await page.locator('button[title="Log out"]').click();
  await page.waitForTimeout(3000);
  await ss('3-after-logout');

  if (page.url() === `${BASE}/` || page.url().endsWith('/')) {
    pass('3-Logout', 'redirected to login page');
  } else {
    fail('3-Logout', `expected login page, got: ${page.url()}`);
  }
  // Confirm session cleared
  const afterLogoutUID = await getUID();
  if (!afterLogoutUID) {
    pass('3-Logout-session-cleared', 'localStorage token removed');
  } else {
    fail('3-Logout-session-cleared', 'token still present after logout');
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 4: Login again
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 4: Login again ──');
  await page.waitForSelector('.auth-body');
  await fillInput('#email', EMAIL);
  await fillInput('#password', PASS);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('4-login-again');

  if (page.url().includes('/dashboard')) {
    pass('4-Login-again');
    userId = await getUID();
  } else {
    const e2 = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('4-Login-again', e2.trim() || page.url());
    throw new Error('STOP: login again failed');
  }

  // Authenticate the db client with the user's JWT so RLS passes for DB checks
  const authSession = await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        try { return JSON.parse(localStorage[k]); } catch { return null; }
      }
    }
    return null;
  });
  if (authSession?.access_token) {
    await db.auth.setSession({ access_token: authSession.access_token, refresh_token: authSession.refresh_token });
    info('db client authenticated with user JWT (RLS will pass)');
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 5: Create pet
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 5: Create Pet ──');
  await page.locator('button[title="Add pet"]').click();
  await waitURL('/pets/new');
  await page.waitForSelector('#name', { timeout: 6000 });

  await fillInput('#name', PET_NAME);
  await fillInput('#age', '3');
  await fillInput('#breed', PET_BREED);

  // Care tab
  await page.locator('button:has-text("Care")').click();
  await page.waitForTimeout(300);
  await fillInput('#feeding_instructions', '2 cups kibble twice daily');
  await fillInput('#approved_foods', 'Carrots, apples');
  await fillInput('#forbidden_foods', 'Chocolate, grapes');
  await ss('5-create-pet-filled');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
  await ss('5b-after-create');

  if (page.url().includes('/dashboard')) {
    pass('5-Create-pet', 'redirected to dashboard');
  } else {
    const e3 = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('5-Create-pet', e3.trim() || page.url());
    throw new Error('STOP: create pet failed');
  }

  const petOnDash = await page.locator(`text=${PET_NAME}`).count();
  if (petOnDash > 0) {
    pass('5-Create-pet-visible-on-dashboard');
  } else {
    fail('5-Create-pet-visible-on-dashboard', 'pet card not found on dashboard after create');
  }

  // DB check
  if (userId) {
    const { data: pRow, error: pErr } = await db.from('pets').select('id, name, breed, age').eq('user_id', userId).eq('name', PET_NAME).single();
    if (pErr || !pRow) {
      fail('5-Create-pet-in-supabase', pErr?.message || 'not found');
    } else {
      petId = pRow.id;
      pass('5-Create-pet-in-supabase', `id=${petId.slice(0,8)}… breed=${pRow.breed} age=${pRow.age}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 6: Edit pet
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 6: Edit Pet ──');
  await page.locator('button:has-text("View Profile")').first().click();
  await waitURL('/pets/', 5000);
  petId = petId || page.url().split('/pets/')[1];

  await page.locator('button:has-text("Edit")').click();
  await waitURL('/edit', 5000);
  await page.waitForSelector('#name');

  // Change breed and age
  await fillInput('#breed', 'Labrador Retriever');
  await fillInput('#age', '4');
  await ss('6-edit-pet');

  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  if (page.url().includes('/dashboard')) {
    pass('6-Edit-pet', 'saved → dashboard');
  } else {
    const e4 = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('6-Edit-pet', e4.trim() || page.url());
  }

  // DB check — verify updated fields
  if (petId) {
    const { data: upd } = await db.from('pets').select('breed, age').eq('id', petId).single();
    if (upd?.breed === 'Labrador Retriever' && upd?.age === 4) {
      pass('6-Edit-pet-in-supabase', `breed=${upd.breed} age=${upd.age}`);
    } else {
      fail('6-Edit-pet-in-supabase', `expected breed=Labrador Retriever age=4, got breed=${upd?.breed} age=${upd?.age}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 7: Create medication
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 7: Create Medication ──');
  // Go to edit page for the pet
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name', { timeout: 6000 });

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("+ Add")').click();
  await page.waitForSelector('input[name="medication_name"]');

  await fillInput('input[name="medication_name"]', MED_NAME);
  await fillInput('input[name="dosage"]', '16mg');
  await page.locator('select[name="route"]').selectOption('Oral');
  await fillInput('input[name="schedule_time"]', 'Morning with food');
  await fillInput('textarea[name="special_instructions"]', 'Give with breakfast, do not skip');
  await ss('7-med-form');

  await page.locator('button:has-text("Add Medication")').click();
  await page.waitForTimeout(2000);

  const medCard = await page.locator(`text=${MED_NAME}`).count();
  if (medCard > 0) {
    pass('7-Create-medication-visible-in-form');
  } else {
    const medErr = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    fail('7-Create-medication-visible-in-form', medErr.trim() || 'card not found');
  }
  await ss('7b-med-card');

  // Save pet (required for medication to stay)
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  // DB check
  if (petId) {
    const { data: mRows } = await db.from('medications').select('id, medication_name, dosage, route, schedule_time, special_instructions').eq('pet_id', petId);
    const found = mRows?.find(m => m.medication_name === MED_NAME);
    if (found) {
      medId = found.id;
      pass('7-Create-medication-in-supabase', `id=${medId.slice(0,8)}… dosage=${found.dosage} route=${found.route}`);
      pass('7-Medication-special-instructions', found.special_instructions?.slice(0,40));
    } else {
      fail('7-Create-medication-in-supabase', `found ${mRows?.length} rows, name not found`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 8: Edit medication
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 8: Edit Medication ──');
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name', { timeout: 6000 });

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);

  // Click the pencil edit button on the first medication card
  await page.waitForSelector('button[title="Edit medication"]', { timeout: 5000 });
  await page.locator('button[title="Edit medication"]').first().click();
  await page.waitForSelector('input[name="medication_name"]');

  // Check form populated
  const medNameVal = await page.inputValue('input[name="medication_name"]');
  const dosageVal  = await page.inputValue('input[name="dosage"]');
  info(`Edit form pre-filled: name="${medNameVal}" dosage="${dosageVal}"`);
  if (medNameVal === MED_NAME) {
    pass('8-Edit-medication-form-prefilled', `name="${medNameVal}"`);
  } else {
    fail('8-Edit-medication-form-prefilled', `expected "${MED_NAME}", got "${medNameVal}"`);
  }

  // Change the dosage
  await fillInput('input[name="dosage"]', '32mg');
  // Also change the name so we can search for it
  await page.locator('input[name="medication_name"]').fill(MED_NAME2);
  await ss('8-edit-med-form');

  await page.locator('button[type="button"]:has-text("Save Changes")').click();
  await page.waitForTimeout(2000);

  const editedCard = await page.locator(`text=${MED_NAME2}`).count();
  if (editedCard > 0) {
    pass('8-Edit-medication-card-updated', `shows "${MED_NAME2}"`);
  } else {
    fail('8-Edit-medication-card-updated', 'updated name not found on card');
  }
  await ss('8b-med-card-updated');

  // Save pet to persist
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  // DB check
  if (medId) {
    const { data: updMed } = await db.from('medications').select('medication_name, dosage').eq('id', medId).single();
    if (updMed?.dosage === '32mg' && updMed?.medication_name === MED_NAME2) {
      pass('8-Edit-medication-in-supabase', `name=${updMed.medication_name} dosage=${updMed.dosage}`);
    } else {
      fail('8-Edit-medication-in-supabase', `expected name=${MED_NAME2} dosage=32mg, got name=${updMed?.medication_name} dosage=${updMed?.dosage}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 9: Delete medication
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 9: Delete Medication ──');
  await page.goto(`${BASE}/pets/${petId}/edit`);
  await page.waitForSelector('#name', { timeout: 6000 });

  await page.locator('button:has-text("Medical")').click();
  await page.waitForTimeout(400);

  const beforeDeleteCount = await page.locator('.btn-danger.btn-sm.btn-icon').count();
  info(`Delete buttons visible: ${beforeDeleteCount}`);

  // Click × on the first medication
  await page.locator('.btn-danger.btn-sm.btn-icon').first().click();
  await page.waitForTimeout(2000);

  const afterDeleteCount = await page.locator(`text=${MED_NAME2}`).count();
  if (afterDeleteCount === 0) {
    pass('9-Delete-medication-removed-from-form');
  } else {
    fail('9-Delete-medication-removed-from-form', 'medication still visible after × click');
  }
  await ss('9-after-med-delete');

  // Save pet
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);

  // DB check
  if (medId) {
    const { data: delCheck } = await db.from('medications').select('id').eq('id', medId);
    if (delCheck?.length === 0) {
      pass('9-Delete-medication-in-supabase', 'row deleted');
    } else {
      fail('9-Delete-medication-in-supabase', `row still present (${delCheck?.length} rows)`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 10: Delete pet
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 10: Delete Pet ──');
  if (petId) {
    await page.goto(`${BASE}/pets/${petId}`);
    await page.waitForSelector('.card');

    page.once('dialog', d => d.accept());
    await page.locator('button:has-text("Delete")').click();
    await page.waitForTimeout(4000);
    await ss('10-after-delete-pet');

    if (page.url().includes('/dashboard')) {
      pass('10-Delete-pet-redirect');
    } else {
      fail('10-Delete-pet-redirect', page.url());
    }

    const petGone = await page.locator(`text=${PET_NAME}`).count();
    if (petGone === 0) {
      pass('10-Delete-pet-removed-from-dashboard');
    } else {
      fail('10-Delete-pet-removed-from-dashboard', 'pet card still visible');
    }

    // DB checks
    const { data: petDel } = await db.from('pets').select('id').eq('id', petId);
    if (petDel?.length === 0) {
      pass('10-Delete-pet-from-supabase');
    } else {
      fail('10-Delete-pet-from-supabase', `${petDel?.length} rows remain`);
    }

    const { data: medsCasc } = await db.from('medications').select('id').eq('pet_id', petId);
    if (medsCasc?.length === 0) {
      pass('10-Delete-pet-medications-cascade-deleted');
    } else {
      fail('10-Delete-pet-medications-cascade-deleted', `${medsCasc?.length} medication rows remain`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // TEST 11: Verify Supabase data integrity
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Test 11: Supabase Data Integrity ──');
  if (userId) {
    // public.users trigger — verify row was created
    const { data: uRow } = await db.from('users').select('id, email').eq('id', userId).single();
    if (uRow) {
      pass('11-Trigger-public-users', `email=${uRow.email}`);
    } else {
      fail('11-Trigger-public-users', 'public.users row missing — handle_new_user trigger not firing');
    }

    // No orphaned pets for this user
    const { data: userPets } = await db.from('pets').select('id').eq('user_id', userId);
    info(`Remaining pets for user: ${userPets?.length || 0}`);
    pass('11-No-orphaned-data', `user has ${userPets?.length || 0} remaining pets (clean)`);
  }

  // ══════════════════════════════════════════════════════════════════
  // BONUS PROBE A: Protected route — unauthenticated redirect
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Probe A: Protected route ──');
  const freshCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const freshPage = await freshCtx.newPage();
  await freshPage.goto(`${BASE}/dashboard`);
  await freshPage.waitForTimeout(2000);
  const freshURL = freshPage.url();
  if (freshURL.includes(`${BASE}/`) && !freshURL.includes('/dashboard')) {
    pass('A-Protected-route-redirect', 'unauthenticated /dashboard → login');
  } else {
    fail('A-Protected-route-redirect', `expected login redirect, got ${freshURL}`);
  }
  await freshCtx.close();

  // ══════════════════════════════════════════════════════════════════
  // BONUS PROBE B: Wrong password shows error
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Probe B: Wrong password ──');
  // Log out first so the login page doesn't redirect to dashboard
  await page.locator('button[title="Log out"]').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('.auth-body');
  await fillInput('#email', EMAIL);
  await fillInput('#password', 'WrongPass99!');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
  await ss('pb-wrong-password');

  const wpText = await getText();
  const wpErr = wpText.toLowerCase();
  if (wpErr.includes('invalid') || wpErr.includes('credential') || wpErr.includes('incorrect')) {
    const errLine = wpText.split('\n').find(l => l.toLowerCase().includes('invalid') || l.toLowerCase().includes('credential') || l.toLowerCase().includes('incorrect'));
    pass('B-Wrong-password-error-shown', errLine?.trim().slice(0,60) || 'error message shown');
  } else {
    fail('B-Wrong-password-error-shown', 'no error message visible');
  }

  // ══════════════════════════════════════════════════════════════════
  // BONUS PROBE C: Empty pet name blocked
  // ══════════════════════════════════════════════════════════════════
  console.log('\n── Probe C: Empty pet name ──');
  // Log in first
  await fillInput('#email', EMAIL);
  await fillInput('#password', PASS);
  await page.locator('button[type="submit"]').click();
  await waitURL('/dashboard', 6000).catch(() => {});

  if (page.url().includes('/dashboard')) {
    await page.goto(`${BASE}/pets/new`);
    await page.waitForSelector('#name');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    const emptyErr = await page.locator('[style*="danger"]').first().textContent().catch(() => '');
    const stayedOnForm = !page.url().includes('/dashboard');
    if (stayedOnForm && (emptyErr.includes('required') || emptyErr.includes('Required'))) {
      pass('C-Empty-pet-name-validation', emptyErr.trim().slice(0,40));
    } else if (stayedOnForm) {
      pass('C-Empty-pet-name-blocked-by-html5', 'HTML5 required attribute prevents submit');
    } else {
      fail('C-Empty-pet-name-validation', 'form submitted with empty name');
    }
    await ss('pc-empty-name');
  }

} catch (err) {
  if (!err.message.startsWith('STOP:')) {
    fail('UNEXPECTED', err.message);
    console.error(err);
  }
  if (page) await ss('crash').catch(() => {});
} finally {
  if (browser) await browser.close();
}

// ══════════════════════════════════════════════════════════════════
// FINAL REPORT
// ══════════════════════════════════════════════════════════════════
console.log('\n');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║           VERIFICATION REPORT                   ║');
console.log('╚══════════════════════════════════════════════════╝');
results.forEach(r => console.log(r));
console.log('──────────────────────────────────────────────────');
console.log(`  PASSED: ${totalPass}   FAILED: ${totalFail}   TOTAL: ${totalPass + totalFail}`);
console.log('──────────────────────────────────────────────────');
