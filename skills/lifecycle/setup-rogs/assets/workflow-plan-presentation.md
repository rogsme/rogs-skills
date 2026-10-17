## Plan presentation

When plan presentation is on, start-ticket calls `present-plan` after optional plan review to display the complete settled report in a local browser. Plan review and presentation are independent features. A missing `Plan presentation` feature row means off.

- Presenter: `present-plan`, using its checked Lavish runtime. No upstream skill or global hook is required.
- Runtime: {{FILL: absolute private runtime directory outside every checkout, containing the pinned packages present-plan checks}}.
- Artifact root: {{FILL: absolute external directory allowed by the planning agent; in OpenCode Plan mode this may be under ~/.opencode/plan/}}.
- Server state: {{FILL: absolute private external state directory, usually <runtime>/lavish-state}}.
- Port: {{FILL: stable unprivileged local port, such as 4388 when free}}.
- Failure policy: return the complete canonical report in the terminal with `Not presented: <reason>`. Keep every review finding or `Not reviewed:` warning.
- Approval: explicit approval in the agent conversation, tied to the current canonical plan. Browser feedback, closing a session and delivery receipts never approve or start implementation.
- Privacy: local assets, telemetry off, loopback-only server, no hosted sharing. Preserve other sessions and private artifacts.
