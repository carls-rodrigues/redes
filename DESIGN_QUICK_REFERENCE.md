# Design System Quick Reference

## Quick Import
```python
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows, Components, Transitions
```

## Common Styling Snippets

### Primary Button
```python
button.style(
    f'background-color: {Colors.PRIMARY}; '
    f'color: {Colors.PRIMARY_FOREGROUND}; '
    f'padding: {Spacing.SM} {Spacing.LG}; '
    f'border-radius: {BorderRadius.MEDIUM}; '
    f'font-weight: 600; '
    f'border: none; '
    f'cursor: pointer; '
    f'transition: all {Transitions.DURATION_FAST} {Transitions.EASING_DEFAULT};'
)
button.on('mouseenter', lambda: button.style(f'background-color: #2E3CB5; opacity: 0.9;'))
button.on('mouseleave', lambda: button.style(f'background-color: {Colors.PRIMARY}; opacity: 1;'))
```

### Secondary Button
```python
button.style(
    f'background-color: {Colors.SECONDARY}; '
    f'color: {Colors.PRIMARY}; '
    f'padding: {Spacing.SM} {Spacing.LG}; '
    f'border-radius: {BorderRadius.MEDIUM}; '
    f'font-weight: 600; '
    f'border: none; '
    f'cursor: pointer;'
)
```

### Card Container
```python
card.style(
    f'background-color: {Colors.WHITE}; '
    f'border-radius: {BorderRadius.LARGE}; '
    f'padding: {Spacing.CONVERSATION_CARD_PADDING}; '
    f'box-shadow: {Shadows.SUBTLE}; '
    f'transition: all {Transitions.DURATION_FAST} {Transitions.EASING_DEFAULT};'
)
card.on('mouseenter', lambda: card.style(f'box-shadow: {Shadows.HOVER}; transform: translateY(-2px);'))
card.on('mouseleave', lambda: card.style(f'box-shadow: {Shadows.SUBTLE}; transform: translateY(0);'))
```

### Input Field
```python
input_field.style(
    f'background-color: {Colors.WHITE}; '
    f'color: {Colors.DARK_GRAY}; '
    f'border: 1px solid {Colors.BORDER}; '
    f'border-radius: {BorderRadius.PILL}; '
    f'padding: {Spacing.MD} {Spacing.LG}; '
    f'font-size: {Typography.Size.BODY};'
)
```

### Text Heading
```python
heading.style(
    f'color: {Colors.DARK_GRAY}; '
    f'font-size: 20px; '
    f'font-weight: 700; '
    f'margin-bottom: {Spacing.MD};'
)
```

### Text Body
```python
text.style(
    f'color: {Colors.DARK_GRAY}; '
    f'font-size: {Typography.Size.BODY}; '
    f'line-height: {Typography.LineHeight.NORMAL};'
)
```

### Muted Text (Secondary)
```python
muted.style(
    f'color: {Colors.MEDIUM_GRAY}; '
    f'font-size: {Typography.Size.SMALL};'
)
```

### Badge
```python
badge.style(
    f'background-color: {Colors.ACCENT_YELLOW}; '
    f'color: {Colors.DARK_GRAY}; '
    f'padding: {Components.Badge.PADDING}; '
    f'border-radius: {Components.Badge.BORDER_RADIUS}; '
    f'font-size: {Components.Badge.FONT_SIZE}; '
    f'font-weight: {Components.Badge.FONT_WEIGHT};'
)
```

### Message Bubble (User)
```python
bubble.style(
    f'background-color: {Colors.SECONDARY}; '
    f'color: {Colors.DARK_GRAY}; '
    f'padding: {Spacing.MD} {Spacing.LG}; '
    f'border-radius: {BorderRadius.EXTRA_LARGE}; '
    f'box-shadow: {Shadows.SUBTLE}; '
    f'max-width: 70%;'
)
```

### Message Bubble (Assistant)
```python
bubble.style(
    f'background-color: transparent; '
    f'color: {Colors.DARK_GRAY}; '
    f'padding: {Spacing.MD} {Spacing.LG}; '
    f'border-radius: {BorderRadius.EXTRA_LARGE};'
)
```

### Avatar
```python
avatar.style(
    f'width: {Components.MessageBubble.AVATAR_SIZE}; '
    f'height: {Components.MessageBubble.AVATAR_SIZE}; '
    f'background-color: {Colors.PRIMARY}; '
    f'border-radius: 50%; '
    f'display: flex; '
    f'align-items: center; '
    f'justify-content: center; '
    f'flex-shrink: 0;'
)
avatar_text.style(f'color: {Colors.PRIMARY_FOREGROUND}; font-weight: 600;')
```

### Divider/Separator
```python
divider.style(
    f'border: none; '
    f'border-top: 1px solid {Colors.BORDER}; '
    f'margin: {Spacing.LG} 0;'
)
```

### Container/Section
```python
container.style(
    f'background-color: {Colors.LIGHT_GRAY}; '
    f'padding: {Spacing.CONTAINER_PADDING}; '
    f'border-radius: {BorderRadius.MEDIUM};'
)
```

### Focus State (Input)
```python
input_field.style(
    # ... other styles
    + ' outline: none; '
    + f'border-color: {Colors.PRIMARY};'
)
```

## Color Reference

```python
Colors.PRIMARY                  # #3B4FE4 - Main brand color
Colors.PRIMARY_FOREGROUND       # #FFFFFF - Text on primary
Colors.SECONDARY                # #E8EAFF - Light blue
Colors.SECONDARY_FOREGROUND     # #3B4FE4 - Text on secondary
Colors.WHITE                    # #FFFFFF
Colors.LIGHT_GRAY               # #F5F5F7
Colors.MEDIUM_GRAY              # #8E8E93
Colors.DARK_GRAY                # #1C1C1E
Colors.ACCENT_YELLOW            # #FFD60A
Colors.BORDER                   # #E5E5EA
```

## Spacing Reference

```python
Spacing.XS      # 4px
Spacing.SM      # 8px
Spacing.MD      # 12px
Spacing.LG      # 16px
Spacing.XL      # 20px
Spacing.XXL     # 24px
Spacing.XXXL    # 32px
```

## Border Radius Reference

```python
BorderRadius.SMALL              # 4px - badges
BorderRadius.MEDIUM             # 8px - buttons, small cards
BorderRadius.LARGE              # 12px - card containers
BorderRadius.EXTRA_LARGE        # 16px - message bubbles
BorderRadius.PILL               # 24px - rounded buttons, inputs
```

## Shadow Reference

```python
Shadows.SUBTLE                  # 0 1px 3px rgba(0, 0, 0, 0.1)
Shadows.HOVER                   # 0 2px 8px rgba(0, 0, 0, 0.12)
Shadows.MEDIUM                  # 0 4px 6px rgba(0, 0, 0, 0.1)
Shadows.ELEVATED                # 0 10px 20px rgba(0, 0, 0, 0.15)
```

## Typography Reference

```python
Typography.Size.MESSAGE_TEXT            # 14px
Typography.Size.CONVERSATION_TITLE      # 14px
Typography.Size.CONVERSATION_PREVIEW    # 12px
Typography.Size.TIMESTAMP               # 11px
Typography.Size.BODY                    # 14px
Typography.Size.SMALL                   # 12px
Typography.Size.EXTRA_SMALL             # 11px

Typography.Weight.REGULAR               # 400
Typography.Weight.MEDIUM                # 500
Typography.Weight.SEMIBOLD              # 600
Typography.Weight.BOLD                  # 700

Typography.LineHeight.TIGHT             # 1.2
Typography.LineHeight.NORMAL            # 1.5
Typography.LineHeight.RELAXED           # 1.75
```

## Transitions Reference

```python
Transitions.DURATION_FAST              # 150ms
Transitions.DURATION_NORMAL            # 200ms
Transitions.EASING_DEFAULT             # ease-in-out
Transitions.HOVER                      # all 150ms ease-in-out
```

## Layout Reference

```python
Layout.HEADER_HEIGHT                   # 60px
Layout.INPUT_HEIGHT                    # 48px
Layout.SIDEBAR_WIDTH                   # 60px
Layout.CONVERSATION_LIST_WIDTH         # 280px
```

## Component Tokens Reference

```python
# Buttons
Components.Button.PRIMARY_BG           # #3B4FE4
Components.Button.PRIMARY_FG           # #FFFFFF
Components.Button.PRIMARY_HOVER        # #2E3CB5
Components.Button.PADDING              # 8px 16px
Components.Button.BORDER_RADIUS        # 8px
Components.Button.FONT_WEIGHT          # 600

# Cards
Components.Card.BACKGROUND             # #FFFFFF
Components.Card.PADDING                # 12px 16px
Components.Card.BORDER_RADIUS          # 12px
Components.Card.SHADOW                 # subtle shadow
Components.Card.SHADOW_HOVER           # hover shadow

# Message Bubbles
Components.MessageBubble.USER_BG       # #E8EAFF
Components.MessageBubble.ASSISTANT_BG  # transparent
Components.MessageBubble.AVATAR_SIZE   # 32px

# Input
Components.Input.BACKGROUND            # #F5F5F7
Components.Input.BORDER_RADIUS         # 24px
Components.Input.PADDING               # 12px 16px

# Badge
Components.Badge.BACKGROUND            # #FFD60A
Components.Badge.PADDING               # 4px 8px
Components.Badge.BORDER_RADIUS         # 4px
```

---

**Tip**: Always use these tokens instead of hardcoding values. This ensures consistency and makes it easy to update the design system in the future!
