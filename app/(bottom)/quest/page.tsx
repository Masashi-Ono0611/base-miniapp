import { Card } from "../../components";
import PointsSummary from "../../components/points/PointsSummary";

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PointsSummary />
      <Card title="Quest">
        <p className="text-[var(--app-foreground-muted)]">Coming soon...</p>
      </Card>
    </div>
  );
}
