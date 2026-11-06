# Component Design — Expert Network

**Page covered:** P18 Expert Network

## Composition
`ExpertNetworkHeader → ExpertSearchFilters → ExpertResults → ExpertProfileDrawer → MatchRationale → EngagementWorkspace → ReviewHistory`

## Components
- **ExpertSearchFilters:** specialization, industry, geography, language, engagement type, and availability only when verified.
- **ExpertResults:** expert identity, verified skills, specialization, market experience, profile completeness, and evidence-backed match rationale.
- **ExpertProfileDrawer:** biography, verified credentials, skills, case evidence, scope, and review history.
- **MatchRationale:** maps a specific finding/initiative to expert skills and shows missing/uncertain match factors.
- **EngagementWorkspace:** consultation request, scope, proposed deliverable, status, owner, approval, and communication history where existing capability exists.
- **ReviewHistory:** distinguishes expert review, human approval, execution, and independent outcome verification.

## Behavior and safeguards
- Do not fabricate experts, ratings, endorsements, credentials, pricing, or availability.
- Show a clear empty state if no verified expert records exist.
- A match recommendation is not a booking or assignment.
- Any engagement or external communication requires the appropriate user authorization and supported existing capability.
- Keep sensitive contact details hidden unless existing permissions allow them.

## Accessibility
- Filters are keyboard operable and labelled.
- Profile drawer manages focus and returns focus to its trigger.
- Status is expressed in text, not color alone.
