from sqlalchemy import Column, String, Text, Boolean
from app.db.database import Base


class KnowledgeBaseArticle(Base):
    """
    Knowledge Base Article model representing articles KB-01 through KB-10.
    """
    __tablename__ = "knowledge_base_articles"

    id = Column(String(32), primary_key=True, index=True, doc="Article identifier (e.g. KB-01)")
    title = Column(String(255), nullable=False, index=True, doc="Article title")
    content = Column(Text, nullable=False, doc="Complete article content")

    def __repr__(self) -> str:
        return f"<KnowledgeBaseArticle(id='{self.id}', title='{self.title}')>"


class Policy(Base):
    """
    Corporate Policy model representing company policies such as the Asset Management Policy.
    """
    __tablename__ = "policies"

    id = Column(String(32), primary_key=True, index=True, doc="Policy identifier (e.g. POL-01)")
    title = Column(String(255), nullable=False, index=True, doc="Policy title")
    issued_by = Column(String(255), nullable=True, doc="Issuing department or entity")
    last_updated = Column(String(64), nullable=True, doc="Policy update date/quarter")
    content = Column(Text, nullable=False, doc="Policy text content")

    def __repr__(self) -> str:
        return f"<Policy(id='{self.id}', title='{self.title}')>"


class EmployeeRequest(Base):
    """
    Employee Request model representing incoming employee requests REQ-01 through REQ-15.
    """
    __tablename__ = "employee_requests"

    id = Column(String(32), primary_key=True, index=True, doc="Request identifier (e.g. REQ-01)")
    employee = Column(String(255), nullable=False, index=True, doc="Employee name")
    email = Column(String(255), nullable=False, index=True, doc="Employee corporate email")
    date_opened = Column(String(64), nullable=False, doc="Date the request was opened (e.g. Mon 21 Sep)")
    request = Column(Text, nullable=False, doc="Original employee request text")
    initial_action_taken = Column(String(255), nullable=False, index=True, doc="Initial triage status/action taken")

    def __repr__(self) -> str:
        return f"<EmployeeRequest(id='{self.id}', employee='{self.employee}')>"


class Ticket(Base):
    """
    Ticket model representing existing active and historical tickets TK-1042 through TK-1051.
    """
    __tablename__ = "tickets"

    id = Column(String(32), primary_key=True, index=True, doc="Ticket identifier (e.g. TK-1042)")
    employee = Column(String(255), nullable=False, index=True, doc="Requester name (e.g. R. Verma)")
    issue_summary = Column(String(255), nullable=False, doc="Issue summary")
    status = Column(String(255), nullable=False, index=True, doc="Ticket status (e.g. Resolved (closed))")
    is_active = Column(Boolean, nullable=False, default=False, index=True, doc="True if ticket is active/open, False if closed")

    def __repr__(self) -> str:
        return f"<Ticket(id='{self.id}', employee='{self.employee}', status='{self.status}')>"
