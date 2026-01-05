import { useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import type { AuditLogFilter as FilterType } from "../../types/audit";

interface AuditLogFilterProps {
  onFilter: (filter: FilterType) => void;
}

export const AuditLogFilter = ({ onFilter }: AuditLogFilterProps) => {
  const [userEmail, setUserEmail] = useState("");
  const [method, setMethod] = useState("");
  const [path, setPath] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filter: FilterType = {};

    if (userEmail) filter.user_email = userEmail;
    if (method) filter.method = method;
    if (path) filter.path = path;
    if (startDate) filter.from = startDate;
    if (endDate) filter.to = endDate;

    onFilter(filter);
  };

  const handleReset = () => {
    setUserEmail("");
    setMethod("");
    setPath("");
    setStartDate("");
    setEndDate("");
    onFilter({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          label="ユーザーメール"
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="user@example.com"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メソッド
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <Input
          label="パス"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/api/v1/"
        />

        <Input
          label="開始日"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <Input
          label="終了日"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={handleReset}>
          リセット
        </Button>
        <Button type="submit">検索</Button>
      </div>
    </form>
  );
};
