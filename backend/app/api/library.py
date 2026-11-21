"""Unified Media Library FastAPI router.

Implements the complete Film & Video Studio Ultimate Unified Media Library API:
- POST   /api/library/assets/import
- POST   /api/library/assets/upload
- GET    /api/library/assets
- GET    /api/library/assets/{asset_id}
- GET    /api/library/assets/{asset_id}/download
- GET    /api/library/assets/{asset_id}/preview
- PUT    /api/library/assets/{asset_id}
- DELETE /api/library/assets/{asset_id}
- GET    /api/library/categories
- GET    /api/library/search
- POST   /api/library/assets/{asset_id}/projects
- DELETE /api/library/assets/{asset_id}/projects/{project_id}
- GET    /api/library/licenses

Uses a thread-safe persistent JSON store by default so the router runs out of
the box; replace `_LibraryRepository` with SQLAlchemy/PostgreSQL models
(`media_assets` and `asset_project_links`) when connecting a relational DB.
"""

from __future__ import annotations

import ipaddress
import json
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/library", tags=["Unified Media Library"])

# ---------------------------------------------------------------------------
# Configuration & Format Validation
# ---------------------------------------------------------------------------

MediaCategory = Literal[
    "animation",
    "vfx",
    "3d_assets",
    "images",
    "audio",
    "video",
    "textures",
    "fonts",
    "projects",
]

CommercialUseStatus = Literal["yes", "no", "check", "unknown"]
AssetLifecycleStatus = Literal["imported", "verified", "deleted"]

SUPPORTED_CATEGORY_FORMATS: dict[str, list[str]] = {
    "animation": ["json", "lottie", "gif", "mp4"],
    "vfx": ["mp4", "mov", "webm", "png"],
    "3d_assets": ["glb", "gltf", "fbx", "obj"],
    "images": ["png", "jpg", "jpeg", "webp"],
    "audio": ["mp3", "wav", "ogg", "m4a"],
    "video": ["mp4", "mov", "webm"],
    "textures": ["png", "jpg", "exr", "hdr"],
    "fonts": ["ttf", "otf", "woff2"],
    "projects": ["json", "zip", "fvs"],
}

MAX_UPLOAD_BYTES = int(os.getenv("LIBRARY_MAX_UPLOAD_BYTES", str(100 * 1024 * 1024)))
DATA_DIR = Path(os.getenv("LIBRARY_DATA_DIR", ".data"))
STORAGE_DIR = DATA_DIR / "library-uploads"
DB_FILE = DATA_DIR / "unified-media-db.json"


# ---------------------------------------------------------------------------
# Security & Validation Helpers
# ---------------------------------------------------------------------------

def _normalize_category(raw: str) -> MediaCategory:
    cleaned = re.sub(r"\s+", "_", (raw or "").strip().lower())
    if cleaned in SUPPORTED_CATEGORY_FORMATS:
        return cleaned  # type: ignore[return-value]
    if "3d" in cleaned:
        return "3d_assets"
    if "vfx" in cleaned or "effect" in cleaned:
        return "vfx"
    if "anim" in cleaned or "lottie" in cleaned:
        return "animation"
    if any(k in cleaned for k in ("music", "sfx", "sound", "audio")):
        return "audio"
    if "video" in cleaned:
        return "video"
    if "texture" in cleaned or "pbr" in cleaned:
        return "textures"
    if "font" in cleaned:
        return "fonts"
    if "project" in cleaned:
        return "projects"
    return "images"


def _validate_format(category: MediaCategory, file_type: str) -> str:
    ext = re.sub(r"^\.", "", (file_type or "").strip().lower()).split("/")[0]
    allowed = SUPPORTED_CATEGORY_FORMATS[category]
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file format '{ext}' for category '{category}'. "
                f"Allowed formats: {', '.join(allowed)}."
            ),
        )
    return ext


def _validate_safe_external_url(raw_url: str | None) -> str:
    if not raw_url:
        return ""
    value = raw_url.strip()
    if value.startswith("/"):
        return value

    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only valid http and https URLs are permitted.",
        )

    host = parsed.hostname.lower()
    if host in ("localhost", "0.0.0.0", "::1") or host.endswith((".local", ".internal")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Internal or private network addresses are blocked.",
        )

    try:
        ip_obj = ipaddress.ip_address(host)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_reserved
            or ip_obj.is_multicast
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Internal or private IP addresses are blocked.",
            )
    except ValueError:
        # Hostname is a DNS name rather than a literal IP address.
        pass

    return value


def _sanitize_filename(filename: str) -> str:
    base = Path(filename or "asset").name
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return safe[:120] or "asset"


def get_current_owner_id(x_user_id: str | None = Header(default=None)) -> str:
    """Resolve the current authenticated owner ID.

    Replace with your JWT/session authentication dependency in production.
    """
    return (x_user_id or "studio-owner").strip() or "studio-owner"


# ---------------------------------------------------------------------------
# Pydantic Models (media_assets & asset_project_links)
# ---------------------------------------------------------------------------

class MediaAssetRecord(BaseModel):
    id: str
    owner_id: str
    project_id: str
    name: str
    category: MediaCategory
    file_type: str
    storage_path: str = ""
    source: str = "Unified Media Library"
    source_url: str = ""
    preview_url: str = ""
    license_name: str = "pending_verification"
    commercial_use: CommercialUseStatus = "unknown"
    attribution: str = ""
    file_size: int = 0
    status: AssetLifecycleStatus = "imported"
    created_at: str
    deleted_at: str | None = None
    linked_projects: list[str] = Field(default_factory=list)


class AssetImportRequest(BaseModel):
    id: str | None = None
    project_id: str = "default-project"
    name: str = Field(..., min_length=1, max_length=200)
    category: str
    file_type: str
    storage_path: str = ""
    source: str = "External Source"
    source_url: str = ""
    preview_url: str = ""
    license_name: str = "pending_verification"
    commercial_use: CommercialUseStatus = "unknown"
    attribution: str = ""
    file_size: int = Field(default=0, ge=0)


class AssetUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    license_name: str | None = None
    commercial_use: CommercialUseStatus | None = None
    attribution: str | None = None
    status: AssetLifecycleStatus | None = None


class ProjectLinkRequest(BaseModel):
    project_id: str = Field(..., min_length=1, max_length=120)


# ---------------------------------------------------------------------------
# Persistent Store (Drop-in replacement point for PostgreSQL / SQLAlchemy)
# ---------------------------------------------------------------------------

class _LibraryRepository:
    def __init__(self, db_path: Path, storage_dir: Path) -> None:
        self._db_path = db_path
        self._storage_dir = storage_dir
        self._lock = threading.Lock()

    def _ensure_dirs(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._storage_dir.mkdir(parents=True, exist_ok=True)

    def _read(self) -> dict[str, list[dict[str, Any]]]:
        self._ensure_dirs()
        if not self._db_path.exists():
            initial: dict[str, list[dict[str, Any]]] = {
                "media_assets": [],
                "asset_project_links": [],
            }
            self._db_path.write_text(json.dumps(initial, indent=2), encoding="utf-8")
            return initial
        try:
            data = json.loads(self._db_path.read_text(encoding="utf-8"))
            return {
                "media_assets": data.get("media_assets", []) if isinstance(data, dict) else [],
                "asset_project_links": data.get("asset_project_links", []) if isinstance(data, dict) else [],
            }
        except (OSError, json.JSONDecodeError):
            return {"media_assets": [], "asset_project_links": []}

    def _write(self, data: dict[str, list[dict[str, Any]]]) -> None:
        self._ensure_dirs()
        self._db_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    @staticmethod
    def _linked_projects(links: list[dict[str, Any]], asset_id: str) -> list[str]:
        return [str(l["project_id"]) for l in links if l.get("asset_id") == asset_id]

    def _hydrate(self, raw: dict[str, Any], links: list[dict[str, Any]]) -> MediaAssetRecord:
        return MediaAssetRecord(
            **{
                **raw,
                "linked_projects": self._linked_projects(links, str(raw["id"])),
            }
        )

    def import_or_link(self, owner_id: str, payload: AssetImportRequest) -> MediaAssetRecord:
        category = _normalize_category(payload.category)
        file_type = _validate_format(category, payload.file_type)
        source_url = _validate_safe_external_url(payload.source_url)
        preview_url = _validate_safe_external_url(payload.preview_url)
        storage_path = _validate_safe_external_url(payload.storage_path) if payload.storage_path else source_url
        now = datetime.now(timezone.utc).isoformat()

        with self._lock:
            db = self._read()
            assets = db["media_assets"]
            links = db["asset_project_links"]

            # Deduplicate per owner: if already imported, link to project without duplicating files.
            for existing in assets:
                if existing.get("owner_id") != owner_id or existing.get("status") == "deleted":
                    continue
                same_id = payload.id and existing.get("id") == payload.id
                same_source = (
                    source_url
                    and existing.get("source_url") == source_url
                    and str(existing.get("name", "")).lower() == payload.name.strip().lower()
                )
                if same_id or same_source:
                    if not any(
                        l.get("asset_id") == existing["id"] and l.get("project_id") == payload.project_id
                        for l in links
                    ):
                        links.append(
                            {
                                "asset_id": existing["id"],
                                "project_id": payload.project_id,
                                "linked_at": now,
                            }
                        )
                        self._write(db)
                    return self._hydrate(existing, links)

            prefix = re.sub(r"[^A-Z0-9]", "", category[:4].upper()) or "ASST"
            asset_id = (payload.id or "").strip() or f"{prefix}_{len(assets) + 1:05d}"

            lifecycle: AssetLifecycleStatus = (
                "verified"
                if payload.commercial_use == "yes"
                and payload.license_name
                and payload.license_name != "pending_verification"
                else "imported"
            )

            record = {
                "id": asset_id,
                "owner_id": owner_id,
                "project_id": payload.project_id,
                "name": payload.name.strip(),
                "category": category,
                "file_type": file_type,
                "storage_path": storage_path,
                "source": payload.source.strip() or "External Source",
                "source_url": source_url,
                "preview_url": preview_url or storage_path,
                "license_name": payload.license_name.strip() or "pending_verification",
                "commercial_use": payload.commercial_use,
                "attribution": payload.attribution.strip(),
                "file_size": payload.file_size,
                "status": lifecycle,
                "created_at": now,
                "deleted_at": None,
            }

            assets.insert(0, record)
            links.append(
                {
                    "asset_id": asset_id,
                    "project_id": payload.project_id,
                    "linked_at": now,
                }
            )
            self._write(db)
            return self._hydrate(record, links)

    def save_uploaded_file(
        self,
        owner_id: str,
        project_id: str,
        name: str,
        category_raw: str,
        file_bytes: bytes,
        original_filename: str,
        license_name: str,
        commercial_use: CommercialUseStatus,
        attribution: str,
    ) -> MediaAssetRecord:
        if len(file_bytes) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
            )

        category = _normalize_category(category_raw)
        safe_name = _sanitize_filename(original_filename)
        ext = Path(safe_name).suffix.lstrip(".").lower()
        file_type = _validate_format(category, ext)

        self._ensure_dirs()
        stored_filename = f"{uuid4().hex}_{safe_name}"
        disk_path = self._storage_dir / stored_filename
        disk_path.write_bytes(file_bytes)

        public_path = f"/api/library/assets/{stored_filename}"
        payload = AssetImportRequest(
            project_id=project_id,
            name=name.strip() or Path(safe_name).stem,
            category=category,
            file_type=file_type,
            storage_path=str(disk_path),
            source="User Upload",
            source_url="",
            preview_url=public_path,
            license_name=license_name or "Studio Master Proprietary",
            commercial_use=commercial_use,
            attribution=attribution or "User Upload",
            file_size=len(file_bytes),
        )
        return self.import_or_link(owner_id, payload)

    def list_assets(
        self,
        owner_id: str,
        category: str | None = None,
        q: str | None = None,
        project_id: str | None = None,
        license_name: str | None = None,
        commercial_use: str | None = None,
        include_deleted: bool = False,
    ) -> list[MediaAssetRecord]:
        with self._lock:
            db = self._read()
            assets = db["media_assets"]
            links = db["asset_project_links"]

        q_norm = (q or "").strip().lower()
        cat_norm = _normalize_category(category) if category and category.lower() != "all" else None
        lic_norm = (license_name or "").strip().lower()
        comm_norm = (commercial_use or "").strip().lower()

        results: list[MediaAssetRecord] = []
        for raw in assets:
            if raw.get("owner_id") != owner_id:
                continue
            if not include_deleted and raw.get("status") == "deleted":
                continue
            if cat_norm and raw.get("category") != cat_norm:
                continue
            linked = self._linked_projects(links, str(raw["id"]))
            if project_id and project_id != "all":
                if raw.get("project_id") != project_id and project_id not in linked:
                    continue
            if lic_norm and lic_norm not in str(raw.get("license_name", "")).lower():
                continue
            if comm_norm and str(raw.get("commercial_use", "")).lower() != comm_norm:
                continue
            if q_norm:
                haystack = " ".join(
                    [
                        str(raw.get("id", "")),
                        str(raw.get("name", "")),
                        str(raw.get("source", "")),
                        str(raw.get("license_name", "")),
                        str(raw.get("file_type", "")),
                    ]
                ).lower()
                if q_norm not in haystack:
                    continue
            results.append(self._hydrate(raw, links))
        return results

    def get_asset(self, owner_id: str, asset_id: str) -> MediaAssetRecord:
        with self._lock:
            db = self._read()
            for raw in db["media_assets"]:
                if raw.get("id") == asset_id:
                    if raw.get("owner_id") != owner_id:
                        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
                    return self._hydrate(raw, db["asset_project_links"])
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    def update_asset(self, owner_id: str, asset_id: str, patch: AssetUpdateRequest) -> MediaAssetRecord:
        with self._lock:
            db = self._read()
            for idx, raw in enumerate(db["media_assets"]):
                if raw.get("id") != asset_id:
                    continue
                if raw.get("owner_id") != owner_id:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
                if patch.name is not None:
                    raw["name"] = patch.name.strip()
                if patch.license_name is not None:
                    raw["license_name"] = patch.license_name.strip()
                if patch.commercial_use is not None:
                    raw["commercial_use"] = patch.commercial_use
                if patch.attribution is not None:
                    raw["attribution"] = patch.attribution.strip()
                if patch.status is not None:
                    raw["status"] = patch.status
                    raw["deleted_at"] = (
                        datetime.now(timezone.utc).isoformat() if patch.status == "deleted" else None
                    )
                db["media_assets"][idx] = raw
                self._write(db)
                return self._hydrate(raw, db["asset_project_links"])
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    def delete_asset(self, owner_id: str, asset_id: str, hard: bool = False) -> bool:
        with self._lock:
            db = self._read()
            for idx, raw in enumerate(db["media_assets"]):
                if raw.get("id") != asset_id:
                    continue
                if raw.get("owner_id") != owner_id:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
                if hard:
                    db["media_assets"].pop(idx)
                    db["asset_project_links"] = [
                        l for l in db["asset_project_links"] if l.get("asset_id") != asset_id
                    ]
                else:
                    raw["status"] = "deleted"
                    raw["deleted_at"] = datetime.now(timezone.utc).isoformat()
                    db["media_assets"][idx] = raw
                self._write(db)
                return True
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    def link_project(self, owner_id: str, asset_id: str, project_id: str) -> list[str]:
        with self._lock:
            db = self._read()
            found = next((a for a in db["media_assets"] if a.get("id") == asset_id), None)
            if not found:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
            if found.get("owner_id") != owner_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
            if not any(
                l.get("asset_id") == asset_id and l.get("project_id") == project_id
                for l in db["asset_project_links"]
            ):
                db["asset_project_links"].append(
                    {
                        "asset_id": asset_id,
                        "project_id": project_id,
                        "linked_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                self._write(db)
            return self._linked_projects(db["asset_project_links"], asset_id)

    def unlink_project(self, owner_id: str, asset_id: str, project_id: str) -> list[str]:
        with self._lock:
            db = self._read()
            found = next((a for a in db["media_assets"] if a.get("id") == asset_id), None)
            if not found:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
            if found.get("owner_id") != owner_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
            db["asset_project_links"] = [
                l
                for l in db["asset_project_links"]
                if not (l.get("asset_id") == asset_id and l.get("project_id") == project_id)
            ]
            self._write(db)
            return self._linked_projects(db["asset_project_links"], asset_id)


repo = _LibraryRepository(DB_FILE, STORAGE_DIR)


# ---------------------------------------------------------------------------
# FastAPI Routes
# ---------------------------------------------------------------------------

@router.post("/assets/import")
async def import_asset(
    payload: AssetImportRequest,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Import an external or free-library asset once and link it to a project."""
    asset = repo.import_or_link(owner_id, payload)
    return {
        "success": True,
        "asset": asset.model_dump(),
        "linked_projects": asset.linked_projects,
    }


@router.post("/assets/upload")
async def upload_asset(
    file: UploadFile = File(...),
    name: str = Form(default=""),
    category: str = Form(default="images"),
    project_id: str = Form(default="default-project"),
    license_name: str = Form(default="Studio Master Proprietary"),
    commercial_use: CommercialUseStatus = Form(default="yes"),
    attribution: str = Form(default="User Upload"),
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Upload a local media file with format and size validation."""
    content = await file.read()
    asset = repo.save_uploaded_file(
        owner_id=owner_id,
        project_id=project_id,
        name=name or (file.filename or "Uploaded Asset"),
        category_raw=category,
        file_bytes=content,
        original_filename=file.filename or "asset.bin",
        license_name=license_name,
        commercial_use=commercial_use,
        attribution=attribution,
    )
    return {
        "success": True,
        "asset": asset.model_dump(),
        "linked_projects": asset.linked_projects,
    }


@router.get("/assets")
async def list_assets(
    category: str = Query(default="all"),
    q: str = Query(default=""),
    project_id: str = Query(default="all"),
    include_deleted: bool = Query(default=False),
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """List media assets scoped to the current user with optional filters."""
    items = repo.list_assets(
        owner_id=owner_id,
        category=category,
        q=q,
        project_id=project_id,
        include_deleted=include_deleted,
    )
    return {
        "success": True,
        "count": len(items),
        "assets": [item.model_dump() for item in items],
    }


@router.get("/categories")
async def list_categories(
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """List all supported media categories, allowed formats, and asset counts."""
    items = repo.list_assets(owner_id=owner_id)
    categories = [
        {
            "id": cat_id,
            "supported_formats": formats,
            "count": sum(1 for item in items if item.category == cat_id),
        }
        for cat_id, formats in SUPPORTED_CATEGORY_FORMATS.items()
    ]
    return {"success": True, "categories": categories}


@router.get("/search")
async def search_assets(
    q: str = Query(default=""),
    category: str = Query(default="all"),
    project_id: str = Query(default="all"),
    license_name: str = Query(default="", alias="license"),
    commercial_use: str = Query(default=""),
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Search media assets by keyword, category, license, commercial use, or project."""
    items = repo.list_assets(
        owner_id=owner_id,
        category=category,
        q=q,
        project_id=project_id,
        license_name=license_name,
        commercial_use=commercial_use,
    )
    return {
        "success": True,
        "count": len(items),
        "assets": [item.model_dump() for item in items],
    }


@router.get("/licenses")
async def list_licenses(
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Return license verification summary across all active user assets."""
    items = repo.list_assets(owner_id=owner_id)
    by_license: dict[str, int] = {}
    commercial_yes = 0
    pending_verification = 0

    for item in items:
        by_license[item.license_name] = by_license.get(item.license_name, 0) + 1
        if item.commercial_use == "yes":
            commercial_yes += 1
        if item.license_name == "pending_verification" or item.commercial_use == "unknown":
            pending_verification += 1

    return {
        "success": True,
        "total_assets": len(items),
        "commercial_yes": commercial_yes,
        "pending_verification": pending_verification,
        "by_license": by_license,
    }


@router.get("/assets/{asset_id}")
async def get_asset(
    asset_id: str,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Retrieve a single asset record and its linked project IDs."""
    asset = repo.get_asset(owner_id, asset_id)
    return {"success": True, "asset": asset.model_dump()}


@router.get("/assets/{asset_id}/download")
async def download_asset(
    asset_id: str,
    owner_id: str = Depends(get_current_owner_id),
):
    """Stream local stored files or return verified download metadata for remote assets."""
    asset = repo.get_asset(owner_id, asset_id)
    local_path = Path(asset.storage_path)
    if asset.storage_path and local_path.is_file():
        return FileResponse(
            path=local_path,
            filename=f"{_sanitize_filename(asset.name)}.{asset.file_type}",
        )
    target = asset.storage_path or asset.source_url
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No download path available.")
    return {
        "success": True,
        "asset_id": asset.id,
        "download_url": target,
        "license_name": asset.license_name,
        "commercial_use": asset.commercial_use,
    }


@router.get("/assets/{asset_id}/preview")
async def preview_asset(
    asset_id: str,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Return preview metadata for rendering in studio preview panels."""
    asset = repo.get_asset(owner_id, asset_id)
    return {
        "success": True,
        "asset_id": asset.id,
        "preview_url": asset.preview_url or asset.storage_path,
        "file_type": asset.file_type,
        "category": asset.category,
    }


@router.put("/assets/{asset_id}")
async def update_asset(
    asset_id: str,
    payload: AssetUpdateRequest,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Update asset metadata, verify license, or restore a soft-deleted asset."""
    updated = repo.update_asset(owner_id, asset_id, payload)
    return {"success": True, "asset": updated.model_dump()}


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    hard: bool = Query(default=False),
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Soft-delete an asset by default (or permanently remove when hard=true)."""
    deleted = repo.delete_asset(owner_id, asset_id, hard=hard)
    return {"success": True, "deleted": deleted, "hard": hard}


@router.post("/assets/{asset_id}/projects")
async def link_asset_to_project(
    asset_id: str,
    payload: ProjectLinkRequest,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Link an existing asset to an additional project without duplicating storage."""
    linked = repo.link_project(owner_id, asset_id, payload.project_id)
    return {"success": True, "asset_id": asset_id, "linked_projects": linked}


@router.delete("/assets/{asset_id}/projects/{project_id}")
async def unlink_asset_from_project(
    asset_id: str,
    project_id: str,
    owner_id: str = Depends(get_current_owner_id),
) -> dict[str, Any]:
    """Remove a project reference from an asset without deleting the underlying file."""
    linked = repo.unlink_project(owner_id, asset_id, project_id)
    return {"success": True, "asset_id": asset_id, "linked_projects": linked}
