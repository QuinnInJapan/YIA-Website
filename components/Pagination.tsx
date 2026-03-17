import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (page: number) => (page === 1 ? basePath : `${basePath}?page=${page}`);

  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <nav className="pagination" aria-label="ページ送り Pagination">
      {currentPage > 1 && (
        <Link className="pagination__arrow" href={href(currentPage - 1)} aria-label="前のページへ">
          ← 前へ
        </Link>
      )}

      <span className="pagination__pages">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className="pagination__ellipsis">
              &hellip;
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="pagination__page pagination__page--current"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link key={p} className="pagination__page" href={href(p)}>
              {p}
            </Link>
          ),
        )}
      </span>

      {currentPage < totalPages && (
        <Link className="pagination__arrow" href={href(currentPage + 1)} aria-label="次のページへ">
          次へ →
        </Link>
      )}
    </nav>
  );
}
