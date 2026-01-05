import apiClient from "./client";
import type { DemoItem, DemoItemCreate, DemoItemUpdate } from "../types/demo";

export const demoApi = {
  /** 一覧取得 */
  getItems: () => apiClient.get<DemoItem[]>("/demo/items"),

  /** 詳細取得 */
  getItem: (id: string) => apiClient.get<DemoItem>(`/demo/items/${id}`),

  /** 作成 */
  createItem: (data: DemoItemCreate) =>
    apiClient.post<DemoItem>("/demo/items", data),

  /** 更新 */
  updateItem: (id: string, data: DemoItemUpdate) =>
    apiClient.put<DemoItem>(`/demo/items/${id}`, data),

  /** 削除 */
  deleteItem: (id: string) => apiClient.delete(`/demo/items/${id}`),
};
