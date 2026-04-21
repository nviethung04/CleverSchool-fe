"use client";

import { useTypedTranslations } from "@/lib/i18n/client";
import React from "react";

interface ProfessionalPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPaginationInfo?: boolean;
  itemName?: string; // Tên của item (ví dụ: "chương trình", "khóa học", "bài tập")
}

export default function ProfessionalPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24, 48],
  showPageSizeSelector = true,
  showPaginationInfo = true,
  itemName = "mục",
}: ProfessionalPaginationProps) {
  const t = useTypedTranslations('pagination')

  // Don't render if no items or only one page and no page size selector needed
  if (totalCount === 0 || (totalPages <= 1 && !showPageSizeSelector))
    return null;

  return (
    <div className="mt-1">
      {/* Top Section: Page Size Selector & Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{t('show')}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                console.log(
                  "📏 Page size select changed to:",
                  Number(e.target.value)
                );
                onPageSizeChange(Number(e.target.value));
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>{t('itemsPerPage')}</span>
          </div>
        )}

        {/* Pagination Info */}
        {showPaginationInfo && (
          <div className="text-sm text-gray-600">
            {t('show')}{" "}
            <span className="font-medium">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{" "}
            {t('of')} <span className="font-medium">{totalCount}</span>{" "}
            {itemName}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <nav className="flex items-center space-x-1" aria-label="Pagination">
            {/* First Page */}
            {currentPage > 1 && (
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Trang đầu"
              >
                ««
              </button>
            )}

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 text-sm font-medium border border-gray-300 ${
                currentPage === 1
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              } transition-colors`}
              title="Trang trước"
            >
              ‹
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {/* Show first page if current page is far from start */}
              {currentPage > 3 && totalPages > 5 && (
                <>
                  <button
                    onClick={() => onPageChange(1)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 py-2 text-sm text-gray-500">...</span>
                  )}
                </>
              )}

              {/* Show pages around current page */}
              {(() => {
                const pages = [];
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, currentPage + 2);

                // Adjust range if we're near the beginning or end
                if (currentPage <= 3) {
                  endPage = Math.min(5, totalPages);
                }
                if (currentPage >= totalPages - 2) {
                  startPage = Math.max(1, totalPages - 4);
                }

                for (let i = startPage; i <= endPage; i++) {
                  const isActive = i === currentPage;
                  pages.push(
                    <button
                      key={i}
                      onClick={() => {
                        console.log(`🖱️ Page ${i} clicked!`);
                        onPageChange(i);
                      }}
                      className={`px-3 py-2 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isActive
                          ? "text-white bg-blue-600 border-blue-600 hover:bg-blue-700"
                          : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                      style={{
                        backgroundColor: isActive ? "#2563eb" : "white",
                        color: isActive ? "white" : "#6b7280",
                      }}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              {/* Show last page if current page is far from end */}
              {currentPage < totalPages - 2 && totalPages > 5 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 py-2 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next Page */}
            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-2 text-sm font-medium border border-gray-300 ${
                currentPage === totalPages
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              } transition-colors`}
              title="Trang tiếp"
            >
              ›
            </button>

            {/* Last Page */}
            {currentPage < totalPages && (
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Trang cuối"
              >
                »»
              </button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
