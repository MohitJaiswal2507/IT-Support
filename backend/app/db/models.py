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


class ActionRequest(Base):
    """
    Action Request model representing controlled IT service actions.
    Traceable audit record for both automated and approval-required operations.
    """
    __tablename__ = "action_requests"

    id = Column(String(32), primary_key=True, index=True, doc="Primary key (same as action_id, e.g. ACT-0001)")
    action_id = Column(String(32), unique=True, index=True, nullable=False, doc="Human-readable action ID")
    action_name = Column(String(64), index=True, nullable=False, doc="Registered action/tool name")
    requested_at = Column(String(64), nullable=False, doc="ISO8601 UTC timestamp of request")
    status = Column(String(32), index=True, nullable=False, default="PENDING_APPROVAL", doc="Status: PENDING_APPROVAL, APPROVED, EXECUTED, REJECTED, FAILED")
    requester = Column(String(128), index=True, nullable=False, default="demo-user", doc="Simulated requester identity")
    parameters_json = Column(Text, nullable=True, doc="Sanitized JSON parameters passed to the tool")
    result_json = Column(Text, nullable=True, doc="JSON output from tool execution")
    approval_required = Column(Boolean, nullable=False, default=False, doc="Whether this action required human authorization")
    approved_at = Column(String(64), nullable=True, doc="ISO8601 timestamp when approved")
    completed_at = Column(String(64), nullable=True, doc="ISO8601 timestamp when execution completed")

    def __repr__(self) -> str:
        return f"<ActionRequest(id='{self.action_id}', action='{self.action_name}', status='{self.status}')>"


class Approval(Base):
    """
    Approval model recording demo authorization/rejection decisions for auditability.
    """
    __tablename__ = "action_approvals"

    id = Column(String(32), primary_key=True, index=True, doc="Unique approval record ID")
    action_request_id = Column(String(32), index=True, nullable=False, doc="Associated ActionRequest ID")
    status = Column(String(32), index=True, nullable=False, default="PENDING", doc="Status: PENDING, APPROVED, REJECTED")
    requested_at = Column(String(64), nullable=False, doc="ISO8601 UTC timestamp when approval was requested")
    approved_at = Column(String(64), nullable=True, doc="ISO8601 UTC timestamp when decision was rendered")
    approver = Column(String(128), nullable=True, default="demo-admin", doc="Demo approver username")
    reason = Column(Text, nullable=True, doc="Decision rationale or notes")

    def __repr__(self) -> str:
        return f"<Approval(id='{self.id}', action_request_id='{self.action_request_id}', status='{self.status}')>"
