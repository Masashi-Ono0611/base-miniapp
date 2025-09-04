"use client";

import { PointsSummary, QuestList } from "../../components";

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PointsSummary />
      <QuestList />
    </div>
  );
}
