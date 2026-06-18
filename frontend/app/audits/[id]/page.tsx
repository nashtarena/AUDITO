"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import RiskBadge from "@/components/ui/RiskBadge";
import ScoreMeter from "@/components/ui/ScoreMeter";
import { auditsApi, reportsApi, reportsApiExtended } from "@/lib/api";
import { Audit } from "@/types";
import { Download, ShieldAlert, AlertTriangle, Search, Key, Eye } from "lucide-react";
import Link from "next/link";

function RiskGauge({ score }: { score: number }) {
  const color = score <= 25 ? "#22c55e" : score <= 50 ? "#f59e0b" : score <= 75 ? "#f97316" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40 * score / 100} ${2 * Math.PI * 40}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-100" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
    </div>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "sensitive" | "canary">("overview");

  const fetchAudit = useCallback(() => {
    auditsApi.get(id).then(r => setAudit(r.data));
  }, [id]);

  useEffect(() => {
    fetchAudit();
    // Poll while running
    const timer = setInterval(() => {
      if (audit?.status === "running" || audit?.status === "pending") fetchAudit();
    }, 3000);
    return () => clearInterval(timer);
  }, [fetchAudit, audit?.status]);

  async function downloadReport() {
    setDownloading(true);
    try {
      await reportsApi.generate(id);
      const r = await reportsApiExtended.download(id);
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_report_${id.slice(0, 8)}.pdf`;
      a.click();
    } catch {
      alert("Report generation failed.");
    } finally {
      setDownloading(false);
    }
  }

  const result = audit?.result;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/projects" className="hover:text-slate-300">Projects</Link>
              <span>/</span>
              <span>Audit</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-300">{id.slice(0, 8)}…</h1>
              {audit && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                  ${audit.status === "completed" ? "bg-green-500/10 text-green-400" :
                    audit.status === "running"   ? "bg-cyan-500/10 text-cyan-400" :
                    audit.status === "failed"    ? "bg-red-500/10 text-red-400" :
                                                   "bg-slate-700 text-slate-400"}`}>
                  {audit.status}
                </span>
              )}
            </div>
          </div>
          {result && (
            <button onClick={downloadReport} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700
                         text-slate-300 text-sm font-medium transition-colors border border-slate-700
                         disabled:opacity-50">
              <Download className="w-4 h-4" />
              {downloading ? "Generating…" : "Download PDF"}
            </button>
          )}
        </div>

        {/* Running progress */}
        {audit?.status === "running" && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-cyan-400 font-medium">Audit in progress…</span>
              <span className="text-sm font-mono text-cyan-400">{audit.progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${audit.progress}%` }} />
            </div>
          </div>
        )}

        {result ? (
          <>
            {/* Risk overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Gauge */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-3">
                <RiskGauge score={result.risk_score} />
                <RiskBadge level={result.risk_level} />
                <p className="text-xs text-slate-500">Overall Risk Score</p>
              </div>

              {/* Score breakdown */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-300 mb-5">Score Breakdown</h2>
                <ScoreMeter label="Exact Match" value={result.exact_match_score}
                  colorClass={result.exact_match_score > 0.5 ? "bg-red-500" : "bg-cyan-500"} />
                <ScoreMeter label="Semantic Similarity" value={result.semantic_similarity_score}
                  colorClass={result.semantic_similarity_score > 0.7 ? "bg-orange-500" : "bg-cyan-500"} />
                <ScoreMeter label="Membership Probability" value={result.membership_probability}
                  colorClass={result.membership_probability > 0.6 ? "bg-orange-500" : "bg-cyan-500"} />
                <ScoreMeter label="Canary Exposure" value={result.canary_exposure_score}
                  asPercent={false} colorClass={result.canary_exposure_score > 30 ? "bg-red-500" : "bg-cyan-500"} />

                {/* Sensitive data flag */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Sensitive Data Detected</span>
                  <span className={`text-xs font-semibold ${result.sensitive_data_detected ? "text-red-400" : "text-green-400"}`}>
                    {result.sensitive_data_detected ? `Yes — ${result.sensitive_findings?.length || 0} findings` : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
              {[
                { key: "overview", label: "Overview", icon: ShieldAlert },
                { key: "matches",  label: "Matches",  icon: Search },
                { key: "sensitive",label: "Sensitive", icon: Eye },
                { key: "canary",   label: "Canary",   icon: Key },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === key
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              {activeTab === "overview" && (
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {[
                    { label: "Exact Matches", value: result.matched_records },
                    { label: "N-gram Overlap", value: `${(result.ngram_overlap_score * 100).toFixed(1)}%` },
                    { label: "Top Similarity Matches", value: result.top_matches?.length ?? 0 },
                    { label: "Canary Hits", value: result.canary_hits?.length ?? 0 },
                    { label: "Sensitive Findings", value: result.sensitive_findings?.length ?? 0 },
                    { label: "Membership Prob.", value: `${(result.membership_probability * 100).toFixed(1)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800/50 rounded-lg p-4">
                      <div className="text-xl font-bold text-slate-100 mb-1">{value}</div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "matches" && (
                <div className="divide-y divide-slate-800">
                  {!result.top_matches?.length ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No high-similarity matches found.</div>
                  ) : result.top_matches.map((match, i) => (
                    <div key={i} className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-400">Match #{i + 1}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {(match.similarity_score * 100).toFixed(1)}% similar
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Reference</p>
                          <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-3 font-mono leading-relaxed">
                            {match.reference}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Generated</p>
                          <p className="text-sm text-slate-300 bg-slate-800 rounded-lg p-3 font-mono leading-relaxed">
                            {match.generated}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "sensitive" && (
                <div className="divide-y divide-slate-800">
                  {!result.sensitive_findings?.length ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No sensitive data detected.</div>
                  ) : result.sensitive_findings.map((f, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-4">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                            {f.type}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{f.masked_value}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{f.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "canary" && (
                <div className="divide-y divide-slate-800">
                  {!result.canary_hits?.length ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No canary strings detected.</div>
                  ) : result.canary_hits.map((hit, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-4">
                      <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-amber-400">{hit.canary}</span>
                          <span className="text-xs text-slate-500">({hit.type})</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">…{hit.context}…</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : audit?.status === "failed" ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-slate-400">Audit failed. Please try running it again.</p>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Waiting for results…
          </div>
        )}
      </div>
    </AppShell>
  );
}
