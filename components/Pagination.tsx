import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
}) => {
  const { colors, isDark } = useTheme();

  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  // Generate page numbers with sliding window / ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <View style={styles.container}>
      <View style={styles.paginationRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            {
              backgroundColor: isDark ? '#262626' : colors.secondaryBg,
              borderColor: colors.border,
              opacity: hasPrev ? 1 : 0.35,
            },
          ]}
          onPress={() => hasPrev && onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          activeOpacity={0.7}
          accessibilityLabel="Previous Page"
        >
          <ChevronLeft size={16} color={hasPrev ? colors.primaryText : colors.secondaryText} />
        </TouchableOpacity>

        {/* Page Number Buttons */}
        <View style={styles.pagesGroup}>
          {pages.map((p, index) => {
            if (p === '...') {
              return (
                <View key={`ellipsis-${index}`} style={styles.ellipsisBox}>
                  <Text style={[styles.ellipsisText, { color: colors.secondaryText }]}>...</Text>
                </View>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <TouchableOpacity
                key={`page-${pageNum}`}
                style={[
                  styles.pageButton,
                  {
                    backgroundColor: isActive
                      ? colors.primaryOrange
                      : isDark
                      ? '#262626'
                      : colors.secondaryBg,
                    borderColor: isActive ? colors.primaryOrange : colors.border,
                  },
                ]}
                onPress={() => onPageChange(pageNum)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pageText,
                    {
                      color: isActive ? '#FFFFFF' : colors.primaryText,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            {
              backgroundColor: isDark ? '#262626' : colors.secondaryBg,
              borderColor: colors.border,
              opacity: hasNext ? 1 : 0.35,
            },
          ]}
          onPress={() => hasNext && onPageChange(currentPage + 1)}
          disabled={!hasNext}
          activeOpacity={0.7}
          accessibilityLabel="Next Page"
        >
          <ChevronRight size={16} color={hasNext ? colors.primaryText : colors.secondaryText} />
        </TouchableOpacity>
      </View>

      {totalItems !== undefined && (
        <Text style={[styles.itemCountText, { color: colors.secondaryText }]}>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageButton: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 13,
  },
  ellipsisBox: {
    width: 24,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
