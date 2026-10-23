/* ================= normalization: algorithms, generator, traces, checkers ================= */
const NORM = (function(){
  const srt = s => [...new Set(s)].sort().join('');
  const uni = (a, b) => srt(a + b);
  const sub = (a, b) => [...a].every(c => b.includes(c));          // a ⊆ b
  const minus = (a, b) => [...a].filter(c => !b.includes(c)).join('');
  const inter = (a, b) => [...a].filter(c => b.includes(c)).join('');
  const eqs = (a, b) => srt(a) === srt(b);
  const M = x => `<bdi dir="ltr" class="m n">${x}</bdi>`;
  const set = s => `{${[...srt(s)].join(', ')}}`;
  const fd = ([l, r]) => `${l}→${r}`;
  const fds = F => `{${F.map(fd).join(', ')}}`;

  function closure(X, F, log){
    let C = srt(X), ch = true;
    while (ch){ ch = false;
      for (const [l, r] of F){ if (sub(l, C) && !sub(r, C)){ const add = minus(r, C); C = uni(C, r); ch = true; if (log) log.push([[l, r], add, C]); } } }
    return C;
  }
  const implies = (F, l, r) => sub(r, closure(l, F));
  const equiv = (F, G) => G.every(([l, r]) => implies(F, l, r)) && F.every(([l, r]) => implies(G, l, r));
  function subsets(R){ const a = [...R], out = []; for (let m = 1; m < (1 << a.length); m++){ out.push(a.filter((_, i) => m & (1 << i)).join('')); } return out.sort((x, y) => x.length - y.length || (x < y ? -1 : 1)); }
  function keys(R, F){
    const ks = [];
    for (const S of subsets(R)){ if (ks.some(k => sub(k, S))) continue; if (eqs(closure(S, F), R)) ks.push(S); }
    return ks;
  }
  const isSuper = (X, R, F) => sub(R, closure(X, F));

  /* canonical cover, with a trace of every change */
  function canon(F0, trace){
    let F = F0.map(([l, r]) => [srt(l), srt(r)]);
    const step = (h, b) => trace && trace.push({h, b});
    const unionSame = () => { const mp = new Map(); F.forEach(([l, r]) => mp.set(l, uni(mp.get(l) || '', r))); const before = F.length; F = [...mp].map(([l, r]) => [l, r]); return before !== F.length; };
    // trivial parts
    let triv = [];
    F = F.map(([l, r]) => { const t = inter(r, l); if (t) triv.push([l, r, t]); return [l, minus(r, l)]; }).filter(([l, r]) => r);
    if (triv.length) step('חלק טריוויאלי', `בצד ימין יש תכונה שכבר בצד שמאל: ${triv.map(([l, r, t]) => `${M(l + '→' + r)} הופכת ל-${M(l + '→' + minus(r, l))}`).join(', ')}. ${M('X→X')} תמיד נכונה, ולכן מוחקים.`);
    if (unionSame()) step('איחוד צדדים שמאליים', `תלויות עם אותו צד שמאל מתאחדות: ${M(fds(F))}.`);
    let changed = true, guard = 0;
    while (changed && guard++ < 40){ changed = false;
      // extraneous on the left
      for (let i = 0; i < F.length && !changed; i++){ const [l, r] = F[i]; if (l.length < 2) continue;
        for (const a of l){ const l2 = minus(l, a); const c = closure(l2, F);
          if (sub(r, c)){ step(`תכונה עודפת בצד שמאל של ${fd([l, r])}`, `בודקים את ${M(a)}: ${M(l2 + '⁺ = ' + set(c))}, וזה מכיל את ${M(r)}. לכן ${M(a)} עודפת, והתלות הופכת ל-${M(l2 + '→' + r)}.`);
            F[i] = [l2, r]; changed = true; break; } } }
      if (changed){ if (unionSame()) step('איחוד צדדים שמאליים', `עכשיו יש שתי תלויות עם אותו צד שמאל, ומאחדים אותן: ${M(fds(F))}.`); continue; }
      // extraneous on the right
      for (let i = 0; i < F.length && !changed; i++){ const [l, r] = F[i];
        for (const a of r){ const r2 = minus(r, a); const G = F.map((x, j) => j === i ? [l, r2] : x).filter(([, y]) => y); const c = closure(l, G);
          if (c.includes(a)){ step(`תכונה עודפת בצד ימין של ${fd([l, r])}`, `מורידים את ${M(a)} ומחשבים בלי אותה: ${M(l + '⁺ = ' + set(c))}, ועדיין מגיעים ל-${M(a)}. ${r2 ? `לכן נשאר ${M(l + '→' + r2)}.` : `לכן כל התלות נובעת מהשאר ונמחקת.`}`);
            F = G; changed = true; break; } } }
      if (changed && unionSame()) step('איחוד צדדים שמאליים', `מאחדים תלויות עם אותו צד שמאל: ${M(fds(F))}.`);
    }
    step('הכיסוי הקנוני', `${M('Fc = ' + fds(F))}. בכל תלות אין תכונה עודפת, ואין שתי תלויות עם אותו צד שמאל.`);
    return F;
  }
  /* is G a canonical cover of F? returns [] or list of problems (Hebrew html) */
  function canonProblems(F, G, R){
    const p = [];
    const bad = G.filter(([l, r]) => !sub(l + r, R)); if (bad.length) p.push(`יש תכונות שלא ב-R: ${M(fds(bad))}.`);
    const notImp = G.filter(([l, r]) => !implies(F, l, r)); if (notImp.length) p.push(`${notImp.map(x => M(fd(x))).join(', ')} לא נובעת מ-F. ${M(notImp[0][0] + '⁺ = ' + set(closure(notImp[0][0], F)))}.`);
    const lost = F.filter(([l, r]) => !implies(G, l, r)); if (lost.length) p.push(`התשובה לא שקולה ל-F: אי אפשר לגזור ממנה את ${lost.map(x => M(fd(x))).join(', ')}.`);
    if (p.length) return p;
    const seen = {}; G.forEach(([l]) => { seen[srt(l)] = (seen[srt(l)] || 0) + 1; });
    Object.entries(seen).filter(([, n]) => n > 1).forEach(([l]) => p.push(`יש שתי תלויות עם צד שמאל ${M(l)}. בכיסוי קנוני מאחדים אותן.`));
    G.forEach(([l, r]) => { const t = inter(r, l); if (t) p.push(`ב-${M(fd([l, r]))} התכונה ${M(t)} נמצאת בשני הצדדים, ולכן היא עודפת.`); });
    G.forEach(([l, r], i) => { if (l.length > 1) for (const a of l){ const l2 = minus(l, a); if (sub(r, closure(l2, G))){ p.push(`ב-${M(fd([l, r]))} התכונה ${M(a)} עודפת בצד שמאל: ${M(l2 + '⁺')} כבר מכיל את ${M(r)}.`); break; } } });
    G.forEach(([l, r], i) => { for (const a of r){ const r2 = minus(r, a); const H = G.map((x, j) => j === i ? [l, r2] : x).filter(([, y]) => y); if (closure(l, H).includes(a)){ p.push(r.length === 1 ? `התלות ${M(fd([l, r]))} מיותרת: היא נובעת משאר התלויות.` : `ב-${M(fd([l, r]))} התכונה ${M(a)} עודפת בצד ימין: אפשר לגזור אותה בלי התלות הזו.`); break; } } });
    return p;
  }

  function nf(R, F){
    const Fc = canon(F), K = keys(R, F), prime = srt(K.join(''));
    const viol = Fc.filter(([l]) => !isSuper(l, R, F));
    const bad3 = viol.filter(([, r]) => !sub(r, prime));
    return {Fc, K, prime, viol, bad3, nf: !viol.length ? 'BCNF' : !bad3.length ? '3NF' : 'none'};
  }
  const lossless2 = (R1, R2, F) => { const I = inter(R1, R2), c = closure(I, F); return {I, c, ok: sub(R1, c) || sub(R2, c)}; };
  function chase(R, D, F){ // tableau test
    const A = [...R]; const T = D.map((Ri, i) => A.map(a => Ri.includes(a) ? 'a' : 'b' + i));
    let ch = true, g = 0;
    while (ch && g++ < 50){ ch = false;
      for (const [l, r] of F){ for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++){
        if ([...l].every(x => T[i][A.indexOf(x)] === T[j][A.indexOf(x)])){
          for (const y of r){ const k = A.indexOf(y); const u = T[i][k], v = T[j][k]; if (u !== v){ const w = u === 'a' || v === 'a' ? 'a' : (u < v ? u : v); const old = [u, v];
            T.forEach(row => { if (old.includes(row[k])) row[k] = w; }); ch = true; } } } } } }
    return T.some(row => row.every(x => x === 'a'));
  }
  function dpCheck(D, F){ // per dependency of Fc: algorithm with restricted closures
    return canon(F).map(([l, r]) => { const inOne = D.find(Ri => sub(l + r, Ri)); if (inOne) return {f: [l, r], ok: true, inOne, res: null};
      let res = l, ch = true; while (ch){ ch = false; for (const Ri of D){ const t = inter(closure(inter(res, Ri), F), Ri); if (!sub(t, res)){ res = uni(res, t); ch = true; } } }
      return {f: [l, r], ok: sub(r, res), inOne: null, res}; });
  }
  function projNF(Ri, F){ // normal form of Ri under projected dependencies
    const K = keys(Ri, projFD(Ri, F)), prime = srt(K.join('')); let worst = 'BCNF', why = null;
    for (const S of subsets(Ri)){ if (S.length === Ri.length) continue; const c = inter(closure(S, F), Ri); const add = minus(c, S); if (!add) continue;
      if (sub(Ri, c)) continue; // S is a superkey of Ri
      if (!sub(add, prime)){ return {nf: 'none', why: [S, add], K}; }
      if (worst === 'BCNF'){ worst = '3NF'; why = [S, add]; } }
    return {nf: worst, why, K};
  }
  function projFD(Ri, F){ const out = []; for (const S of subsets(Ri)){ const add = minus(inter(closure(S, F), Ri), S); if (add) out.push([S, add]); } return out; }
  function synth(R, F, trace){
    const Fc = canon(F), K = keys(R, F); const step = (h, b) => trace && trace.push({h, b});
    let T = Fc.map(([l, r]) => uni(l, r));
    step('טבלה לכל תלות בכיסוי הקנוני', `${M('Fc = ' + fds(Fc))}. לכל תלות טבלה עם הצד השמאלי והימני: ${T.map(t => M('(' + [...t].join(',') + ')')).join(', ')}.`);
    const rm = T.filter((t, i) => T.some((u, j) => j !== i && sub(t, u) && (t !== u || j < i)));
    if (rm.length){ T = T.filter((t, i) => !T.some((u, j) => j !== i && sub(t, u) && (t !== u || j < i))); step('מחיקת טבלה מוכלת', `${rm.map(t => M('(' + [...t].join(',') + ')')).join(', ')} מוכלת בטבלה אחרת, ולכן נמחקת.`); }
    if (!T.some(t => K.some(k => sub(k, t)))){ T.push(K[0]); step('טבלת מפתח', `אף טבלה לא מכילה מפתח קביל, ולכן מוסיפים טבלה עם המפתח ${M(K[0])}. היא מבטיחה שימור מידע.`); }
    else step('שימור מידע', `הטבלה ${M('(' + [...T.find(t => K.some(k => sub(k, t)))].join(',') + ')')} מכילה מפתח קביל של R, ולכן לא צריך טבלה נוספת. הפירוק משמר מידע.`);
    const nfs = T.map(t => projNF(t, F));
    step('הצורה של כל טבלה', T.map((t, i) => `${M('(' + [...t].join(',') + ')')}: ${nfs[i].nf === 'BCNF' ? 'BCNF' : `3NF ולא BCNF (${M(nfs[i].why[0] + '→' + nfs[i].why[1])})`}`).join(' · '));
    return {T, nfs};
  }

  /* ---------- parsing ---------- */
  const letters = s => srt(String(s).toUpperCase().replace(/[^A-Z]/g, ''));
  function parseSets(s){ s = String(s).toUpperCase();
    if (/[({\[]/.test(s)) return [...s.matchAll(/[({\[]([^)}\]]*)[)}\]]/g)].map(m => letters(m[1])).filter(Boolean);
    return s.split(/[,;|\n\/]+|\s{2,}/).map(letters).filter(Boolean); }
  function parseFDs(s){ s = String(s).replace(/→|->|=>|⟶|➝/g, '>');
    const out = [];
    s.split(/[;\n]+/).forEach(part => { if (!part.trim()) return;
      if ((part.match(/>/g) || []).length <= 1){ const [l, r] = part.split('>'); if (r !== undefined) out.push([letters(l), letters(r)]); return; }
      let cur = null; part.split(',').forEach(tok => { if (tok.includes('>')){ const [l, r] = tok.split('>'); cur = [letters(l), letters(r)]; out.push(cur); } else if (cur){ cur[1] = uni(cur[1], letters(tok)); } }); });
    return out.filter(([l, r]) => l && r); }

  /* ---------- generator ---------- */
  function rng(seed){ let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function shuffle(r, a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function genRF(r){
    const R = r() < .7 ? 'ABCDEG' : 'ABCDE';
    const n = 4 + Math.floor(r() * 3), F = [];
    let g = 0;
    while (F.length < n && g++ < 100){
      const ls = r() < .45 ? 1 : r() < .88 ? 2 : 3;
      const l = srt(shuffle(r, [...R]).slice(0, ls).join(''));
      const rest = minus(R, l); const rs = 1 + Math.floor(r() * Math.min(3, rest.length));
      let rr = srt(shuffle(r, [...rest]).slice(0, rs).join(''));
      if (r() < .08) rr = uni(rr, l[0]); // a trivial attribute, as in E→ECG
      if (F.some(([a, b]) => a === l)) continue;
      F.push([l, rr]);
    }
    return {R, F};
  }
  function profile(R, F){ const K = keys(R, F); const Fc = canon(F); const N = nf(R, F); return {K, Fc, nf: N.nf}; }
  function gen(kind, seed){
    const r = rng(seed); r(); r(); r(); const W = r();
    for (let tries = 0; tries < 4000; tries++){
      const {R, F} = genRF(r); const P = profile(R, F);
      if (P.K.length < 1 || P.K.length > 5 || P.K[0].length === R.length) continue;
      if (P.K.every(k => k.length >= 4)) continue;
      if (kind === 'closure'){
        const X = srt(shuffle(r, [...R]).slice(0, r() < .55 ? 1 : 2).join('')); const c = closure(X, F);
        if (c.length - X.length < 2) continue;
        if (r() < .3){ const notIn = minus(R, c); const yes = r() < .5 || !notIn; const target = yes ? srt(shuffle(r, [...minus(c, X)]).slice(0, 2).join('')) : uni(notIn[0], minus(c, X)[0] || '');
          return {kind, R, F, X, Y: target, mode: 'implied'}; }
        return {kind, R, F, X};
      }
      if (kind === 'keys'){ const w = [0, .25, .45, .7, .85, .95]; if (r() > w[P.K.length] + .2 && P.K.length === 1) continue; return {kind, R, F}; }
      if (kind === 'canon'){ if (equivSame(F, P.Fc)) continue; return {kind, R, F}; }
      if (kind === 'nf'){ const want = W < .5 ? 'none' : W < .85 ? '3NF' : 'BCNF'; if (P.nf !== want) continue; return {kind, R, F}; }
      if (kind === 'lossless'){ const A = [...R]; const I = srt(shuffle(r, A).slice(0, 1 + Math.floor(r() * 2)).join('')); const rest = shuffle(r, [...minus(R, I)]);
        const cut = 1 + Math.floor(r() * (rest.length - 1)); const R1 = uni(I, rest.slice(0, cut).join('')), R2 = uni(I, rest.slice(cut).join(''));
        const want = W < .6; if (lossless2(R1, R2, F).ok !== want) continue; return {kind, R, F, D: [R1, R2]}; }
      if (kind === 'dp'){ const D = decomp(r, R, F); if (!D) continue; const res = dpCheck(D, F); const ok = res.every(x => x.ok); const tricky = res.some(x => x.ok && !x.inOne);
        const want = W < .5; if (ok !== want) continue; if (ok && !tricky && r() < .6) continue; return {kind, R, F, D}; }
      if (kind === 'decomp'){ if (P.nf === 'BCNF') continue; const S = synth(R, F); if (S.T.length < 2) continue; const allB = S.nfs.every(x => x.nf === 'BCNF'); const want = W < .7; if (allB !== want) continue; return {kind, R, F, askBCNF: allB}; }
    }
    return null;
  }
  const equivSame = (F, G) => F.length === G.length && F.every(([l, r]) => G.some(([a, b]) => a === srt(l) && b === srt(r)));
  function decomp(r, R, F){ // a lossless decomposition into 2–3 tables built from dependencies
    const Fc = canon(F); if (Fc.length < 2) return null; const sh = shuffle(r, Fc);
    const a = uni(sh[0][0], sh[0][1]); const restA = uni(minus(R, a), sh[0][0]);
    const D = r() < .5 ? [a, restA] : [a, uni(sh[1][0], sh[1][1]), uni(minus(R, uni(a, uni(sh[1][0], sh[1][1]))), sh[0][0] + sh[1][0])];
    const D2 = [...new Set(D.map(srt))].filter(x => x.length > 1 && x !== R);
    if (D2.length < 2 || !sub(R, srt(D2.join('')))) return null;
    if (!chase(R, D2, F)) return null; return D2;
  }

  /* ---------- real exam instances ---------- */
  const P = s => parseFDs(s);
  const EXAM = [
    {src: '2024ג מועד 93', R: 'ABCDEG', F: P('A>DE; CD>AB; E>ECG; BG>AE; AG>BD')},
    {src: '2024א מועד 87', R: 'ABCDEG', F: P('AG>B; EBD>AC; E>BG; AG>E; B>A'), D: ['ABEG', 'CDEG']},
    {src: '2019א מועד 84', R: 'ABCDE', F: P('A>BCD; BCD>A; BC>D; AE>C; CE>B'), D: ['ABC', 'BCDE']},
    {src: '2019א מועד 86', R: 'ABCDEG', F: P('A>C; B>DG; D>E; BG>AE; DE>BG'), D: ['ACDE', 'BDG']},
    {src: '2019ג מועד 91', R: 'ABCDEG', F: P('AB>CD; BC>EG; A>G; G>B; C>G'), D: ['ABCD', 'CEG']},
    {src: '2019א מועד 92', R: 'ABCDE', F: P('AB>C; A>BD; AD>E; B>DE; E>B')},
    {src: '2019ג מועד 83', R: 'ABCDEG', F: P('A>BCD; B>D; D>E; BG>DE; AC>G')},
    {src: 'בחינה לדוגמה 1', R: 'ABCDE', F: P('C>D; CD>A; CE>B; B>ACE; E>A'), D: ['ABC', 'CDE']},
    {src: 'בחינה לדוגמה 4', R: 'ABCDEG', F: P('AD>G; AE>BCD; CE>A; G>E'), D: ['ABDEG', 'ACE']},
    {src: 'בחינה לדוגמה 2', R: 'ABCDEG', F: P('AB>CD; C>CE; C>G; G>E; CDG>E; DGE>A')},
  ];
  function examInst(kind, i){
    const pool = EXAM.filter(e => kind === 'lossless' || kind === 'dp' ? e.D : true);
    for (let k = 0; k < pool.length; k++){ const e = pool[(i + k) % pool.length]; const P = profile(e.R, e.F);
      if (kind === 'closure'){ const X = P.K.find(k => k.length === 1) ? minus(e.R, P.K.join('')).slice(0, 1) || e.R[1] : P.K[0].slice(0, 1); return {kind, R: e.R, F: e.F, X: X || 'A', src: e.src}; }
      if (kind === 'canon' && equivSame(e.F, P.Fc)) continue;
      if (kind === 'decomp') return {kind, R: e.R, F: e.F, askBCNF: synth(e.R, e.F).nfs.every(x => x.nf === 'BCNF'), src: e.src};
      return {kind, R: e.R, F: e.F, D: e.D, src: e.src}; }
    return gen(kind, i + 7);
  }

  /* ---------- skills: question, solution trace, checker ---------- */
  const given = q => `<div class="fml" dir="ltr"><div>R = (${[...q.R].join(', ')})</div><div>F = ${fds(q.F)}</div>${q.D ? `<div>${q.D.map((d, i) => `R${i+1} = (${[...d].join(', ')})`).join(',  ')}</div>` : ''}</div>`;
  const SK = {
    closure: {
      ask: q => q.mode === 'implied' ? `האם התלות ${M(q.X + '→' + q.Y)} נובעת מ-F?` : `חשבו את ${M(q.X + '⁺')}, הסגור של ${M(q.X)}.`,
      input: q => q.mode === 'implied' ? {type: 'mcq', opts: ['כן, נובעת', 'לא נובעת']} : {type: 'set', ph: 'למשל ABD'},
      solve(q){ const log = []; const c = closure(q.X, q.F, log); const st = [{h: 'מתחילים', b: `${M(q.X + '⁺')} מכיל קודם כל את ${M(set(q.X))}.`}];
        log.forEach(([f, add, C]) => st.push({h: `מפעילים ${fd(f)}`, b: `צד שמאל ${M(f[0])} כבר בקבוצה, ולכן מוסיפים את ${M(set(add))}. עכשיו ${M(set(C))}.`}));
        st.push({h: 'אין עוד שינוי', b: `אף תלות לא מוסיפה תכונה חדשה. ${M(q.X + '⁺ = ' + set(c))}.${q.mode === 'implied' ? ` ${sub(q.Y, c) ? `${M(q.Y)} כלול בסגור, ולכן התלות נובעת.` : `${M(minus(q.Y, c))} לא בסגור, ולכן התלות לא נובעת.`}` : ''}`});
        return {steps: st, ans: q.mode === 'implied' ? (sub(q.Y, c) ? 0 : 1) : c, show: q.mode === 'implied' ? (sub(q.Y, c) ? 'נובעת' : 'לא נובעת') : M(set(c))}; },
      check(q, v, sol){ if (q.mode === 'implied'){ const c = closure(q.X, q.F); return v === sol.ans ? {ok: true} : {ok: false, why: sol.ans === 0 ? `התלות כן נובעת: ${M(q.X + '⁺ = ' + set(c))}, וזה מכיל את ${M(q.Y)}. לא צריך שהתלות תהיה כתובה ב-F.` : `${M(q.X + '⁺ = ' + set(c))} לא מכיל את ${M(minus(q.Y, c))}, ולכן התלות לא נובעת.`}; }
        const u = letters(v); if (eqs(u, sol.ans)) return {ok: true};
        const miss = minus(sol.ans, u), extra = minus(u, sol.ans);
        return {ok: false, why: [miss && `חסרות ${M(set(miss))}. אחרי שהקבוצה גדלה, צריך לעבור שוב על כל התלויות: תלות שלא הופעלה קודם יכולה להיות מופעלת עכשיו.`, extra && `${M(set(extra))} לא בסגור: אין תלות שצד שמאל שלה כלול בקבוצה ושנותנת אותן.`, !sub(q.X, u) && `הסגור תמיד מכיל את ${M(q.X)} עצמו.`].filter(Boolean).join(' ')}; }
    },
    keys: {
      ask: () => 'מצאו את כל המפתחות הקבילים של R.',
      input: () => ({type: 'sets', ph: 'למשל AE, CE'}),
      solve(q){ const K = keys(q.R, q.F); const L = srt(q.F.map(x => x[0]).join('')), Rr = srt(q.F.map(x => minus(x[1], x[0])).join(''));
        const onlyL = minus(minus(q.R, Rr), ''), none = minus(q.R, uni(L, Rr)), core = uni(minus(q.R, Rr), ''), onlyR = minus(Rr, L);
        const st = [{h: 'מיון התכונות', b: `${core ? `${M(set(core))} לא מופיעות אף פעם בצד ימין, ולכן הן בכל מפתח.` : 'כל תכונה מופיעה גם בצד ימין, ולכן אין תכונה שחייבת להיות בכל מפתח.'} ${onlyR ? `${M(set(onlyR))} מופיעות רק בצד ימין, ולכן הן לא באף מפתח.` : ''}`}];
        if (core) st.push({h: `הסגור של ${core}`, b: `${M(core + '⁺ = ' + set(closure(core, q.F)))}${eqs(closure(core, q.F), q.R) ? `. זה כל R, ולכן ${M(core)} הוא המפתח היחיד.` : `. זה לא כל R, ולכן מוסיפים לו תכונות.`}`});
        K.forEach(k => st.push({h: `מפתח: ${k}`, b: `${M(k + '⁺ = ' + set(closure(k, q.F)))} = R, ואף תת-קבוצה ממש של ${M(k)} אינה מפתח.`}));
        st.push({h: 'סיכום', b: `המפתחות הקבילים: ${K.map(k => M(set(k))).join(', ')}. כל קבוצה אחרת שמגיעה ל-R מכילה אחד מהם.`});
        return {steps: st, ans: K, show: K.map(k => M(set(k))).join(', ')}; },
      check(q, v, sol){ const u = [...new Set(parseSets(v))]; const K = sol.ans; const ok = u.length === K.length && u.every(x => K.includes(x)); if (ok) return {ok: true};
        const notSuper = u.filter(x => !isSuper(x, q.R, q.F)), nonMin = u.filter(x => isSuper(x, q.R, q.F) && !K.includes(x)), miss = K.filter(k => !u.includes(k));
        return {ok: false, why: [notSuper.length && `${notSuper.map(x => M(x)).join(', ')} אינו מפתח: ${M(notSuper[0] + '⁺ = ' + set(closure(notSuper[0], q.F)))}.`,
          nonMin.length && `${nonMin.map(x => M(x)).join(', ')} מגיע לכל R, אבל אינו מינימלי: ${M(K.find(k => sub(k, nonMin[0])))} שבתוכו כבר מפתח.`,
          miss.length && `חסר${miss.length > 1 ? 'ים' : ''} ${miss.length} מפתח${miss.length > 1 ? 'ות' : ''}. אחרי שמוצאים מפתח, בודקים קבוצות שמחליפות את אחת התכונות שלו בצד שמאל של תלות שנותנת אותה.`].filter(Boolean).join(' ')}; }
    },
    canon: {
      ask: () => 'חשבו כיסוי קנוני ל-F.',
      input: () => ({type: 'fds', ph: 'A>BC, CD>A'}),
      solve(q){ const st = []; const Fc = canon(q.F, st); return {steps: st, ans: Fc, show: M(fds(Fc))}; },
      check(q, v, sol){ const G = parseFDs(v); if (!G.length) return {ok: false, why: 'לא זיהיתי תלויות. כתבו למשל A>BC, CD>A.'}; const p = canonProblems(q.F, G, q.R); return p.length ? {ok: false, why: p.slice(0, 2).join(' ')} : {ok: true, note: equivSame(G, sol.ans) ? '' : 'יש יותר מכיסוי קנוני אחד, וגם התשובה שלכם נכונה.'}; }
    },
    nf: {
      ask: () => 'באיזו צורה נורמלית נמצא R?',
      input: () => ({type: 'mcq', opts: ['BCNF', '3NF ולא BCNF', 'לא 3NF']}),
      solve(q){ const N = nf(q.R, q.F); const st = [{h: 'מפתחות', b: `המפתחות: ${N.K.map(k => M(k)).join(', ')}. תכונות ראשוניות (שייכות למפתח כלשהו): ${M(set(N.prime))}.`},
        {h: 'בדיקת BCNF', b: N.viol.length ? `${N.viol.map(f => M(fd(f))).join(', ')}: צד שמאל אינו מפתח-על, ולכן R אינו ב-BCNF.` : 'בכל תלות בכיסוי הקנוני צד שמאל הוא מפתח-על, ולכן R ב-BCNF.'}];
        if (N.viol.length) st.push({h: 'בדיקת 3NF', b: N.bad3.length ? `ב-${M(fd(N.bad3[0]))} צד שמאל אינו מפתח-על, ו-${M(minus(N.bad3[0][1], N.prime))} אינה תכונה ראשונית. לכן R אינו ב-3NF.` : 'בכל תלות שמפרה BCNF, כל התכונות בצד ימין ראשוניות. לכן R ב-3NF.'});
        const ans = {BCNF: 0, '3NF': 1, none: 2}[N.nf]; return {steps: st, ans, show: ['BCNF', '3NF ולא BCNF', 'לא 3NF'][ans]}; },
      check(q, v, sol){ if (v === sol.ans) return {ok: true}; const N = nf(q.R, q.F);
        return {ok: false, why: v === 0 ? `${M(fd(N.viol[0]))} מפרה BCNF: ${M(N.viol[0][0] + '⁺ = ' + set(closure(N.viol[0][0], q.F)))}, לא כל R.` : v === 1 && N.nf === 'none' ? `${M(fd(N.bad3[0]))}: צד שמאל אינו מפתח-על, ו-${M(minus(N.bad3[0][1], N.prime))} לא שייכת לאף מפתח קביל.` : v === 2 && N.nf === '3NF' ? `כל תכונה בצד ימין של תלות מפרה שייכת למפתח קביל (${M(set(N.prime))}), וזה מספיק ל-3NF.` : 'כל צדי השמאל הם מפתחות-על, ולכן R ב-BCNF.'}; }
    },
    lossless: {
      ask: q => `האם הפירוק ${q.D.map((d, i) => M(`R${i+1} = (${[...d].join(',')})`)).join(', ')} משמר מידע?`,
      input: () => ({type: 'mcq', opts: ['משמר מידע', 'לא משמר מידע']}),
      solve(q){ const L = lossless2(q.D[0], q.D[1], q.F); return {steps: [{h: 'החיתוך', b: `${M('R1 ∩ R2 = ' + set(L.I))}.`}, {h: 'הסגור של החיתוך', b: `${M(L.I + '⁺ = ' + set(L.c))}.`},
        {h: 'המסקנה', b: L.ok ? `הסגור מכיל את ${M(sub(q.D[0], L.c) ? 'R1' : 'R2')}, כלומר החיתוך הוא מפתח-על של אחת הטבלאות. לכן הפירוק משמר מידע.` : `הסגור לא מכיל את R1 ולא את R2: החיתוך אינו מפתח-על של אף אחת מהן. לכן הפירוק לא משמר מידע.`}], ans: L.ok ? 0 : 1, show: L.ok ? 'משמר מידע' : 'לא משמר מידע'}; },
      check(q, v, sol){ if (v === sol.ans) return {ok: true}; const L = lossless2(q.D[0], q.D[1], q.F);
        return {ok: false, why: L.ok ? `${M(L.I + '⁺ = ' + set(L.c))} מכיל את ${M(sub(q.D[0], L.c) ? 'R1' : 'R2')}. זה מספיק: לא צריך שהחיתוך יהיה מפתח של R כולו.` : `${M(L.I + '⁺ = ' + set(L.c))} לא מכיל אף אחת משתי הטבלאות.`}; }
    },
    dp: {
      ask: q => `האם הפירוק ${q.D.map((d, i) => M(`R${i+1} = (${[...d].join(',')})`)).join(', ')} משמר תלויות?`,
      input: () => ({type: 'mcq', opts: ['משמר תלויות', 'לא משמר תלויות']}),
      solve(q){ const res = dpCheck(q.D, q.F); const Fc = canon(q.F); const st = [{h: 'כיסוי קנוני', b: `בודקים כל תלות ב-${M('Fc = ' + fds(Fc))}.`}];
        res.forEach(x => st.push({h: fd(x.f), b: x.inOne ? `${M(x.f[0] + x.f[1])} כולן בטבלה ${M('(' + [...x.inOne].join(',') + ')')}. נשמרת.` : x.ok ? `לא בטבלה אחת, אבל נגזרת: מתחילים מ-${M(x.f[0])}, ובכל טבלה מוסיפים את הסגור שלו בתוכה. מגיעים ל-${M(set(x.res))}, שמכיל את ${M(x.f[1])}. נשמרת.` : `לא בטבלה אחת, ומהטבלאות מגיעים רק ל-${M(set(x.res))}. ${M(minus(x.f[1], x.res))} חסרה, ולכן התלות אובדת.`}));
        const ok = res.every(x => x.ok); st.push({h: 'המסקנה', b: ok ? 'כל התלויות נשמרות.' : 'יש תלות שאובדת, ולכן הפירוק לא משמר תלויות.'}); return {steps: st, ans: ok ? 0 : 1, show: ok ? 'משמר תלויות' : 'לא משמר תלויות'}; },
      check(q, v, sol){ if (v === sol.ans) return {ok: true}; const res = dpCheck(q.D, q.F); const lost = res.find(x => !x.ok), derived = res.find(x => x.ok && !x.inOne);
        return {ok: false, why: lost ? `${M(fd(lost.f))} אובדת: מהטבלאות מגיעים מ-${M(lost.f[0])} רק ל-${M(set(lost.res))}.` : `${derived ? `${M(fd(derived.f))} לא כתובה בתוך טבלה אחת, אבל אפשר לגזור אותה דרך כמה טבלאות. ` : ''}שימור תלויות בודקים בסגור, לא רק בחיפוש התלות הכתובה. על זה ירדו נקודות ב-2019א מועד 86.`}; }
    },
    decomp: {
      ask: q => q.askBCNF ? 'פרקו את R פירוק משמר מידע ומשמר תלויות ליחסים שכולם ב-BCNF.' : 'פרקו את R פירוק משמר מידע ומשמר תלויות, בצורה הנורמלית הגבוהה ביותר האפשרית.',
      input: () => ({type: 'sets', ph: '(A,B,C), (C,D,E)'}),
      solve(q){ const st = []; const S = synth(q.R, q.F, st); return {steps: st, ans: S.T, show: S.T.map(t => M('(' + [...t].join(',') + ')')).join(', ')}; },
      check(q, v, sol){ const D = [...new Set(parseSets(v))]; if (D.length < 1) return {ok: false, why: 'כתבו טבלאות בסוגריים, למשל (A,B,C), (C,D).'};
        if (!eqs(srt(D.join('')), q.R)) return {ok: false, why: `הטבלאות לא מכסות את כל התכונות: חסרות ${M(set(minus(q.R, D.join(''))))}.`};
        if (!chase(q.R, D, q.F)) return {ok: false, why: 'הפירוק לא משמר מידע. בדרך כלל חסרה טבלה שמכילה מפתח קביל של R.'};
        const res = dpCheck(D, q.F); const lost = res.find(x => !x.ok); if (lost) return {ok: false, why: `הפירוק לא משמר את ${M(fd(lost.f))}.`};
        const n = D.map(t => projNF(t, q.F)); const bad = D.findIndex((t, i) => n[i].nf === 'none'); if (bad >= 0) return {ok: false, why: `${M('(' + [...D[bad]].join(',') + ')')} אינה אפילו ב-3NF: ${M(n[bad].why[0] + '→' + n[bad].why[1])}.`};
        const nb = D.findIndex((t, i) => n[i].nf !== 'BCNF');
        if (nb >= 0 && sol.ans && synthAllB(q)) return {ok: false, why: `${M('(' + [...D[nb]].join(',') + ')')} ב-3NF ולא ב-BCNF (${M(n[nb].why[0] + '→' + n[nb].why[1])}), ואפשר להגיע כאן לפירוק שכולו BCNF.`};
        return {ok: true, note: nb >= 0 ? 'הפירוק תקין. חלק מהטבלאות ב-3NF ולא ב-BCNF, וכאן אי אפשר יותר מזה בלי לאבד תלות.' : ''}; }
    }
  };
  const synthAllB = q => synth(q.R, q.F).nfs.every(x => x.nf === 'BCNF');
  return {closure, keys, canon, canonProblems, nf, lossless2, chase, dpCheck, projNF, synth, parseFDs, parseSets, letters, gen, examInst, EXAM, SK, given, fds, set, M};
})();
if (typeof module !== 'undefined') module.exports = NORM;
