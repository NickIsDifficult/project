import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layout/AppShell";
import "./search.css";

// ✅ 실제 API 호출 함수
async function searchAPI({ keyword, categories, from, to, sort, page, pageSize, employeeState }) {
  const query = new URLSearchParams({
    keyword: keyword || "",
    category: categories?.[0] || "",
    from_date: from || "",
    to_date: to || "",
    sort: sort || "desc",
    employee_state: employeeState || "",
  });

  const response = await fetch(`http://localhost:8000/search/?${query.toString()}`);
  if (!response.ok) throw new Error("검색 API 호출 실패");

  const data = await response.json();

  // ✅ 필터링
  const selectedCats = Object.entries(categories)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const filtered = data.filter((row) => {
    const matchCat = selectedCats.length ? selectedCats.includes(row.type) : true;
    const matchKeyword =
      !keyword ||
      row.title.toLowerCase().includes(keyword.toLowerCase()) ||
      row.owner.toLowerCase().includes(keyword.toLowerCase());
    const matchState =
      !employeeState || row.current_state === employeeState || row.state === employeeState;

    let matchFrom = true;
    let matchTo = true;
    if (from) matchFrom = new Date(row.createdAt) >= new Date(from + "T00:00:00");
    if (to) matchTo = new Date(row.createdAt) <= new Date(to + "T23:59:59");

    return matchCat && matchKeyword && matchState && matchFrom && matchTo;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "title_asc") return a.title.localeCompare(b.title, "ko");
    if (sort === "title_desc") return b.title.localeCompare(a.title, "ko");
    return 0;
  });

  const start = (page - 1) * pageSize;
  return { total: sorted.length, items: sorted.slice(start, start + pageSize) };
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
  const [employeeState, setEmployeeState] = useState(""); // ✅ 직원 상태 필터 추가

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const isSearching = useRef(false);
  const nav = useNavigate();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const runSearch = async () => {
    if (isSearching.current) return;
    isSearching.current = true;
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
        employeeState, // ✅ 전달
      });
      setItems(arr);
      setTotal(t);
    } finally {
      setLoading(false);
      isSearching.current = false;
    }
  };

  useEffect(() => {
    setPage(1);
  }, [keyword, categories, from, to, sort, employeeState]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(), 150);
    return () => clearTimeout(timer);
  }, [page, keyword, from, to, sort, JSON.stringify(categories), employeeState]);

  const clearFilters = () => {
    setKeyword("");
    setCategories({ 공지사항: true, 프로젝트: true, 업무: true, 직원: false });
    setFrom("");
    setTo("");
    setSort("recent");
    setEmployeeState("");
  };

  const handleItemOpen = (item) => {
    const routeMap = {
      공지사항: `/notices/${item.id}`,
      프로젝트: `/projects/`,
      업무: `/tasks/${item.id}`,
      직원: `/employees/${item.id}`,
    };
    const dest = routeMap[item.type];
    if (dest) nav(dest);
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

          {/* ✅ 직원 상태 필터 */}
          {categories["직원"] && (
            <div className="f-group">
              <label className="f-label">직원 상태</label>
              <select
                className="f-input"
                value={employeeState}
                onChange={(e) => setEmployeeState(e.target.value)}
              >
                <option value="">전체</option>
                <option value="WORKING">업무중</option>
                <option value="FIELD">외근</option>
                <option value="AWAY">자리비움</option>
                <option value="OFF">퇴근</option>
              </select>
            </div>
          )}

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
              <article
                key={`${it.type}-${it.id}`}
                className="card"
                onDoubleClick={() => handleItemOpen(it)}
                style={{ cursor: "pointer" }}
              >
                <header className="card-head">
                  <span className={`badge type-${mapTypeClass(it.type)}`}>
                    {it.type}
                  </span>
                  <time className="date">{it.createdAtStr}</time>
                </header>
                <h3 className="card-title">{highlight(it.title, keyword)}</h3>
                <p className="card-desc">{it.summary}</p>
                <div className="card-foot">
                  <span className="owner">
                    {it.owner ? `담당: ${it.owner}` : ""}
                    {it.current_state ? ` (${it.current_state})` : ""}
                  </span>
                  <button className="btn tiny" onClick={() => handleItemOpen(it)}>
                    자세히
                  </button>
                </div>
              </article>
            ))}
            {!loading && items.length === 0 && (
              <div className="empty">조건에 맞는 결과가 없습니다.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pager">
              <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(1)}>
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
