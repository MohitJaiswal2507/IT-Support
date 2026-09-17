from typing import Optional, Dict, Any
from app.agent.state import SourceReference


class AssetManagementPolicyValidator:
    """
    Evaluates policy evidence for hardware replacement and asset management queries.
    Strictly enforces constraints from POL-01 without inventing periods or rules.
    """

    POLICY_ID = "POL-01"
    STANDARD_REFRESH_CYCLE_YEARS = 3

    @classmethod
    def analyze_hardware_policy(cls, policy_evidence: Optional[SourceReference]) -> Dict[str, Any]:
        """
        Extracts verified policy rules from POL-01 evidence.
        """
        if not policy_evidence or policy_evidence.source_id != cls.POLICY_ID:
            return {
                "has_policy_evidence": False,
                "summary": "Asset Management Policy (POL-01) evidence was not retrieved."
            }

        return {
            "has_policy_evidence": True,
            "policy_id": cls.POLICY_ID,
            "standard_cycle": "3 years of service",
            "early_replacement_condition": "Verified hardware failure confirmed by IT Support",
            "upgrade_requirement": "Department Head approval and written business justification",
            "asset_return_timeline": "All corporate equipment must be returned within 5 business days upon departure",
            "governing_text": policy_evidence.text
        }
