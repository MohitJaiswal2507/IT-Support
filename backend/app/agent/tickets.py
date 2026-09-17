from typing import List, Optional
from app.agent.state import SourceReference


class HistoricalTicketContext:
    """
    Formats historical tickets as supporting precedent without treating them as active user tickets
    or current official policy.
    """

    @classmethod
    def format_ticket_context(cls, tickets: List[SourceReference], max_tickets: int = 2) -> Optional[str]:
        if not tickets:
            return None

        formatted_lines = []
        for t in tickets[:max_tickets]:
            status = t.metadata.get("status", "Historical")
            # Redact employee name to avoid exposing sensitive info, preserve ticket summary
            summary = t.title or t.text.split("\n")[0]
            formatted_lines.append(f"• Ticket {t.source_id}: {summary} (Outcome: {status})")

        return (
            "Historical Context:\n"
            "A previous support ticket indicates how similar inquiries were handled in the past:\n"
            + "\n".join(formatted_lines)
            + "\n(Note: Prior ticket resolutions serve as historical reference and do not supersede official policy)."
        )
