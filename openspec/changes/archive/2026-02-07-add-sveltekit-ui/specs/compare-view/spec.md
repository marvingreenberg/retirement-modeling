## ADDED Requirements

### Requirement: Strategy selection for comparison
The Compare view SHALL allow the user to select multiple conversion strategies and multiple spending strategies to compare. It SHALL provide checkboxes for each available strategy, fetched from the `/strategies` endpoint.

#### Scenario: Strategies loaded
- **WHEN** the Compare view is opened
- **THEN** available conversion and spending strategies are fetched and displayed as checkboxes with descriptions

#### Scenario: At least one of each required
- **WHEN** the user deselects all conversion strategies
- **THEN** the "Run Comparison" button is disabled with a message indicating at least one of each type is required

### Requirement: Run comparison
The Compare view SHALL provide a "Run Comparison" button that sends the portfolio and selected strategies to the `/compare` endpoint.

#### Scenario: Successful comparison
- **WHEN** the user selects 2 conversion strategies and 2 spending strategies and clicks "Run Comparison"
- **THEN** the API is called with the portfolio and selected strategies, and results are displayed

#### Scenario: Loading state
- **WHEN** the comparison is in progress
- **THEN** the button shows a loading indicator and is disabled

### Requirement: Comparison bar chart
The Compare view SHALL display a grouped bar chart comparing strategy combinations across key metrics: final balance, total taxes paid, total IRMAA paid, and total Roth conversions.

#### Scenario: Chart renders
- **WHEN** comparison results are available
- **THEN** a bar chart displays with one group per strategy combination and bars for each metric

### Requirement: Comparison table
The Compare view SHALL display a table with one row per strategy combination showing: conversion strategy, spending strategy, final balance, total taxes, total IRMAA, total Roth conversions, and final balance by account type (pretax, roth, brokerage).

#### Scenario: Table renders
- **WHEN** comparison results are available
- **THEN** a table displays all comparison data with formatted currency values

#### Scenario: Best values highlighted
- **WHEN** comparison results are displayed in the table
- **THEN** the best value in each numeric column (highest balance, lowest taxes) is visually highlighted
