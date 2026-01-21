# Prospect Manager Skill

A Claude Code skill for managing and validating sales prospects with a rigorous 5-step verification process.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-blue)](https://claude.ai/code)

## Features

- **5-Step Verification** - Name, title, employment status, email format, and contact depth validation
- **Anti-Inference Rules** - Never guess names from emails or titles from domains
- **Email Validation** - Verify actual email formats, not assumed patterns
- **Contact Depth Search** - Find decision-makers' personal emails over generic ones
- **Incremental Updates** - Batch management with 70% contact rate threshold
- **Multi-Category Support** - Academic, Enterprise, and Gallery/Museum targets

## Installation

### For Claude Code

Copy to your skills directory:

```bash
# Personal skills (all projects)
cp -r . ~/.claude/skills/prospect-manager/

# Or project-specific
cp -r . /your/project/.claude/skills/prospect-manager/
```

### For Other AI Coding Assistants

This skill uses the standard SKILL.md format compatible with:
- Claude Code
- Cursor
- Codex CLI
- ChatGPT (with Agent Skills)

## Quick Start

```bash
# Initialize
/prospect init

# Search for prospects (auto-validates)
/prospect search --category academic --count 10

# View results with verification scores
/prospect list

# Generate outreach draft (requires score ≥ 3)
/prospect draft <contact-id>

# Mark as contacted
/prospect mark <contact-id> contacted

# Check progress (triggers next batch at 70%)
/prospect stats
```

## 7-Step Verification

| Step | Validation | Prevents |
|------|------------|----------|
| 1 | Name verification | Inferring names from email prefixes |
| 2 | Title verification | Inferring roles from email domains |
| 3 | Employment status | Using outdated appointment news |
| 4 | Email format | Assuming standard email patterns |
| 5 | Contact depth | Stopping at generic mailboxes |
| 6 | Email purpose | Using event/support emails for outreach |
| 7 | Org name/abbreviation | Misunderstanding institution names |

### Key Rules

1. **Never infer names from email prefixes** - `rushdi@` ≠ "Rushdi Shams"
2. **Never infer titles from domains** - `eng.ox.ac.uk` ≠ "VGG member"
3. **Never use old appointment news as employment proof** - Verify with current year
4. **Never assume email formats** - Search `"@domain.com"` to confirm actual format
5. **Never stop at first result** - Generic email found? Keep searching for decision-makers
6. **Never confuse email purposes** - `observe@arize.com` is an event email, not business
7. **Never assume abbreviations** - OxTEC = "Technology & Elections" not "Ethics"

## Scoring System

| Score | Status | Meaning |
|-------|--------|---------|
| 7 | ✅ verified | All 7 checks passed + personal email |
| 6 | ✅ verified | All 7 checks passed (generic email/form) |
| 5 | ⚠️ partial | 6/7 passed, can contact with note |
| 4 | ⚠️ partial | 5/7 passed, needs human review |
| 3 | ⚠️ partial | 4/7 passed, needs more validation |
| 2 | ❓ unverified | 3 or fewer passed, not recommended |
| 1 | ❓ unverified | Contains assumptions, do not contact |
| 0 | ❌ invalid | Wrong/outdated/non-existent info |

**Draft generation requires score ≥ 4**

## Email Priority

```
Best:   Decision-maker personal email (loriglover@csail.mit.edu)
Good:   Department head email (director@domain.com)
OK:     Department generic email (partnerships@domain.com)
Worst:  Organization generic email (info@domain.com)
```

## File Structure

```
prospect-manager/
├── SKILL.md                    # Main skill definition
├── README.md                   # This file
├── LICENSE                     # MIT License
├── templates/
│   ├── config.template.json    # Configuration template
│   ├── contact.template.json   # Contact data structure
│   ├── stats.template.json     # Statistics template
│   ├── academic.md             # Academic outreach template
│   ├── enterprise.md           # Enterprise outreach template
│   └── gallery.md              # Gallery/Museum outreach template
└── .gitignore
```

## Data Storage

After `/prospect init`, creates:

```
.vulca-prospects/
├── config.json         # Your configuration
├── stats.json          # Progress statistics
├── batches/            # Contact batches
├── templates/          # Copied outreach templates
└── drafts/             # Generated drafts
```

## Incremental Updates

The skill uses a batch-based approach:

1. Search returns a batch of ~10 contacts
2. You work through contacting them
3. When 70% are contacted, `/prospect stats` prompts for next batch
4. Run `/prospect next` to get more prospects

This prevents overwhelming you with contacts while ensuring steady progress.

## Target Categories

### Academic
- AI/ML research lab directors
- Digital humanities professors
- Museum digital innovation leads
- VLM researchers

### Enterprise
- AI company product/research leads
- Tech company AI evaluation teams
- Art-tech startups
- Data labeling companies

### Gallery/Museum
- Museum directors
- Chief curators
- Digital collection heads
- Art authentication experts

## Contributing

Issues and PRs welcome. Please ensure any changes maintain the verification rigor that prevents common prospecting errors.

## License

MIT License - see [LICENSE](LICENSE) file.

## Credits

Developed for the [VULCA](https://vulcaart.art) AI Art Evaluation Platform.

---

**Note:** This skill is designed to prevent common prospecting mistakes like:
- Using outdated contact information
- Inferring names/titles from emails
- Assuming email formats without verification
- Stopping at generic mailboxes instead of finding decision-makers
