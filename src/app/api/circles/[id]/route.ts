import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCircleForMember } from "@/lib/circles";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const circle = await getCircleForMember(id, session.user.id);
  if (!circle) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(circle);
}
