import { ClaimTxCard, PointsSummary } from "../../components";

export default function Page() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PointsSummary />
      <ClaimTxCard />
    </div>
  );
}
