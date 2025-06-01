import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  const [jumpToPage, setJumpToPage] = useState('');
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Если всего одна страница или меньше, не показываем пагинацию
  if (totalPages <= 1) {
    return null;
  }

  const handleFirstPage = () => {
    if (currentPage !== 1 && !loading) {
      onPageChange(1);
    }
  };

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

  const handleLastPage = () => {
    if (currentPage !== totalPages && !loading) {
      onPageChange(totalPages);
    }
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage && !loading) {
      onPageChange(pageNum);
      setJumpToPage('');
    }
  };

  // Генерируем массив номеров страниц для отображения
  const getPageNumbers = () => {
    const delta = 2; // Количество страниц слева и справа от текущей
    const range = [];
    const rangeWithDots = [];

    // Всегда показываем первую страницу
    range.push(1);

    // Добавляем страницы вокруг текущей
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Всегда показываем последнюю страницу (если она не равна первой)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Убираем дубликаты и сортируем
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Добавляем многоточия где нужно
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {/* Мобильная версия */}
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={handlePrevPage}
          disabled={!hasPrevPage || loading}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            !hasPrevPage || loading
              ? 'text-gray-300 cursor-not-allowed bg-gray-100'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Назад
        </button>
        
        <div className="flex items-center px-4">
          <span className="text-sm text-gray-700">
            Страница <span className="font-medium">{currentPage}</span> из{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
            !hasNextPage || loading
              ? 'text-gray-300 cursor-not-allowed bg-gray-100'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Вперед
        </button>
      </div>

      {/* Десктопная версия */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
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
            <p className="text-xs text-gray-500 mt-1">
              Страница {currentPage} из {totalPages}
            </p>
          </div>

          {/* Быстрый переход к странице */}
          {totalPages > 10 && (
            <form onSubmit={handleJumpToPage} className="flex items-center space-x-2">
              <label htmlFor="jumpToPage" className="text-sm text-gray-600">
                Перейти к:
              </label>
              <input
                id="jumpToPage"
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                placeholder={currentPage.toString()}
                disabled={loading}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !jumpToPage || parseInt(jumpToPage) === currentPage}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                →
              </button>
            </form>
          )}
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Кнопка "В начало" */}
            <button
              onClick={handleFirstPage}
              disabled={currentPage === 1 || loading}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                currentPage === 1 || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
              title="Первая страница"
            >
              <span className="sr-only">Первая страница</span>
              <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Кнопка "Назад" */}
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || loading}
              className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                !hasPrevPage || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
              title="Предыдущая страница"
            >
              <span className="sr-only">Предыдущая</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Номера страниц */}
            {pageNumbers.map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => !loading && onPageChange(pageNumber as number)}
                  disabled={loading}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : loading
                      ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                      : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  title={`Страница ${pageNumber}`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Кнопка "Вперед" */}
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || loading}
              className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                !hasNextPage || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
              title="Следующая страница"
            >
              <span className="sr-only">Следующая</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Кнопка "В конец" */}
            <button
              onClick={handleLastPage}
              disabled={currentPage === totalPages || loading}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                currentPage === totalPages || loading
                  ? 'text-gray-300 bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
              title="Последняя страница"
            >
              <span className="sr-only">Последняя страница</span>
              <ChevronsRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}; 