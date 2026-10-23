#!/usr/bin/env python3
"""Parse, split, search and digest chat exports for the chat-investigation skill (two-person and group chats).

Commands (all write into / read from one working directory, called WORK below):
  parse   FILE --out WORK        WhatsApp .txt/.zip or Telegram result.json -> WORK/chat.jsonl + WORK/meta.json
  setme   WORK NAME              set which participant is "me" (exact sender name, or "none" for a group read from outside)
  swap    WORK                   two-person chats only: flip "me" and "other"
  periods WORK [--budget N]      split the analysed messages into reader periods -> WORK/periods/period_NN.txt
  search  WORK "a|b|c"           substring search over the whole chat, with context
  range   WORK FROM TO           every message between two dates (YYYY-MM-DD, inclusive)
  digest  WORK                   merge WORK/readers/period_NN.json into WORK/digest.md
"""
import argparse, datetime as dt, glob, io, json, os, re, sys, zipfile

CLEAN = re.compile('[‎‏‪-‮⁦-⁩﻿]')
DT = r'(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?\s+(?:בשעה\s+|at\s+)?(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?'
RE_IOS = re.compile(r'^\[' + DT + r'\]\s*(.*)$')
RE_AND = re.compile('^' + DT + r'\s*[-–]\s(.*)$')
MEDIA = re.compile(r'<media omitted>|<המדיה לא נכללה>|\bomitted\b|הושמט|לא נכלל|<attached:|^\s*null\s*$', re.I)
EDIT = re.compile(r'\s*<(this message was edited|ההודעה נערכה)>\s*', re.I)
YOUDEL = re.compile(r'you deleted this message|מחקת את ההודעה', re.I)
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿️\U0001F3FB-\U0001F3FF]')


def parse_whatsapp(raw):
    recs, cur = [], None
    for line in raw.replace('\r\n', '\n').replace('\r', '\n').split('\n'):
        line = CLEAN.sub('', line).replace(' ', ' ').replace(' ', ' ')
        m = RE_IOS.match(line) or RE_AND.match(line)
        if m:
            rest = m.group(8)
            ci = rest.find(': ')
            sender = rest[:ci].strip() if 0 < ci < 48 else None
            cur = dict(a=int(m.group(1)), b=int(m.group(2)), c=int(m.group(3)), h=int(m.group(4)), mi=int(m.group(5)),
                       s=int(m.group(6) or 0), ap=(m.group(7) or '').lower(), sender=sender,
                       text=rest[ci + 2:] if sender else rest)
            recs.append(cur)
        elif cur is not None:
            cur['text'] += '\n' + line
    order = 'dmy'
    if any(r['a'] > 31 for r in recs):
        order = 'ymd'
    elif any(r['a'] > 12 for r in recs):
        order = 'dmy'
    elif any(r['b'] > 12 for r in recs):
        order = 'mdy'
    out = []
    for r in recs:
        if not r['sender']:
            continue
        if order == 'ymd':
            y, mo, d = r['a'], r['b'], r['c']
        elif order == 'mdy':
            mo, d, y = r['a'], r['b'], r['c']
        else:
            d, mo, y = r['a'], r['b'], r['c']
        if y < 100:
            y += 2000
        h = r['h']
        if r['ap'].startswith('p') and h < 12:
            h += 12
        if r['ap'].startswith('a') and h == 12:
            h = 0
        try:
            t = dt.datetime(y, mo, d, h, r['mi'], r['s'])
        except ValueError:
            continue
        out.append({'t': t.isoformat(timespec='minutes'), 's': r['sender'], 'text': r['text'].strip()})
    return out


def parse_telegram(j):
    out = []
    for m in j.get('messages', []):
        if m.get('type') != 'message' or not m.get('from'):
            continue
        txt = m.get('text', '')
        if isinstance(txt, list):
            txt = ''.join(x if isinstance(x, str) else x.get('text', '') for x in txt)
        if not txt and (m.get('media_type') or m.get('photo') or m.get('file')):
            txt = '<media omitted>'
        try:
            t = dt.datetime.fromisoformat(m['date']).isoformat(timespec='minutes')
        except Exception:
            continue
        out.append({'t': t, 's': str(m['from']), 'text': txt})
    return out


def load(path):
    """Return (messages, hint). The hint is a name WhatsApp/Telegram attaches to the other person."""
    hint = os.path.basename(path)
    data = open(path, 'rb').read()
    if data[:2] == b'PK':
        z = zipfile.ZipFile(io.BytesIO(data))
        txts = [n for n in z.namelist() if n.lower().endswith('.txt')]
        if not txts:
            sys.exit('no .txt file inside the zip')
        txts.sort(key=lambda n: 0 if re.search(r'_chat|whatsapp', n, re.I) else 1)
        name = txts[0]
        if not os.path.basename(name).startswith('_chat'):
            hint = os.path.basename(name)
        text = z.read(name).decode('utf-8', errors='replace')
    else:
        text = data.decode('utf-8-sig', errors='replace')
    if text.lstrip().startswith('{'):
        j = json.loads(text)
        if j.get('name'):
            hint = str(j['name'])
        return parse_telegram(j), hint
    return parse_whatsapp(text), hint


def norm(s):
    return re.sub(r'[^\w]+', '', EMOJI.sub('', str(s)).lower())


def guess_me(people, youdel, hint, mode='pair'):
    two = people[:2]
    if mode == 'group':
        for p in people:
            if youdel.get(p):
                return p, '"you deleted this message" lines belong to the exporter'
        return None, None
    if hint:
        cand = re.sub(r'\.(txt|zip|json)$', '', hint, flags=re.I)
        cand = norm(re.sub(r"whatsapp|chat|צ['׳]?אט|ווטסאפ|וואטסאפ|with|עם|\(\d+\)", ' ', cand, flags=re.I))
        if len(cand) >= 2:
            for p in two:
                n = norm(p)
                if n and (n == cand or cand in n or n in cand):
                    return next(x for x in two if x != p), 'file name names the other person'
    for p in two:
        if youdel.get(p):
            return p, '"you deleted this message" lines belong to the exporter'
    return two[0], None


def line(m):
    d = dt.datetime.fromisoformat(m['t'])
    body = '[מדיה]' if MEDIA.search(m['text']) else re.sub(r'\s*\n\s*', ' / ', m['text'])[:400]
    return f"{d:%Y-%m-%d %H:%M} {m['s']}: {body}"


def read_chat(work):
    """Messages under analysis: the two main writers in a pair chat, every listed participant in a group."""
    meta = json.load(open(os.path.join(work, 'meta.json'), encoding='utf-8'))
    msgs = [json.loads(l) for l in open(os.path.join(work, 'chat.jsonl'), encoding='utf-8')]
    keep = set(meta['participants'])
    return meta, [m for m in msgs if m['s'] in keep]


def cmd_parse(a):
    msgs, hint = load(a.file)
    youdel = {}
    for m in msgs:
        if YOUDEL.search(m['text']):
            youdel[m['s']] = youdel.get(m['s'], 0) + 1
    msgs = [{**m, 'text': EDIT.sub('', m['text']).strip()} for m in msgs]
    msgs = [m for m in msgs if m['text']]
    msgs.sort(key=lambda m: m['t'])
    if len(msgs) < 10:
        sys.exit('could not read messages: is this a WhatsApp or Telegram export?')
    counts = {}
    for m in msgs:
        counts[m['s']] = counts.get(m['s'], 0) + 1
    people = sorted(counts, key=lambda p: -counts[p])
    if len(people) < 2:
        sys.exit('only one participant found')
    # a group = three or more people who each wrote a real share of the chat
    active = [p for p in people if counts[p] >= max(5, 0.02 * len(msgs))]
    mode = 'group' if len(active) >= 3 else 'pair'
    me, why = guess_me(people, youdel, hint, mode)
    if mode == 'pair':
        other = next(p for p in people[:2] if p != me)
        participants = [me, other]
    else:
        other, participants = None, active
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'chat.jsonl'), 'w', encoding='utf-8') as f:
        for m in msgs:
            f.write(json.dumps(m, ensure_ascii=False) + '\n')
    meta = {'mode': mode, 'me': me, 'other': other, 'participants': participants,
            'me_sure': bool(why), 'me_reason': why or ('unknown: ask which name is theirs' if mode == 'group' else 'guessed: most messages'), 'people': people,
            'counts': counts, 'first': msgs[0]['t'], 'last': msgs[-1]['t'], 'messages': len(msgs), 'source_hint': hint}
    json.dump(meta, open(os.path.join(a.out, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(meta, ensure_ascii=False, indent=1))


def cmd_setme(a):
    p = os.path.join(a.work, 'meta.json')
    meta = json.load(open(p, encoding='utf-8'))
    name = None if a.name.lower() == 'none' else a.name
    if name is not None and name not in meta['people']:
        sys.exit('no such sender. senders: ' + ', '.join(meta['people']))
    meta['me'] = name
    if meta['mode'] == 'pair':
        meta['other'] = next(x for x in meta['people'][:2] if x != name) if name in meta['people'][:2] else meta['other']
        meta['participants'] = [meta['me'], meta['other']]
    elif name and name not in meta['participants']:
        meta['participants'].append(name)
    meta['me_sure'], meta['me_reason'] = True, 'confirmed by the user'
    json.dump(meta, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"me = {meta['me']}, participants = {', '.join(meta['participants'])}")


def cmd_swap(a):
    p = os.path.join(a.work, 'meta.json')
    meta = json.load(open(p, encoding='utf-8'))
    if meta.get('mode') == 'group':
        sys.exit('swap is for two-person chats; use setme in a group')
    meta['me'], meta['other'] = meta['other'], meta['me']
    meta['participants'] = [meta['me'], meta['other']]
    meta['me_sure'], meta['me_reason'] = True, 'confirmed by the user'
    json.dump(meta, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"me = {meta['me']}, other = {meta['other']}")


def cmd_periods(a):
    meta, pair = read_chat(a.work)
    msgs = [m for m in pair if not MEDIA.search(m['text'])]
    lines = [line(m) for m in msgs]
    lens = [len(l) + 1 for l in lines]
    total = sum(lens)
    n = max(2, min(a.max, -(-total // a.budget)))
    target = total / n
    groups, cur, acc = [], [], 0
    for i, L in enumerate(lens):
        cur.append(i); acc += L
        if acc >= target and len(groups) < n - 1:
            groups.append(cur); cur, acc = [], 0
    if cur:
        groups.append(cur)
    d = os.path.join(a.work, 'periods'); os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, 'period_*.txt')):
        os.remove(f)
    for k, idx in enumerate(groups, 1):
        full = sum(lens[i] for i in idx)
        if full <= a.budget:
            body, sampled = '\n'.join(lines[i] for i in idx), False
        else:
            parts, w = [], a.budget / 6
            for j in range(6):
                p, used, chunk = len(idx) * j // 6, 0, []
                while p < len(idx) and used < w:
                    chunk.append(lines[idx[p]]); used += lens[idx[p]]; p += 1
                parts.append('\n'.join(chunk))
            body, sampled = '\n…\n'.join(parts), True
        frm, to = msgs[idx[0]]['t'][:10], msgs[idx[-1]]['t'][:10]
        head = f"# period {k}/{len(groups)} · {frm} .. {to} · {len(idx)} messages" + (' · sampled windows, … marks a skip' if sampled else '')
        open(os.path.join(d, f'period_{k:02d}.txt'), 'w', encoding='utf-8').write(head + '\n' + body + '\n')
        print(f'period_{k:02d}.txt  {frm} .. {to}  {len(idx)} msgs  {len(body)} chars' + ('  (sampled)' if sampled else ''))


def cmd_search(a):
    meta, pair = read_chat(a.work)
    qs = [q.strip().lower() for q in a.query.split('|') if q.strip()]
    hits = [i for i, m in enumerate(pair) if any(q in m['text'].lower() for q in qs)]
    k = min(a.limit, len(hits))
    chosen = [hits[j * len(hits) // k] for j in range(k)] if k else []
    print(f'{len(hits)} matches, showing {k}' + (', spread across the whole chat' if len(hits) > k else '') + ':')
    for h in chosen:
        print('\n'.join(line(m) for m in pair[max(0, h - a.context): h + a.context + 1]))
        print('---')


def cmd_range(a):
    meta, pair = read_chat(a.work)
    lo = a.frm
    hi = (dt.date.fromisoformat(a.to) + dt.timedelta(days=1)).isoformat()
    sel = [m for m in pair if lo <= m['t'] < hi]
    print(f'{len(sel)} messages in range' + (f', showing first {a.limit}' if len(sel) > a.limit else '') + ':')
    for m in sel[:a.limit]:
        print(line(m))


def cmd_digest(a):
    files = sorted(glob.glob(os.path.join(a.work, 'readers', 'period_*.json')))
    meta = json.load(open(os.path.join(a.work, 'meta.json'), encoding='utf-8'))
    q = lambda s: f' «{s}»' if s else ''
    who = {'me': meta.get('me') or 'me', 'other': meta.get('other') or 'other'}
    out = []
    for f in files:
        try:
            x = json.load(open(f, encoding='utf-8'))
        except Exception as e:
            out.append(f'### {os.path.basename(f)}\n(could not read: {e})'); continue
        L = [f"### {x.get('period', os.path.basename(f))}", f"summary: {x.get('summary', '')}", f"tone: {x.get('tone', '')}"]
        if x.get('themes'): L.append('themes: ' + ', '.join(map(str, x['themes'])))
        for r in x.get('roles', []): L.append(f"- role {r.get('who', '')}: {r.get('role', '')}{q(r.get('quote'))}")
        for e in x.get('events', []): L.append(f"- event {e.get('date', '')}: {e.get('what', '')}{q(e.get('quote'))}")
        for c in x.get('conflicts', []):
            L.append(f"- conflict {c.get('date', '')}" + (f" [{c['between']}]" if c.get('between') else '') +
                     f": {c.get('trigger', '')} | underneath: {c.get('underneath', '')} | escalated: {c.get('who_escalated', '')} | ended: {c.get('how_ended', '')}{q(c.get('quote'))}")
        n = x.get('needs') or {}
        if n: L.append(f"needs: {who['me']}: {n.get('me', '')}; {who['other']}: {n.get('other', '')}")
        for k, label in (('dynamics', 'dynamics'), ('alliances', 'alliances'), ('left_out', 'left out'), ('me_in_group', 'the user in this period'), ('unsaid', 'unsaid')):
            if x.get(k): L.append(f"{label}: {x[k]}")
        for j in x.get('inside_jokes', []): L.append(f"- inside joke: {j.get('what', '')}{q(j.get('quote'))}")
        for r in x.get('red_flags', []): L.append(f"- warning sign {r.get('date', '')}: {r.get('what', '')}{q(r.get('quote'))}")
        b = x.get('best_moment') or {}
        if b.get('quote'): L.append(f"best moment {b.get('date', '')}:{q(b.get('quote'))}")
        nm = x.get('names') or {}
        if nm: L.append('names used: ' + '; '.join(f'{k} → {v}' for k, v in nm.items() if v) + (f"; gender: {x['gender']}" if x.get('gender') else ''))
        out.append('\n'.join(L))
    p = os.path.join(a.work, 'digest.md')
    open(p, 'w', encoding='utf-8').write('\n\n'.join(out) + '\n')
    print(f'wrote {p} from {len(files)} reader files, {sum(len(o) for o in out)} chars')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('parse'); p.add_argument('file'); p.add_argument('--out', required=True); p.set_defaults(f=cmd_parse)
    p = sp.add_parser('setme'); p.add_argument('work'); p.add_argument('name'); p.set_defaults(f=cmd_setme)
    p = sp.add_parser('swap'); p.add_argument('work'); p.set_defaults(f=cmd_swap)
    p = sp.add_parser('periods'); p.add_argument('work'); p.add_argument('--budget', type=int, default=36000); p.add_argument('--max', type=int, default=10); p.set_defaults(f=cmd_periods)
    p = sp.add_parser('search'); p.add_argument('work'); p.add_argument('query'); p.add_argument('--limit', type=int, default=20); p.add_argument('--context', type=int, default=2); p.set_defaults(f=cmd_search)
    p = sp.add_parser('range'); p.add_argument('work'); p.add_argument('frm'); p.add_argument('to'); p.add_argument('--limit', type=int, default=150); p.set_defaults(f=cmd_range)
    p = sp.add_parser('digest'); p.add_argument('work'); p.set_defaults(f=cmd_digest)
    a = ap.parse_args(); a.f(a)


if __name__ == '__main__':
    main()
