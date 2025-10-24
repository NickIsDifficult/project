import { useEffect, useMemo, useState } from "react";
import AppShell from "../../layout/AppShell";
import "./search.css";

// ✅ 실제 API 호출 함수
async function searchAPI({ keyword, categories, from, to, sort, page, pageSize }) {
  const query = new URLSearchParams({
    keyword: keyword || "",
    category: categories?.[0] || "",
    from_date: from || "",
    to_date: to || "",
    sort: sort || "desc",
  });

  const response = await fetch(`http://localhost:8000/api/search/?${query.toString()}`);
  if (!response.ok) {
    throw new Error("검색 API 호출 실패");
  }

  const data = await response.json();

  // ✅ 프론트 쪽에서도 필터링/정렬/페이지 처리가 필요하면 이 안에서 수행
  const selectedCats = Object.entries(categories)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const filtered = data.filter((row) => {
    const matchCat = selectedCats.length ? selectedCats.includes(row.type) : true;
    const matchKeyword =
      !keyword ||
      row.title.toLowerCase().includes(keyword.toLowerCase()) ||
      row.owner.toLowerCase().includes(keyword.toLowerCase());

    let matchFrom = true;
    let matchTo = true;
    if (from) matchFrom = new Date(row.createdAt) >= new Date(from + "T00:00:00");
    if (to) matchTo = new Date(row.createdAt) <= new Date(to + "T23:59:59");

    return matchCat && matchKeyword && matchFrom && matchTo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "title_asc") return a.title.localeCompare(b.title, "ko");
    if (sort === "title_desc") return b.title.localeCompare(a.title, "ko");
    return 0;
  });

  const start = (page - 1) * pageSize;

  return {
    total: sorted.length,
    items: sorted.slice(start, start + pageSize),
  };
}

// ✅ 메인 컴포넌트
export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState({
    공지사항: true,
    프로젝트: true,
    업무: true,
    직원: false,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("recent");

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const { total: t, items: arr } = await searchAPI({
        keyword,
        categories,
        from,
        to,
        sort,
        page,
        pageSize,
      });
      setItems(arr);
      setTotal(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [keyword, categories, from, to, sort]);

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line
  }, [page, keyword, categories, from, to, sort]);

  const clearFilters = () => {
    setKeyword("");
    setCategories({ 공지사항: true, 프로젝트: true, 업무: true, 직원: false });
    setFrom("");
    setTo("");
    setSort("recent");
  };

  return (
    <AppShell>
      <div className="search-wrap fill-vert">
        <h1 className="search-title">통합 검색</h1>

        {/* 필터 바 */}
        <div className="filter-bar">
          <div className="f-group">
            <label className="f-label">이름/제목/담당자</label>
            <input
              className="f-input"
              value={keyword}
              placeholder="예: 홍길동, 대시보드, 공지"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="f-group">
            <label className="f-label">항목</label>
            <div className="f-checkboxes">
              {Object.keys(categories).map((k) => (
                <label key={k} className="f-check">
                  <input
                    type="checkbox"
                    checked={categories[k]}
                    onChange={(e) =>
                      setCategories((prev) => ({ ...prev, [k]: e.target.checked }))
                    }
                  />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="f-group">
            <label className="f-label">기간</label>
            <div className="f-dates">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="f-input"
              />
              <span className="f-tilde">~</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="f-input"
              />
            </div>
          </div>

          <div className="f-group">
            <label className="f-label">정렬</label>
            <select
              className="f-input"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title_asc">제목 ↑</option>
              <option value="title_desc">제목 ↓</option>
            </select>
          </div>

          <div className="f-actions">
            <button
              className="btn primary"
              onClick={() => {
                setPage(1);
                runSearch();
              }}
            >
              검색
            </button>
            <button className="btn ghost" onClick={clearFilters}>
              초기화
            </button>
          </div>
        </div>

        {/* 결과 */}
        <div className="result-head">
          <div className="result-count">
            {loading ? "검색 중…" : `총 ${total.toLocaleString()}건`}
          </div>
        </div>

        <div className="results-scroll">
          <div className="result-grid">
            {items.map((it) => (
              <article key={it.id} className="card">
                <header className="card-head">
                  <span className={`badge type-${mapTypeClass(it.type)}`}>
                    {it.type}
                  </span>
                  <time className="date">{it.createdAtStr}</time>
                </header>
                <h3 className="card-title">{highlight(it.title, keyword)}</h3>
                <p className="card-desc">{it.summary}</p>
                <div className="card-foot">
                  <span className="owner">담당: {it.owner}</span>
                  <button className="btn tiny">자세히</button>
                </div>
              </article>
            ))}
            {!loading && items.length === 0 && (
              <div className="empty">조건에 맞는 결과가 없습니다.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pager">
              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                ≪
              </button>
              <button
                className="btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                〈
              </button>
              <span className="pageinfo">
                {page} / {totalPages}
              </span>
              <button
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                〉
              </button>
              <button
                className="btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                ≫
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ✅ 보조 함수
function mapTypeClass(type) {
  if (type === "공지사항") return "notice";
  if (type === "프로젝트") return "project";
  if (type === "업무") return "task";
  if (type === "직원") return "employee";
  return "default";
}

function highlight(text, keyword) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = String(text).split(re);
  return parts.map((part, idx) =>
    re.test(part) ? <mark key={idx}>{part}</mark> : <span key={idx}>{part}</span>
  );
}


// 가져가야 하는 파일 서치페이지, 서치 라우터, 노티스모델, 메인라우터
