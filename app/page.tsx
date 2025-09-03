import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ fid?: string }>;
}) {
  const { fid } = await searchParams;
  if (fid) {
    redirect(`/home?fid=${encodeURIComponent(fid)}`);
  }
  redirect("/home");
}

