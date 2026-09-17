from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.tools.schemas import ToolRiskLevel, ActionResult


class ITTool(ABC):
    """
    Abstract base class for all explicitly registered IT support tools.
    Encapsulates tool identity, risk classification, parameter validation,
    and safe execution against the local demo database.
    """
    name: str
    description: str
    risk_level: ToolRiskLevel
    requires_approval: bool

    @abstractmethod
    def execute(
        self,
        params: Dict[str, Any],
        db: Session,
        action_request_id: Optional[str] = None
    ) -> ActionResult:
        """
        Execute the tool logic using sanitized parameters and database session.
        """
        pass
