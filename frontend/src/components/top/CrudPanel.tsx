import { useState, useEffect, useCallback } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";
import { Loading } from "../common/Loading";
import { demoApi } from "../../api/demo";
import type {
  DemoItem,
  DemoItemCreate,
  DemoItemUpdate,
} from "../../types/demo";

export const CrudPanel = () => {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DemoItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await demoApi.getItems();
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError("データの取得に失敗しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setFormLoading(true);
    try {
      const data: DemoItemCreate = {
        title: formTitle,
        description: formDescription || undefined,
      };
      await demoApi.createItem(data);
      setCreateModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !formTitle.trim()) return;
    setFormLoading(true);
    try {
      const data: DemoItemUpdate = {
        title: formTitle,
        description: formDescription || undefined,
      };
      await demoApi.updateItem(selectedItem.id, data);
      setEditModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setFormLoading(true);
    try {
      await demoApi.deleteItem(selectedItem.id);
      setDeleteModalOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (item: DemoItem) => {
    setSelectedItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setEditModalOpen(true);
  };

  const openDeleteModal = (item: DemoItem) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchItems}>再試行</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Demo Items</h2>
        <Button onClick={() => setCreateModalOpen(true)}>新規作成</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                説明
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {item.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="新規作成"
      >
        <div className="space-y-4">
          <Input
            label="名前"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="アイテム名"
          />
          <Input
            label="説明"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="説明（任意）"
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleCreate} loading={formLoading}>
              作成
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetForm();
        }}
        title="編集"
      >
        <div className="space-y-4">
          <Input
            label="名前"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="アイテム名"
          />
          <Input
            label="説明"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="説明（任意）"
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleUpdate} loading={formLoading}>
              更新
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        title="削除確認"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            「<span className="font-medium">{selectedItem?.title}</span>
            」を削除しますか？
          </p>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedItem(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={formLoading}
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
