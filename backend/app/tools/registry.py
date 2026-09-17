import logging
from typing import Dict, List, Optional
from app.tools.base import ITTool
from app.tools.schemas import ToolMetadata
from app.tools.account import CheckAccountStatusTool
from app.tools.password import RequestPasswordResetTool
from app.tools.vpn import CheckVpnStatusTool
from app.tools.hardware import RequestLaptopReplacementTool
from app.tools.tickets import CheckTicketStatusTool

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Explicit, auditable registry of approved IT tools.
    Strictly forbids arbitrary code execution, unvalidated function calls,
    or direct SQL injection from external sources.
    """

    def __init__(self):
        self._tools: Dict[str, ITTool] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        """Register the 5 approved IT service tools."""
        approved_tools = [
            CheckAccountStatusTool(),
            RequestPasswordResetTool(),
            CheckVpnStatusTool(),
            RequestLaptopReplacementTool(),
            CheckTicketStatusTool(),
        ]
        for tool in approved_tools:
            self._tools[tool.name] = tool
            logger.debug(f"Registered IT Tool: {tool.name} (Risk: {tool.risk_level.value})")

    def get_tool(self, action_name: str) -> Optional[ITTool]:
        """
        Retrieves an explicitly registered tool by name.
        Returns None if tool is not registered.
        """
        if not action_name:
            return None
        return self._tools.get(action_name.strip().upper())

    def is_registered(self, action_name: str) -> bool:
        """Checks if a tool name is registered."""
        if not action_name:
            return False
        return action_name.strip().upper() in self._tools

    def list_tools(self) -> List[ToolMetadata]:
        """Returns metadata for all registered tools."""
        return [
            ToolMetadata(
                name=t.name,
                description=t.description,
                risk_level=t.risk_level,
                requires_approval=t.requires_approval
            )
            for t in self._tools.values()
        ]


# Singleton instance
tool_registry = ToolRegistry()
