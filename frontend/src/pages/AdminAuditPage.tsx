import { useState, useEffect, useCallback } from "react";
import { Layout } from "../components/layout/Layout";
import { AuditLogTable } from "../components/admin/AuditLogTable";
import { AuditLogFilter } from "../components/admin/AuditLogFilter";
import { AuditLogDetailModal } from "../components/admin/AuditLogDetailModal";
import { Button } from "../components/common/Button";
import { adminApi } from "../api/admin";
import type { AuditLog, AuditLogFilter as FilterType } from "../types/audit";

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const limit = 50;

  const fetchLogs = useCallback(
    async (currentPage: number, currentFilter: FilterType, append = false) => {
      setLoading(true);
      try {
        const response = await adminApi.getAuditLogs({
          ...currentFilter,
          page: currentPage,
          limit,
        });

        const data = response.data;
        setLogs(append ? (prev) => [...prev, ...data.items] : data.items);
        setHasMore(data.items.length === limit);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLogs(1, filter);
  }, [fetchLogs, filter]);

  const handleFilter = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, filter, true);
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">監査ログ</h1>
          <p className="text-gray-600 mt-1">システムの監査ログを閲覧できます</p>
        </div>

        {/* Filter */}
        <AuditLogFilter onFilter={handleFilter} />

        {/* Table */}
        <AuditLogTable
          logs={logs}
          loading={loading && page === 1}
          onRowClick={handleRowClick}
        />

        {/* Load More */}
        {!loading && hasMore && logs.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              loading={loading}
            >
              さらに読み込む
            </Button>
          </div>
        )}

        {/* Detail Modal */}
        <AuditLogDetailModal
          log={selectedLog}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLog(null);
          }}
        />
      </div>
    </Layout>
  );
};
