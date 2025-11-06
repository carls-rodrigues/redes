# Design System Implementation Guide

## Overview

This guide documents how the design from `design/code` (Next.js/TypeScript/Tailwind) has been transported to your Python NiceGUI application.

## Design Tokens Module

All design tokens are centralized in `design_tokens.py`. This module includes:

- **Colors**: Primary (#3B4FE4), Secondary (#E8EAFF), Neutrals, Accents
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: 4px base unit scale (XS, SM, MD, LG, XL, XXL, XXXL)
- **Border Radius**: Small (4px), Medium (8px), Large (12px), Extra Large (16px), Pill (24px)
- **Shadows**: Subtle, Medium, Elevated, Hover effects
- **Layout**: Header height, Input height, Sidebar width
- **Transitions**: Fast (150ms), Normal (200ms), Easing defaults

## Color Palette

```
Primary Blue:       #3B4FE4 (Royal blue - actions, headers, brand)
Secondary Blue:     #E8EAFF (Light lavender - message bubbles, backgrounds)
White:              #FFFFFF
Light Gray:         #F5F5F7 (Backgrounds, muted elements)
Medium Gray:        #8E8E93 (Secondary text, placeholders)
Dark Gray:          #1C1C1E (Primary text, headings)
Accent Yellow:      #FFD60A (Badges, highlights)
Border:             #E5E5EA (Dividers, borders)
```

## Component Styling

### Messages

**User Messages:**
- Background: Secondary Blue (#E8EAFF)
- Text: Dark Gray (#1C1C1E)
- Avatar: Primary Blue background with white initials
- Border Radius: 16px (extra large/pill-shaped)
- Alignment: Right side with avatar on right

**Assistant Messages:**
- Background: Transparent or Light Gray
- Text: Dark Gray (#1C1C1E)
- Avatar: Secondary Blue background with primary blue initials
- Border Radius: 16px
- Alignment: Left side with avatar on left

### Chat Cards (Conversation List)

- Background: White
- Padding: 12-16px
- Border Radius: 12px
- Shadow: Subtle (0 1px 3px rgba(0,0,0,0.1))
- Hover: Increased shadow + subtle scale transform
- Text: 
  - Title: 14px, weight 500, dark gray
  - Preview: 12px, medium gray
  - Timestamp: 11px, medium gray

### Buttons

**Primary Button:**
- Background: Primary Blue (#3B4FE4)
- Text: White
- Padding: 8px 16px
- Border Radius: 8px
- Font Weight: 600 (Semibold)
- Hover: Darker blue (#2E3CB5)
- Transition: 150ms ease-in-out

### Input Fields

- Background: Light Gray (#F5F5F7)
- Border: 1px solid border color
- Border Radius: 24px (pill-shaped)
- Padding: 12px 16px
- Font Size: 14px
- Placeholder: Medium Gray
- Focus: Border primary color

### Header

- Height: 60px
- Background: White
- Border Bottom: 1px solid border color
- Padding: 0 24px
- Shadow: Subtle

## Files Updated

### Message Components
- `view/components/chat/message_item.py` - Individual message bubbles
- `view/components/chat/message_area.py` - Container for message list
- `view/components/chat/message_input.py` - Message input field with send button
- `view/components/chat/chat_header.py` - Chat header with back button

### Layout Components
- `view/components/chat/chat_room_component.py` - Main chat room layout
- `view/chat_dashboard_view.py` - Chat list and dashboard

## Design Tokens Usage

### In Python Code

```python
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows

# Using in element styling
with ui.button().style(
    f'background-color: {Colors.PRIMARY}; '
    f'color: {Colors.PRIMARY_FOREGROUND}; '
    f'padding: {Spacing.SM} {Spacing.LG}; '
    f'border-radius: {BorderRadius.MEDIUM}; '
    f'font-weight: {Typography.Weight.SEMIBOLD};'
):
    ui.label("Click me")
```

### Common Patterns

```python
# Cards
f'background-color: {Colors.WHITE}; '
f'border-radius: {BorderRadius.LARGE}; '
f'padding: {Components.Card.PADDING}; '
f'box-shadow: {Components.Card.SHADOW};'

# Hover Effects
f'transition: all {Transitions.DURATION_FAST} {Transitions.EASING_DEFAULT};'

# Message Bubbles
f'background-color: {Colors.SECONDARY if is_user else "transparent"}; '
f'border-radius: {BorderRadius.EXTRA_LARGE}; '
f'padding: {Spacing.MD} {Spacing.LG};'

# Text Styling
f'color: {Colors.DARK_GRAY}; '
f'font-size: {Typography.Size.BODY}; '
f'font-weight: {Typography.Weight.MEDIUM};'
```

## Spacing Scale

Based on 4px base unit:
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 20px
- XXL: 24px
- XXXL: 32px

## Shadow Effects

- **Subtle**: Used for cards at rest (0 1px 3px rgba(0,0,0,0.1))
- **Hover**: Used on hover states (0 2px 8px rgba(0,0,0,0.12))
- **Medium**: Used for elevated elements (0 4px 6px rgba(0,0,0,0.1))
- **Elevated**: Used for modals/important overlays (0 10px 20px rgba(0,0,0,0.15))

## Typography Hierarchy

- Message Text: 14px, weight 400, line height 1.5
- Conversation Title: 14px, weight 500
- Conversation Preview: 12px, weight 400
- Timestamp: 11px, weight 400
- Section Label: 11px, weight 600, uppercase
- Button Text: 14px, weight 600

## Interactive States

### Hover Transitions
- Duration: 150ms
- Easing: ease-in-out
- Effects: Shadow increase, slight scale (1.01), opacity changes

### Active States
- Conversation Card: Left border in primary color or background highlight
- Navigation: Full opacity indicator

## Best Practices

1. **Always use design_tokens** - Don't hardcode colors or spacing
2. **Consistent Spacing** - Use the spacing scale (4px multiples)
3. **Typography Scale** - Follow the defined font sizes and weights
4. **Hover States** - Apply transitions for interactive elements
5. **Color Contrast** - Dark text on light backgrounds (good contrast)
6. **Padding/Margins** - Use standardized spacing from design system
7. **Border Radius** - Use defined radius values
8. **Shadows** - Use predefined shadow values only

## CSS Variables

The `design_tokens.py` module includes a `generate_css_variables()` function that generates CSS custom properties. This can be used if you need to integrate with native CSS:

```python
from design_tokens import generate_css_variables

css_vars = generate_css_variables()
# Then insert into <style> tag if needed
```

## Future Enhancements

- Dark mode support (CSS variables already defined in globals.css)
- Theme switching
- Responsive breakpoints
- Animation library integration
- Component composition utilities

## Migration Checklist

- [x] Color palette transported
- [x] Typography system documented
- [x] Spacing scale implemented
- [x] Border radius values defined
- [x] Shadow effects translated
- [x] Message components styled
- [x] Chat list cards styled
- [x] Input fields styled
- [x] Header component styled
- [x] Dashboard view styled
- [ ] Login view styling (if needed)
- [ ] Registration view styling (if needed)
- [ ] Group management styling (if needed)
