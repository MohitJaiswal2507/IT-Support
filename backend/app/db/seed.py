import json
import sys
from pathlib import Path
from typing import Dict, Any, List

from app.core.config import settings
from app.db.database import SessionLocal, init_db
from app.db.models import KnowledgeBaseArticle, Policy, EmployeeRequest, Ticket


def resolve_data_dir() -> Path:
    """Finds the data directory containing the seed JSON files."""
    candidates = [
        settings.DATA_DIR,
        Path.cwd() / "data",
        Path.cwd().parent / "data",
        Path(__file__).resolve().parent.parent.parent.parent / "data",
    ]
    for c in candidates:
        if c.exists() and (c / "knowledge_base.json").exists():
            return c
    raise FileNotFoundError(f"Could not locate data directory in candidates: {candidates}")


def load_json(filepath: Path) -> List[Dict[str, Any]]:
    """Loads and validates JSON file content."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_database() -> Dict[str, int]:
    """
    Idempotently seeds the database from JSON source files in data/.
    Safe to execute repeatedly without generating duplicate records.
    """
    init_db()
    data_dir = resolve_data_dir()
    db = SessionLocal()

    try:
        # 1. Seed Knowledge Base Articles
        kb_data = load_json(data_dir / "knowledge_base.json")
        for item in kb_data:
            kb_obj = KnowledgeBaseArticle(
                id=item["id"],
                title=item["title"],
                content=item["content"]
            )
            db.merge(kb_obj)

        # 2. Seed Policies
        policy_data = load_json(data_dir / "policies.json")
        for item in policy_data:
            policy_obj = Policy(
                id=item["id"],
                title=item["title"],
                issued_by=item.get("issued_by"),
                last_updated=item.get("last_updated"),
                content=item["content"]
            )
            db.merge(policy_obj)

        # 3. Seed Employee Requests
        req_data = load_json(data_dir / "employee_requests.json")
        for item in req_data:
            req_obj = EmployeeRequest(
                id=item["id"],
                employee=item["employee"],
                email=item["email"],
                date_opened=item["date_opened"],
                request=item["request"],
                initial_action_taken=item["initial_action_taken"]
            )
            db.merge(req_obj)

        # 4. Seed Tickets
        ticket_data = load_json(data_dir / "tickets.json")
        for item in ticket_data:
            ticket_obj = Ticket(
                id=item["id"],
                employee=item["employee"],
                issue_summary=item["issue_summary"],
                status=item["status"],
                is_active=item.get("is_active", False)
            )
            db.merge(ticket_obj)

        db.commit()

        # Count verified records
        counts = {
            "Knowledge Base": db.query(KnowledgeBaseArticle).count(),
            "Policies": db.query(Policy).count(),
            "Requests": db.query(EmployeeRequest).count(),
            "Tickets": db.query(Ticket).count(),
        }
        return counts

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    print("==================================================")
    print("Veridian Service Agent — Database Seeding")
    print("==================================================")
    try:
        counts = seed_database()
        print("\nSeed process completed successfully!")
        print("Dataset counts:")
        for name, count in counts.items():
            print(f"{name}: {count}")
        print("==================================================")
    except Exception as err:
        print(f"Error during database seed: {err}", file=sys.stderr)
        sys.exit(1)
