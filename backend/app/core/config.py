import os
import shutil
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_default_database_url() -> str:
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    # In Vercel serverless / AWS Lambda environment, filesystem is read-only except /tmp
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("LAMBDA_TASK_ROOT"):
        tmp_db = Path("/tmp/veridian.db")
        if not tmp_db.exists():
            candidates = [
                Path.cwd() / "veridian.db",
                Path(__file__).resolve().parent.parent.parent / "veridian.db",
                Path(__file__).resolve().parent.parent.parent.parent / "veridian.db",
            ]
            for c in candidates:
                if c.exists():
                    try:
                        shutil.copyfile(c, tmp_db)
                        break
                    except Exception:
                        pass
        return "sqlite:////tmp/veridian.db"
    return "sqlite:///./veridian.db"


def get_default_data_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "data",
        Path(__file__).resolve().parent.parent.parent.parent / "data",
        Path.cwd() / "data",
    ]
    for c in candidates:
        if c.exists() and (c / "knowledge_base.json").exists():
            return c
    return candidates[0]


class Settings(BaseSettings):
    PROJECT_NAME: str = "veridian-it-support-agent"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database Configuration
    DATABASE_URL: str = get_default_database_url()

    # LLM Configuration (Phase 4)
    LLM_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Data directory path
    DATA_DIR: Path = get_default_data_dir()

    # Comma-separated list or JSON list of CORS origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
