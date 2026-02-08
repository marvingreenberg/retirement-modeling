## MODIFIED Requirements

### Requirement: Theme configuration
The app SHALL use the Skeleton built-in theme `pine` configured via the `data-theme` attribute on the `<html>` element. The global stylesheet SHALL import the pine theme instead of seafoam.

#### Scenario: Theme attribute set
- **WHEN** the app.html file is loaded
- **THEN** the `<html>` tag has `data-theme="pine"` set

#### Scenario: Theme stylesheet imported
- **WHEN** the app.css file is loaded
- **THEN** it imports `@skeletonlabs/skeleton/themes/pine` instead of seafoam
