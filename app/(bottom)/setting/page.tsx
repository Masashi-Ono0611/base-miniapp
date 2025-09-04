import { Card } from "../../components";

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Admin">
        <p className="text-[var(--app-foreground-muted)]">Settings will appear here.</p>
      </Card>
    </div>
  );
}
