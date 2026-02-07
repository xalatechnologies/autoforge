/**
 * DataTable Component
 *
 * A generic, reusable data table with sorting, pagination, and row selection.
 * Built on Designsystemet Table primitive for consistent styling.
 *
 * @example Basic usage
 * ```tsx
 * const columns: DataTableColumn<User>[] = [
 *   { id: 'name', header: 'Name', accessor: 'name', sortable: true },
 *   { id: 'email', header: 'Email', accessor: 'email' },
 *   { id: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   pagination={{ page: 1, pageSize: 10, total: 100 }}
 *   onPageChange={setPage}
 *   onSort={setSort}
 * />
 * ```
 */

import * as React from 'react';
import {
    Table,
    Checkbox,
    Pagination,
    Spinner,
} from '@digdir/designsystemet-react';
import { Stack } from '../primitives';

// =============================================================================
// Types
// =============================================================================

/** Column definition for DataTable */
export interface DataTableColumn<T> {
    /** Unique column identifier */
    id: string;
    /** Column header text */
    header: string;
    /** Property key to access value (for simple cases) */
    accessor?: keyof T;
    /** Custom render function for cell content */
    render?: (row: T, index: number) => React.ReactNode;
    /** Whether column is sortable */
    sortable?: boolean;
    /** Column width (CSS value) */
    width?: string;
    /** Text alignment */
    align?: 'left' | 'center' | 'right';
    /** Hide column on mobile */
    hideOnMobile?: boolean;
}

/** Sort state */
export interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

/** Pagination state */
export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

/** DataTable props */
export interface DataTableProps<T> {
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Data rows */
    data: T[];
    /** Unique key extractor for rows */
    getRowKey: (row: T, index: number) => string;
    /** Loading state */
    isLoading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Current sort state */
    sort?: SortState;
    /** Sort change handler */
    onSort?: (sort: SortState) => void;
    /** Pagination state */
    pagination?: PaginationState;
    /** Page change handler */
    onPageChange?: (page: number) => void;
    /** Page size change handler */
    onPageSizeChange?: (pageSize: number) => void;
    /** Enable row selection */
    selectable?: boolean;
    /** Selected row keys */
    selectedRows?: string[];
    /** Selection change handler */
    onSelectionChange?: (selectedKeys: string[]) => void;
    /** Row click handler */
    onRowClick?: (row: T, index: number) => void;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
    /** Component size */
    size?: 'sm' | 'md' | 'lg';
    /** Zebra striping */
    zebra?: boolean;
    /** Sticky header */
    stickyHeader?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function DataTable<T>({
    columns,
    data,
    getRowKey,
    isLoading = false,
    emptyMessage = 'Ingen data å vise',
    sort,
    onSort,
    pagination,
    onPageChange,
    selectable = false,
    selectedRows = [],
    onSelectionChange,
    onRowClick,
    className,
    style,
    size = 'md',
    zebra = false,
    stickyHeader = false,
}: DataTableProps<T>): React.ReactElement {
    // Handle column header click for sorting
    const handleSort = (columnId: string) => {
        if (!onSort) return;

        const column = columns.find((c) => c.id === columnId);
        if (!column?.sortable) return;

        const newDirection =
            sort?.column === columnId && sort.direction === 'asc' ? 'desc' : 'asc';

        onSort({ column: columnId, direction: newDirection });
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;

        if (checked) {
            const allKeys = data.map((row, index) => getRowKey(row, index));
            onSelectionChange(allKeys);
        } else {
            onSelectionChange([]);
        }
    };

    // Handle individual row selection
    const handleRowSelect = (rowKey: string, checked: boolean) => {
        if (!onSelectionChange) return;

        if (checked) {
            onSelectionChange([...selectedRows, rowKey]);
        } else {
            onSelectionChange(selectedRows.filter((key) => key !== rowKey));
        }
    };

    // Check if all rows are selected
    const allSelected = data.length > 0 && data.every((row, index) =>
        selectedRows.includes(getRowKey(row, index))
    );

    // Check if some rows are selected
    const someSelected = selectedRows.length > 0 && !allSelected;

    // Get cell value for a column
    const getCellValue = (row: T, column: DataTableColumn<T>, index: number): React.ReactNode => {
        if (column.render) {
            return column.render(row, index);
        }
        if (column.accessor) {
            const value = row[column.accessor];
            return value != null ? String(value) : '';
        }
        return '';
    };

    // Render sort indicator
    const renderSortIndicator = (columnId: string) => {
        if (sort?.column !== columnId) {
            return <span style={{ opacity: 0.3 }}>↕</span>;
        }
        return sort.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <Stack direction="vertical" spacing="var(--ds-spacing-4)" className={className} style={style}>
            {/* Table */}
            <div
                style={{
                    overflowX: 'auto',
                    position: 'relative',
                }}
            >
                <Table
                    data-size={size}
                    zebra={zebra}
                    stickyHeader={stickyHeader}
                >
                    <Table.Head>
                        <Table.Row>
                            {selectable && (
                                <Table.HeaderCell style={{ width: '48px' }}>
                                    <Checkbox
                                        checked={allSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        aria-label="Velg alle rader"
                                        data-size="sm"
                                    />
                                </Table.HeaderCell>
                            )}

                            {/* Data columns */}
                            {columns.map((column) => (
                                <Table.HeaderCell
                                    key={column.id}
                                    style={{
                                        width: column.width,
                                        textAlign: column.align || 'left',
                                        cursor: column.sortable ? 'pointer' : 'default',
                                    }}
                                    onClick={() => column.sortable && handleSort(column.id)}
                                    aria-sort={
                                        sort?.column === column.id
                                            ? sort.direction === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : undefined
                                    }
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {column.header}
                                        {column.sortable && (
                                            <span style={{ marginLeft: '4px' }}>{renderSortIndicator(column.id)}</span>
                                        )}
                                    </span>
                                </Table.HeaderCell>
                            ))}
                        </Table.Row>
                    </Table.Head>

                    <Table.Body>
                        {/* Loading state */}
                        {isLoading && (
                            <Table.Row>
                                <Table.Cell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    style={{ textAlign: 'center', padding: 'var(--ds-spacing-8)' }}
                                >
                                    <Spinner aria-label="Laster data..." />
                                </Table.Cell>
                            </Table.Row>
                        )}

                        {/* Empty state */}
                        {!isLoading && data.length === 0 && (
                            <Table.Row>
                                <Table.Cell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    style={{
                                        textAlign: 'center',
                                        padding: 'var(--ds-spacing-8)',
                                        color: 'var(--ds-color-neutral-text-subtle)',
                                    }}
                                >
                                    {emptyMessage}
                                </Table.Cell>
                            </Table.Row>
                        )}

                        {/* Data rows */}
                        {!isLoading &&
                            data.map((row, index) => {
                                const rowKey = getRowKey(row, index);
                                const isSelected = selectedRows.includes(rowKey);

                                return (
                                    <Table.Row
                                        key={rowKey}
                                        onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                                        style={{
                                            cursor: onRowClick ? 'pointer' : 'default',
                                            backgroundColor: isSelected
                                                ? 'var(--ds-color-first-surface-default)'
                                                : undefined,
                                        }}
                                        aria-selected={isSelected}
                                    >
                                        {/* Selection cell */}
                                        {selectable && (
                                            <Table.Cell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={(e) => handleRowSelect(rowKey, e.target.checked)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Velg rad ${index + 1}`}
                                                    data-size="sm"
                                                />
                                            </Table.Cell>
                                        )}

                                        {/* Data cells */}
                                        {columns.map((column) => (
                                            <Table.Cell
                                                key={column.id}
                                                style={{ textAlign: column.align || 'left' }}
                                            >
                                                {getCellValue(row, column, index)}
                                            </Table.Cell>
                                        ))}
                                    </Table.Row>
                                );
                            })}
                    </Table.Body>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && onPageChange && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--ds-spacing-4)',
                    }}
                >
                    <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-neutral-text-subtle)' }}>
                        Viser {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)} -{' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} av {pagination.total}
                    </span>

                    <div style={{ display: 'flex', gap: 'var(--ds-spacing-2)', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => onPageChange(1)}
                            disabled={pagination.page <= 1}
                            style={{
                                padding: 'var(--ds-spacing-2) var(--ds-spacing-3)',
                                border: '1px solid var(--ds-color-neutral-border-default)',
                                borderRadius: 'var(--ds-border-radius-md)',
                                background: 'var(--ds-color-neutral-background-default)',
                                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                opacity: pagination.page <= 1 ? 0.5 : 1,
                            }}
                        >
                            ⟨⟨
                        </button>
                        <button
                            type="button"
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            style={{
                                padding: 'var(--ds-spacing-2) var(--ds-spacing-3)',
                                border: '1px solid var(--ds-color-neutral-border-default)',
                                borderRadius: 'var(--ds-border-radius-md)',
                                background: 'var(--ds-color-neutral-background-default)',
                                cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                opacity: pagination.page <= 1 ? 0.5 : 1,
                            }}
                        >
                            ⟨
                        </button>
                        <span style={{ padding: '0 var(--ds-spacing-3)' }}>
                            Side {pagination.page} av {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                            style={{
                                padding: 'var(--ds-spacing-2) var(--ds-spacing-3)',
                                border: '1px solid var(--ds-color-neutral-border-default)',
                                borderRadius: 'var(--ds-border-radius-md)',
                                background: 'var(--ds-color-neutral-background-default)',
                                cursor: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 'not-allowed' : 'pointer',
                                opacity: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 0.5 : 1,
                            }}
                        >
                            ⟩
                        </button>
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.ceil(pagination.total / pagination.pageSize))}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                            style={{
                                padding: 'var(--ds-spacing-2) var(--ds-spacing-3)',
                                border: '1px solid var(--ds-color-neutral-border-default)',
                                borderRadius: 'var(--ds-border-radius-md)',
                                background: 'var(--ds-color-neutral-background-default)',
                                cursor: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 'not-allowed' : 'pointer',
                                opacity: pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 0.5 : 1,
                            }}
                        >
                            ⟩⟩
                        </button>
                    </div>
                </div>
            )}
        </Stack>
    );
}

export default DataTable;
