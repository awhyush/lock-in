import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCircleForMember } from "@/lib/circles";
import { CircleView } from "@/components/CircleView";

export const metadata: Metadata = {
  title: "Circle",
  robots: { index: false, follow: false },
};

export default async function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const circle = await getCircleForMember(id, session.user.id);
  if (!circle) notFound();

  return <CircleView circle={circle} viewerId={session.user.id} />;
}
