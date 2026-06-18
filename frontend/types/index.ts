export type UserRole = 'admin' | 'researcher' | 'viewer'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
}

export interface Project {
  id: string
  name: string
  model_name: string
  description?: string
  owner_id: string
  created_at: string
}

export type DatasetType = 'reference' | 'generated'

export interface Dataset {
  id: string
  project_id: string
  name: string
  file_type: string
  dataset_type: DatasetType
  record_count: number
  created_at: string
}

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface AuditResult {
  exact_match_score: number
  matched_records: number
  ngram_overlap_score: number
  semantic_similarity_score: number
  top_matches: TopMatch[] | null
  membership_probability: number
  canary_exposure_score: number
  canary_hits: CanaryHit[] | null
  sensitive_data_detected: boolean
  sensitive_findings: SensitiveFinding[] | null
  risk_score: number
  risk_level: RiskLevel
}

export interface TopMatch {
  generated: string
  reference: string
  similarity_score: number
}

export interface CanaryHit {
  canary: string
  type: string
  context: string
}

export interface SensitiveFinding {
  type: string
  masked_value: string
  context: string
}

export interface Audit {
  id: string
  project_id: string
  status: AuditStatus
  progress: number
  created_at: string
  completed_at?: string
  result?: AuditResult
}

export interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface DashboardData {
  total_projects: number
  total_audits: number
  completed_audits: number
  average_risk_score: number
  risk_distribution: Record<string, number>
  recent_audits: RecentAudit[]
}

export interface RecentAudit {
  audit_id: string
  project_name: string
  model_name: string
  status: AuditStatus
  created_at: string
  risk_score?: number
  risk_level?: RiskLevel
}
