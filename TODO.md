# Improvements

When an item here is completed, move it to Completed.md in the order of completion.  Move all the completed sections over first.  Do each task in whatever order seems appropriate.

For each TODO task, follow the Task Execution Process in CLAUDE.md (branch, plan, implement, test, commit, merge, push).

Where it makes sense, open up to three parallel agents to accomplish tasks.

---

# Backend (API / Simulation Engine)

## BE-8. Chatbot Integration

Expand. Does this need GCP, what security issues, what use cases make sense for chatbot integration (portfolio analysis)?

## BE-9 Multi-user

Something cloud based, information stored encrypted at rest. Some best practices for security. Security review. OAuth with Apple, Google, Facebook. Probably Google Cloud.  But, need to evaluate and discuss what the value.

---

# Frontend (UI)

## FE-4. What-If / Scenario Comparisons

Rather than complicated historical configuration presets, user-friendly what-if scenarios: "What if taxes were like the 1970s?", "What if SS were means-tested?" Each with an explanation popup. "Note that Monte Carlo varies economic conditions, not policy changes."

These could feed into Compare — run a what-if, it auto-adds to comparison.
