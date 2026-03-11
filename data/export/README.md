# NDR Data Export Summary

Generated: 2026-03-11T04:25:07.519Z

## Overview
- Total Wells: 3,000
- Wells in Fields: 1,736 (57.9%)
- Wells in Blocks: 724 (24.1%)
- Wells in Both Field and Block: 471
- Wells Outside Fields: 1,264

## Wells by Type
- Hydrocarbon exploration: 776
- Hydrocarbon evaluation: 323
- Hydrocarbon development: 1206
- Hydrocarbon development by injection: 52
- Gas storage development: 16
- Observation: 25
- Salt mining development: 275
- Salt exploration: 6
- Exploration: 138
- Coal exploration: 87
- Geological exploration: 52
- Geothermal development: 34
- Geothermal exploration: 10

## Wells by Status
- Abandoned: 1639
- Closed-in: 348
- Plugged back and sidetracked: 168
- Producing/Injecting: 269
- Suspended: 300
- Observing: 30
- Plugged: 29
-  : 216
- Completed to well: 1

## Wells by Result
- Oil: 464
- Dry: 465
- Oil shows: 20
- Gas: 1004
- Technical failure: 294
- Gas and oil shows: 15
- Oil and gas: 114
- Gas with oil shows: 6
- Gas shows: 45
- Water: 64
- Salt: 289
-  : 124
- Coal: 26
- Oil with gas shows: 3
- Groundwater: 8
- Unknown: 59

## File Descriptions

### wells_with_relationships.csv
Main export file with one row per well. Contains:
- Well identification and location
- Drilling characteristics
- Spatial relationships (containing field/block names)
- Relationship flags and counts

### well_field_block_relationships.csv
Normalized relationship file where each row represents a well-field-block combination.
Useful for pivot tables and relational analysis.

## Usage for AI Analysis

Example questions the AI can answer with this data:
1. "Which wells in field X have gas results?"
2. "What is the average depth of abandoned wells?"
3. "List all exploration wells in block K10"
4. "Which operator has drilled the most wells?"
5. "Find wells with vertical depth > 3000m that discovered oil"
