"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function CircleForms() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(body.error ?? "Couldn't create that circle.");
      return;
    }
    router.push(`/circles/${body.id}`);
    router.refresh();
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setJoining(true);
    const res = await fetch("/api/circles/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    const body = await res.json();
    setJoining(false);
    if (!res.ok) {
      setError(body.error ?? "Couldn't join that circle.");
      return;
    }
    router.push(`/circles/${body.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <p className="mb-3 px-0.5 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Start a circle</p>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            required
            maxLength={60}
            placeholder="Gym crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={creating}
            className="flex-none rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60"
          >
            {creating ? "..." : "Create"}
          </button>
        </form>
      </section>

      <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
        <p className="mb-3 px-0.5 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Join with a code</p>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Paste invite code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={joining}
            className="flex-none rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-60"
          >
            {joining ? "..." : "Join"}
          </button>
        </form>
      </section>

      {error && <p className="text-center text-sm text-warn">{error}</p>}
    </div>
  );
}
