import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Account overview</h1>
              <p className="mt-1 text-sm text-slate-400">Secure workspace access with Clerk authentication.</p>
            </div>
            <Badge variant="secondary">Protected route</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Unknown user'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {user?.primaryEmailAddress?.emailAddress || 'No email available'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next step</p>
              <p className="mt-2 text-lg font-semibold text-white">Connect Supabase + Prisma</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Workspace actions</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
              Open generator
            </Link>
            <Link href="/sign-in" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              Sign in page
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}