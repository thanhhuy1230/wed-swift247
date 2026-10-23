#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nạp dữ liệu WordPress (file .sql xuất từ Navicat/phpMyAdmin) vào website Swift247 (Next.js, dữ liệu JSON trong data/).

  python3 tools/import-wp.py swift247.sql                      # chạy trong thư mục swift-news
  python3 tools/import-wp.py swift247.sql --media-base https://cdn.example.vn/uploads/

- Chỉ THÊM bài/trang từ WordPress (id bắt đầu bằng "wp"), KHÔNG sửa/xóa bài, trang, cài đặt đang có.
- Chạy lại nhiều lần an toàn: bản nhập trước (id "wp…") được thay bằng bản mới, nội dung bạn tự viết giữ nguyên.
  Lưu ý: bài "wp…" bạn đã sửa trong admin sẽ bị ghi đè nếu chạy lại → chỉ chạy lại khi cần nhập lại từ đầu.
- Trước khi ghi, toàn bộ file JSON bị thay đổi được sao lưu vào data/backup-before-wp-import-<thời gian>/.
"""
import re, sys, json, html, os, shutil, argparse, collections, datetime, urllib.parse, unicodedata
import phpserialize

ap = argparse.ArgumentParser()
ap.add_argument('sql')
ap.add_argument('--data', default='data')
ap.add_argument('--media-base', default='https://swift247.vn/wp-content/uploads/',
                help='Địa chỉ gốc chứa ảnh WordPress (thư mục wp-content/uploads)')
ap.add_argument('--dry', action='store_true', help='Chỉ thống kê, không ghi file')
A = ap.parse_args()
MEDIA = A.media_base.rstrip('/') + '/'

# ---------------- 1. Đọc file SQL ----------------
ESC = {'0': '\0', 'n': '\n', 'r': '\r', 't': '\t', 'Z': '\x1a', 'b': '\b'}
def parse_values(s, i):
    rows = []
    while True:
        while s[i] in ' ,\r\n': i += 1
        if s[i] != '(': break
        i += 1; row = []
        while True:
            while s[i] == ' ': i += 1
            if s[i] == "'":
                i += 1; buf = []
                while True:
                    c = s[i]
                    if c == '\\': buf.append(ESC.get(s[i+1], s[i+1])); i += 2
                    elif c == "'":
                        if s[i+1] == "'": buf.append("'"); i += 2
                        else: i += 1; break
                    else:
                        j = i
                        while s[j] not in "\\'": j += 1
                        buf.append(s[i:j]); i = j
                row.append(''.join(buf))
            else:
                j = i
                while s[j] not in ',)': j += 1
                tok = s[i:j].strip(); i = j
                row.append(None if tok == 'NULL' else tok)
            while s[i] == ' ': i += 1
            if s[i] == ',': i += 1; continue
            if s[i] == ')': i += 1; break
        rows.append(row)
    return rows, i

src = open(A.sql, encoding='utf-8').read()
WANT = {'wp_posts', 'wp_postmeta', 'wp_terms', 'wp_term_taxonomy', 'wp_term_relationships', 'wp_options'}
T = collections.defaultdict(list)
for m in re.finditer(r"INSERT INTO `(\w+)` \(([^)]*)\) VALUES ", src):
    if m.group(1) not in WANT: continue
    cols = [c.strip(' `') for c in m.group(2).split(',')]
    rows, _ = parse_values(src, m.end())
    T[m.group(1)] += [dict(zip(cols, r)) for r in rows]

P = {p['ID']: p for p in T['wp_posts']}
META = collections.defaultdict(dict)
for m in T['wp_postmeta']: META[m['post_id']].setdefault(m['meta_key'], m['meta_value'])
OLD_SLUGS = collections.defaultdict(list)
for m in T['wp_postmeta']:
    if m['meta_key'] == '_wp_old_slug' and m['meta_value']: OLD_SLUGS[m['post_id']].append(m['meta_value'])
TT = {t['term_taxonomy_id']: t for t in T['wp_term_taxonomy']}
TM = {t['term_id']: t for t in T['wp_terms']}
REL = collections.defaultdict(list)
for r in T['wp_term_relationships']: REL[r['object_id']].append(r['term_taxonomy_id'])
OPT = {o['option_name']: o['option_value'] for o in T['wp_options']}

def terms(pid, tax):
    return [TM[TT[x]['term_id']]['slug'] for x in REL[pid] if x in TT and TT[x]['taxonomy'] == tax]
def lang_of(pid):
    l = terms(pid, 'language'); return l[0] if l else 'vi'
def unser(v):
    if v is None: return None
    try:
        r = phpserialize.loads(v.encode('utf-8'), decode_strings=True)
        if isinstance(r, str) and r[:2] in ('a:', 's:'): return unser(r)
        return r
    except Exception:
        # PHP đếm độ dài theo byte; dữ liệu đã sửa tay có thể lệch → sửa lại độ dài rồi thử lần nữa
        fixed = re.sub(r's:\d+:"(.*?)";(?=[a-z]:|\}|$)', lambda m: 's:%d:"%s";' % (len(m.group(1).encode('utf-8')), m.group(1)), v, flags=re.S)
        try: return unser(fixed) if fixed != v else None
        except Exception: return None

# Nhóm bản dịch Polylang: id WordPress → id nhóm (dùng chung giữa các ngôn ngữ để nút đổi ngôn ngữ nhảy đúng bản dịch)
GROUP = {}
for t in TT.values():
    if t['taxonomy'] != 'post_translations': continue
    d = unser(t['description']) or {}
    ids = {k: str(v) for k, v in d.items()}
    lead = ids.get('vi') or sorted(ids.values(), key=int)[0]
    for v in ids.values(): GROUP[v] = lead

# ---------------- 2. Tiện ích ----------------
def slugify(t):
    t = unicodedata.normalize('NFD', str(t or ''))
    t = re.sub(r'[\u0300-\u036f]', '', t).replace('đ', 'd').replace('Đ', 'D').lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')
def iso(d, fallback=None):
    if not d or d.startswith('0000'): return fallback
    return datetime.datetime.strptime(d, '%Y-%m-%d %H:%M:%S').strftime('%Y-%m-%dT%H:%M:%S.000Z')
def plain(h):
    h = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', h or '', flags=re.I)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()
def cut(t, n):
    t = (t or '').strip()
    if len(t) <= n: return t
    c = t[:n-1]; sp = c.rfind(' ')
    return c[:max(sp, n-20)].rstrip(' ,.;:-') + '…'
def clean_txt(t): return re.sub(r'\s+', ' ', html.unescape(t or '')).strip()
SITENAME = 'Swift247'
def yoast_vars(t, title):
    if not t: return ''
    t = t.replace('%%title%%', title).replace('%%sitename%%', SITENAME).replace('%%sep%%', '-')
    t = re.sub(r'%%[a-z_]+%%', '', t)
    return clean_txt(t)

def media_url(u):
    return re.sub(r'^(?:https?:)?//[^/]+/wp-content/uploads/', MEDIA, u)
def attachment(aid):
    a = P.get(str(aid or ''))
    if not a: return '', ''
    f = META[a['ID']].get('_wp_attached_file')
    url = MEDIA + f if f else media_url(a.get('guid') or '')
    return url, clean_txt(META[a['ID']].get('_wp_attachment_image_alt') or '')

# ---------------- 3. Chuyển shortcode ----------------
TABLE_POST = (json.loads(OPT.get('tablepress_tables') or '{}')).get('table_post', {})
def tablepress(tid):
    p = P.get(str(TABLE_POST.get(str(tid), '')))
    if not p: return ''
    try: data = json.loads(p['post_content'])
    except Exception: return ''
    out = ['<table><tbody>']
    for r, row in enumerate(data):
        out.append('<tr>')
        for c, cell in enumerate(row):
            if cell in ('#colspan#', '#rowspan#'): continue
            cs = 1
            while c + cs < len(row) and row[c+cs] == '#colspan#': cs += 1
            rs = 1
            while r + rs < len(data) and c < len(data[r+rs]) and data[r+rs][c] == '#rowspan#': rs += 1
            a = (' colspan="%d"' % cs if cs > 1 else '') + (' rowspan="%d"' % rs if rs > 1 else '')
            out.append('<td%s>%s</td>' % (a, cell))
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)
def accordion(aid):
    d = unser(META.get(str(aid), {}).get('wpsm_accordion_data'))
    if not isinstance(d, dict): return ''
    out = []
    for k in sorted(d, key=lambda x: int(x)):
        it = d[k]
        q = clean_txt(it.get('accordion_title', '')); a = it.get('accordion_desc', '')
        if q: out.append('<h3>%s</h3>' % html.escape(q, quote=False))
        if a: out.append('<div>%s</div>' % a)
    return ''.join(out)

# ---------------- 4. Làm sạch nội dung ----------------
LINK_MAP = {}  # slug WordPress cũ → đường dẫn mới (điền ở bước 5)
WP_HOST = r'(?:https?:)?//(?:www\.)?(?:swift247\.vn|portal-homepage(?:-dev)?\.stg\.swift247\.vn|wordpress\.test|localhost:8888)'
def fix_href(h):
    h0 = html.unescape(h)
    m = re.match(WP_HOST + r'/wp-admin/(https?://.*)$', h0)
    if m: return m.group(1)
    if re.match(WP_HOST + r'/wp-content/uploads/', h0): return media_url(h0)
    m = re.match(r'^https?://([a-z0-9-]+)/?$', h0)            # link gõ thiếu tên miền: http://<slug>
    if m and m.group(1) in LINK_MAP: return LINK_MAP[m.group(1)]
    m = re.match(WP_HOST + r'(/[^?#]*)?([?#].*)?$', h0)
    if not m: return h
    if re.search(r'/www\.swift247\.vn/?$', m.group(1) or ''): return '/'
    path = urllib.parse.unquote((m.group(1) or '/')).strip('/')
    if path == '': return '/'
    seg = path.split('/')
    if seg[0] == 'category' and len(seg) > 1: return '/news'
    key = seg[-1] if seg[0] not in ('wp-admin',) else ''
    if key in LINK_MAP: return LINK_MAP[key]
    if key in ('tin-tuc', 'news', 'tin-tuc-su-kien-swift247'): return '/news'
    return h

def clean_html(c):
    c = c or ''
    c = re.sub(r'<!--\s*/?wp:[\s\S]*?-->', '', c)                 # chú thích khối Gutenberg
    c = re.sub(r'<!--[\s\S]*?-->', '', c)
    c = re.sub(r'\[table id=(\d+)\s*/?\]', lambda m: tablepress(m.group(1)), c)
    c = re.sub(r'\[WPSM_AC id=(\d+)\]', lambda m: accordion(m.group(1)), c)
    c = re.sub(r'\[(?:latest_post|posts_by_cat|image_posts)[^\]]*\]', '', c)
    c = re.sub(r'\[caption[^\]]*\]([\s\S]*?)\[/caption\]', r'<figure>\1</figure>', c)
    c = re.sub(r'<(script|style|noscript)[\s\S]*?</\1>', '', c, flags=re.I)
    c = re.sub(r'</?(?:link|meta|form|input|select|option|textarea)\b[^>]*>', '', c, flags=re.I)
    c = re.sub(r'<button\b[^>]*>([\s\S]*?)</button>', r'<strong>\1</strong>', c, flags=re.I)
    def tag(m):
        t, a = m.group(1), m.group(2) or ''
        center = re.search(r'\bclass\s*=\s*"[^"]*(?:has-text-align-center|aligncenter)', a)
        right = re.search(r'\bclass\s*=\s*"[^"]*has-text-align-right', a)
        # bỏ class/id/srcset… của theme cũ để không đụng CSS & neo (#contact, #services…) của website mới
        a = re.sub(r'\s(?:class|id|srcset|sizes|data-[\w-]+|on\w+|loading|decoding|width|height)\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)', '', a, flags=re.I)
        a = re.sub(r'\s(href|src)\s*=\s*"([^"]*)"', lambda x: ' %s="%s"' % (x.group(1), fix_href(x.group(2)) if x.group(1) == 'href' else media_url(x.group(2))), a)
        if (center or right) and t.lower() in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'div'):
            al = 'center' if center else 'right'
            if re.search(r'\sstyle\s*=\s*"', a): a = re.sub(r'\sstyle\s*=\s*"', ' style="text-align:%s;' % al, a, count=1)
            else: a += ' style="text-align:%s"' % al
        return '<%s%s>' % (t, a)
    c = re.sub(r'<([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*?)?\s*/?>', tag, c)
    c = re.sub(r'<h1(\s[^>]*)?>([\s\S]*?)</h1>', r'<h2\1>\2</h2>', c, flags=re.I)  # trang đã có 1 H1 (tiêu đề)
    c = re.sub(r'<p[^>]*>(?:\s|&nbsp;|<br\s*/?>)*</p>', '', c)
    c = re.sub(r'<(div|figure)[^>]*>\s*</\1>', '', c)
    c = re.sub(r'\n\s*\n+', '\n', c)
    return c.strip()

# ---------------- 5. Chuẩn bị bài viết ----------------
def unique(slug, used):
    s, b, i = slug, slug, 2
    while s in used: s = '%s-%d' % (b, i); i += 1
    used.add(s); return s

store = lambda n, l: n if l == 'vi' else n.replace('.json', '.%s.json' % l)
def rd(n, d):
    try: return json.load(open(os.path.join(A.data, n), encoding='utf-8'))
    except Exception: return d
LANGS = ['vi', 'en']
posts_now = {l: [p for p in rd(store('posts.json', l), []) if not str(p.get('id', '')).startswith('wp')] for l in LANGS}
pages_now = {l: [p for p in rd(store('pages.json', l), []) if not str(p.get('id', '')).startswith('wp')] for l in LANGS}
used_post = {l: {p['slug'] for p in posts_now[l]} for l in LANGS}
used_page = {l: {p['slug'] for p in pages_now[l]} for l in LANGS}
valid_cats = [c.get('key') for c in (rd('site.json', {}).get('postCats') or [])] or ['van-chuyen', 'huong-dan', 'khuyen-mai', 'cong-ty']

GUIDE = re.compile(r'hướng dẫn|cách |bí quyết|lưu ý|bật mí|chia sẻ|giải đáp|kinh nghiệm|mẹo|how to|guide|đóng gói', re.I)
def map_cat(wp, title):
    s = set(wp)
    if 'khuyen-mai' in s: c = 'khuyen-mai'
    elif GUIDE.search(title): c = 'huong-dan'
    elif s & {'thong-tin', 'chuyen-phat-nhanh-trong-nuoc'}: c = 'van-chuyen'
    else: c = 'cong-ty'  # Tin tức – Sự kiện, News, tuyển dụng, chưa phân loại…
    return c if c in valid_cats else valid_cats[0]
HIDE_CATS = {'nhan-xet-khach-hang', 'hinh-anh', 'image'}  # bài phụ của theme cũ (nhận xét khách hàng, ảnh slide) → nhập dạng nháp

wp_posts = [p for p in P.values() if p['post_type'] == 'post' and p['post_status'] in ('publish', 'draft')]
wp_posts.sort(key=lambda p: p['post_date'])
SKIP_PAGES = {'50', '1042', '3412', '3413', '3139', '3416', '1791', '2209', '2499', '1726',  # trang chủ, tra cứu, bản sao lưu/nháp cũ
              '241', '1034', '2982', '2828', '2830', '2832', '2834', '1123', '1172'}         # trang chỉ chứa danh sách bài tự động
wp_pages = [p for p in P.values() if p['post_type'] == 'page' and p['post_status'] in ('publish', 'draft') and p['ID'] not in SKIP_PAGES]
PAGE_LANG = {'3369': 'en'}  # trang tiếng Anh nhưng bị gắn nhầm tiếng Việt trong Polylang
# Trang WP trùng nội dung với trang đang có trên website → nhập dạng NHÁP (giữ nguyên trang hiện tại)
# Trang dựng bằng bố cục riêng của theme cũ (nhiều khối, tab, menu lặp) → nhập NHÁP để xem lại trước khi đăng
LAYOUT_PAGE = {'239', '242', '1043', '1176'}
DUP_PAGE = {'thong-tin-dich-vu', 'quy-trinh-gui-hang', 'hang-hoa-khong-van-chuyen', 'chinh-sach-boi-thuong', 'dieu-khoan-su-dung',
            'chinh-sach-bao-mat-s247', 'our-services', 'terms-and-conditions-of-service'}
EXISTING_PAGE_FOR = {'chinh-sach-bao-mat-s247': 'chinh-sach-bao-mat', 'thong-tin-dich-vu': 'thong-tin-dich-vu', 'quy-trinh-gui-hang': 'quy-trinh-gui-hang',
                     'hang-hoa-khong-van-chuyen': 'hang-hoa-khong-van-chuyen', 'chinh-sach-boi-thuong': 'chinh-sach-boi-thuong',
                     'dieu-khoan-su-dung': 'dieu-khoan-su-dung', 'chuyen-phat-nhanh-trong-nuoc': 'chuyen-phat-nhanh-trong-nuoc',
                     'chuyen-phat-nhanh-quoc-te': 'chuyen-phat-nhanh-quoc-te', 'chinh-sach-ve-boi-thuong': 'chinh-sach-boi-thuong'}

# 5a. slug mới + bảng chuyển link nội bộ
plan_posts, plan_pages = [], []
for p in wp_posts:
    l = lang_of(p['ID'])
    if l not in LANGS: continue
    title = clean_txt(p['post_title'])
    raw = urllib.parse.unquote(p['post_name'] or '')
    if raw.startswith('__trashed'): raw = ''   # slug hỏng do khôi phục từ thùng rác → tạo lại từ tiêu đề
    slug = unique(slugify(raw) or slugify(title) or 'bai-' + p['ID'], used_post[l])
    plan_posts.append((p, l, title, slug))
    if l == 'vi':
        for k in [raw, p['post_name']] + OLD_SLUGS[p['ID']]: LINK_MAP.setdefault(urllib.parse.unquote(k or ''), '/post/' + slug)
for p in wp_pages:
    l = PAGE_LANG.get(p['ID'], lang_of(p['ID']))
    if l not in LANGS: continue
    title = clean_txt(p['post_title']); raw = urllib.parse.unquote(p['post_name'] or '')
    base = slugify(raw) or slugify(title)
    dup = base in DUP_PAGE
    slug = unique(base + ('-wp' if dup else ''), used_page[l])
    plan_pages.append((p, l, title, slug, dup))
    if l == 'vi' and not dup: LINK_MAP.setdefault(raw, '/p/' + slug)
for k, v in EXISTING_PAGE_FOR.items(): LINK_MAP.setdefault(k, '/p/' + v)
LINK_MAP.setdefault('bang-gia', LINK_MAP.get('bang-gia-cac-dich-vu-giao-hang-swift247', '/'))
LINK_MAP.setdefault('doi-tac', '/')

# 5b. dựng bản ghi
def gid(pid): return 'wp' + GROUP.get(pid, pid)
out_posts = {l: [] for l in LANGS}
for p, l, title, slug in plan_posts:
    mt = META[p['ID']]; content = clean_html(p['post_content'])
    wpc = terms(p['ID'], 'category')
    cover, alt = attachment(mt.get('_thumbnail_id'))
    if not cover:
        m = re.search(r'<img[^>]*\ssrc="([^"]+)"', content)
        cover = m.group(1) if m else ''
    date = iso(p['post_date_gmt'], iso(p['post_date']))
    status = 'published' if p['post_status'] == 'publish' and not (set(wpc) & HIDE_CATS) else 'draft'
    ex = clean_txt(p['post_excerpt']) or cut(clean_txt(mt.get('_yoast_wpseo_metadesc')) or plain(content), 160)
    rec = {'id': gid(p['ID']), 'date': date, 'updated': iso(p['post_modified_gmt'], date), 'cat': map_cat(wpc, title),
           'title': title, 'slug': slug, 'excerpt': ex[:300], 'cover': cover, 'coverAlt': (alt or title)[:150],
           'content': content, 'seoTitle': yoast_vars(mt.get('_yoast_wpseo_title'), title)[:120],
           'seoDesc': yoast_vars(mt.get('_yoast_wpseo_metadesc'), title)[:300], 'keyword': clean_txt(mt.get('_yoast_wpseo_focuskw'))[:80],
           'noindex': mt.get('_yoast_wpseo_meta-robots-noindex') == '1', 'status': status,
           'source': 'wordpress', 'wpId': int(p['ID'])}
    out_posts[l].append(rec)
out_pages = {l: [] for l in LANGS}
for p, l, title, slug, dup in plan_pages:
    mt = META[p['ID']]; content = clean_html(p['post_content'])
    if len(plain(content)) < 80: continue
    upd = iso(p['post_modified_gmt'], iso(p['post_modified']))
    nice = re.sub(r'swift\s?247', 'Swift247', title.capitalize() if title.isupper() else title, flags=re.I)
    rec = {'id': gid(p['ID']), 'title': ('[WP] ' if dup else '') + nice,
           'slug': slug, 'excerpt': cut(clean_txt(mt.get('_yoast_wpseo_metadesc')) or plain(content), 160),
           'content': content, 'status': 'draft' if dup or p['ID'] in LAYOUT_PAGE or p['post_status'] != 'publish' else 'published',
           'seoTitle': yoast_vars(mt.get('_yoast_wpseo_title'), title)[:120], 'seoDesc': yoast_vars(mt.get('_yoast_wpseo_metadesc'), title)[:300],
           'keyword': clean_txt(mt.get('_yoast_wpseo_focuskw'))[:80], 'noindex': mt.get('_yoast_wpseo_meta-robots-noindex') == '1',
           'updated': upd, 'source': 'wordpress', 'wpId': int(p['ID'])}
    out_pages[l].append(rec)

# id phải duy nhất trong từng ngôn ngữ (nhóm Polylang có thể chứa 2 bài cùng ngôn ngữ)
for coll in (out_posts, out_pages):
    for l in LANGS:
        seen = set()
        for r in coll[l]:
            if r['id'] in seen: r['id'] = 'wp' + str(r['wpId'])
            seen.add(r['id'])

# ---------------- 6. Ghi file ----------------
stat = {l: dict(posts=len(out_posts[l]), posts_pub=sum(r['status'] == 'published' for r in out_posts[l]),
                pages=len(out_pages[l]), pages_pub=sum(r['status'] == 'published' for r in out_pages[l])) for l in LANGS}
print(json.dumps(stat, ensure_ascii=False))
print('Chuyên mục:', dict(collections.Counter(r['cat'] for l in LANGS for r in out_posts[l])))
if A.dry: sys.exit()
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
bk = os.path.join(A.data, 'backup-before-wp-import-' + stamp); os.makedirs(bk, exist_ok=True)
def wr(n, v):
    f = os.path.join(A.data, n)
    if os.path.exists(f): shutil.copy2(f, os.path.join(bk, n))
    tmp = f + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh: json.dump(v, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, f)
for l in LANGS:
    wr(store('posts.json', l), posts_now[l] + out_posts[l])
    wr(store('pages.json', l), pages_now[l] + out_pages[l])
print('Đã ghi. Sao lưu dữ liệu cũ tại', bk)
