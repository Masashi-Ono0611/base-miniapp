"use client";

import { useCallback, useState } from "react";
import { PointsSummary, QuestList } from "../../components";

export default function Page() {
  const [summaryKey, setSummaryKey] = useState(0);
  const handleAnyCompleted = useCallback(() => setSummaryKey((k) => k + 1), []);
  return (
    <div className="space-y-6 animate-fade-in">
      <PointsSummary key={summaryKey} />
      <QuestList onAnyCompleted={handleAnyCompleted} />
    </div>
  );
}
