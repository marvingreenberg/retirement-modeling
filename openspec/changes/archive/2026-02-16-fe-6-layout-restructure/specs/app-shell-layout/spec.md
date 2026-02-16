## MODIFIED Requirements

### Requirement: ProfileDrawer includes Advanced settings
The ProfileDrawer SHALL include a "Tax & Advanced" section containing State Tax %, Capital Gains %, RMD Age, and IRMAA Limit inputs. These are separated from the profile fields by a divider.

#### Scenario: Advanced settings in drawer
- **WHEN** the user opens the ProfileDrawer
- **THEN** below the profile fields and dark mode toggle, a "Tax & Advanced" section appears
- **AND** it contains State Tax %, Cap Gains %, RMD Age, and IRMAA Limit inputs

#### Scenario: Advanced values persist
- **WHEN** the user changes State Tax % to 8% in the drawer and closes it
- **THEN** the value remains at 8% in the portfolio config
