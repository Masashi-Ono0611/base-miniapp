import { redirect } from "next/navigation";

export default function Page({
  searchParams,
}: {
  searchParams: { fid?: string };
}) {
  const fid = searchParams?.fid;
  if (fid) {
    redirect(`/home?fid=${encodeURIComponent(fid)}`);
  }
  redirect("/home");
}

