from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Float, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from database.session import Base


class AuditStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class RiskLevel(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class Audit(Base):
    __tablename__ = "audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    reference_dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"))
    generated_dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"))
    status = Column(Enum(AuditStatus), default=AuditStatus.pending)
    task_id = Column(String)             # Celery task ID
    progress = Column(Integer, default=0)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    project = relationship("Project", back_populates="audits")
    result = relationship("AuditResult", back_populates="audit", uselist=False)
    report = relationship("Report", back_populates="audit", uselist=False)


class AuditResult(Base):
    __tablename__ = "audit_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)

    # Exact match
    exact_match_score = Column(Float, default=0.0)
    matched_records = Column(Integer, default=0)
    ngram_overlap_score = Column(Float, default=0.0)

    # Semantic similarity
    semantic_similarity_score = Column(Float, default=0.0)
    top_matches = Column(JSON)           # list of {reference, output, score}

    # Membership inference
    membership_probability = Column(Float, default=0.0)

    # Canary exposure
    canary_exposure_score = Column(Float, default=0.0)
    canary_hits = Column(JSON)           # list of matched canaries

    # Sensitive data
    sensitive_data_detected = Column(Boolean, default=False)
    sensitive_findings = Column(JSON)    # list of {type, value, context}

    # Risk
    risk_score = Column(Float, default=0.0)
    risk_level = Column(Enum(RiskLevel))

    created_at = Column(DateTime, default=datetime.utcnow)

    audit = relationship("Audit", back_populates="result")
