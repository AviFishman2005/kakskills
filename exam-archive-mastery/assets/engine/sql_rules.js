var SQLRULES=(function(){
  const PL=/\b(create|function|trigger|returns|language|plpgsql|declare|begin|raise|perform|procedure)\b/i;
  const NAMES={with:"with",limit:"limit",offset:"offset",rank:"rank()",row_number:"row_number()",union:"union",intersect:"intersect",except:"except",minus:"minus",between:"between",case:"case",join:"join … on / using (מותר רק natural join או cross join)",outer:"צירוף חיצוני (left / right / full outer join)",some:"some",any:"any",coalesce:"coalesce",isnull:"is null / null",extract:"extract (מותר date_part)",interval:"interval",cast:"cast / ::",fromsub:"שאילתה בתוך from",selsub:"שאילתה בתוך select",order:"order by (מותר רק כשהשאלה מבקשת במפורש למיין)",upper:"פונקציות שלא ברשימה"};
  function words(q){ // strip strings and comments, keep words (hyphenated names are one word)
    return q.replace(/--[^\n]*/g," ").replace(/'(?:[^']|'')*'/g,"''").replace(/"[^"]*"/g,"x").toLowerCase();}
  function depthScan(q,startIdx,stopRe){ // from startIdx at depth 0: find "(select" at same depth before stop keyword or closing paren
    let d=0;
    for(let i=startIdx;i<q.length;i++){const c=q[i];
      if(c==="("){ if(d===0&&/^\(\s*select\b/.test(q.slice(i))) return true; d++; continue;}
      if(c===")"){ if(d===0) return false; d--; continue;}
      if(d===0){ if(c===";") return false; const m=stopRe.exec(q.slice(i,i+12)); if(m&&m.index===0&&/\W/.test(q[i-1]||" ")) return false; }
    }
    return false;}
  function check(src,opt){
    opt=opt||{}; const q=words(src), out=new Set(); const pl=PL.test(q);
    const w=r=>r.test(q);
    if(w(/\bwith\b/)&&!/\bwith\s+(grant|check|time)\b/.test(q)) out.add("with");
    ["limit","offset","union","intersect","except","minus","between","case","coalesce","interval","extract"].forEach(k=>{if(w(new RegExp("(^|[^\\w-])"+k+"(?![\\w-])"))) out.add(k);});
    if(w(/\brank\s*\(/)) out.add("rank"); if(w(/\brow_number\s*\(/)) out.add("row_number");
    if(w(/(^|[^\w-])(left|right|full)(\s+outer)?\s+join\b/)||w(/\bouter\s+join\b/)) out.add("outer");
    for(const m of q.matchAll(/(^|[^\w-])join(?![\w-])/g)){const pre=q.slice(Math.max(0,m.index-12),m.index+1); if(!/(natural|cross)\s+$/.test(pre)&&!/(left|right|full|outer)\s+$/.test(pre)) {out.add("join"); break;}}
    if(w(/(^|[^\w-])(inner)\s+join/)) out.add("join");
    if(w(/[<>=]\s*(some|any)\s*\(/)) {if(w(/\bsome\s*\(/)) out.add("some"); if(w(/\bany\s*\(/)) out.add("any");}
    if(w(/\bis\s+(not\s+)?null\b/)||w(/[=<>]\s*null\b/)||w(/\bselect\s+null\b/)) out.add("isnull");
    if(w(/\bcast\s*\(/)||q.includes("::")) out.add("cast");
    for(const m of q.matchAll(/(^|[^\w-])from(?![\w-])/g)){ if(depthScan(q,m.index+m[0].length,/^(where|group|having|order|union|except|intersect|into)\b/)){out.add("fromsub"); break;} }
    for(const m of q.matchAll(/(^|[^\w-])select(?![\w-])/g)){ if(depthScan(q,m.index+m[0].length,/^(from|into)\b/)){out.add("selsub"); break;} }
    if(!opt.sortAsked&&w(/\border\s+by\b/)) out.add("order");
    return [...out];}
  const msg=list=>list.map(k=>NAMES[k]||k);
  return {check,msg,NAMES};
})();

