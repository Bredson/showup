# Research and Compare Skill

Auto-invoked workflow for researching a method/product/technique and comparing it with
evidence-based alternatives, then producing a recommendation.

## Trigger

Use when asked to research a method, technique, product, or approach and evaluate whether
it can be improved with other practices.

## Workflow

1. **Gather primary source** — fetch the official site/docs of the subject.
2. **Search alternatives** — use DuckDuckGo HTML (`https://duckduckgo.com/html/?q=...`);
   Google search is blocked for fetching.
3. **Fetch 2-3 credible sources** — prefer evidence-based ones with citations to studies.
4. **Build a comparison table** — technique | scientific source | does the subject already have it?
5. **Recommend improvements** — filter by value/simplicity ratio. Respect any user constraint
   like "keep it simple / don't over-engineer".
6. **Explicitly list rejected options** — state what was dropped and WHY (avoids scope creep).
7. **Cite all sources** — separate app/product links from peer-reviewed research.

## Principles

- Flag marketing/affiliate content and unverified claims (e.g. "95% success rate").
- Prefer peer-reviewed studies with author + year + journal.
- When the user asks for simplicity, default to the fewest high-impact additions.

## Output

A structured document with: subject method → comparative research → recommended improvements
→ deliberately rejected → sources.
