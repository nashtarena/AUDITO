import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database.session import get_db
from models.user import User
from models.project import Project
from models.dataset import Dataset, DatasetType
from api.deps import get_current_user, require_researcher
from config import settings

from uuid import UUID

router = APIRouter(prefix="/datasets", tags=["datasets"])

ALLOWED_EXTENSIONS = {"csv", "json", "txt"}


def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


class DatasetResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    file_type: str
    dataset_type: str
    record_count: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    project_id: UUID = Form(...),
    dataset_type: DatasetType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_researcher),
):
    # Validate project ownership
    project = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file type
    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save file
    save_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(save_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(save_dir, f"{file_id}.{ext}")

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Count records
    record_count = count_records(content, ext)

    dataset = Dataset(
        project_id=project_id,
        name=file.filename,
        file_path=file_path,
        file_type=ext,
        dataset_type=dataset_type,
        record_count=record_count,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


def count_records(content: bytes, ext: str) -> int:
    try:
        text = content.decode("utf-8")
        if ext == "csv":
            lines = [l for l in text.strip().splitlines() if l]
            return max(0, len(lines) - 1)  # subtract header
        elif ext == "json":
            import json
            data = json.loads(text)
            return len(data) if isinstance(data, list) else 1
        elif ext == "txt":
            return len([l for l in text.strip().splitlines() if l])
    except Exception:
        pass
    return 0


@router.get("/project/{project_id}", response_model=List[DatasetResponse])
def list_datasets(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id, Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Dataset).filter(Dataset.project_id == project_id).all()
