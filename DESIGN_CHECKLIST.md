# Design System Application Checklist

Use this checklist when applying the design system to new components or views.

## ✅ Already Completed

- [x] Message components (message_item.py, message_area.py)
- [x] Message input (message_input.py)
- [x] Chat header (chat_header.py)
- [x] Chat room layout (chat_room_component.py)
- [x] Dashboard view (chat_dashboard_view.py)
- [x] Main app styling (main.py)

## ⏳ To Do

### Login View (`view/login_view.py`)

- [ ] Import design tokens
- [ ] Apply light gray background to main container
- [ ] Style login card with white background and subtle shadow
- [ ] Style form title with dark gray and proper font weight
- [ ] Style input fields with pill-shaped border radius
- [ ] Style primary button for "Login"
- [ ] Style secondary button for "Register"
- [ ] Add hover effects to buttons
- [ ] Apply proper typography hierarchy
- [ ] Add error message styling (red/destructive color)

### Register View (`view/register_view.py`)

- [ ] Import design tokens
- [ ] Apply light gray background
- [ ] Style registration card
- [ ] Style form title
- [ ] Style input fields with proper spacing
- [ ] Style "Register" button with primary blue
- [ ] Style "Back to Login" link
- [ ] Add error handling and styling
- [ ] Apply validation message styling

### Group Management View (`view/group_management_view.py`)

- [ ] Import design tokens
- [ ] Create header with white background
- [ ] Style group list with cards
- [ ] Style group creation form
- [ ] Apply button styling to actions (Create, Edit, Delete)
- [ ] Style member list with proper spacing
- [ ] Add hover effects to interactive elements
- [ ] Style modal dialogs with proper shadow and radius

### Group View (`view/group_view.py`)

- [ ] Import design tokens
- [ ] Apply to group chat layout
- [ ] Style group info section
- [ ] Style member list section
- [ ] Apply message styling (same as ChatRoomComponent)
- [ ] Style group settings/options button

### Client Screens (if applicable)

- [ ] Import design tokens in any remaining views
- [ ] Apply consistent background colors
- [ ] Use design token spacing throughout
- [ ] Apply hover effects where needed
- [ ] Ensure typography consistency
- [ ] Add smooth transitions

## General Checklist for Each Component

When styling any component:

### Colors
- [ ] Use Colors.PRIMARY for main brand elements
- [ ] Use Colors.DARK_GRAY for text
- [ ] Use Colors.MEDIUM_GRAY for secondary text
- [ ] Use Colors.LIGHT_GRAY for backgrounds
- [ ] Use Colors.BORDER for dividers
- [ ] Use Colors.ACCENT_YELLOW for badges/highlights

### Spacing
- [ ] Use Spacing scale consistently (XS, SM, MD, LG, etc.)
- [ ] Add proper padding to containers
- [ ] Use consistent gaps between elements
- [ ] Apply margin to separate sections

### Typography
- [ ] Use Typography.Size for appropriate font sizes
- [ ] Use Typography.Weight for font weights
- [ ] Use Typography.LineHeight for line heights
- [ ] Apply proper hierarchy (h1, h2, body, small)

### Interactive Elements
- [ ] Add Transitions.HOVER to hover states
- [ ] Use Shadows.HOVER on card hovers
- [ ] Apply Shadows.SUBTLE for cards at rest
- [ ] Add smooth transitions (150ms duration)

### Layout
- [ ] Use BorderRadius appropriate to component type
- [ ] Apply proper padding/margins
- [ ] Use flexbox for alignment
- [ ] Ensure responsive behavior

### Shadows & Depth
- [ ] Use Shadows.SUBTLE for cards
- [ ] Use Shadows.HOVER for hover states
- [ ] Use Shadows.MEDIUM for elevated elements
- [ ] Use Shadows.ELEVATED for modals

### Accessibility
- [ ] Ensure text contrast (dark on light, light on dark)
- [ ] Make interactive elements clear
- [ ] Add focus states to inputs
- [ ] Use proper semantic HTML (labels for inputs)

## Example Component Template

```python
from nicegui import ui
from design_tokens import Colors, Typography, Spacing, BorderRadius, Shadows, Components

def my_component():
    with ui.column().style(
        f'background-color: {Colors.LIGHT_GRAY}; '
        f'padding: {Spacing.CONTAINER_PADDING}; '
        f'border-radius: {BorderRadius.MEDIUM};'
    ):
        # Title
        title = ui.label('My Component').style(
            f'color: {Colors.DARK_GRAY}; '
            f'font-size: 20px; '
            f'font-weight: 700; '
            f'margin-bottom: {Spacing.LG};'
        )
        
        # Card
        with ui.card().style(
            f'background-color: {Colors.WHITE}; '
            f'border-radius: {BorderRadius.LARGE}; '
            f'padding: {Components.Card.PADDING}; '
            f'box-shadow: {Shadows.SUBTLE}; '
            f'transition: all 150ms ease-in-out;'
        ) as card:
            # Add hover effect
            card.on('mouseenter', lambda: card.style(f'box-shadow: {Shadows.HOVER};'))
            card.on('mouseleave', lambda: card.style(f'box-shadow: {Shadows.SUBTLE};'))
            
            # Content
            ui.label('Card content').style(
                f'color: {Colors.DARK_GRAY}; '
                f'font-size: {Typography.Size.BODY};'
            )
        
        # Button
        button = ui.button('Action').style(
            f'background-color: {Colors.PRIMARY}; '
            f'color: {Colors.PRIMARY_FOREGROUND}; '
            f'padding: {Spacing.SM} {Spacing.LG}; '
            f'border-radius: {BorderRadius.MEDIUM}; '
            f'border: none; '
            f'cursor: pointer; '
            f'font-weight: 600;'
        )
```

## Documentation Files

- `DESIGN_SYSTEM.md` - Full design system documentation
- `DESIGN_QUICK_REFERENCE.md` - Quick code snippets
- `TRANSPORT_SUMMARY.md` - What's been completed
- `design_tokens.py` - Token definitions with code examples

## Testing Checklist

After applying design system to a component:

- [ ] Colors match the design system palette
- [ ] Spacing is consistent with the scale
- [ ] Typography follows the hierarchy
- [ ] Interactive elements have hover effects
- [ ] Shadows provide proper depth
- [ ] Border radius is appropriate
- [ ] Text contrast is accessible
- [ ] Transitions are smooth
- [ ] Component looks clean and professional

## Common Issues & Solutions

### Issue: Colors look different
**Solution**: Ensure you're using the exact hex values from `Colors` constants

### Issue: Spacing looks uneven
**Solution**: Use the `Spacing` scale consistently - avoid hardcoding px values

### Issue: Hover effects don't work
**Solution**: Use `.on('mouseenter'/'mouseleave')` events on the element

### Issue: Text is hard to read
**Solution**: Check color contrast - use `Colors.DARK_GRAY` on light backgrounds

### Issue: Shadows look too harsh
**Solution**: Use `Shadows.SUBTLE` or `Shadows.HOVER` instead of strong shadows

---

**Remember**: Consistency is key! Always reference the design tokens rather than hardcoding values.
