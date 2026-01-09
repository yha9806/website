# iOS Design System - LOCKED

## Status: Frozen

This directory contains the iOS Design System components that have been **locked** and should not be modified.

## Lock Date
2026-01-09

## What's Locked

### Core Components
- `IOSButton` - Primary, secondary, destructive, glass, text variants
- `IOSCard` - Elevated, outlined, filled, glass variants
- `IOSToggle` - iOS-style switches
- `IOSSlider` - Value sliders
- `IOSAlert` - Modal alerts
- `IOSSheet` - Bottom sheets
- `IOSSegmentedControl` - Tab controls
- `IOSActionSheet` - Action menus
- `IOSContextMenu` - Context menus
- `IOSPopupButton` - Popup buttons
- `IOSTabBar` - Navigation tabs
- `IOSFilterPanel` - Filter panels
- `IOSRangeSlider` - Range sliders

### Effects
- `LiquidGlass` - Glass morphism effects

### Utils
- `iosTheme.ts` - Design tokens (colors, shadows, spacing)
- `animations.ts` - Animation presets
- `emojiMap.ts` - Emoji mappings

## Why Locked

Based on [Claude Frontend-Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md):

> "Bold, opinionated aesthetic direction distinguishes standout work from generic AI slop."

Our design choices are **intentional** and **final**:
- SF Pro Display font stack
- iOS System Colors (#007AFF, #34C759, #FF9500, #FF3B30)
- Glass Morphism effects (72% opacity, 30px blur)
- Spring physics animations (stiffness: 300, damping: 30)

## If You Need Extensions

Do **NOT** modify files in this directory. Instead:

1. Create new components in `components/common/`
2. Use CSS variables from `iosTheme.ts`
3. Compose existing iOS components
4. Add new utility classes in `index.css`

## Contact

For design system questions, refer to:
- `CLAUDE.md` - Project documentation
- `/home/yhryzy/.claude/plans/hashed-sniffing-lerdorf.md` - Implementation plan
