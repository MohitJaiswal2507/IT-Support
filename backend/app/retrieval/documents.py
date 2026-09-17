import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal, init_db
from app.db.models import KnowledgeBaseArticle, Policy, Ticket


@dataclass
class Document:
    """Normalized document representation before chunking and embedding."""
    source_type: str
    source_id: str
    title: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)


def load_documents_from_db(db: Optional[Session] = None) -> List[Document]:
    """
    Loads Knowledge Base articles, Policies, and Tickets from the relational database.
    Does NOT include employee requests (which are reserved for incoming user queries).
    """
    close_db = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_db = True

    documents: List[Document] = []

    try:
        # 1. Knowledge Base Articles (KB-01 to KB-10)
        kb_articles = db.query(KnowledgeBaseArticle).all()
        for article in kb_articles:
            documents.append(
                Document(
                    source_type="knowledge_base",
                    source_id=article.id,
                    title=article.title,
                    text=f"{article.title}\n{article.content}",
                    metadata={
                        "title": article.title,
                        "id": article.id
                    }
                )
            )

        # 2. Corporate Policies (Asset Management Policy POL-01)
        policies = db.query(Policy).all()
        for pol in policies:
            meta = {
                "title": pol.title,
                "id": pol.id,
                "issued_by": pol.issued_by,
                "last_updated": pol.last_updated
            }
            body = f"{pol.title}\n"
            if pol.issued_by:
                body += f"Issued by: {pol.issued_by}\n"
            if pol.last_updated:
                body += f"Last updated: {pol.last_updated}\n"
            body += pol.content

            documents.append(
                Document(
                    source_type="policy",
                    source_id=pol.id,
                    title=pol.title,
                    text=body,
                    metadata=meta
                )
            )

        # 3. Tickets (TK-1042 to TK-1051, both active and closed)
        tickets = db.query(Ticket).all()
        for ticket in tickets:
            documents.append(
                Document(
                    source_type="ticket",
                    source_id=ticket.id,
                    title=ticket.issue_summary,
                    text=f"Ticket {ticket.id}: {ticket.issue_summary}\nRequester: {ticket.employee}\nStatus: {ticket.status}",
                    metadata={
                        "id": ticket.id,
                        "employee": ticket.employee,
                        "status": ticket.status,
                        "is_active": ticket.is_active
                    }
                )
            )

        return documents

    finally:
        if close_db:
            db.close()


def load_documents_from_json(data_dir: Path) -> List[Document]:
    """Fallback loader directly reading JSON seed files if DB is unavailable."""
    documents: List[Document] = []

    # 1. KB
    kb_path = data_dir / "knowledge_base.json"
    if kb_path.exists():
        with open(kb_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                documents.append(
                    Document(
                        source_type="knowledge_base",
                        source_id=item["id"],
                        title=item["title"],
                        text=f"{item['title']}\n{item['content']}",
                        metadata={"title": item["title"], "id": item["id"]}
                    )
                )

    # 2. Policies
    pol_path = data_dir / "policies.json"
    if pol_path.exists():
        with open(pol_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                documents.append(
                    Document(
                        source_type="policy",
                        source_id=item["id"],
                        title=item["title"],
                        text=f"{item['title']}\nIssued by: {item.get('issued_by', '')}\nLast updated: {item.get('last_updated', '')}\n{item['content']}",
                        metadata={
                            "title": item["title"],
                            "id": item["id"],
                            "issued_by": item.get("issued_by"),
                            "last_updated": item.get("last_updated")
                        }
                    )
                )

    # 3. Tickets
    ticket_path = data_dir / "tickets.json"
    if ticket_path.exists():
        with open(ticket_path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                documents.append(
                    Document(
                        source_type="ticket",
                        source_id=item["id"],
                        title=item["issue_summary"],
                        text=f"Ticket {item['id']}: {item['issue_summary']}\nRequester: {item['employee']}\nStatus: {item['status']}",
                        metadata={
                            "id": item["id"],
                            "employee": item["employee"],
                            "status": item["status"],
                            "is_active": item.get("is_active", False)
                        }
                    )
                )

    return documents


def load_all_documents(db: Optional[Session] = None) -> List[Document]:
    """Primary document loader returning all 21 raw documents (10 KB, 1 Policy, 10 Tickets)."""
    docs = load_documents_from_db(db)
    if not docs:
        from app.core.config import settings
        docs = load_documents_from_json(settings.DATA_DIR)
    return docs
