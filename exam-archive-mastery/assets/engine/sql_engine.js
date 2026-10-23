const SQL=(function(){
  const KW=new Set("select distinct all from where group by having order asc desc as and or not in is null like between exists unique some any union intersect except join natural inner left right full outer on using with insert into values update set delete create table view drop case when then else end primary key foreign references cross true false".split(" "));
  const AGG=new Set(["count","sum","avg","min","max"]);
  function E(m){return new Error(m);}
  function lex(s){
    const t=[]; let i=0;
    while(i<s.length){
      const c=s[i];
      if(/\s/.test(c)){i++;continue;}
      if(c==="-"&&s[i+1]==="-"){while(i<s.length&&s[i]!=="\n")i++; continue;}
      if(c==="'"){let j=i+1,v=""; for(;;){if(j>=s.length) throw E("מחרוזת בלי גרש סוגר. מחרוזות ב-SQL נכתבות בין גרשים: 'זית'."); if(s[j]==="'"){if(s[j+1]==="'"){v+="'";j+=2;continue;} break;} v+=s[j++];} t.push({t:"str",v,p:i}); i=j+1; continue;}
      if(c==='"'){const j=s.indexOf('"',i+1); if(j<0) throw E("חסר \" סוגר."); t.push({t:"id",v:s.slice(i+1,j).toLowerCase(),p:i}); i=j+1; continue;}
      const n=/^\d+(?:\.\d+)?/.exec(s.slice(i)); if(n){t.push({t:"num",v:+n[0],p:i}); i+=n[0].length; continue;}
      const w=/^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
      if(w){const lw=w[0].toLowerCase(); t.push(KW.has(lw)?{t:"kw",v:lw,p:i}:{t:"id",v:lw,p:i}); i+=w[0].length; continue;}
      const two=s.slice(i,i+2);
      if(["<=",">=","<>","!=","||"].includes(two)){t.push({t:"op",v:two==="!="?"<>":two,p:i}); i+=2; continue;}
      if("=<>+-*/%".includes(c)){t.push({t:"op",v:c,p:i}); i++; continue;}
      if("(),.;".includes(c)){t.push({t:"p",v:c,p:i}); i++; continue;}
      if(/[\u0590-\u05FF]/.test(c)) throw E("טקסט בעברית צריך להיות בתוך גרשים, למשל where p_type = 'עץ פרי'.");
      throw E(`התו „${c}״ לא מוכר.`);
    }
    t.push({t:"eof",p:s.length}); return t;
  }
  /* ---------------- parser ---------------- */
  function Parser(src){
    const T=lex(src); let p=0;
    const pk=(o=0)=>T[p+o];
    const isK=(v,o=0)=>pk(o).t==="kw"&&pk(o).v===v;
    const isP=(v,o=0)=>(pk(o).t==="p"||pk(o).t==="op")&&pk(o).v===v;
    const desc=x=>x.t==="eof"?"סוף השאילתה":`„${x.v}״`;
    function k(v){if(!isK(v)) throw E(`ציפיתי למילה ${v.toUpperCase()} אבל מצאתי ${desc(pk())}.`); p++;}
    function P(v){if(!isP(v)) throw E(`ציפיתי ל-„${v}״ אבל מצאתי ${desc(pk())}.`); p++;}
    function id(){const x=pk(); if(x.t!=="id"){ if(x.t==="kw") throw E(`„${x.v}״ היא מילה שמורה ולא יכולה לשמש כאן כשם.`); throw E(`ציפיתי לשם אבל מצאתי ${desc(x)}.`);} p++; return x.v;}
    function statements(){const out=[]; while(pk().t!=="eof"){ if(isP(";")){p++;continue;} out.push(statement()); if(!isP(";")&&pk().t!=="eof") throw E(`אחרי סוף הפקודה מצאתי ${desc(pk())}. אולי חסר פסיק או נקודה-פסיק?`);} return out;}
    function statement(){
      if(isK("select")||isK("with")||isP("(")) return {type:"query",q:query()};
      if(isK("insert")){p++; k("into"); const t=id(); let cols=null; if(isP("(")&&!(isK("select",1))){p++; cols=[id()]; while(isP(",")){p++; cols.push(id());} P(")");}
        if(isK("values")){p++; const rows=[]; do{ if(rows.length) p++; P("("); const r=[expr()]; while(isP(",")){p++; r.push(expr());} P(")"); rows.push(r);}while(isP(",")); return {type:"insert",t,cols,rows};}
        return {type:"insert",t,cols,q:query()};}
      if(isK("update")){p++; const t=id(); let alias=null; if(pk().t==="id") alias=id(); k("set"); const sets=[]; do{ if(sets.length) p++; const c=id(); P("="); sets.push([c,expr()]);}while(isP(",")); let where=null; if(isK("where")){p++; where=expr();} return {type:"update",t,alias,sets,where};}
      if(isK("delete")){p++; k("from"); const t=id(); let alias=null; if(pk().t==="id") alias=id(); let where=null; if(isK("where")){p++; where=expr();} return {type:"delete",t,alias,where};}
      if(isK("create")){p++;
        if(isK("view")){p++; const v=id(); let cols=null; if(isP("(")){p++; cols=[id()]; while(isP(",")){p++; cols.push(id());} P(")");} k("as"); return {type:"view",v,cols,q:query()};}
        k("table"); const t=id(); P("("); const cols=[], pkc=[]; let depth=0;
        for(;;){
          if(isK("primary")){p++; k("key"); P("("); pkc.push(id()); while(isP(",")){p++; pkc.push(id());} P(")");}
          else if(isK("foreign")){while(!(isP(",")||isP(")"))||depth){ if(isP("(")) depth++; if(isP(")")) depth--; p++; }}
          else { const c=id(); cols.push(c); while(!(isP(",")&&!depth)&&!(isP(")")&&!depth)){ if(pk().t==="eof") throw E("חסר ) בסוף CREATE TABLE."); if(isP("(")) depth++; else if(isP(")")) depth--; else if(isK("primary")){p++; k("key"); pkc.push(c); continue;} p++; } }
          if(isP(",")){p++; continue;} P(")"); break;
        }
        return {type:"create",t,cols,pk:pkc};}
      if(isK("drop")){p++; const what=isK("view")?"view":"table"; p++; return {type:"drop",what,name:id()};}
      throw E(`פקודה צריכה להתחיל ב-SELECT, INSERT, UPDATE, DELETE, CREATE או DROP. מצאתי ${desc(pk())}.`);
    }
    function query(){
      let withs=null;
      if(isK("with")){p++; withs=[]; do{ if(withs.length) p++; const n=id(); let cols=null; if(isP("(")){p++; cols=[id()]; while(isP(",")){p++; cols.push(id());} P(")");} k("as"); P("("); const q=query(); P(")"); withs.push({n,cols,q});}while(isP(","));}
      let body=setTerm();
      while(isK("union")||isK("intersect")||isK("except")){const op=pk().v; p++; let all=false; if(isK("all")){p++; all=true;} else if(isK("distinct")) p++; body={type:"setop",op,all,l:body,r:setTerm()};}
      let order=null;
      if(isK("order")){p++; k("by"); order=[]; do{ if(order.length) p++; const e=expr(); let d=false; if(isK("asc")) p++; else if(isK("desc")){p++; d=true;} order.push({e,desc:d});}while(isP(","));}
      return {withs,body,order};
    }
    function setTerm(){ if(isP("(")){p++; const q=query(); P(")"); return {type:"paren",q};} return select(); }
    function select(){
      k("select"); let distinct=false; if(isK("distinct")){p++; distinct=true;} else if(isK("all")) p++;
      const items=[]; do{ if(items.length) p++;
        if(isP("*")){p++; items.push({star:true});}
        else if(pk().t==="id"&&isP(".",1)&&isP("*",2)){const t=id(); p+=2; items.push({star:true,tbl:t});}
        else { const st=pk().p; const e=expr(); let alias=null; if(isK("as")){p++; alias=id();} else if(pk().t==="id") alias=id(); items.push({e,alias,src:src.slice(st,pk().p).trim()}); }
      }while(isP(","));
      let from=[]; if(isK("from")){p++; from=[fromItem()]; while(isP(",")){p++; from.push(fromItem());}}
      let where=null, group=null, having=null;
      if(isK("where")){p++; where=expr();}
      if(isK("group")){p++; k("by"); group=[expr()]; while(isP(",")){p++; group.push(expr());}}
      if(isK("having")){p++; having=expr();}
      return {type:"select",distinct,items,from,where,group,having};
    }
    function fromPrimary(){
      if(isP("(")){p++; const q=query(); P(")"); if(isK("as")) p++; const alias=pk().t==="id"?id():null; if(!alias) throw E("לשאילתה בתוך FROM חייבים לתת שם, למשל (select ...) as t."); let cols=null; if(isP("(")){p++; cols=[id()]; while(isP(",")){p++; cols.push(id());} P(")");} return {kind:"sub",q,alias,cols};}
      const name=id(); let alias=null; if(isK("as")){p++; alias=id();} else if(pk().t==="id") alias=id();
      return {kind:"table",name,alias:alias||name};
    }
    function fromItem(){
      let l=fromPrimary();
      for(;;){
        let natural=false, jt=null;
        if(isK("natural")){p++; natural=true;}
        if(isK("join")) jt="inner";
        else if(isK("inner")&&isK("join",1)){p++; jt="inner";}
        else if(isK("cross")&&isK("join",1)){p++; jt="cross";}
        else if((isK("left")||isK("right")||isK("full"))){jt=pk().v; p++; if(isK("outer")) p++;}
        if(!jt){ if(natural) throw E("אחרי NATURAL צריך לבוא JOIN."); break; }
        k("join"); const r=fromPrimary(); let on=null, using=null;
        if(!natural&&jt!=="cross"){ if(isK("on")){p++; on=expr();} else if(isK("using")){p++; P("("); using=[id()]; while(isP(",")){p++; using.push(id());} P(")");} else throw E("אחרי JOIN צריך ON עם תנאי, או USING, או לכתוב NATURAL JOIN."); }
        l={kind:"join",jt,natural,l,r,on,using};
      }
      return l;
    }
    function expr(){return orE();}
    function orE(){let l=andE(); while(isK("or")){p++; l={k:"or",l,r:andE()};} return l;}
    function andE(){let l=notE(); while(isK("and")){p++; l={k:"and",l,r:notE()};} return l;}
    function notE(){ if(isK("not")&&!isK("exists",1)&&!isK("unique",1)){p++; return {k:"not",e:notE()};} if(isK("not")){p++; return {k:"not",e:notE()};} return pred(); }
    function pred(){
      const l=add();
      let neg=false; if(isK("not")&&(isK("like",1)||isK("in",1)||isK("between",1))){p++; neg=true;}
      if(isK("like")){p++; return {k:"like",e:l,pat:add(),not:neg};}
      if(isK("between")){p++; const lo=add(); k("and"); const hi=add(); return {k:"between",e:l,lo,hi,not:neg};}
      if(isK("in")){p++; P("("); if(isK("select")||isK("with")){const q=query(); P(")"); return {k:"in",e:l,q,not:neg};} const list=[expr()]; while(isP(",")){p++; list.push(expr());} P(")"); return {k:"in",e:l,list,not:neg};}
      if(isK("is")){p++; let n=false; if(isK("not")){p++; n=true;} k("null"); return {k:"isnull",e:l,not:n};}
      const x=pk();
      if(x.t==="op"&&["=","<>","<",">","<=",">="].includes(x.v)){p++;
        if(isK("some")||isK("any")||isK("all")){const qn=pk().v==="all"?"all":"some"; p++; P("("); const q=query(); P(")"); return {k:"quant",op:x.v,e:l,q,quant:qn};}
        return {k:"cmp",op:x.v,l,r:add()};}
      return l;
    }
    function add(){let l=mul(); while(pk().t==="op"&&["+","-","||"].includes(pk().v)){const o=pk().v; p++; l={k:"ar",op:o,l,r:mul()};} return l;}
    function mul(){let l=un(); while(pk().t==="op"&&["*","/","%"].includes(pk().v)){const o=pk().v; p++; l={k:"ar",op:o,l,r:un()};} return l;}
    function un(){ if(isP("-")){p++; return {k:"neg",e:un()};} return prim(); }
    function prim(){
      const x=pk();
      if(x.t==="num"){p++; return {k:"lit",v:x.v};}
      if(x.t==="str"){p++; return {k:"lit",v:x.v};}
      if(isK("null")){p++; return {k:"lit",v:null};}
      if(isK("true")){p++; return {k:"lit",v:true};}
      if(isK("false")){p++; return {k:"lit",v:false};}
      if(isK("exists")){p++; P("("); const q=query(); P(")"); return {k:"exists",q};}
      if(isK("unique")){p++; P("("); const q=query(); P(")"); return {k:"unique",q};}
      if(isK("case")){p++; let base=null; if(!isK("when")) base=expr(); const whens=[]; while(isK("when")){p++; const c=expr(); k("then"); whens.push([c,expr()]);} let els=null; if(isK("else")){p++; els=expr();} k("end"); return {k:"case",base,whens,els};}
      if(isP("(")){p++; if(isK("select")||isK("with")){const q=query(); P(")"); return {k:"subq",q};} const e=expr(); P(")"); return e;}
      if(x.t==="id"){
        if(isP("(",1)){const name=id(); p++; let distinct=false, star=false, args=[];
          if(isP("*")){p++; star=true;} else if(!isP(")")){ if(isK("distinct")){p++; distinct=true;} args=[expr()]; while(isP(",")){p++; args.push(expr());} }
          P(")"); return {k:"fn",name,args,distinct,star};}
        const a=id(); if(isP(".")){p++; return {k:"col",tbl:a,name:id()};} return {k:"col",name:a};
      }
      throw E(`ציפיתי לערך, לשם עמודה או לביטוי, אבל מצאתי ${desc(x)}.`);
    }
    return {statements};
  }
  /* ---------------- evaluation ---------------- */
  const t3and=(a,b)=>a===false||b===false?false:(a===null||b===null?null:true);
  const t3or=(a,b)=>a===true||b===true?true:(a===null||b===null?null:false);
  const t3not=a=>a===null?null:!a;
  function cmpv(a,b){ // returns -1,0,1 or null
    if(a===null||b===null||a===undefined||b===undefined) return null;
    if(typeof a==="number"&&typeof b!=="number"&&b!==""&&!isNaN(+b)) b=+b;
    if(typeof b==="number"&&typeof a!=="number"&&a!==""&&!isNaN(+a)) a=+a;
    if(typeof a!==typeof b){a=String(a); b=String(b);}
    return a<b?-1:a>b?1:0;
  }
  function cmpOp(op,a,b){const c=cmpv(a,b); if(c===null) return null; return {"=":c===0,"<>":c!==0,"<":c<0,">":c>0,"<=":c<=0,">=":c>=0}[op];}
  function txt(e){
    switch(e.k){case "lit":return e.v===null?"null":typeof e.v==="string"?"'"+e.v+"'":String(e.v);
      case "col":return (e.tbl?e.tbl+".":"")+e.name;
      case "fn":return e.name+"("+(e.star?"*":(e.distinct?"distinct ":"")+e.args.map(txt).join(", "))+")";
      case "ar":return txt(e.l)+" "+e.op+" "+txt(e.r);
      case "neg":return "-"+txt(e.e);
      default:return "expr";}
  }
  function hasAgg(e){ if(!e||typeof e!=="object") return false; if(e.k==="fn"&&AGG.has(e.name)) return true; if(e.k==="subq"||e.k==="exists"||e.k==="in"&&e.q||e.k==="quant"||e.k==="unique"){ return e.k==="in"||e.k==="quant"?hasAgg(e.e):false; }
    for(const key of ["l","r","e","lo","hi","pat","base","els"]) if(e[key]&&hasAgg(e[key])) return true;
    if(e.list&&e.list.some(hasAgg)) return true; if(e.args&&e.args.some(hasAgg)) return true; if(e.whens&&e.whens.some(([a,b])=>hasAgg(a)||hasAgg(b))) return true; return false;}
  function Engine(db){
    // db: {name:{cols,rows,pk}} ; views: {name:{q,cols}}
    const views={};
    let trace=null;
    function relation(name,env){
      if(env.temps&&env.temps[name]) return env.temps[name];
      if(db[name]) return db[name];
      if(views[name]){const r=runQuery(views[name].q,null,env); return {cols:views[name].cols||r.cols,rows:r.rows};}
      throw E(`אין טבלה בשם ${name}. הטבלאות הקיימות: ${Object.keys(db).concat(Object.keys(views)).join(", ")}.`);
    }
    function frameOf(alias,cols,vals,hidden){return {alias,cols,vals,hidden:hidden||null};}
    function fromRows(items,ctx,env,where){
      /* predicate pushdown: apply each top-level AND condition as soon as the tables it names are joined */
      const conj=[]; (function fl(e){ if(!e) return; if(e.k==="and"){fl(e.l); fl(e.r);} else conj.push(e); })(where);
      const aliasesOf=it=>it.kind==="table"||it.kind==="sub"?[it.alias]:aliasesOf(it.l).concat(aliasesOf(it.r));
      const colsOf=it=>{ try{ if(it.kind==="table") return relation(it.name,env).cols; }catch(e){} return null; };
      const local=items.map(it=>({al:aliasesOf(it),cols:it.kind==="table"?colsOf(it):null}));
      const allAl=new Set(local.flatMap(x=>x.al));
      const deps=e=>{ const need=new Set(); let late=false;
        (function w(x){ if(!x||typeof x!=="object"||late) return;
          if(x.k==="exists"||x.k==="subq"||x.k==="quant"||x.k==="unique"||(x.k==="in"&&x.q)||x.k==="fn"&&AGG.has(x.name)){late=true; return;}
          if(x.k==="col"){ if(x.tbl){ if(allAl.has(x.tbl)) need.add(x.tbl); } else if(x.name.toLowerCase()!=="current_date"){ const hit=local.filter(l=>l.cols===null||l.cols.includes(x.name)); if(hit.length) hit.forEach(l=>l.al.forEach(a=>need.add(a))); } return; }
          for(const k in x){ const v=x[k]; if(v&&typeof v==="object"){ if(Array.isArray(v)) v.forEach(w); else w(v); } } })(e);
        return late?null:need; };
      const plan=conj.map(e=>({e,need:deps(e),done:false}));
      let rows=[[]]; const bound=new Set();
      items.forEach((it,i)=>{const rs=itemRows(it,ctx,env); local[i].al.forEach(a=>bound.add(a));
        const ready=plan.filter(p=>!p.done&&p.need&&[...p.need].every(a=>bound.has(a))); ready.forEach(p=>p.done=true);
        const out=[]; rows.forEach(a=>rs.forEach(b=>{const r=a.concat(b); if(ready.every(p=>evalE(p.e,{row:r,outer:ctx},env)===true)) out.push(r);})); rows=out;});
      return rows;
    }
    const visibleCols=row=>{const o=[]; row.forEach(f=>f.cols.forEach((c,i)=>{if(!(f.hidden&&f.hidden.has(c))) o.push(c);})); return o;};
    function nullRow(row){return row.map(f=>frameOf(f.alias,f.cols,f.cols.map(()=>null),f.hidden));}
    function itemRows(it,ctx,env){
      if(it.kind==="table"){const R=relation(it.name,env); return R.rows.map(v=>[frameOf(it.alias,R.cols,v)]);}
      if(it.kind==="sub"){const r=runQuery(it.q,ctx,env); const cols=it.cols||r.cols; return r.rows.map(v=>[frameOf(it.alias,cols,v)]);}
      const L=itemRows(it.l,ctx,env), Rr=itemRows(it.r,ctx,env);
      const lShape=L[0]||shapeOf(it.l,env), rShape=Rr[0]||shapeOf(it.r,env);
      let common=null;
      if(it.natural){const lc=visibleCols(lShape); common=visibleCols(rShape).filter(c=>lc.includes(c));}
      if(it.using) common=it.using;
      const match=(a,b)=>{ if(it.jt==="cross") return true; if(common) return common.every(c=>cmpv(getIn(a,c),getIn(b,c))===0); return evalE(it.on,{row:a.concat(b),outer:ctx},env)===true; };
      const hide=b=>common?b.map(f=>frameOf(f.alias,f.cols,f.vals,new Set([...(f.hidden||[]),...common.filter(c=>f.cols.includes(c))]))):b;
      const out=[]; const usedR=new Set();
      L.forEach(a=>{let any=false; Rr.forEach((b,j)=>{ if(match(a,b)){any=true; usedR.add(j); out.push(a.concat(hide(b)));} }); if(!any&&(it.jt==="left"||it.jt==="full")) out.push(a.concat(hide(nullRow(rShape))));});
      if(it.jt==="right"||it.jt==="full") Rr.forEach((b,j)=>{ if(!usedR.has(j)){ const nl=nullRow(lShape); if(common) nl.forEach(f=>{common.forEach(c=>{const i=f.cols.indexOf(c); if(i>=0) f.vals[i]=getIn(b,c);});}); out.push(nl.concat(hide(b))); } });
      return out;
    }
    function shapeOf(it,env){
      if(it.kind==="table"){const R=relation(it.name,env); return [frameOf(it.alias,R.cols,R.cols.map(()=>null))];}
      if(it.kind==="sub"){const r=runQuery(it.q,null,env); const cols=it.cols||r.cols; return [frameOf(it.alias,cols,cols.map(()=>null))];}
      return shapeOf(it.l,env).concat(shapeOf(it.r,env));
    }
    function getIn(row,c){for(const f of row){if(f.hidden&&f.hidden.has(c)) continue; const i=f.cols.indexOf(c); if(i>=0) return f.vals[i];} return null;}
    function resolve(ctx,tbl,name){
      for(let c=ctx;c;c=c.outer){
        if(!c.row) continue;
        const hits=[];
        c.row.forEach(f=>{ if(tbl&&f.alias!==tbl) return; const i=f.cols.indexOf(name); if(i<0) return; if(!tbl&&f.hidden&&f.hidden.has(name)) return; hits.push([f,i]); });
        if(hits.length>1) throw E(`שם העמודה ${name} דו-משמעי: הוא קיים ב-${hits.map(h=>h[0].alias).join(" וגם ב-")}. כתבו את שם הטבלה לפניו, למשל ${hits[0][0].alias}.${name}.`);
        if(hits.length===1){
          if(c.group&&c.groupCheck&&!c.inAgg) c.groupCheck(tbl,name);
          return hits[0][0].vals[hits[0][1]];
        }
        if(tbl&&c.row.some(f=>f.alias===tbl)) throw E(`בטבלה ${tbl} אין עמודה בשם ${name}.`);
      }
      throw E(tbl?`לא מכיר את ${tbl}.${name}. בדקו את שם הטבלה או הכינוי ב-FROM.`:`אין עמודה בשם ${name}.`);
    }
    function evalE(e,ctx,env){
      if(ctx.gk&&e.k!=="lit"&&e.k!=="col"&&!(e.k==="fn"&&AGG.has(e.name))){const gi=ctx.gk.indexOf(JSON.stringify(e)); if(gi>=0) return evalE(e,{row:ctx.row,outer:ctx.outer},env);}
      switch(e.k){
        case "lit":return e.v;
        case "col":if(!e.tbl&&e.name.toLowerCase()==="current_date") return (d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"))(new Date()); return resolve(ctx,e.tbl,e.name);
        case "and":return t3and(evalE(e.l,ctx,env),evalE(e.r,ctx,env));
        case "or":return t3or(evalE(e.l,ctx,env),evalE(e.r,ctx,env));
        case "not":return t3not(evalE(e.e,ctx,env));
        case "cmp":return cmpOp(e.op,evalE(e.l,ctx,env),evalE(e.r,ctx,env));
        case "neg":{const v=evalE(e.e,ctx,env); return v===null?null:-v;}
        case "ar":{const a=evalE(e.l,ctx,env), b=evalE(e.r,ctx,env); if(a===null||b===null) return null; if(e.op==="||") return String(a)+String(b);
          const x=+a,y=+b; if(isNaN(x)||isNaN(y)) throw E(`אי אפשר לחשב ${e.op} על טקסט.`); return e.op==="+"?x+y:e.op==="-"?x-y:e.op==="*"?x*y:e.op==="/"?(y===0?null:x/y):x%y;}
        case "isnull":{const v=evalE(e.e,ctx,env); return e.not?v!==null:v===null;}
        case "like":{const v=evalE(e.e,ctx,env), pt=evalE(e.pat,ctx,env); if(v===null||pt===null) return null; const re=new RegExp("^"+String(pt).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/%/g,".*").replace(/_/g,".")+"$","s"); const r=re.test(String(v)); return e.not?!r:r;}
        case "between":{const v=evalE(e.e,ctx,env); const r=t3and(cmpOp(">=",v,evalE(e.lo,ctx,env)),cmpOp("<=",v,evalE(e.hi,ctx,env))); return e.not?t3not(r):r;}
        case "in":{const v=evalE(e.e,ctx,env); let vals;
          if(e.q){const r=runQuery(e.q,ctx,env); if(r.cols.length!==1) throw E("שאילתה פנימית אחרי IN צריכה להחזיר עמודה אחת בדיוק."); vals=r.rows.map(x=>x[0]);} else vals=e.list.map(x=>evalE(x,ctx,env));
          let res=false; for(const w of vals){res=t3or(res,cmpOp("=",v,w)); if(res===true) break;} return e.not?t3not(res):res;}
        case "quant":{const v=evalE(e.e,ctx,env); const r=runQuery(e.q,ctx,env); if(r.cols.length!==1) throw E(`שאילתה פנימית אחרי ${e.quant.toUpperCase()} צריכה להחזיר עמודה אחת.`);
          let res=e.quant==="all"; for(const [w] of r.rows){const c=cmpOp(e.op,v,w); res=e.quant==="all"?t3and(res,c):t3or(res,c);} return res;}
        case "exists":return runQuery(e.q,ctx,env).rows.length>0;
        case "unique":{const r=runQuery(e.q,ctx,env); const seen=new Set(); for(const x of r.rows){ if(x.some(v=>v===null)) continue; const kk=JSON.stringify(x); if(seen.has(kk)) return false; seen.add(kk);} return true;}
        case "subq":{const r=runQuery(e.q,ctx,env); if(r.cols.length!==1) throw E("שאילתה פנימית שמשמשת כערך צריכה להחזיר עמודה אחת."); if(r.rows.length>1) throw E(`שאילתה פנימית שמשמשת כערך החזירה ${r.rows.length} שורות במקום אחת. אולי התכוונתם ל-IN או ל-SOME/ALL?`); return r.rows.length?r.rows[0][0]:null;}
        case "case":{ for(const [c,v] of e.whens){ const ok=e.base?cmpOp("=",evalE(e.base,ctx,env),evalE(c,ctx,env)):evalE(c,ctx,env); if(ok===true) return evalE(v,ctx,env);} return e.els?evalE(e.els,ctx,env):null;}
        case "fn":{
          if(AGG.has(e.name)){
            if(ctx.inAgg) throw E("אי אפשר לקנן פונקציות צבירה זו בתוך זו.");
            if(!ctx.group) throw E(`פונקציית צבירה ${e.name.toUpperCase()} לא יכולה להופיע ב-WHERE. תנאי על קבוצות כותבים ב-HAVING.`);
            const sub=ctx.group.map(r=>e.star?1:evalE(e.args[0],{row:r,outer:ctx.outer,inAgg:true},env));
            let vals=e.star?sub:sub.filter(v=>v!==null);
            if(e.distinct){const s=new Set(); vals=vals.filter(v=>{const kk=JSON.stringify(v); if(s.has(kk)) return false; s.add(kk); return true;});}
            if(e.name==="count") return vals.length;
            if(!vals.length) return null;
            if(e.name==="sum") return vals.reduce((a,b)=>a+ +b,0);
            if(e.name==="avg") return Math.round(vals.reduce((a,b)=>a+ +b,0)/vals.length*1e4)/1e4;
            if(e.name==="min") return vals.reduce((a,b)=>cmpv(b,a)<0?b:a);
            return vals.reduce((a,b)=>cmpv(b,a)>0?b:a);
          }
          const a=e.args.map(x=>evalE(x,ctx,env));
          switch(e.name){case "upper":return a[0]===null?null:String(a[0]).toUpperCase(); case "lower":return a[0]===null?null:String(a[0]).toLowerCase();
            case "length":return a[0]===null?null:String(a[0]).length; case "abs":return a[0]===null?null:Math.abs(a[0]); case "round":return a[0]===null?null:Math.round(a[0]*Math.pow(10,a[1]||0))/Math.pow(10,a[1]||0);
            case "coalesce":return a.find(v=>v!==null)??null;
            case "date_part":{ if(a[1]===null) return null; const f=String(a[0]).toLowerCase(), m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(a[1])); if(!m) throw E(`date_part מצפה לתאריך בצורה YYYY-MM-DD, והתקבל ${a[1]}.`); if(f==="year") return +m[1]; if(f==="month") return +m[2]; if(f==="day") return +m[3]; throw E(`date_part: החלק ${a[0]} לא נתמך כאן. אפשר year, month, day.`);}}
          throw E(`הפונקציה ${e.name} לא מוכרת כאן. מוכרות: count, sum, avg, min, max, date_part, upper, lower, length, abs, round, coalesce.`);
        }
      }
      throw E("ביטוי לא נתמך.");
    }
    function runSelect(s,ctx,env,top){
      const T=top?{}:null;
      const rows=s.from.length?fromRows(s.from,ctx,env,s.where&&!hasAgg(s.where)?s.where:null):[[]];
      if(T) T.from=rows.length;
      let rs=rows;
      if(s.where){ if(hasAgg(s.where)) throw E("פונקציית צבירה לא יכולה להופיע ב-WHERE. תנאי על קבוצות כותבים ב-HAVING."); rs=rows.filter(r=>evalE(s.where,{row:r,outer:ctx},env)===true);}
      if(T) T.where=rs.length;
      const grouped=s.group||s.having||s.items.some(it=>it.e&&hasAgg(it.e));
      let cols=[], out=[], srcs=[];
      const shape=rs[0]||(s.from.length?s.from.map(it=>shapeOf(it,env)).flat():[]);
      s.items.forEach(it=>{ if(it.star){ if(grouped) throw E("אי אפשר לכתוב * בשאילתה עם GROUP BY או עם פונקציית צבירה."); shape.forEach(f=>{ if(it.tbl&&f.alias!==it.tbl) return; f.cols.forEach(c=>{ if(!it.tbl&&f.hidden&&f.hidden.has(c)) return; cols.push(c);});}); if(it.tbl&&!shape.some(f=>f.alias===it.tbl)) throw E(`אין ב-FROM טבלה בשם ${it.tbl}.`);} else cols.push(it.alias||(it.e.k==="col"?it.e.name:it.src||txt(it.e))); });
      const project=(row,ctxx)=>{const v=[]; s.items.forEach(it=>{ if(it.star){ row.forEach(f=>{ if(it.tbl&&f.alias!==it.tbl) return; f.cols.forEach((c,i)=>{ if(!it.tbl&&f.hidden&&f.hidden.has(c)) return; v.push(f.vals[i]);});}); } else v.push(evalE(it.e,ctxx,env)); }); return v;};
      if(grouped){
        const gmap=new Map(), order=[];
        rs.forEach(r=>{const kk=s.group?JSON.stringify(s.group.map(g=>evalE(g,{row:r,outer:ctx},env))):"all"; if(!gmap.has(kk)){gmap.set(kk,[]); order.push(kk);} gmap.get(kk).push(r);});
        if(!s.group&&!order.length){gmap.set("all",[]); order.push("all");}
        if(T) T.groups=order.length;
        const gnames=(s.group||[]).filter(g=>g.k==="col");
        const check=(tbl,name)=>{ if(!gnames.some(g=>g.name===name&&(!g.tbl||!tbl||g.tbl===tbl))) throw E(`העמודה ${tbl?tbl+".":""}${name} מופיעה ב-SELECT או ב-HAVING בלי להיות ב-GROUP BY ובלי פונקציית צבירה. בכל קבוצה יכולים להיות לה כמה ערכים.`); };
        order.forEach(kk=>{const g=gmap.get(kk); const rep=g[0]||nullRow(shape); const gctx={row:rep,group:g,outer:ctx,groupCheck:check,gk:(s.group||[]).map(x=>JSON.stringify(x))};
          if(s.having&&evalE(s.having,gctx,env)!==true) return;
          out.push(project(rep,gctx)); srcs.push(gctx);});
        if(T) T.having=out.length;
      } else { rs.forEach(r=>{const c={row:r,outer:ctx}; out.push(project(r,c)); srcs.push(c);}); }
      if(s.distinct){const seen=new Set(); const o2=[],s2=[]; out.forEach((r,i)=>{const kk=JSON.stringify(r); if(!seen.has(kk)){seen.add(kk); o2.push(r); s2.push(srcs[i]);}}); out=o2; srcs=s2;}
      if(T){T.out=out.length; T.grouped=!!grouped; T.distinct=s.distinct; trace=T;}
      return {cols,rows:out,srcs};
    }
    function runBody(b,ctx,env,top){
      if(b.type==="select") return runSelect(b,ctx,env,top);
      if(b.type==="paren") return runQuery(b.q,ctx,env);
      const L=runBody(b.l,ctx,env,false), R=runBody(b.r,ctx,env,false);
      if(L.cols.length!==R.cols.length) throw E(`ב-${b.op.toUpperCase()} שתי השאילתות צריכות להחזיר אותו מספר עמודות (כאן ${L.cols.length} מול ${R.cols.length}).`);
      const kk=x=>JSON.stringify(x); let rows;
      if(b.all){
        if(b.op==="union") rows=L.rows.concat(R.rows);
        else {const cnt=new Map(); R.rows.forEach(x=>cnt.set(kk(x),(cnt.get(kk(x))||0)+1)); rows=[]; L.rows.forEach(x=>{const c=cnt.get(kk(x))||0; if(b.op==="intersect"){ if(c>0){rows.push(x); cnt.set(kk(x),c-1);} } else { if(c>0) cnt.set(kk(x),c-1); else rows.push(x);} });}
      } else {
        const rk=new Set(R.rows.map(kk)), seen=new Set(); rows=[];
        const add=x=>{const k2=kk(x); if(!seen.has(k2)){seen.add(k2); rows.push(x);}};
        if(b.op==="union"){L.rows.forEach(add); R.rows.forEach(add);} else if(b.op==="intersect") L.rows.filter(x=>rk.has(kk(x))).forEach(add); else L.rows.filter(x=>!rk.has(kk(x))).forEach(add);
      }
      if(top) trace={setop:b.op,all:b.all,l:L.rows.length,r:R.rows.length,out:rows.length};
      return {cols:L.cols,rows,srcs:null};
    }
    function runQuery(q,ctx,env,top){
      let env2=env;
      if(q.withs){env2={temps:Object.assign({},env.temps||{})}; q.withs.forEach(w=>{const r=runQuery(w.q,ctx,env2); env2.temps[w.n]={cols:w.cols||r.cols,rows:r.rows};});}
      const r=runBody(q.body,ctx,env2,top);
      if(q.order){
        const keys=r.rows.map((row,i)=>q.order.map(o=>{
          const e=o.e;
          if(e.k==="lit"&&typeof e.v==="number"){ if(e.v<1||e.v>r.cols.length) throw E("מספר עמודה ב-ORDER BY מחוץ לטווח."); return row[e.v-1];}
          if(e.k==="col"&&!e.tbl){const j=r.cols.indexOf(e.name); if(j>=0) return row[j];}
          if(!r.srcs) throw E("אחרי UNION, INTERSECT או EXCEPT אפשר למיין רק לפי שם עמודה בתוצאה או לפי מספרה.");
          return evalE(e,r.srcs[i],env2);
        }));
        const idx=r.rows.map((_,i)=>i).sort((a,b)=>{for(let j=0;j<q.order.length;j++){const x=keys[a][j], y=keys[b][j]; if(x===null&&y===null) continue; if(x===null) return q.order[j].desc?1:-1; if(y===null) return q.order[j].desc?-1:1; const c=cmpv(x,y); if(c) return q.order[j].desc?-c:c;} return a-b;});
        r.rows=idx.map(i=>r.rows[i]); if(r.srcs) r.srcs=idx.map(i=>r.srcs[i]);
        if(top&&trace) trace.order=true;
      }
      return r;
    }
    function exec(src){
      const sts=Parser(src).statements(); if(!sts.length) throw E("הקלידו פקודת SQL.");
      const results=[];
      sts.forEach(st=>{
        trace=null; const env={};
        if(st.type==="query"){const r=runQuery(st.q,null,env,true); results.push({kind:"rows",cols:r.cols,rows:r.rows,trace});}
        else if(st.type==="insert"){const T=db[st.t]; if(!T) throw E(`אין טבלה בשם ${st.t}.`); const cols=st.cols||T.cols; cols.forEach(c=>{if(!T.cols.includes(c)) throw E(`בטבלה ${st.t} אין עמודה ${c}.`);});
          const vals=st.rows?st.rows.map(r=>r.map(x=>evalE(x,{row:null},env))):runQuery(st.q,null,env).rows;
          const add=[]; vals.forEach(v=>{ if(v.length!==cols.length) throw E(`מספר הערכים (${v.length}) לא תואם למספר העמודות (${cols.length}).`); const row=T.cols.map(c=>{const i=cols.indexOf(c); return i<0?null:v[i];}); add.push(row);});
          if(T.pk&&T.pk.length){const ix=T.pk.map(c=>T.cols.indexOf(c)); const have=new Set(T.rows.map(r=>JSON.stringify(ix.map(i=>r[i])))); add.forEach(r=>{const kk=JSON.stringify(ix.map(i=>r[i])); if(ix.some(i=>r[i]===null)) throw E(`ערך null במפתח הראשי (${T.pk.join(", ")}) אסור.`); if(have.has(kk)) throw E(`הפרת מפתח ראשי: כבר יש שורה עם ${T.pk.join(", ")} = ${ix.map(i=>r[i]).join(", ")}.`); have.add(kk);});}
          T.rows.push(...add); results.push({kind:"msg",msg:`נוספו ${add.length} שורות ל-${st.t}.`,table:st.t});}
        else if(st.type==="update"){const T=db[st.t]; if(!T) throw E(`אין טבלה בשם ${st.t}.`); const alias=st.alias||st.t; let n=0;
          const plan=T.rows.map(v=>{const row=[frameOf(alias,T.cols,v)]; const ok=!st.where||evalE(st.where,{row},env)===true; if(!ok) return null; return st.sets.map(([c,e])=>{const i=T.cols.indexOf(c); if(i<0) throw E(`בטבלה ${st.t} אין עמודה ${c}.`); return [i,evalE(e,{row},env)];});});
          plan.forEach((pl,ri)=>{if(pl){n++; pl.forEach(([i,v])=>T.rows[ri][i]=v);}}); results.push({kind:"msg",msg:`עודכנו ${n} שורות ב-${st.t}.`,table:st.t});}
        else if(st.type==="delete"){const T=db[st.t]; if(!T) throw E(`אין טבלה בשם ${st.t}.`); const alias=st.alias||st.t; const keep=T.rows.filter(v=>!(!st.where||evalE(st.where,{row:[frameOf(alias,T.cols,v)]},env)===true)); const n=T.rows.length-keep.length; T.rows=keep; results.push({kind:"msg",msg:`נמחקו ${n} שורות מ-${st.t}.`,table:st.t});}
        else if(st.type==="create"){ if(db[st.t]||views[st.t]) throw E(`כבר קיימת טבלה בשם ${st.t}.`); db[st.t]={cols:st.cols,rows:[],pk:st.pk}; results.push({kind:"msg",msg:`נוצרה הטבלה ${st.t} (${st.cols.join(", ")})${st.pk.length?", מפתח ראשי: "+st.pk.join(", "):""}.`,table:st.t});}
        else if(st.type==="view"){ if(db[st.v]||views[st.v]) throw E(`כבר קיים שם ${st.v}.`); const r=runQuery(st.q,null,env); if(st.cols&&st.cols.length!==r.cols.length) throw E("מספר שמות העמודות של המבט לא תואם לשאילתה."); views[st.v]={q:st.q,cols:st.cols}; results.push({kind:"msg",msg:`נוצר המבט ${st.v}. הוא נשמר כשאילתה ומחושב מחדש בכל שימוש.`,view:st.v});}
        else if(st.type==="drop"){ if(st.what==="view"){ if(!views[st.name]) throw E(`אין מבט בשם ${st.name}.`); delete views[st.name]; } else { if(!db[st.name]) throw E(`אין טבלה בשם ${st.name}.`); delete db[st.name]; } results.push({kind:"msg",msg:`${st.what==="view"?"המבט":"הטבלה"} ${st.name} נמחק${st.what==="view"?"":"ה"}.`}); }
      });
      return results;
    }
    return {exec,db,views};
  }
  return {Engine,lex};
})();