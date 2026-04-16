import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useSearchParams } from "react-router";

export function LibraryPagination({ totalPages }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const goToPage = (page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", page);
    setSearchParams(nextParams);
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  // optional: generate small page range window
  const visiblePages = Array.from(
    { length: totalPages },
    (_, i) => i + 1,
  ).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2));

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            to="#"
            onClick={(e) => {
              e.preventDefault();
              if (canPrev) goToPage(currentPage - 1);
            }}
            className={!canPrev ? "opacity-50 pointer-events-none" : ""}
          />
        </PaginationItem>

        {/* Visible numbered pages */}
        {visiblePages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              to="#"
              isActive={page === currentPage}
              onClick={(e) => {
                e.preventDefault();
                goToPage(page);
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Ellipsis if there are more pages */}
        {currentPage + 2 < totalPages && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            to="#"
            onClick={(e) => {
              e.preventDefault();
              if (canNext) goToPage(currentPage + 1);
            }}
            className={!canNext ? "opacity-50 pointer-events-none" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
