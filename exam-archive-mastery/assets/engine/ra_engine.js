const RA=(function(){
  const OPS1={"σ":"sel","π":"proj","ρ":"ren"};
  const WORD1={select:"sel",sigma:"sel",project:"proj",pi:"proj",rename:"ren",rho:"ren"};
  const BIN={"⋈":"join","×":"prod","∪":"union","∩":"inter","−":"diff","÷":"div"};
  const WORDB={join:"join",x:"prod",times:"prod",union:"union",intersect:"inter",minus:"diff",divide:"div"};
  function lex(s){
    const t=[]; let i=0;
    while(i<s.length){
      const c=s[i];
      if(/\s/.test(c)){i++;continue;}
      if(c==="["){ // bracket argument, keep raw
        let d=1,j=i+1; while(j<s.length&&d){if(s[j]==="[")d++; else if(s[j]==="]")d--; j++;}
        if(d) throw new Error("חסר ] סוגר.");
        t.push({k:"arg",v:s.slice(i+1,j-1)}); i=j; continue;}
      if(c==="("||c===")"){t.push({k:c});i++;continue;}
      if(c==="←"||(c==="<"&&s[i+1]==="-")){t.push({k:"assign"}); i+=c==="←"?1:2; continue;}
      if(OPS1[c]){t.push({k:"u",v:OPS1[c]});i++;continue;}
      if(BIN[c]){t.push({k:"b",v:BIN[c]});i++;continue;}
      if(c==="-"){t.push({k:"b",v:"diff"});i++;continue;}
      if(c==="*"){t.push({k:"b",v:"prod"});i++;continue;}
      if(c==="/"){t.push({k:"b",v:"div"});i++;continue;}
      const m=/^[A-Za-z_][A-Za-z0-9_]*(?:-[A-Za-z][A-Za-z0-9_]*)*/.exec(s.slice(i));
      if(m){const w=m[0], lw=w.toLowerCase();
        if(WORD1[lw]&&s.slice(i+w.length).trimStart()[0]==="[") t.push({k:"u",v:WORD1[lw]});
        else if(WORDB[lw]&&t.length&&(t[t.length-1].k===")"||t[t.length-1].k==="id")) t.push({k:"b",v:WORDB[lw]});
        else t.push({k:"id",v:w});
        i+=w.length; continue;}
      throw new Error(`התו „${c}״ לא מוכר בביטוי.`);
    }
    return t;
  }
  // precedence: unary ops bind tightest; then ⋈ × ÷ ; then ∪ ∩ −
  function parse(tokens){
    let p=0; const peek=()=>tokens[p], eat=k=>{const x=tokens[p]; if(!x||(k&&x.k!==k)) throw new Error(k===")"?"חסר סוגר ) .":"ביטוי לא שלם."); p++; return x;};
    function primary(){
      const x=peek(); if(!x) throw new Error("ביטוי לא שלם.");
      if(x.k==="u"){p++; let arg=null; if(peek()&&peek().k==="arg") arg=eat("arg").v; else if(x.v!=="ren") throw new Error("אחרי σ או π צריך לבוא תנאי או רשימה בסוגריים מרובעים, למשל σ[a=1](r).");
        let b=null, j=null;
        if(x.v==="ren"&&!arg){ throw new Error("אחרי ρ כותבים שם חדש בסוגריים מרובעים, למשל ρ[s](r)."); }
        const e=primary();
        return {op:x.v,arg,e};}
      if(x.k==="("){p++; const e=expr(); eat(")"); return e;}
      if(x.k==="id"){p++; return {op:"rel",name:x.v};}
      throw new Error("ציפיתי לשם יחס, לסוגר או לפעולה.");
    }
    function mid(){ let l=primary(); while(peek()&&peek().k==="b"&&["join","prod","div"].includes(peek().v)){const o=eat().v; let arg=null; if(o==="join"&&peek()&&peek().k==="arg") arg=eat().v; l={op:o,arg,l,r:primary()};} return l;}
    function expr(){ let l=mid(); while(peek()&&peek().k==="b"){const o=eat().v; let arg=null; if(o==="join"&&peek()&&peek().k==="arg") arg=eat().v; const r=["join","prod","div"].includes(o)?primary():mid(); l={op:o,arg,l,r};} return l;}
    const e=expr(); if(p<tokens.length) throw new Error("יש בביטוי חלק מיותר אחרי הסוף. אולי חסר אופרטור?"); return e;
  }
  /* ---- condition language ---- */
  function lexC(s){
    const t=[]; let i=0;
    while(i<s.length){const c=s[i];
      if(/\s/.test(c)){i++;continue;}
      if(c==="'"||c==='"'||c==="„"||c==="“"){const close=c==="„"?/[״"”“]/:c==="“"?/[”"]/:new RegExp(c); let j=i+1; while(j<s.length&&!close.test(s[j])) j++; if(j>=s.length) throw new Error("מחרוזת בלי מירכאה סוגרת."); t.push({k:"v",v:s.slice(i+1,j)}); i=j+1; continue;}
      const two=s.slice(i,i+2);
      if(["<=",">=","<>","!="].includes(two)){t.push({k:"cmp",v:{"<=":"≤",">=":"≥","<>":"≠","!=":"≠"}[two]});i+=2;continue;}
      if("=<>≤≥≠".includes(c)){t.push({k:"cmp",v:c});i++;continue;}
      if(c==="∧"||c==="&"){t.push({k:"and"});i++;continue;}
      if(c==="∨"||c==="|"){t.push({k:"or"});i++;continue;}
      if(c==="¬"||c==="!"){t.push({k:"not"});i++;continue;}
      if(c==="("||c===")"||c===","){t.push({k:c});i++;continue;}
      const n=/^-?\d+(?:\.\d+)?/.exec(s.slice(i)); if(n){t.push({k:"v",v:+n[0]});i+=n[0].length;continue;}
      const m=/^[A-Za-z_][A-Za-z0-9_]*(?:-[A-Za-z][A-Za-z0-9_]*)*(?:\.[A-Za-z_][A-Za-z0-9_]*(?:-[A-Za-z][A-Za-z0-9_]*)*)?/.exec(s.slice(i));
      if(m){const w=m[0].toLowerCase(); if(w==="and")t.push({k:"and"}); else if(w==="or")t.push({k:"or"}); else if(w==="not")t.push({k:"not"}); else t.push({k:"a",v:m[0]}); i+=m[0].length; continue;}
      const h=/^[֐-׿][֐-׿\-״׳ ]*/.exec(s.slice(i)); if(h){throw new Error(`ערך בעברית צריך מירכאות: '${h[0].trim()}'.`);}
      throw new Error(`התו „${c}״ לא מוכר בתנאי.`);}
    return t;
  }
  function parseC(s){
    const t=lexC(s); let p=0; const pk=()=>t[p];
    function or(){let l=and(); while(pk()&&pk().k==="or"){p++; l={o:"or",l,r:and()};} return l;}
    function and(){let l=not(); while(pk()&&pk().k==="and"){p++; l={o:"and",l,r:not()};} return l;}
    function not(){if(pk()&&pk().k==="not"){p++; return {o:"not",e:not()};} return cmp();}
    function cmp(){ if(pk()&&pk().k==="("){p++; const e=or(); if(!pk()||pk().k!==")") throw new Error("חסר ) בתנאי."); p++; return e;}
      const a=opnd(); const c=pk(); if(!c||c.k!=="cmp") throw new Error("בתנאי צריכה להיות השוואה, למשל a=5."); p++; const b=opnd(); return {o:"cmp",c:c.v,a,b};}
    function opnd(){const x=pk(); if(!x) throw new Error("תנאי לא שלם."); p++; if(x.k==="v") return {v:x.v}; if(x.k==="a") return {a:x.v}; throw new Error("ציפיתי לשם תכונה או לערך.");}
    const e=or(); if(p<t.length) throw new Error("יש חלק מיותר בתנאי."); return e;
  }
  /* ---- relations ---- */
  // relation: {cols:[{n,r}], rows:[[...]]}
  function key(row){return JSON.stringify(row);}
  function dedup(rows){const s=new Set(),o=[]; rows.forEach(r=>{const k=key(r); if(!s.has(k)){s.add(k);o.push(r);}}); return o;}
  function colIdx(rel,name){
    const parts=name.split("."); let hits;
    if(parts.length===2) hits=rel.cols.map((c,i)=>[c,i]).filter(([c])=>c.n===parts[1]&&c.r===parts[0]);
    else hits=rel.cols.map((c,i)=>[c,i]).filter(([c])=>c.n===name);
    if(!hits.length) throw new Error(`אין תכונה בשם ${name}. התכונות הזמינות: ${rel.cols.map(cn).join(", ")}. אם התכוונתם לערך, עטפו אותו במירכאות: '${name}'.`);
    if(hits.length>1) throw new Error(`השם ${name} דו-משמעי. כתבו ${hits.map(([c])=>c.r+"."+c.n).join(" או ")}.`);
    return hits[0][1];
  }
  function cn(c){return c.q?c.r+"."+c.n:c.n;}
  function evalC(e,rel,row){
    if(e.o==="or"){const a=evalC(e.l,rel,row); return a||evalC(e.r,rel,row);}
    if(e.o==="and"){const a=evalC(e.l,rel,row); return a&&evalC(e.r,rel,row);}
    if(e.o==="not") return !evalC(e.e,rel,row);
    const v=x=>("v" in x)?x.v:row[colIdx(rel,x.a)];
    let a=v(e.a), b=v(e.b);
    if(typeof a!==typeof b){ if(!isNaN(+a)&&!isNaN(+b)){a=+a;b=+b;} else {a=String(a);b=String(b);} }
    switch(e.c){case "=":return a===b; case "≠":return a!==b; case "<":return a<b; case ">":return a>b; case "≤":return a<=b; case "≥":return a>=b;}
  }
  function qualify(cols){ // mark names that appear twice as qualified
    const cnt={}; cols.forEach(c=>cnt[c.n]=(cnt[c.n]||0)+1); return cols.map(c=>({...c,q:cnt[c.n]>1}));}
  function same(a,b){return a.cols.length===b.cols.length;}
  function run(src,db){
    const env=Object.assign({},db); const steps=[]; let last=null, lastName=null;
    const lines=src.split(/\n|;/).map(s=>s.trim()).filter(Boolean);
    if(!lines.length) throw new Error("הקלידו ביטוי.");
    lines.forEach(line=>{
      const t=lex(line); let name=null, body=t;
      if(t.length>2&&t[0].k==="id"&&t[1].k==="assign"){name=t[0].v; body=t.slice(2);}
      else if(t.some(x=>x.k==="assign")) throw new Error("השמה כותבים כך: שם ← ביטוי.");
      const ast=parse(body);
      const r=ev(ast,env,steps);
      if(name){ env[name]={cols:r.cols.map(c=>({n:c.n,r:name})),rows:r.rows}; steps.push({label:name+" ← "+show(ast),rel:env[name],assign:1}); }
      last=name?env[name]:r; lastName=name;
    });
    return {result:last,steps};
  }
  function show(a){
    switch(a.op){
      case "rel":return a.name;
      case "sel":return "σ["+a.arg+"]("+show(a.e)+")";
      case "proj":return "π["+a.arg+"]("+show(a.e)+")";
      case "ren":return "ρ["+a.arg+"]("+show(a.e)+")";
      default:{const s={join:"⋈",prod:"×",union:"∪",inter:"∩",diff:"−",div:"÷"}[a.op]; const w=x=>x.op==="rel"||["sel","proj","ren"].includes(x.op)?show(x):"("+show(x)+")"; return w(a.l)+" "+s+(a.arg?"["+a.arg+"]":"")+" "+w(a.r);}
    }
  }
  function ev(a,env,steps){
    let r;
    switch(a.op){
      case "rel":{const R=env[a.name]; if(!R) throw new Error(`אין יחס בשם ${a.name}. היחסים הקיימים: ${Object.keys(env).join(", ")}.`); return {cols:R.cols.map(c=>({n:c.n,r:c.r||a.name})),rows:R.rows.slice()};}
      case "sel":{const x=ev(a.e,env,steps), c=parseC(a.arg); r={cols:x.cols,rows:x.rows.filter(row=>evalC(c,x,row))}; break;}
      case "proj":{const x=ev(a.e,env,steps); const names=a.arg.split(",").map(s=>s.trim()).filter(Boolean); if(!names.length) throw new Error("π צריכה רשימת תכונות."); const idx=names.map(n=>colIdx(x,n)); r={cols:qualify(idx.map(i=>({n:x.cols[i].n,r:x.cols[i].r}))),rows:dedup(x.rows.map(row=>idx.map(i=>row[i])))}; break;}
      case "ren":{const x=ev(a.e,env,steps); const m=/^\s*([A-Za-z_][\w-]*)\s*(?:\(([^)]*)\))?\s*$/.exec(a.arg); if(!m) throw new Error("ρ כותבים כך: ρ[s](r) או ρ[s(a,b)](r)."); const nn=m[2]?m[2].split(",").map(s=>s.trim()):null; if(nn&&nn.length!==x.cols.length) throw new Error(`ב-ρ צריך ${x.cols.length} שמות תכונות.`); r={cols:x.cols.map((c,i)=>({n:nn?nn[i]:c.n,r:m[1]})),rows:x.rows}; break;}
      case "prod":{const L=ev(a.l,env,steps),R=ev(a.r,env,steps); const rows=[]; L.rows.forEach(x=>R.rows.forEach(y=>rows.push(x.concat(y)))); r={cols:qualify(L.cols.concat(R.cols)),rows}; break;}
      case "join":{const L=ev(a.l,env,steps),R=ev(a.r,env,steps);
        if(a.arg){const cols=qualify(L.cols.concat(R.cols)); const rel={cols}; const c=parseC(a.arg); const rows=[]; L.rows.forEach(x=>R.rows.forEach(y=>{const row=x.concat(y); if(evalC(c,rel,row)) rows.push(row);})); r={cols,rows}; break;}
        const common=L.cols.map((c,i)=>[c.n,i]).filter(([n])=>R.cols.some(c=>c.n===n));
        const rIdx=common.map(([n])=>R.cols.findIndex(c=>c.n===n));
        const restR=R.cols.map((c,i)=>i).filter(i=>!rIdx.includes(i));
        const rows=[]; L.rows.forEach(x=>R.rows.forEach(y=>{ if(common.every(([n,i],k)=>String(x[i])===String(y[rIdx[k]]))) rows.push(x.concat(restR.map(i=>y[i]))); }));
        r={cols:qualify(L.cols.map(c=>({n:c.n,r:c.r})).concat(restR.map(i=>({n:R.cols[i].n,r:R.cols[i].r})))),rows:dedup(rows),common:common.map(c=>c[0])}; break;}
      case "union":case "inter":case "diff":{const L=ev(a.l,env,steps),R=ev(a.r,env,steps);
        if(!same(L,R)) throw new Error(`ב-${{union:"∪",inter:"∩",diff:"−"}[a.op]} שני היחסים צריכים להיות תואמים: אותו מספר תכונות. כאן ${L.cols.length} מול ${R.cols.length}.`);
        const rk=new Set(R.rows.map(key)); let rows;
        if(a.op==="union") rows=dedup(L.rows.concat(R.rows)); else if(a.op==="inter") rows=dedup(L.rows.filter(x=>rk.has(key(x)))); else rows=dedup(L.rows.filter(x=>!rk.has(key(x))));
        r={cols:L.cols,rows}; break;}
      case "div":{const L=ev(a.l,env,steps),R=ev(a.r,env,steps);
        const rIn=R.cols.map(c=>L.cols.findIndex(x=>x.n===c.n)); if(rIn.some(i=>i<0)) throw new Error("ב-÷ כל התכונות של המחלק צריכות להופיע במחולק.");
        const keep=L.cols.map((c,i)=>i).filter(i=>!rIn.includes(i)); if(!keep.length) throw new Error("ב-÷ למחולק צריכות להיות תכונות נוספות.");
        const have=new Set(L.rows.map(key)); const cand=dedup(L.rows.map(x=>keep.map(i=>x[i])));
        const rows=cand.filter(t=>R.rows.every(u=>{const full=new Array(L.cols.length); keep.forEach((i,k)=>full[i]=t[k]); rIn.forEach((i,k)=>full[i]=u[k]); return have.has(key(full));}));
        r={cols:keep.map(i=>L.cols[i]),rows}; break;}
    }
    r.rows=dedup(r.rows);
    steps.push({label:show(a),rel:r,op:a.op});
    return r;
  }
  return {run,show,cn,parse,lex};
})();