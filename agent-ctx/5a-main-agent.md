---
Task ID: 5a
Agent: Main Agent
Task: Add visual statistics/overview panel to the main page

Work Log:
- Read worklog.md, page.tsx, and types.ts to understand project structure and data models
- Created `/src/components/statistics-panel.tsx` — a 'use client' component with:
  - **Overview Cards** (4 cards in responsive 2-col/4-col grid):
    - Total sheep across all feed sections
    - Pregnancy rate (%) — confirmed out of total monitored
    - Births this month (current month filter)
    - Active diseases count
  - **Pregnancy Distribution Bar**: Stacked horizontal bar showing confirmed (emerald), pending (amber), and unmonitored (gray) with percentage labels
  - **Birth Gender Distribution**: CSS conic-gradient pie chart + individual progress bars for male/female ratio
  - **Feed Sections Summary**: Each section with color-coded proportional bar, name, count, and percentage
- All stats computed with `useMemo` for performance
- Arabic labels throughout, emerald/green theme consistent with app
- Integrated into page.tsx between dashboard cards and tabs section with heading "نظرة عامة"
- ESLint passes with 0 errors
- Dev server compiles successfully, GET / returns 200

Files Modified:
- `/src/components/statistics-panel.tsx` — NEW (created)
- `/src/app/page.tsx` — Added import and `<StatisticsPanel>` component
