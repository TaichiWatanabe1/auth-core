/** Demoアイテム */
export interface DemoItem {
  id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string | null;
}

/** Demoアイテム作成リクエスト */
export interface DemoItemCreate {
  title: string;
  description?: string;
}

/** Demoアイテム更新リクエスト */
export interface DemoItemUpdate {
  title?: string;
  description?: string;
}

// エイリアス（互換性のため）
export type CreateDemoItemRequest = DemoItemCreate;
export type UpdateDemoItemRequest = DemoItemUpdate;
