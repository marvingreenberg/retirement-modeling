# Improvements

When an item here is completed, move it to Completed.md in the order of completion.  Move all the completed sections over first.  Do each task in whatever order seems appropriate.

For each TODO task, at whatever granularity makes sense, DO ALL THESE STEPS

Where it makes sense, open up to three parallel agents to accomplish tasks.

For each task, make a new branch off main
opsx:ff
opsx:apply
Run all tests, fixing failures by correcting implementation, unless the test itself does not match the spec
opsx:verify
Verify results may identify issues, resolve them and list issue, resolution, and choices (briefly) in VerificationIssues.md
opsx:sync/archive.  Change specs should remove "change language" when merging into the top level specs
commit changes to the branch
merge changes onto main
push main to origin, leave local branches in place, do not push feature branches.

Then advance to the next task you have identified.  I want this whole process, all tasks completed with no user intervention.  I consider that goal worth the risk that the implementation diverges some from the intent.

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
