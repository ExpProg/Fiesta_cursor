import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Если всего одна страница или меньше, не показываем пагинацию
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevPage = () => {
    if (hasPrevPage && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        {/* Мобильная версия */}
        <button
          onClick={handlePrevPage}
          disabled={!hasPrevPage || loading}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            !hasPrevPage || loading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Назад
        </button>
        <button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            !hasNextPage || loading
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Вперед
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Показано{' '}
            <span className="font-medium">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            </span>{' '}
            -{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{' '}
            из{' '}
            <span className="font-medium">{totalItems}</span>{' '}
            результатов
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Кнопка "Назад" */}
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || loading}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                !hasPrevPage || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Предыдущая</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Номера страниц */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              const isCurrentPage = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => !loading && onPageChange(pageNumber)}
                  disabled={loading}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : loading
                      ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                      : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Кнопка "Вперед" */}
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || loading}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                !hasNextPage || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Следующая</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}; 