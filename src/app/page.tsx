"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from 'react';

type ListingResponse = {
  productTitle: string;
  tags: string[];
  productDescription: string;
};

type ApiResponse = {
  success?: boolean;
  listing?: ListingResponse;
  document?: {
    $id?: string;
  };
  error?: string;
};

type SavedListing = {
  $id: string;
  productTitle: string;
  productDescription: string;
  tags: string[];
  $createdAt: string;
};

export default function Home() {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ListingResponse | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [copiedField, setCopiedField] = useState<'title' | 'description' | 'tags' | ''>('');
  const [activeTab, setActiveTab] = useState<'generator' | 'dashboard'>('generator');
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate listing.');
      }

      if (!data.listing) {
        throw new Error('The API returned no listing data.');
      }

      setResult(data.listing);
      setDocumentId(data.document?.$id || '');
      setShowResults(true);
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, field: 'title' | 'description' | 'tags') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(''), 2000);
    } catch {
      setCopiedField('');
    }
  }

  async function fetchListings() {
    setDashboardLoading(true);
    try {
      const response = await fetch('/api/listings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch listings.');
      }

      const data = (await response.json()) as { listings?: SavedListing[] };
      setSavedListings(data.listings || []);
    } catch {
      setSavedListings([]);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function handleDeleteListing(id: string) {
    try {
      const response = await fetch('/api/listings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete listing.');
      }

      setSavedListings(savedListings.filter((l) => l.$id !== id));
    } catch {
      // Handle error silently
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchListings();
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.08),_transparent_24%),linear-gradient(180deg,_#0f1724_0%,_#0b1220_50%,_#0f1724_100%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6 lg:px-8 lg:py-8">
        <header className="mb-5 flex items-center justify-center rounded-2xl border border-white/8 bg-white/5/5 px-4 py-3 backdrop-blur-xl">
          <Image
            src="/etsy-gang-logo.svg"
            alt="Etsy Gang"
            width={320}
            height={96}
            priority
            className="h-20 w-auto max-w-full object-contain sm:h-24"
          />
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('generator')}
            className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              activeTab === 'generator'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              activeTab === 'dashboard'
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Dashboard
          </button>
        </div>
            {activeTab === 'generator' ? (
              <>
              <section id="generator" className="w-full rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl">
                <div className="mb-4 border-b border-white/10 pb-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Generator</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Etsy SEO Generator</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">Enter a product name and generate a complete Etsy listing with an optimized title, description, and 13 SEO-ready tags.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-200">Product Name</span>
                    <input
                      type="text"
                      value={productName}
                      onChange={(event) => setProductName(event.target.value)}
                      placeholder="Type Your Keyword"
                      className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-slate-950/85 px-4 text-lg text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                    />
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading || !productName.trim()}
                      className="inline-flex h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 px-6 text-lg font-semibold text-slate-950 transition hover:from-amber-200 hover:via-amber-300 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </form>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}
              </section>

              <section
                ref={resultsRef}
                id="results"
                className={`mt-4 rounded-[1.45rem] border border-white/10 bg-slate-950/60 p-4 transition-all duration-450 ease-out ${
                  showResults ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
                }`}
                aria-live="polite"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Result</h2>
                  </div>
                  {documentId ? (
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">Saved</div>
                  ) : null}
                </div>
                {result ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Title</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(result.productTitle, 'title')}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            copiedField === 'title' ? 'border-amber-400/30 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm leading-6 text-white">{result.productTitle}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Description</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(result.productDescription, 'description')}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            copiedField === 'description' ? 'border-amber-400/30 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-300">{result.productDescription}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Tags</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(result.tags.join(', '), 'tags')}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            copiedField === 'tags' ? 'border-amber-400/30 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-amber-300/25 bg-amber-300/8 px-3 py-1 text-sm text-amber-100">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-center text-sm text-slate-400">
                    Your generated Etsy copy will appear here.
                  </div>
                )}
              </section>
              </>
            ) : (
            <section id="dashboard" className="w-full rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <div className="mb-4 border-b border-white/10 pb-4">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">Dashboard</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Saved Listings</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">View all your generated Etsy listings. Total: <span className="font-semibold text-amber-200">{savedListings.length}</span></p>
              </div>

              {dashboardLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <p className="text-slate-400">Loading listings...</p>
                </div>
              ) : savedListings.length > 0 ? (
                <div className="space-y-3">
                  {savedListings.map((listing) => (
                    <div key={listing.$id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white line-clamp-1">{listing.productTitle}</h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(listing.$createdAt).toLocaleDateString()} {new Date(listing.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(listing.$id)}
                          className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="mb-2 line-clamp-2 text-sm text-slate-300">{listing.productDescription}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="rounded-full border border-amber-300/25 bg-amber-300/8 px-2 py-0.5 text-xs text-amber-100">{tag}</span>
                        ))}
                        {listing.tags.length > 5 ? (
                          <span className="rounded-full border border-slate-500/25 bg-slate-500/8 px-2 py-0.5 text-xs text-slate-300">+{listing.tags.length - 5}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-center text-sm text-slate-400">
                  <div>
                    <p className="font-medium">No listings yet</p>
                    <p className="mt-1 text-xs">Generate your first Etsy listing to see it here</p>
                  </div>
                </div>
              )}
            </section>
            )}
      </div>
    </main>
  );
}
