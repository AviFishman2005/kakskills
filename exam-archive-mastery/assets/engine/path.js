/* ================= learning path: state, sync, scheduling, player ================= */
const PATH = (function(){
  const NM = NORM.M;
  /* ---------- configuration ---------- */
  const UNITS = [
    {id: 'sql', name: 'SQL', pts: 20, c: 'sql', line: 'כל מבחן כתוב: שתי שאילתות, בדרך כלל 20 נקודות ביחד.', skills: [
      {id: 's.nx', key: 'nx', name: '„אף״, „מעולם לא״, „רק״', short: 'not exists', what: 'שלילה על „קיים״: תת-שאילתה מתואמת בתוך not exists.'},
      {id: 's.gh', key: 'gh', name: '„לפחות״, „בדיוק״, „שונים״', short: 'group by + having', what: 'ספירה או סכום לכל קבוצה, ותנאי על הקבוצה ב-having.'},
      {id: 's.all', key: 'all', name: '„הכי הרבה״, כולל שוויון', short: '>= all', what: 'מקסימום או מינימום בלי limit ובלי max מקונן: השוואה לכל הערכים של אותה שאילתה מקובצת.'},
      {id: 's.div', key: 'div', name: '„כל״', short: 'חילוק', what: '„מכר כל ספר ש…״ = אין ספר ש… שלא נמכר: not exists כפול.'}]},
    {id: 'trigger', name: 'טריגרים', pts: 8.7, c: 'trigger', line: 'כמעט כל מבחן כתוב מאז 2019: טריגר אחד, כ-10 נקודות. שומר או מעדכן.', skills: [
      {id: 't.kind', kind: 'gen', mod: 'TRIG', key: 'kind', name: 'before או after, ומה מחזירים', short: 'סוג הטריגר', what: 'טריגר שדוחה שורה הוא before עם return null. טריגר שמעדכן טבלה אחרת הוא after.'},
      {id: 't.line', kind: 'gen', mod: 'TRIG', key: 'line', name: 'השורה החסרה בפתרון', short: 'שורה חסרה', what: 'פתרונות אמיתיים מהמבחנים, עם שורה אחת חסרה. האפשרויות השגויות הן טעויות שירדו עליהן נקודות.'},
      {id: 't.trace', kind: 'gen', mod: 'TRIG', key: 'trace', name: 'מה יקרה בטבלה', short: 'מעקב', what: 'מריצים טריגר בראש על כמה הכנסות: מה נכנס, מה נדחה, ומה הערך בסוף.'}]},
    {id: 'algebra', name: 'אלגברה', pts: 18.6, c: 'algebra', line: 'כל מבחן כתוב: ביטוי לכתוב, ולפעמים גם תוצאה לחשב על טבלאות.', skills: [
      {id: 'a.join', kind: 'ra', key: 'join', name: 'בחירה, הטלה וצירוף', short: 'σ π ⋈', what: 'צירוף טבעי או עם תנאי, ρ כשאותה טבלה מופיעה פעמיים, ו-∪ לאיחוד.'},
      {id: 'a.diff', kind: 'ra', key: 'diff', name: '„אף״, „רק״: הפרש', short: '−', what: '„מעולם לא״ = מי שיכול, פחות מי שכן עשה.'},
      {id: 'a.div', kind: 'ra', key: 'div', name: '„כל״: חילוק', short: '÷', what: 'זוגות ÷ הקבוצה שצריך לכסות.'},
      {id: 'a.max', kind: 'ra', key: 'max', name: 'מקסימום בלי צבירה', short: 'max', what: 'כולם, פחות מי שיש מישהו גדול ממנו: מכפלה של הטבלה עם עצמה.'},
      {id: 'a.calc', kind: 'gen', mod: 'ALG', key: 'calc', name: 'חישוב תוצאה על טבלאות', short: 'חישוב', what: 'מחשבים ביטוי על טבלאות קטנות, מבפנים החוצה, כמו ב-2024ג וב-2020ג.'}]},
    {id: 'norm', name: 'נרמול', pts: 20, c: 'norm', line: 'כל מבחן: שאלה של 20 נקודות, עם מפתחות כמעט תמיד.', skills: [
      {id: 'n.closure', key: 'closure', name: 'סגור ותלות נובעת', short: 'X⁺', what: 'מתחילים מ-X ומפעילים תלויות עד שאין שינוי. כל השאר בנוי על זה.'},
      {id: 'n.keys', key: 'keys', name: 'מפתחות קבילים', short: 'מפתחות', what: 'מיון תכונות לפי צד ימין ושמאל, ובדיקת סגורים מהקטן לגדול.'},
      {id: 'n.canon', key: 'canon', name: 'כיסוי קנוני', short: 'Fc', what: 'מוחקים תכונות עודפות משני הצדדים ותלויות מיותרות, ומאחדים צדדים שמאליים.'},
      {id: 'n.nf', key: 'nf', name: 'צורה נורמלית של R', short: 'BCNF / 3NF', what: 'בכל תלות: האם צד שמאל מפתח-על, ואם לא, האם צד ימין ראשוני.'},
      {id: 'n.lossless', key: 'lossless', name: 'שימור מידע', short: 'שימור מידע', what: 'החיתוך צריך להיות מפתח-על של אחת הטבלאות.'},
      {id: 'n.dp', key: 'dp', name: 'שימור תלויות', short: 'שימור תלויות', what: 'כל תלות בטבלה אחת, או נגזרת דרך כמה טבלאות. בודקים בסגור.'},
      {id: 'n.decomp', key: 'decomp', name: 'פירוק משמר מידע ותלויות', short: 'פירוק', what: 'אלגוריתם 3NF מהכיסוי הקנוני, טבלת מפתח אם צריך, ובדיקת BCNF לכל טבלה.'}]},
    {id: 'er', name: 'ישויות-קשרים', pts: 18.6, c: 'er', line: 'כל מבחן: דיאגרמה לשרטט, וטענות נכון/לא נכון עליה.', skills: [
      {id: 'e.keys', kind: 'gen', mod: 'ERQ', key: 'keys', name: 'לקרוא חץ וקו כפול', short: 'סימונים', what: 'חץ = לכל היותר אחד. קו כפול = לפחות אחד. ומה זה אומר על המפתח של טבלת הקשר.'},
      {id: 'e.tables', kind: 'gen', mod: 'ERQ', key: 'tables', name: 'מהטבלאות לדיאגרמה', short: 'תבניות', what: 'מה המפתח של כל טבלה מגלה: ישות חזקה, חלשה, קשר רבים-לרבים, הכללה או מפתח זר.'},
      {id: 'e.read', kind: 'gen', mod: 'ERQ', key: 'read', name: 'טענות נכון/לא נכון', short: 'טענות', what: 'הטענות האמיתיות מהמבחנים, על הדיאגרמות שלהם.'}]},
    {id: 'index', name: 'עץ B+ וגיבוב', pts: 8.3, c: 'bplus', line: 'כל מבחן כתוב: אחד מהשניים, כ-10 נקודות.', skills: [
      {id: 'i.bplus', kind: 'gen', mod: 'IDX', key: 'bplus', name: 'הכנסות לעץ B+', short: 'B+', what: 'פיצול עלה מעתיק את הערך להורה. פיצול צומת פנימי מעביר אותו למעלה.'},
      {id: 'i.hash', kind: 'gen', mod: 'IDX', key: 'hash', name: 'גיבוב מתרחב', short: 'גיבוב', what: 'סל מלא: אם j = i מכפילים את המדריך, ואז מפצלים לפי הסיבית הבאה.'},
      {id: 'i.calc', kind: 'gen', mod: 'IDX', key: 'calc', name: 'חישובי מבנה', short: 'חישובים', what: 'מספר עלים, n מגודל דף, וגודל מדריך מינימלי.'}]},
    {id: 'estimate', name: 'הערכת גודל', pts: 6, c: 'estimate', line: 'בחלק מהמבחנים: סעיף של 5–10 נקודות.', skills: [
      {id: 'x.est', kind: 'gen', mod: 'EST', key: 'est', name: 'הערכת מספר השורות', short: 'n/V', what: 'בחירה: n/V. אחרי בחירה: V = min(V, |σ|). צירוף: n·n / max(V, V).'},
      {id: 'x.bounds', kind: 'gen', mod: 'EST', key: 'bounds', name: 'מינימום ומקסימום', short: 'חסמים', what: 'מה המקרה הקיצוני בכל כיוון: אין ערכים משותפים, או שכולם משותפים.'}]},
  ];
  const LOCKED = [];
  const SKILLS = UNITS.flatMap(u => u.skills.map(s => Object.assign(s, {unit: u.id, kind: s.kind || u.id})));
  const MODS = () => ({TRIG: GEN.TRIG, ERQ: GEN.ERQ, IDX: GEN.IDX, EST: GEN.EST, ALG: GEN.ALG});
  const modOf = s => MODS()[s.mod];
  const ladder = s => (s.kind === 'gen' && modOf(s).skills[s.key].ladder === 'mcq') ? ['example', 'hints', 'solo'] : ['example', 'complete', 'hints', 'solo'];
  const MODE_NAME = {example: 'דוגמה מוסברת', complete: 'השלמה', hints: 'פתרון עם רמזים', solo: 'פתרון לבד'};
  const rungName = (s, r) => MODE_NAME[ladder(s)[Math.min(r, ladder(s).length - 1)]];
  const SK = id => SKILLS.find(s => s.id === id);
  const isWrite = s => s.kind === 'sql' || s.kind === 'ra';
  const BANK = s => s.kind === 'ra' ? {X: RAB.X, SK: RAB.SKILLS, check: RAB.check, run: (q, ex) => RAB.run(q, ex.schema, 'A')} : {X: SQLB.X, SK: SQLB.SKILLS, check: SQLB.check, run: (q, ex) => SQLB.run(q, SQLB.data(ex.schema, 'A'))};
  function api(s){
    if (s.kind === 'norm'){ const K = NORM.SK[s.key]; return {html: q => NORM.given(q) + `<p class="pa-ask">${K.ask(q)}</p>`, input: q => K.input(q), solve: q => K.solve(q), check: (q, v, sol) => K.check(q, v, sol), mcq: NORM_MCQ[s.key], gen: seed => NORM.gen(s.key, seed), example: i => NORM.examInst(s.key, i)}; }
    const m = modOf(s); return {html: q => m.html(q), input: q => m.input(q), solve: q => m.solve(q), check: (q, v, sol) => m.check(q, v, sol), mcq: (m.mcq || {})[s.key], gen: seed => m.gen(s.key, seed), example: i => m.example(s.key, i)};
  }
  const NORM_MCQ = {
    closure: {q: 'למה עוברים על התלויות יותר מסבב אחד?', opts: ['תכונה שנוספה יכולה להפעיל תלות שלא הייתה פעילה קודם', 'כל תלות צריך להפעיל פעמיים', 'אין צורך, סבב אחד מספיק תמיד'], a: 0},
    keys: {q: 'תכונה שמופיעה רק בצד ימין של התלויות. האם היא יכולה להיות במפתח קביל?', opts: ['לא: היא נובעת מתכונות אחרות, ולכן מפתח שמכיל אותה אינו מינימלי', 'כן, תמיד', 'רק אם היא מופיעה בתלות אחת בלבד'], a: 0},
    canon: {q: 'איך בודקים אם B עודפת בצד שמאל של AB→C?', opts: ['מחשבים את A⁺ לפי כל התלויות, ובודקים אם הוא מכיל את C', 'בודקים אם AB→C כתובה ב-F פעמיים', 'בודקים אם B מופיעה בצד ימין של תלות אחרת'], a: 0},
    nf: {q: 'R ב-3NF ולא ב-BCNF. מה בהכרח נכון?', opts: ['יש תלות שצד שמאל שלה אינו מפתח-על, וכל תכונה בצד ימין שלה שייכת למפתח קביל', 'בכל תלות צד שמאל הוא מפתח-על', 'יש תכונה שלא שייכת לאף מפתח, ושנובעת מתכונה לא ראשונית'], a: 0},
    lossless: {q: 'פירוק לשתי טבלאות משמר מידע בדיוק כאשר…', opts: ['החיתוך הוא מפתח-על של אחת משתי הטבלאות', 'החיתוך הוא מפתח של R כולו', 'כל תלות נמצאת באחת הטבלאות'], a: 0},
    dp: {q: 'תלות לא כתובה בתוך אף טבלה של הפירוק. מה המסקנה?', opts: ['עדיין בודקים אם אפשר לגזור אותה דרך הטבלאות', 'היא בהכרח אובדת', 'הפירוק לא משמר מידע'], a: 0},
    decomp: {q: 'למה באלגוריתם 3NF מוסיפים טבלה עם מפתח קביל, כשאין כזו?', opts: ['כדי שהפירוק ישמור מידע', 'כדי שהפירוק ישמור תלויות', 'כדי שכל טבלה תהיה ב-BCNF'], a: 0},
  };

  /* ---------- dates ---------- */
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
  const heDate = s => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()}.${d.getMonth() + 1}`; };
  function interval(k){ // k-th review gap, shrunk to fit the exam date
    const base = [1, 3, 7][Math.min(k, 2)];
    if (!S.examDate) return base;
    const left = diffDays(today(), S.examDate);
    if (left <= 1) return 1;
    return Math.max(1, Math.min(base, Math.floor((left - 1) / (3 - Math.min(k, 2)))));
  }

  /* ---------- state and sync ---------- */
  const fresh = () => ({v: 1, updatedAt: 0, examDate: null, diag: {done: false}, skills: {}, calib: {sure: [0, 0], think: [0, 0], guess: [0, 0]}, misses: [], log: {}, drills: [0, 0], mixed: null, mixedBest: 0, ctr: 0});
  let S = fresh();
  const sk = id => S.skills[id] || (S.skills[id] = {rung: 0, sub: 0, streak: 0, lvl: 0, due: null, rev: 0, relearn: false, fails: 0, seen: {}, ok: 0, n: 0});
  function loadLocal(){ try { const v = localStorage.getItem('dbx-path'); if (v){ const o = JSON.parse(v); if (o && o.v === 1) return o; } } catch (e){} return null; }
  function saveLocal(){ try { localStorage.setItem('dbx-path', JSON.stringify(S)); } catch (e){} }
  const Sync = {status: 'local', ref: null, writing: false, pending: false, t: 0,
    async start(){
      try {
        if (!window.claude || !window.claude.use) { this.status = 'none'; return paintSync(); }
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user){ this.status = 'none'; return paintSync(); }
        const uid = await user.id(); if (!uid){ this.status = 'none'; return paintSync(); }
        this.ref = db.doc(`data/users/${uid}/path`);
        await this.pull(true);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.pull(); else if (this.t){ clearTimeout(this.t); this.push(); } });
      } catch (e){ this.status = 'error'; paintSync(); }
    },
    async pull(first){
      if (!this.ref) return;
      try { const snap = await this.ref.get(); const rem = snap.exists ? (snap.data() || {}).s : null;
        if (rem && rem.v === 1 && (rem.updatedAt || 0) > (S.updatedAt || 0)){ S = rem; saveLocal(); if (!player) renderHome(); }
        else if (S.updatedAt && (!rem || (rem.updatedAt || 0) < S.updatedAt)) await this.push();
        this.status = 'synced'; } catch (e){ this.status = 'error'; }
      paintSync();
    },
    schedule(){ clearTimeout(this.t); this.t = setTimeout(() => this.push(), 1200); },
    async push(){ if (!this.ref) return; if (this.writing){ this.pending = true; return; } this.writing = true;
      try { await this.ref.set({s: JSON.parse(JSON.stringify(S))}); this.status = 'synced'; } catch (e){ this.status = e && e.code === 'invalid_argument' ? 'readonly' : 'error'; }
      this.writing = false; paintSync(); if (this.pending){ this.pending = false; this.push(); } }
  };
  function save(){ S.updatedAt = Date.now(); saveLocal(); Sync.schedule(); }
  function paintSync(){ const el = document.getElementById('pa-sync'); if (!el) return;
    const m = {synced: ['ok', 'ההתקדמות שמורה בחשבון שלכם, וזמינה מכל מכשיר.'], local: ['wait', 'מתחבר לחשבון…'], none: ['warn', 'ההתקדמות נשמרת רק בדפדפן הזה. כדי לעבור מכשיר, השתמשו בקוד הגיבוי.'], readonly: ['warn', 'לחשבון הזה אין הרשאת כתיבה כאן. ההתקדמות נשמרת רק בדפדפן הזה.'], error: ['warn', 'השמירה בחשבון נכשלה כרגע. ההתקדמות נשמרת בדפדפן, ותסונכרן כשאפשר.']}[Sync.status] || ['wait', ''];
    el.className = 'pa-sync ' + m[0]; el.textContent = m[1]; }

  /* ---------- scoring helpers ---------- */
  const MASTERY = [0, .15, .5, .8, 1];
  const skillM = id => { const s = S.skills[id]; if (!s) return 0; const base = MASTERY[s.lvl] || 0; return s.lvl < 2 ? Math.min(.45, base + s.rung * .08) : base; };
  const unitM = u => u.skills.reduce((a, s) => a + skillM(s.id), 0) / u.skills.length;
  const readiness = () => { const act = UNITS.reduce((a, u) => a + u.pts * unitM(u), 0) / UNITS.reduce((a, u) => a + u.pts, 0);
    const all = UNITS.reduce((a, u) => a + u.pts * unitM(u), 0) / (UNITS.reduce((a, u) => a + u.pts, 0) + LOCKED.reduce((a, u) => a + u.pts, 0)); return {act, all}; };
  const isDue = id => { const s = S.skills[id]; return s && s.lvl >= 2 && s.due && s.due <= today(); };
  const learned = () => SKILLS.filter(s => (S.skills[s.id] || {}).lvl >= 2);
  const currentSkill = () => SKILLS.find(s => (S.skills[s.id] || {lvl: 0}).lvl < 2);
  const doneToday = k => S[k] && S[k].d === today();

  /* ---------- problems ---------- */
  function seedFor(id){ S.ctr = (S.ctr || 0) + 1; let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return (h ^ (S.ctr * 2654435761)) >>> 0; }
  function makeProblem(sid, mode){
    const s = SK(sid), st = sk(sid);
    if (!isWrite(s)){
      const A = api(s); let q;
      if (mode === 'example'){ q = A.example(st.exi || 0); st.exi = (st.exi || 0) + 1; }
      else { q = A.gen(seedFor(sid)); if (!q) q = A.example((st.n || 0) + 3); }
      const sol = A.solve(q); const inp = A.input(q);
      const perm = inp.type === 'mcq' && !inp.fixed && !(s.kind === 'norm') && !(s.key === 'read') ? inp.opts.map((_, i) => i).sort(() => Math.random() - .5) : null;
      return {sid, mode, kind: 'st', q, sol, hints: 0, wasLearned: st.lvl >= 2, perm};
    }
    const B = BANK(s), sq = B.SK.find(x => x.id === s.key);
    let ex;
    if (mode === 'example') ex = B.X.find(x => x.id === sq.ex);
    else if (mode === 'complete') ex = B.X.find(x => x.id === sq.comp[Math.min(st.sub, sq.comp.length - 1)]);
    else { const pool = B.X.filter(x => x.skill === s.key && x.id !== sq.ex);
      const min = Math.min(...pool.map(x => st.seen[x.id] || 0)); const cands = pool.filter(x => (st.seen[x.id] || 0) === min && x.id !== st.last);
      ex = (cands.length ? cands : pool)[Math.floor(Math.random() * (cands.length || pool.length))]; }
    return {sid, mode, kind: s.kind, ex, hints: 0, wasLearned: st.lvl >= 2, fade: mode === 'complete' ? ex.fade[Math.min(st.sub, ex.fade.length - 1)] : null};
  }
  const modeFor = sid => { const st = sk(sid), L = ladder(SK(sid)); if (st.lvl >= 2) return 'solo'; return L[Math.min(st.rung, L.length - 1)]; };

  /* ---------- recording results ---------- */
  function record(p, ok, conf){
    const st = sk(p.sid), t = today();
    S.log[t] = (S.log[t] || 0) + 1;
    const counted = ['solo', 'review', 'mixed', 'diag'].includes(p.mode);
    if (counted && conf){ S.calib[conf][1]++; if (ok) S.calib[conf][0]++; if (!ok && conf === 'sure'){ S.misses.unshift({s: p.sid, t, d: problemLabel(p)}); S.misses = S.misses.slice(0, 20); } }
    if (counted){ st.n++; if (ok) st.ok++; }
    if (p.ex){ st.seen[p.ex.id] = (st.seen[p.ex.id] || 0) + 1; st.last = p.ex.id; }
    const L = ladder(SK(p.sid)), at = m => L.indexOf(m);
    if (p.mode === 'example'){ st.rung = Math.max(st.rung, 1); st.sub = 0; st.lvl = Math.max(st.lvl, 1); }
    else if (p.mode === 'complete'){ if (ok){ st.sub++; if (st.sub >= 2){ st.rung = at('complete') + 1; st.sub = 0; } } }
    else if (p.mode === 'hints'){ if (ok){ st.rung = at('hints') + 1; st.streak = p.hints ? 0 : 1; } }
    else if (p.mode === 'solo' && st.lvl < 2){
      if (ok && !p.hints){ st.streak++; st.fails = 0; if (st.streak >= (st.relearn ? 2 : 3)){ st.lvl = 2; st.rung = 4; st.rev = 0; st.relearn = false; st.due = addDays(t, interval(0)); } }
      else { st.streak = 0; st.fails++; if (st.fails >= 2){ st.rung = at('hints'); st.fails = 0; } } }
    else if (p.mode === 'review' || (p.mode === 'solo' && st.lvl >= 2) || p.mode === 'mixed'){
      if (ok){ if (st.due && st.due <= t){ st.rev++; st.lvl = Math.min(4, 2 + st.rev); st.due = addDays(t, interval(st.rev)); } }
      else if (p.mode === 'review'){ st.lvl = 1; st.rung = at('hints'); st.streak = 0; st.relearn = true; st.due = null; }
      else { st.due = t; } }
    else if (p.mode === 'diag'){
      if (ok && conf !== 'guess'){ st.rung = at('solo'); st.streak = 1; st.lvl = 1; } else if (ok){ st.rung = at('hints'); st.lvl = 1; } else { st.rung = 0; } }
    save();
  }
  function problemLabel(p){ const s = SK(p.sid); if (p.ex) return `${s.short}: ${p.ex.src}`; if (s.kind === 'norm') return `${s.name}: ${p.q.R}, ${NORM.fds(p.q.F)}`; return `${unitOf(p.sid).name} · ${s.name}`; }

  /* ---------- sessions ---------- */
  let player = null; // {queue, i, done, results, title, kind}
  function planToday(){
    const items = [];
    SKILLS.filter(s => isDue(s.id)).forEach(s => items.push({t: 'review', sid: s.id}));
    const cur = currentSkill(); if (cur) items.push({t: 'learn', sid: cur.id});
    const L = learned();
    if (L.some(s => s.unit === 'sql') && !doneToday('drillDay')) items.push({t: 'drill'});
    if (L.length >= 2 && !doneToday('mixed')) items.push({t: 'mixed'});
    return items;
  }
  const estMin = items => items.reduce((a, it) => a + ({review: 3, learn: 15, drill: 4, mixed: 12}[it.t] || 3), 0);
  function startSession(kind, arg){
    let queue = [];
    if (kind === 'today'){ planToday().forEach(it => { if (it.t === 'review') queue.push({mode: 'review', sid: it.sid}); else if (it.t === 'learn') queue.push({mode: 'learn', sid: it.sid, n: 0}); else if (it.t === 'drill') queue.push(...drillQueue(6)); else if (it.t === 'mixed') queue.push(...mixedQueue(6)); }); }
    else if (kind === 'skill') queue.push({mode: 'learn', sid: arg, n: 0, only: true});
    else if (kind === 'practice') for (let i = 0; i < 3; i++) queue.push({mode: 'solo', sid: arg});
    else if (kind === 'diag') queue = SKILLS.map(s => ({mode: 'diag', sid: s.id}));
    else if (kind === 'mixed') queue = mixedQueue(6);
    else if (kind === 'drill') queue = drillQueue(6);
    if (!queue.length) return;
    player = {kind, queue, i: 0, results: [], cur: null};
    history.replaceState(null, '', '#path'); next(true);
  }
  function mixedQueue(n){ const L = learned(); if (L.length < 2) return []; const q = []; let last = null;
    for (let i = 0; i < n; i++){ const c = L.filter(s => s.id !== last); const s = c[Math.floor(Math.random() * c.length)]; q.push({mode: 'mixed', sid: s.id}); last = s.id; } return q; }
  function drillQueue(n){ const pool = SQLB.X.slice().sort(() => Math.random() - .5).slice(0, n); return pool.map(ex => ({mode: 'drill', ex})); }
  function next(first){
    if (!player) return;
    if (!first) player.i++;
    let it = player.queue[player.i];
    // a learning item repeats until the skill is learned (at most 8 steps per session)
    if (!first){ const prev = player.queue[player.i - 1]; if (prev && prev.mode === 'learn'){ const st = sk(prev.sid); if (st.lvl < 2 && prev.n < 7){ player.queue.splice(player.i, 0, {mode: 'learn', sid: prev.sid, n: prev.n + 1, only: prev.only}); it = player.queue[player.i]; }
        else if (st.lvl >= 2 && player.kind === 'today'){ const nx = currentSkill(); if (nx && prev.n < 7){ player.queue.splice(player.i, 0, {mode: 'learn', sid: nx.id, n: prev.n + 1}); it = player.queue[player.i]; player.learnedNow = (player.learnedNow || []).concat(prev.sid); } else if (st.lvl >= 2) player.learnedNow = (player.learnedNow || []).concat(prev.sid); }
        else if (st.lvl >= 2) player.learnedNow = (player.learnedNow || []).concat(prev.sid); } }
    if (!it) return finish();
    if (it.mode === 'drill'){ player.cur = {mode: 'drill', ex: it.ex, sel: new Set()}; }
    else { const mode = it.mode === 'learn' ? modeFor(it.sid) : it.mode; player.cur = makeProblem(it.sid, mode); }
    renderPlayer();
  }
  function finish(){
    const r = player.results; const counted = r.filter(x => x.counted);
    if (player.kind === 'diag'){ S.diag = {done: true, d: today()}; save(); }
    if (player.queue.some(x => x.mode === 'mixed')){ const m = r.filter(x => x.mode === 'mixed'); if (m.length){ const sc = m.filter(x => x.ok).length / m.length; S.mixed = {d: today(), ok: m.filter(x => x.ok).length, n: m.length}; S.mixedBest = Math.max(S.mixedBest || 0, m.length >= 5 ? sc : 0); } }
    if (player.queue.some(x => x.mode === 'drill')){ S.drillDay = {d: today()}; }
    save();
    const P = root(); const learnedNow = [...new Set(player.learnedNow || [])];
    P.innerHTML = `<div class="pa-play"><div class="pa-card pa-done">
      <h2>${player.kind === 'diag' ? 'מבחן הפתיחה הסתיים' : 'סיימתם את המפגש'}</h2>
      <p class="lead">${counted.length ? `${counted.filter(x => x.ok).length} מתוך ${counted.length} פתרונות לבד היו נכונים.` : 'כל שלב שעשיתם נשמר.'}</p>
      ${learnedNow.length ? `<p>נלמדו היום: ${learnedNow.map(id => `<b>${esc(SK(id).name)}</b>`).join(', ')}. הם יחזרו לחזרה ב-${heDate(sk(learnedNow[0]).due)}.</p>` : ''}
      ${player.kind === 'diag' ? `<p>לפי התשובות סידרתי לכל מיומנות מאיפה להתחיל. מה שפתרתם נכון מתחיל ישר מפתרון לבד, ומה שלא, מתחיל מדוגמה מוסברת.</p>` : ''}
      <div class="pa-row"><button class="btn solid" data-act="home">חזרה למסלול</button></div></div></div>`;
    player = null;
  }

  /* ---------- rendering: shared bits ---------- */
  const root = () => document.getElementById('p-path');
  const unitOf = id => UNITS.find(u => u.skills.some(s => s.id === id));
  function ring(pct, cls){ const r = 15, c = 2 * Math.PI * r; return `<svg class="pa-ring ${cls || ''}" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${r}" class="bg"/><circle cx="18" cy="18" r="${r}" class="fg" stroke-dasharray="${(pct * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 18 18)"/></svg>`; }
  function skillStatus(s){ const st = S.skills[s.id]; if (!st || (!st.lvl && !st.rung)) return 'עוד לא התחלתם';
    if (st.lvl >= 4) return `שולט · חזרה ב-${heDate(st.due)}`;
    if (st.lvl >= 2) return isDue(s.id) ? 'מחכה לחזרה היום' : `נלמד · חזרה ב-${heDate(st.due)}`;
    const L = ladder(s), m = L[Math.min(st.rung, L.length - 1)];
    return `בשלב: ${MODE_NAME[m]}${m === 'solo' ? ` (${st.streak}/${st.relearn ? 2 : 3})` : m === 'complete' ? ` (${st.sub + 1}/2)` : ''}`; }
  function tableHTML(cols, rows, max){ max = max || 60; return `<div class="tw pa-tw"><table class="pa-t"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, max).map(r => `<tr>${r.map(v => `<td>${v === null ? '<span class="nul">null</span>' : esc(typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)}</td>`).join('')}</tr>`).join('')}${rows.length > max ? `<tr><td colspan="${cols.length}">ועוד ${rows.length - max}</td></tr>` : ''}${!rows.length ? `<tr><td colspan="${cols.length}" class="nul">אין שורות</td></tr>` : ''}</tbody></table></div>`; }

  /* ---------- home ---------- */
  function renderHome(){
    const P = root(); if (!P) return;
    const plan = planToday(), R = readiness(), started = Object.keys(S.log).length > 0;
    const cal = S.calib, pc = k => cal[k][1] ? Math.round(cal[k][0] / cal[k][1] * 100) : null;
    const left = S.examDate ? diffDays(today(), S.examDate) : null;
    const days = []; for (let i = 20; i >= 0; i--){ const d = addDays(today(), -i); days.push([d, S.log[d] || 0]); }
    const planText = plan.map(it => it.t === 'review' ? `חזרה: ${esc(SK(it.sid).name)}` : it.t === 'learn' ? `ממשיכים: ${esc(SK(it.sid).name)} · ${rungName(SK(it.sid), (S.skills[it.sid] || {rung: 0}).rung)}` : it.t === 'drill' ? 'זיהוי תבניות SQL (6 שאלות קצרות)' : 'סבב מעורב (6 שאלות מכל מה שנלמד)');
    P.innerHTML = `<div class="pa-home">
      ${!started && !S.diag.done ? `<section class="pa-card pa-hero">
        <span class="eyebrow">מסלול למידה · כל נושאי המבחן</span>
        <h2>לומדים עד שיודעים, וחוזרים עד שזה נשאר</h2>
        <ul class="pa-how">
          <li><b>כל מיומנות בארבע מדרגות:</b> דוגמה מוסברת, השלמה של פתרון, פתרון עם רמזים, ושלושה פתרונות נכונים לבד ברצף.</li>
          <li><b>חזרות בימים אחרים:</b> מיומנות שנלמדה חוזרת אחרי יום, שלושה ימים ושבוע, ומתכווצת לפי תאריך המבחן.</li>
          <li><b>שאלות אמיתיות:</b> ב-SQL ובאלגברה שאלות המבחנים 2019–2024, שרצות על שני מאגרי נתונים. בנרמול, באינדקסים ובהערכת גודל תרגיל חדש בכל פעם, ברמת המבחן. בטריגרים וב-ER הפתרונות והטענות מהמבחנים עצמם.</li>
        </ul>
        <div class="pa-row"><label class="pa-date">תאריך המבחן <input type="date" id="pa-exam" value="${S.examDate || ''}"></label></div>
        <div class="pa-row"><button class="btn solid" data-act="diag">מבחן פתיחה (כ-45 דקות)</button><button class="btn ghost" data-act="today">להתחיל מההתחלה, בלי מבחן</button></div>
        <p class="pa-small">מבחן הפתיחה שואל שאלה אחת על כל אחת מ-${SKILLS.length} המיומנויות. מה שתפתרו נכון יתחיל ישר מפתרון לבד. אפשר לדלג על כל שאלה.</p>
      </section>` : `<section class="pa-card pa-today">
        <div class="pa-today-h"><div><span class="eyebrow">המפגש של היום</span><h2>${plan.length ? `כ-${estMin(plan)} דקות` : 'הכול הושלם להיום'}</h2></div>
          <div class="pa-exam">${left !== null ? `<b>${left > 0 ? left : 0}</b><span>ימים למבחן</span>` : ''}<label class="pa-date${left !== null ? ' sm' : ''}">${left !== null ? 'שינוי' : 'תאריך המבחן'} <input type="date" id="pa-exam" value="${S.examDate || ''}"></label></div></div>
        ${plan.length ? `<ol class="pa-plan">${planText.map(t => `<li>${t}</li>`).join('')}</ol><div class="pa-row"><button class="btn solid" data-act="today">התחלה</button>${learned().length >= 2 ? '<button class="btn ghost" data-act="mixed">סבב מעורב נוסף</button>' : ''}</div>`
          : `<p>החזרות של היום נעשו והמיומנות הבאה תחכה למחר. אפשר לתרגל בחופשיות מהמפה למטה${learned().length >= 2 ? ', או לעשות עוד סבב מעורב' : ''}.</p>${learned().length >= 2 ? '<div class="pa-row"><button class="btn solid" data-act="mixed">סבב מעורב</button></div>' : ''}`}
      </section>`}
      <section class="pa-units">${UNITS.map(u => `<div class="pa-unit" style="${cc(u.c)}">
        <div class="pa-unit-h"><h3>${esc(u.name)}</h3><span>${u.pts} נק׳ בממוצע · ${Math.round(unitM(u) * 100)}%</span></div><p class="pa-small">${esc(u.line)}</p>
        <ol class="pa-chain">${u.skills.map(s => { const st = S.skills[s.id] || {lvl: 0, rung: 0}; const pct = skillM(s.id); const cur = currentSkill() === s;
          return `<li><button class="pa-node${cur ? ' cur' : ''}${isDue(s.id) ? ' due' : ''}${st.lvl >= 2 ? ' ok' : ''}" data-skill="${s.id}">${ring(pct)}<span class="pa-node-t"><b>${esc(s.name)}</b><small>${esc(skillStatus(s))}</small></span></button></li>`; }).join('')}</ol></div>`).join('')}

      </section>
      <section class="pa-dash">
        <div class="pa-card"><h3>מוכנות</h3>
          <div class="pa-meter"><span style="width:${Math.round(R.act * 100)}%"></span></div><p class="pa-small"><b>${Math.round(R.act * 100)}%</b> מהחומר של המבחן, משוקלל לפי הנקודות הממוצעות של כל נושא. מיומנות נספרת במלואה רק אחרי שתי חזרות בימים אחרים.</p>
          ${S.mixed ? `<p class="pa-small">סבב מעורב אחרון: ${S.mixed.ok}/${S.mixed.n}${S.mixedBest >= .8 ? ' · עברתם את רף ה-80%' : ''}.</p>` : ''}</div>
        <div class="pa-card"><h3>כמה אתם צודקים כשאתם בטוחים</h3>
          ${['sure', 'think', 'guess'].map(k => `<div class="pa-cal"><span>${{sure: 'בטוח', think: 'כנראה', guess: 'ניחוש'}[k]}</span><div class="pa-meter sm"><span style="width:${pc(k) || 0}%"></span></div><b>${pc(k) === null ? '–' : pc(k) + '%'}</b><small>${cal[k][1]}</small></div>`).join('')}
          ${S.misses.length ? `<h4>„בטוח״ וטעיתם: מה לחזור עליו קודם</h4><ul class="pa-miss">${S.misses.slice(0, 6).map(m => `<li><button class="linkish" data-practice="${m.s}">${esc(m.d)}</button> <small>${heDate(m.t)}</small></li>`).join('')}</ul>` : `<p class="pa-small">אחרי כל פתרון לבד מסמנים כמה אתם בטוחים. כאן יופיעו המקומות שבהם הייתם בטוחים וטעיתם. מהם כדאי להתחיל.</p>`}</div>
        <div class="pa-card"><h3>3 השבועות האחרונים</h3><div class="pa-days">${days.map(([d, n]) => `<i class="${n ? (n > 8 ? 'h' : 'm') : ''}" title="${heDate(d)}: ${n}"></i>`).join('')}</div>
          <p class="pa-small">${Object.keys(S.log).length} ימי תרגול. החזרות עובדות רק אם מגיעים בימים שונים.</p>
          <p id="pa-sync" class="pa-sync"></p>
          <details class="pa-backup"><summary>גיבוי והעברה ידנית</summary><p class="pa-small">קוד שמכיל את כל ההתקדמות. אפשר להדביק אותו במכשיר אחר.</p>
            <div class="pa-row"><button class="btn ghost" data-act="export">יצירת קוד</button><button class="btn ghost" data-act="import">טעינת קוד</button><button class="btn ghost" data-act="reset">איפוס</button></div><textarea id="pa-code" class="pa-code" rows="3" dir="ltr" spellcheck="false" placeholder="הקוד יופיע כאן, או הדביקו קוד"></textarea><p id="pa-code-msg" class="pa-small"></p></details></div>
      </section></div>`;
    paintSync();
  }
  function renderSkill(id){
    const s = SK(id), st = sk(id), u = unitOf(id), P = root();
    P.innerHTML = `<div class="pa-play" style="${cc(u.c)}"><div class="pa-top"><button class="back" data-act="home">→ המסלול</button></div>
      <div class="pa-card"><span class="eyebrow">${esc(u.name)}</span><h2>${esc(s.name)}</h2><p class="lead">${esc(s.what)}</p>
      <ol class="pa-ladder">${ladder(s).map((m, i) => `<li class="${st.rung > i || st.lvl >= 2 ? 'done' : st.rung === i ? 'now' : ''}"><b>${MODE_NAME[m]}</b><small>${{example: 'פתרון מלא שנפתח צעד אחר צעד, ושאלת „למה״ אחת', complete: 'אותו סוג פתרון, וחסר בו הסוף. פעמיים', hints: 'פתרון שלכם, ורמז זמין כשנתקעים', solo: `${st.relearn ? 'שני' : 'שלושה'} פתרונות נכונים לבד ברצף`}[m]}</small></li>`).join('')}<li class="${st.lvl >= 2 ? 'done' : ''}"><b>נלמד</b><small>חוזר לחזרה אחרי יום, שלושה ימים ושבוע</small></li></ol>
      <p class="pa-small">${esc(skillStatus(s))}${st.n ? ` · ${st.ok}/${st.n} נכונים בפתרון לבד` : ''}</p>
      <div class="pa-row">${st.lvl < 2 ? `<button class="btn solid" data-start-skill="${id}">${st.rung || st.lvl ? 'המשך' : 'התחלה'}: ${rungName(s, st.rung)}</button>` : `<button class="btn solid" data-practice="${id}">שלושה תרגילים לבד</button>`}
        <button class="btn ghost" data-example="${id}">לראות שוב את הדוגמה המוסברת</button></div></div></div>`;
  }

  /* ---------- player ---------- */
  const confBtns = () => `<div class="pa-conf"><span>בדיקה, ואני:</span><button class="btn solid" data-check="sure">בטוח</button><button class="btn" data-check="think">חושב שכן</button><button class="btn ghost" data-check="guess">מנחש</button></div>`;
  function renderPlayer(){
    const p = player.cur, P = root();
    const head = `<div class="pa-top"><button class="back" data-act="quit">→ יציאה (נשמר)</button><div class="pa-dots">${player.queue.map((x, i) => `<i class="${i < player.i ? (player.results[i] && player.results[i].ok === false ? 'x' : 'v') : i === player.i ? 'c' : ''}"></i>`).join('')}</div><span class="pa-small">${{today: 'המפגש של היום', skill: 'סולם', practice: 'תרגול', diag: 'מבחן פתיחה', mixed: 'סבב מעורב', drill: 'זיהוי תבניות'}[player.kind] || ''} · ${player.i + 1}</span></div>`;
    if (p.mode === 'drill'){ P.innerHTML = `<div class="pa-play" style="${cc('sql')}">${head}<div class="pa-card">${drillHTML(p)}</div></div>`; return; }
    const s = SK(p.sid), u = unitOf(p.sid);
    const tag = {example: 'דוגמה מוסברת', complete: 'השלמה', hints: 'פתרון עם רמזים', solo: 'פתרון לבד', review: 'חזרה', mixed: 'סבב מעורב', diag: 'מבחן פתיחה'}[p.mode];
    const body = p.kind === 'st' ? stHTML(p) : writeHTML(p);
    P.innerHTML = `<div class="pa-play" style="${cc(u.c)}">${head}<div class="pa-card"><div class="pa-ph"><span class="pa-tag">${tag}</span><span class="pa-sk">${esc(u.name)} · ${esc(s.name)}</span></div>${body}<div id="pa-fb"></div></div></div>`;
    if (p.kind !== 'st') wireEditor();
    if (typeof mountViz === 'function') mountViz(P);
    window.scrollTo({top: 0});
  }
  /* structured problems: normalization and the generated modules */
  function inputHTML(p){
    const inp = api(SK(p.sid)).input(p.q);
    if (inp.type === 'mcq'){ const order = p.perm || inp.opts.map((_, i) => i); return `<div class="pa-mcq" role="radiogroup">${order.map(i => `<button class="pa-opt" data-opt="${i}" role="radio" aria-checked="${p.pick === i}">${inp.opts[i]}</button>`).join('')}</div>`; }
    if (inp.type === 'multi') return `<p class="pa-small">אפשר לבחור כמה.</p><div class="pa-mcq">${inp.opts.map((o, i) => `<button class="pa-opt" data-multi="${i}" aria-pressed="${!!(p.multi && p.multi.has(i))}">${o}</button>`).join('')}</div>`;
    if (inp.type === 'nums') return `<div class="pa-nums">${inp.fields.map((f, i) => `<label class="pa-in"><span>${esc(f)}</span><input class="pa-num" data-i="${i}" dir="ltr" inputmode="decimal" autocomplete="off"></label>`).join('')}</div>`;
    const help = inp.help || {set: 'כתבו את האותיות, למשל ABD.', sets: 'הפרידו בפסיקים, למשל AE, CE. טבלאות כתבו בסוגריים, למשל (A,B,C), (C,D).', fds: 'תלות בכל שורה או מופרדות בפסיק, עם > או ->. למשל A>BC, CD>A.'}[inp.type] || '';
    const area = inp.type === 'fds' || inp.type === 'rows';
    return `<label class="pa-in"><span>${help}</span>${area ? `<textarea id="pa-ans" rows="3" dir="ltr" spellcheck="false" placeholder="${esc(inp.ph || '')}"></textarea>` : `<input id="pa-ans" dir="ltr" spellcheck="false" autocomplete="off" placeholder="${esc(inp.ph || '')}">`}</label>`;
  }
  function stepsHTML(steps, n, cls){ return `<ol class="pa-steps ${cls || ''}">${steps.slice(0, n).map(x => `<li><b>${esc(x.h)}</b><div>${x.b}</div></li>`).join('')}</ol>`; }
  function stHTML(p){
    const s = SK(p.sid), A = api(s), q = A.html(p.q);
    const src = s.kind === 'norm' ? (p.q.src ? `<p class="pa-src">מתוך ${esc(p.q.src)}</p>` : '<p class="pa-src">תרגיל חדש ברמת המבחן</p>') : '';
    const skip = p.mode === 'diag' ? '<div class="pa-row"><button class="btn ghost" data-act="skip">לא יודע, לדלג</button></div>' : '';
    if (p.mode === 'example'){ p.shown = p.shown || 1; const all = p.shown > p.sol.steps.length;
      return `${src}${q}${stepsHTML(p.sol.steps, p.shown, 'ex')}
        ${!all ? `<div class="pa-row"><span class="pa-small">לפני שפותחים: מה לדעתכם הצעד הבא?</span><button class="btn solid" data-act="step">הצעד הבא</button><button class="btn ghost" data-act="allsteps">הכול</button></div>`
          : `<div class="pa-ans-box"><b>התשובה:</b> ${p.sol.show}</div>${mcqHTML(A.mcq, p)}`}`; }
    if (p.mode === 'complete'){ const n = p.sol.steps.length, k = sk(p.sid).sub === 0 ? Math.max(1, Math.ceil(n / 2)) : Math.max(1, Math.floor(n / 3));
      const shownK = n > 1 ? Math.min(k, n - 1) : 0;
      return `${src}${q}<p class="pa-small">${shownK ? 'כך מתחיל הפתרון. השלימו את התשובה הסופית.' : 'נסו לבד. הפתרון יופיע אחרי הבדיקה.'}</p>${stepsHTML(p.sol.steps, shownK)}${inputHTML(p)}<div class="pa-row"><button class="btn solid" data-check="none">בדיקה</button></div>`; }
    const hintsLeft = p.mode === 'hints' && p.hints < p.sol.steps.length;
    return `${src}${q}${p.mode === 'hints' ? `<div id="pa-hints">${stepsHTML(p.sol.steps, p.hints)}</div>` : ''}${inputHTML(p)}
      ${p.mode === 'hints' ? `<div class="pa-row"><button class="btn solid" data-check="none">בדיקה</button>${hintsLeft ? '<button class="btn ghost" data-act="hint">רמז: הצעד הבא בפתרון</button>' : ''}</div>` : confBtns()}${skip}`;
  }
  function mcqHTML(m, p){ if (!m) return '<div class="pa-row"><button class="btn solid" data-act="exdone">הבנתי, הלאה</button></div>';
    const order = p.order || (p.order = m.opts.map((_, i) => i).sort(() => Math.random() - .5));
    return `<div class="pa-why"><b>שאלת „למה״:</b> ${esc(m.q)}<div class="pa-mcq">${order.map(i => `<button class="pa-opt" data-why="${i}">${esc(m.opts[i])}</button>`).join('')}</div><div id="pa-whyfb"></div></div>`; }
  /* written problems: SQL and relational algebra */
  function schemaHTML(ex, ra){ const sc = SQLB.S[ex.schema]; const A = SQLB.data(ex.schema, 'A');
    return `<div class="pa-schema"><b>${esc(sc.title)}</b><ul>${Object.entries(sc.show).map(([t, c]) => `<li><code dir="ltr">${esc(t)}(${esc(c)})</code></li>`).join('')}</ul>${sc.note && !ra ? `<p class="pa-small">${esc(sc.note)}</p>` : ''}
      <details class="pa-data"><summary>הנתונים ש${ra ? 'הביטוי' : 'השאילתה'} רץ עליהם</summary><div class="pa-data-g">${Object.entries(A).map(([t, v]) => `<div><h6 dir="ltr">${esc(Object.keys(sc.show).find(k => k.toLowerCase() === t) || t)}</h6>${tableHTML(v.cols, v.rows, 40)}</div>`).join('')}</div>
      <p class="pa-small">בבדיקה ${ra ? 'הביטוי' : 'השאילתה'} רץ גם על מאגר שני שלא מוצג, כדי לתפוס פתרון שעובד כאן במקרה.</p></details></div>`; }
  const fmtW = (p, q) => p.kind === 'ra' ? q : fmtSQL(q);
  const SYMS = ['σ[]()', 'π[]()', ' ⋈ ', '⋈[]', ' × ', ' ∪ ', ' ∩ ', ' − ', ' ÷ ', 'ρ[]()', ' ← ', ' ∧ ', ' ∨ ', ' ≠ ', ' ≥ ', ' ≤ '];
  function writeHTML(p){
    const ex = p.ex, ra = p.kind === 'ra', src = `<p class="pa-src">${esc(ex.src)}</p>`, what = ra ? 'הביטוי' : 'השאילתה';
    if (p.mode === 'example'){ p.shown = p.shown || 1; const all = p.shown > ex.steps.length;
      return `${src}<p class="pa-ask">${esc(ex.q)}</p>${schemaHTML(ex, ra)}<ol class="pa-steps ex">${ex.steps.slice(0, p.shown).map(([h, b, code]) => `<li><b>${esc(h)}</b><div>${esc(b)}</div>${code ? `<pre dir="ltr">${esc(code)}</pre>` : ''}</li>`).join('')}</ol>
        ${!all ? `<div class="pa-row"><span class="pa-small">לפני שפותחים: איך הייתם ממשיכים?</span><button class="btn solid" data-act="step">הצעד הבא</button><button class="btn ghost" data-act="allsteps">הכול</button></div>`
          : `<div class="pa-ans-box"><b>${what} המלא${ra ? '' : 'ה'}</b><pre dir="ltr">${esc(fmtW(p, ex.ref))}</pre></div>${mcqHTML(ex.mcq, p)}`}`; }
    const bar = ra ? `<div class="pa-syms" dir="ltr">${SYMS.map(x => `<button type="button" data-sym="${esc(x)}">${esc(x.trim().replace('[]()', '').replace('[]', '[ ]'))}</button>`).join('')}</div>` : '';
    const editor = ph => `<div class="pa-ed">${bar}<textarea id="pa-sql" rows="${p.mode === 'complete' ? 3 : ra ? 5 : 8}" dir="ltr" spellcheck="false" placeholder="${esc(ph)}"></textarea>
      <div class="pa-row"><button class="btn" data-act="run">הרצה על הנתונים <kbd>Ctrl+Enter</kbd></button>${ra ? '<span class="pa-small">שורות השמה: שם ← ביטוי. השורה האחרונה היא התשובה.</span>' : ''}</div><div id="pa-out"></div></div>`;
    if (p.mode === 'complete'){ const shown = fmtW(p, ex.ref.replace(p.fade, '▢▢▢▢'));
      return `${src}<p class="pa-ask">${esc(ex.q)}</p>${schemaHTML(ex, ra)}<p class="pa-small">זה ${what} הנכון${ra ? '' : 'ה'}, וחסר בו החלק המסומן ▢. כתבו רק אותו.</p><pre dir="ltr" class="pa-blank">${esc(shown).replace('▢▢▢▢', '<mark>▢▢▢▢</mark>')}</pre>${editor('החלק החסר')}<div class="pa-row"><button class="btn solid" data-check="none">בדיקה</button></div>`; }
    const isCode = h => ra ? /[σπ⋈×∪−÷ρ←]/.test(h) && !/[א-ת]{3}/.test(h.replace(/'[^']*'/g, '')) : /\n|select|where|from/.test(h);
    return `${src}<p class="pa-ask">${esc(ex.q)}</p>${schemaHTML(ex, ra)}${p.mode === 'hints' ? `<div id="pa-hints">${ex.hints.slice(0, p.hints).map((h, i) => `<div class="pa-hint"><b>רמז ${i + 1}</b>${isCode(h) ? `<pre dir="ltr">${esc(h)}</pre>` : `<span>${esc(h)}</span>`}</div>`).join('')}</div>` : ''}${editor(ra ? 'π[…](σ[…](…))' : 'select …')}
      ${p.mode === 'hints' ? `<div class="pa-row"><button class="btn solid" data-check="none">בדיקה</button>${p.hints < ex.hints.length ? `<button class="btn ghost" data-act="hint">רמז ${p.hints + 1} מתוך ${ex.hints.length}</button>` : ''}</div>` : confBtns()}${p.mode === 'diag' ? '<div class="pa-row"><button class="btn ghost" data-act="skip">לא יודע, לדלג</button></div>' : ''}`;
  }
  function fmtSQL(q){ // line breaks before clauses, indented by subquery depth
    q = q.replace(/\s+/g, ' ').trim(); let out = '', depth = 0, inS = false;
    const KW = /^(from|where|group by|having|and|or|order by)\b/i;
    for (let i = 0; i < q.length; i++){ const c = q[i];
      if (c === "'"){ inS = !inS; out += c; continue; }
      if (inS){ out += c; continue; }
      if (c === '('){ depth++; out += c; continue; }
      if (c === ')'){ depth = Math.max(0, depth - 1); out += c; continue; }
      if (c === ' ' && KW.test(q.slice(i + 1)) && !/between\s+\S+$/i.test(q.slice(0, i))){ const kw = q.slice(i + 1).match(KW)[1].toLowerCase(); out += '\n' + '    '.repeat(depth) + (kw === 'and' || kw === 'or' ? '  ' : ''); continue; }
      out += c; }
    return out; }
  function wireEditor(){ const t = document.getElementById('pa-sql'); if (!t) return;
    t.addEventListener('keydown', e => { if (e.key === 'Tab'){ e.preventDefault(); const a = t.selectionStart; t.value = t.value.slice(0, a) + '  ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = a + 2; }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); runSQL(); } }); }
  function fullSQL(p){ const v = (document.getElementById('pa-sql') || {}).value || ''; return p.mode === 'complete' ? p.ex.ref.replace(p.fade, v.trim().replace(/;\s*$/, '')) : v; }
  function runSQL(){ const p = player.cur, out = document.getElementById('pa-out'); const q = fullSQL(p);
    try { const r = BANK(SK(p.sid)).run(q, p.ex); out.innerHTML = `<p class="pa-small">${r.rows.length} שורות</p>${tableHTML(r.cols, r.rows, 30)}`; } catch (e){ out.innerHTML = `<p class="pa-err">${esc(e.message)}</p>`; } }
  /* drills */
  const IDIOMS = [['nx', 'not exists / exists'], ['gh', 'group by + having'], ['all', '>= all / <= all'], ['div', 'חילוק (not exists כפול)']];
  const drillLabels = ex => { const a = ex.ref.toLowerCase(), L = new Set(); if (ex.skill === 'div') L.add('div'); else if (/exists/.test(a)) L.add('nx'); if (/having/.test(a)) L.add('gh'); if (/[<>]=?\s*all/.test(a)) L.add('all'); return L; };
  function drillHTML(p){ return `<div class="pa-ph"><span class="pa-tag">זיהוי תבנית</span><span class="pa-sk">SQL</span></div><p class="pa-small">לא פותרים. רק בוחרים את כל התבניות שהשאילתה תצטרך.</p><p class="pa-ask">${esc(p.ex.q)}</p>
    <div class="pa-mcq multi">${IDIOMS.map(([k, n]) => `<button class="pa-opt" data-idiom="${k}" aria-pressed="${p.sel.has(k)}">${k === 'div' ? 'חילוק (<bdi dir="ltr">not exists</bdi> כפול)' : `<bdi dir="ltr">${esc(n)}</bdi>`}</button>`).join('')}</div><div class="pa-row"><button class="btn solid" data-act="drillcheck">בדיקה</button></div><div id="pa-fb"></div>`; }

  /* ---------- checking ---------- */
  function readAnswer(p){
    if (p.kind === 'st'){ const inp = api(SK(p.sid)).input(p.q);
      if (inp.type === 'mcq') return p.pick === undefined ? null : p.pick;
      if (inp.type === 'multi') return p.multi && p.multi.size ? [...p.multi].sort((a, b) => a - b) : null;
      if (inp.type === 'nums'){ const v = [...root().querySelectorAll('.pa-num')].map(x => x.value.trim()); return v.every(Boolean) ? v : null; }
      const v = (document.getElementById('pa-ans') || {}).value || ''; return v.trim() ? v : null; }
    const v = fullSQL(p); return v.trim() ? v : null; }
  const solHTML = (p, open) => p.kind === 'st' ? `<details class="pa-sol"${open ? ' open' : ''}><summary>הפתרון המלא</summary>${p.sol.show && SK(p.sid).kind !== 'norm' ? `<p><b>התשובה:</b> ${p.sol.show}</p>` : ''}${stepsHTML(p.sol.steps, 99)}</details>` : `<details class="pa-sol"${open ? ' open' : ''}><summary>פתרון לדוגמה</summary><pre dir="ltr">${esc(fmtW(p, p.ex.ref))}</pre></details>`;
  function doCheck(conf){
    const p = player.cur; if (p.checked && !p.retry) return;
    const ans = readAnswer(p); const fb = document.getElementById('pa-fb');
    if (ans === null){ fb.innerHTML = `<div class="pa-fb warn">${p.kind === 'st' && ['mcq', 'multi'].includes(api(SK(p.sid)).input(p.q).type) ? 'בחרו תשובה.' : 'כתבו תשובה.'}</div>`; return; }
    let res;
    if (p.kind === 'st') res = api(SK(p.sid)).check(p.q, ans, p.sol);
    else { const c = BANK(SK(p.sid)).check(p.ex, ans); res = {ok: c.ok, why: c.msgs.join(' '), note: c.note, err: c.err}; if (c.err && !p.checked){ fb.innerHTML = `<div class="pa-fb warn"><b>${p.kind === 'ra' ? 'הביטוי' : 'השאילתה'} לא רץ.</b> ${esc(c.msgs[0] || '')}</div>`; return; } }
    const first = !p.checked; p.checked = true;
    if (first){ p.ok = res.ok; record(p, res.ok, conf === 'none' ? null : conf); player.results[player.i] = {ok: res.ok, mode: p.mode, counted: ['solo', 'review', 'mixed', 'diag'].includes(p.mode)}; }
    const st = sk(p.sid), L = ladder(SK(p.sid)), cur = L[Math.min(st.rung, L.length - 1)];
    const progress = p.mode === 'complete' ? (res.ok ? (cur !== 'complete' ? 'עברתם לשלב הבא: פתרון עם רמזים.' : 'עוד השלמה אחת, עם פחות פתרון גלוי.') : '')
      : p.mode === 'hints' ? (res.ok ? `עברתם לשלב הבא: פתרון לבד${p.hints ? '' : ', וזה כבר נספר כפתרון לבד ראשון'}.` : '')
      : p.mode === 'solo' && st.lvl < 2 ? (res.ok && !p.hints ? `${st.streak} מתוך ${st.relearn ? 2 : 3} ברצף.` : cur === 'hints' ? 'שתי טעויות ברצף: חוזרים לשלב עם רמזים.' : 'הרצף מתחיל מחדש.')
      : '';
    const learnedNow = first && res.ok && st.lvl >= 2 && p.mode === 'solo' && st.rev === 0 && st.due && !p.wasLearned;
    root().querySelectorAll('[data-opt],[data-multi]').forEach(b => { b.disabled = true; });
    if (p.kind === 'st' && api(SK(p.sid)).input(p.q).type === 'mcq'){ root().querySelectorAll('[data-opt]').forEach(b => { if (+b.dataset.opt === p.sol.ans) b.classList.add('right'); else if (+b.dataset.opt === p.pick && !res.ok) b.classList.add('wrong'); }); }
    fb.innerHTML = `<div class="pa-fb ${res.ok ? 'ok' : 'bad'}"><b>${res.ok ? (first ? 'נכון.' : 'עכשיו נכון.') : 'לא נכון.'}</b> ${res.ok ? (res.note || '') : res.why || ''}
      ${progress ? `<p class="pa-prog">${progress}</p>` : ''}${learnedNow ? `<p class="pa-prog big">נלמד! המיומנות תחזור לחזרה ב-${heDate(st.due)}.</p>` : ''}
      ${res.ok || p.revealed ? solHTML(p) : ''}
      <div class="pa-row">${!res.ok && !p.revealed ? '<button class="btn" data-act="retry">לנסות שוב</button><button class="btn ghost" data-act="reveal">הצגת הפתרון</button>' : ''}<button class="btn solid" data-act="next">הלאה</button></div></div>`;
    if (typeof mountViz === 'function') mountViz(fb);
    fb.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    root().querySelectorAll('[data-check]').forEach(b => b.disabled = true);
  }

  /* ---------- events ---------- */
  function onClick(e){
    const t = e.target.closest('button,[data-skill],[data-practice]'); if (!t || !root().contains(t)) return;
    const d = t.dataset;
    if (d.act === 'home'){ player = null; renderHome(); window.scrollTo({top: 0}); return; }
    if (d.act === 'quit'){ player = null; renderHome(); window.scrollTo({top: 0}); return; }
    if (d.act === 'today'){ startSession('today'); return; }
    if (d.act === 'diag'){ startSession('diag'); return; }
    if (d.act === 'mixed'){ startSession('mixed'); return; }
    if (d.skill){ renderSkill(d.skill); window.scrollTo({top: 0}); return; }
    if (d.startSkill){ startSession('skill', d.startSkill); return; }
    if (d.practice){ startSession('practice', d.practice); return; }
    if (d.example){ player = {kind: 'skill', queue: [{mode: 'review-ex', sid: d.example}], i: 0, results: []}; player.cur = makeProblem(d.example, 'example'); player.cur.rewatch = true; renderPlayer(); return; }
    if (d.act === 'export'){ const c = document.getElementById('pa-code'); try { c.value = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); c.select(); document.getElementById('pa-code-msg').textContent = 'העתיקו את הקוד ושמרו אותו.'; } catch (x){} return; }
    if (d.act === 'import'){ const c = document.getElementById('pa-code'), m = document.getElementById('pa-code-msg'); try { const o = JSON.parse(decodeURIComponent(escape(atob(c.value.trim())))); if (o && o.v === 1){ S = o; save(); renderHome(); } else m.textContent = 'הקוד לא תקין.'; } catch (x){ m.textContent = 'הקוד לא תקין.'; } return; }
    if (d.act === 'reset'){ if (t.dataset.confirm){ S = fresh(); save(); renderHome(); } else { t.dataset.confirm = 1; t.textContent = 'ללחוץ שוב כדי לאפס הכול'; } return; }
    const p = player && player.cur; if (!p) return;
    if (d.act === 'step'){ p.shown++; renderPlayer(); return; }
    if (d.act === 'allsteps'){ p.shown = 99; renderPlayer(); return; }
    if (d.why !== undefined){ const m = p.kind === 'st' ? api(SK(p.sid)).mcq : p.ex.mcq; const ok = +d.why === m.a;
      root().querySelectorAll('[data-why]').forEach(b => { b.disabled = true; if (+b.dataset.why === m.a) b.classList.add('right'); else if (b === t) b.classList.add('wrong'); });
      document.getElementById('pa-whyfb').innerHTML = `<div class="pa-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'נכון.' : 'לא בדיוק.'}</b> התשובה: ${esc(m.opts[m.a])}<div class="pa-row"><button class="btn solid" data-act="exdone">${p.rewatch ? 'חזרה' : 'הבנתי, הלאה'}</button></div></div>`; return; }
    if (d.act === 'exdone'){ if (p.rewatch){ renderSkill(p.sid); player = null; return; } record(p, true, null); player.results[player.i] = {ok: true, mode: 'example'}; next(); return; }
    if (d.opt !== undefined){ p.pick = +d.opt; root().querySelectorAll('[data-opt]').forEach(b => b.setAttribute('aria-checked', b === t)); return; }
    if (d.multi !== undefined){ p.multi = p.multi || new Set(); const i = +d.multi; p.multi.has(i) ? p.multi.delete(i) : p.multi.add(i); t.setAttribute('aria-pressed', p.multi.has(i)); return; }
    if (d.sym !== undefined){ const ta = document.getElementById('pa-sql'); if (!ta) return; const ins = d.sym; const at = ta.selectionStart; ta.value = ta.value.slice(0, at) + ins + ta.value.slice(ta.selectionEnd); const back = ins.endsWith('[]()') ? 3 : ins.endsWith('[]') ? 1 : 0; ta.focus(); ta.selectionStart = ta.selectionEnd = at + ins.length - back; return; }
    if (d.check){ doCheck(d.check); return; }
    if (d.act === 'hint'){ p.hints++; const id = p.kind === 'st' ? 'pa-ans' : 'pa-sql'; const keep = (document.getElementById(id) || {}).value; renderPlayer(); const el = document.getElementById(id); if (el && keep) el.value = keep; const h = document.getElementById('pa-hints'); if (h && h.lastElementChild) h.lastElementChild.scrollIntoView({block: 'nearest'}); return; }
    if (d.act === 'run'){ runSQL(); return; }
    if (d.act === 'retry'){ p.retry = true; document.getElementById('pa-fb').innerHTML = ''; root().querySelectorAll('[data-check],[data-opt],[data-multi]').forEach(b => { b.disabled = false; b.classList.remove('right', 'wrong'); }); const el = document.getElementById(p.kind === 'st' ? 'pa-ans' : 'pa-sql'); if (el) el.focus(); return; }
    if (d.act === 'reveal'){ p.revealed = true; p.retry = false; const fb = document.getElementById('pa-fb'); fb.querySelector('.pa-row').insertAdjacentHTML('beforebegin', solHTML(p, true)); if (typeof mountViz === 'function') mountViz(fb); t.remove(); fb.querySelector('[data-act="retry"]')?.remove(); return; }
    if (d.act === 'skip'){ if (!p.checked){ p.checked = true; record(p, false, null); player.results[player.i] = {ok: false, mode: 'diag'}; } next(); return; }
    if (d.act === 'next'){ next(); return; }
    if (d.idiom){ p.sel.has(d.idiom) ? p.sel.delete(d.idiom) : p.sel.add(d.idiom); t.setAttribute('aria-pressed', p.sel.has(d.idiom)); return; }
    if (d.act === 'drillcheck'){ if (p.checked) return; p.checked = true; const L = drillLabels(p.ex); const ok = L.size === p.sel.size && [...L].every(k => p.sel.has(k));
      S.drills[1]++; if (ok) S.drills[0]++; save(); player.results[player.i] = {ok, mode: 'drill'};
      root().querySelectorAll('[data-idiom]').forEach(b => { b.disabled = true; const k = b.dataset.idiom; if (L.has(k)) b.classList.add('right'); else if (p.sel.has(k)) b.classList.add('wrong'); });
      document.getElementById('pa-fb').innerHTML = `<div class="pa-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'נכון.' : 'לא בדיוק.'}</b> השאילתה צריכה: ${[...L].map(k => k === 'div' ? 'חילוק' : `<bdi dir="ltr">${esc(IDIOMS.find(x => x[0] === k)[1])}</bdi>`).join(', ')}.<details class="pa-sol"><summary>השאילתה</summary><pre dir="ltr">${esc(fmtSQL(p.ex.ref))}</pre></details><div class="pa-row"><button class="btn solid" data-act="next">הלאה</button></div></div>`; return; }
  }
  function onChange(e){ if (e.target.id === 'pa-exam'){ S.examDate = e.target.value || null; save(); renderHome(); } }
  function onKey(e){ if (e.key === 'Enter' && e.target.id === 'pa-ans' && e.target.tagName === 'INPUT'){ e.preventDefault(); const p = player && player.cur; if (!p) return; const b = root().querySelector('[data-check]:not([disabled])'); if (b && b.dataset.check === 'none') doCheck('none'); } }

  let wired = false;
  function render(){ const P = root(); if (!wired){ P.addEventListener('click', onClick); P.addEventListener('change', onChange); P.addEventListener('keydown', onKey); wired = true;
      const loc = loadLocal(); if (loc) S = loc; Sync.start(); }
    if (player) renderPlayer(); else renderHome(); }
  return {render, get state(){ return S; }, _s: () => S, _p: () => player, startSession};
})();
