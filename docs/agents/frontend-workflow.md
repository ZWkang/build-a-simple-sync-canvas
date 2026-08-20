# Frontend Workflow

This file is the source of truth for routing the installed React and interface-design skills. A skill being installed is not evidence that its checks ran: apply every route whose condition matches, then report the result in the handoff.

## Skill routing

| Trigger or scope | Skill | Workflow responsibility |
| --- | --- | --- |
| Write, review, or refactor React or Next.js code | `vercel-react-best-practices` | Apply the relevant performance, rendering, data-fetching, rerender, and bundle rules during implementation and review. |
| Design a reusable React component API, reduce boolean-prop combinations, or introduce compound components, render props, or context providers | `vercel-composition-patterns` | Review the component boundary and public API before implementation, then re-check the resulting composition. |
| Work in a configured shadcn project, initialize shadcn, or add, update, style, or compose registry components | `shadcn` | Inspect project context and current component docs, search for an existing primitive before creating a custom one, preview updates, and inspect generated files. Do not force shadcn into an unconfigured project. |
| Add or replace a complete UI transition | `transitions-dev` | Select and implement the transition recipe, including its required reduced-motion behavior. Do not add motion unless the task calls for it. |
| Audit or tune existing durations, distances, scales, blur, easing, stagger, or delays | `transitions-polish` | Review existing motion first, then apply only the accepted token and timing refinements. |
| Change user-facing layout, interaction, styling, forms, navigation, or accessibility behavior | `web-design-guidelines` | Run the UI review against the skill's current guidelines after implementation and resolve applicable findings. |
| Change a runnable user-facing flow | `agent-browser` | Exercise the affected flow in a real browser after static checks. Record the tested path and observed result; if the app cannot run, surface the exact failure instead of silently skipping verification. |

## Execution order

1. **Route before implementation.** Identify the matching rows above. For component-API work, use `vercel-composition-patterns` before settling the interface. For shadcn work, inspect the project and registry before writing custom UI.
2. **Implement with the applicable rules.** React work uses `vercel-react-best-practices`. Motion work uses `transitions-dev` for a new recipe and `transitions-polish` for review or refinement; the two responsibilities are not interchangeable.
3. **Run review gates.** Every user-facing UI change runs `web-design-guidelines`. Every React change is re-checked with `vercel-react-best-practices`. Component-API and motion changes also re-run their conditional checks.
4. **Verify behavior.** Run the repository's configured static checks, then use `agent-browser` for affected runnable UI flows.
5. **Report evidence.** The final handoff lists each applicable skill, its result, and the verification performed. A conditional route may be marked `N/A` only with a concrete reason tied to the trigger column above.

## Minimum handoff record

```text
Frontend workflow:
- vercel-react-best-practices: PASS | N/A — <result or reason>
- vercel-composition-patterns: PASS | N/A — <result or reason>
- shadcn: PASS | N/A — <result or reason>
- transitions-dev: PASS | N/A — <result or reason>
- transitions-polish: PASS | N/A — <result or reason>
- web-design-guidelines: PASS | N/A — <result or reason>
- agent-browser: PASS | BLOCKED | N/A — <tested flow, exact blocker, or reason>
- repository checks: PASS | FAIL — <commands and result>
```
