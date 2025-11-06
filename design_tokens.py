"""
Design System Tokens
Translated from design/system.json and design/code/app/globals.css

This module contains all design tokens (colors, typography, spacing, shadows, etc.)
for the RedES Chat application.
"""

# ============================================================================
# COLOR PALETTE
# ============================================================================

class Colors:
    """Primary colors from the design system"""
    
    # Primary Color
    PRIMARY = "#3B4FE4"  # Deep royal blue
    PRIMARY_FOREGROUND = "#FFFFFF"
    
    # Secondary Color (Light blue/lavender)
    SECONDARY = "#E8EAFF"  # Very light blue
    SECONDARY_FOREGROUND = "#3B4FE4"
    
    # Neutral/Gray Scale
    WHITE = "#FFFFFF"
    LIGHT_GRAY = "#F5F5F7"
    MEDIUM_GRAY = "#8E8E93"
    DARK_GRAY = "#1C1C1E"
    
    # Accent Color
    ACCENT_YELLOW = "#FFD60A"  # Bright yellow for badges
    
    # Semantic Colors
    BACKGROUND = WHITE
    FOREGROUND = DARK_GRAY
    CARD = WHITE
    CARD_FOREGROUND = DARK_GRAY
    MUTED = LIGHT_GRAY
    MUTED_FOREGROUND = MEDIUM_GRAY
    BORDER = "#E5E5EA"  # Light border color


# ============================================================================
# TYPOGRAPHY
# ============================================================================

class Typography:
    """Typography settings for the application"""
    
    FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    FONT_MONO = "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace"
    
    # Font sizes
    class Size:
        MESSAGE_TEXT = "14px"
        CONVERSATION_TITLE = "14px"
        CONVERSATION_PREVIEW = "12px"
        TIMESTAMP = "11px"
        SECTION_LABEL = "11px"
        BUTTON_TEXT = "14px"
        BODY = "14px"
        SMALL = "12px"
        EXTRA_SMALL = "11px"
    
    # Font weights
    class Weight:
        REGULAR = 400
        MEDIUM = 500
        SEMIBOLD = 600
        BOLD = 700
    
    # Line heights
    class LineHeight:
        TIGHT = "1.2"
        NORMAL = "1.5"
        RELAXED = "1.75"
    
    # Letter spacing
    class LetterSpacing:
        NORMAL = "0"
        WIDE = "0.5px"


# ============================================================================
# SPACING
# ============================================================================

class Spacing:
    """Spacing scale (base unit: 4px)"""
    
    XS = "4px"
    SM = "8px"
    MD = "12px"
    LG = "16px"
    XL = "20px"
    XXL = "24px"
    XXXL = "32px"
    
    # Component-specific spacing
    SIDEBAR_ICON_PADDING = "12px 16px"  # vertical
    CONVERSATION_CARD_PADDING = "12px 16px"
    CONVERSATION_CARD_GAP = "8px"
    MESSAGE_VERTICAL_SPACING = "16px"
    CONTAINER_PADDING = "20px 24px"


# ============================================================================
# BORDERS & RADIUS
# ============================================================================

class BorderRadius:
    """Border radius values"""
    
    SMALL = "4px"      # Badges
    MEDIUM = "8px"     # Cards, buttons
    LARGE = "12px"     # Alternative for cards
    EXTRA_LARGE = "16px"  # Message bubbles
    PILL = "24px"       # Input fields, rounded buttons


class Borders:
    """Border definitions"""
    
    WIDTH = "1px"
    COLOR_LIGHT = "rgba(0, 0, 0, 0.1)"
    COLOR = Colors.BORDER


# ============================================================================
# SHADOWS
# ============================================================================

class Shadows:
    """Shadow definitions following Material Design principles"""
    
    SUBTLE = "0 1px 3px rgba(0, 0, 0, 0.1)"
    MEDIUM = "0 4px 6px rgba(0, 0, 0, 0.1)"
    ELEVATED = "0 10px 20px rgba(0, 0, 0, 0.15)"
    HOVER = "0 2px 8px rgba(0, 0, 0, 0.12)"


# ============================================================================
# LAYOUT DIMENSIONS
# ============================================================================

class Layout:
    """Layout dimensions"""
    
    SIDEBAR_WIDTH = "60px"  # Icon navigation sidebar
    CONVERSATION_LIST_WIDTH = "280px"
    HEADER_HEIGHT = "60px"
    INPUT_HEIGHT = "48px"


# ============================================================================
# TRANSITIONS
# ============================================================================

class Transitions:
    """Animation/transition settings"""
    
    DURATION_FAST = "150ms"
    DURATION_NORMAL = "200ms"
    EASING_DEFAULT = "ease-in-out"
    HOVER = f"all {DURATION_FAST} {EASING_DEFAULT}"


# ============================================================================
# COMPONENT-SPECIFIC TOKENS
# ============================================================================

class Components:
    """Component-specific styling tokens"""
    
    class Button:
        PRIMARY_BG = Colors.PRIMARY
        PRIMARY_FG = Colors.PRIMARY_FOREGROUND
        PRIMARY_HOVER = "#2E3CB5"  # Darker blue
        PADDING = f"{Spacing.SM} {Spacing.LG}"
        BORDER_RADIUS = BorderRadius.MEDIUM
        FONT_WEIGHT = Typography.Weight.SEMIBOLD
    
    class Card:
        BACKGROUND = Colors.CARD
        FOREGROUND = Colors.CARD_FOREGROUND
        PADDING = Spacing.CONVERSATION_CARD_PADDING
        BORDER_RADIUS = BorderRadius.LARGE
        SHADOW = Shadows.SUBTLE
        SHADOW_HOVER = Shadows.HOVER
    
    class MessageBubble:
        USER_BG = Colors.SECONDARY
        USER_FG = Colors.DARK_GRAY
        ASSISTANT_BG = "transparent"
        ASSISTANT_FG = Colors.DARK_GRAY
        PADDING = f"{Spacing.MD} {Spacing.LG}"
        BORDER_RADIUS = BorderRadius.EXTRA_LARGE
        MAX_WIDTH = "70%"
        AVATAR_SIZE = "32px"
    
    class Input:
        BACKGROUND = Colors.LIGHT_GRAY
        FOREGROUND = Colors.DARK_GRAY
        PLACEHOLDER = Colors.MEDIUM_GRAY
        BORDER_RADIUS = BorderRadius.PILL
        PADDING = f"{Spacing.MD} {Spacing.LG}"
        HEIGHT = Layout.INPUT_HEIGHT
        FONT_SIZE = Typography.Size.BODY
    
    class Badge:
        BACKGROUND = Colors.ACCENT_YELLOW
        FOREGROUND = Colors.DARK_GRAY
        BORDER_RADIUS = BorderRadius.SMALL
        PADDING = "4px 8px"
        FONT_SIZE = Typography.Size.EXTRA_SMALL
        FONT_WEIGHT = Typography.Weight.SEMIBOLD
    
    class ConversationCard:
        BACKGROUND = Colors.WHITE
        FOREGROUND = Colors.DARK_GRAY
        PADDING = Spacing.CONVERSATION_CARD_PADDING
        BORDER_RADIUS = BorderRadius.LARGE
        SHADOW = Shadows.SUBTLE
        SHADOW_HOVER = Shadows.HOVER
        TITLE_SIZE = Typography.Size.CONVERSATION_TITLE
        TITLE_WEIGHT = Typography.Weight.MEDIUM
        PREVIEW_SIZE = Typography.Size.CONVERSATION_PREVIEW
        PREVIEW_COLOR = Colors.MEDIUM_GRAY
        TIMESTAMP_SIZE = Typography.Size.TIMESTAMP
        TIMESTAMP_COLOR = Colors.MEDIUM_GRAY


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_message_classes(is_user: bool) -> str:
    """
    Get NiceGUI CSS classes for message styling
    
    Args:
        is_user: True if this is a user message, False if assistant
    
    Returns:
        String of CSS classes for NiceGUI
    """
    if is_user:
        return f"p-3 rounded-2xl max-w-xs text-sm" \
               f" bg-[{Colors.SECONDARY}] text-[{Colors.DARK_GRAY}]" \
               f" self-end"
    else:
        return f"p-3 rounded-2xl max-w-xs text-sm" \
               f" bg-transparent text-[{Colors.DARK_GRAY}]" \
               f" self-start"


def get_card_hover_classes() -> str:
    """Get hover effect classes for cards"""
    return "hover:shadow-md hover:scale-105 transition-all duration-150 cursor-pointer"


def get_button_classes(variant: str = "primary") -> str:
    """
    Get NiceGUI CSS classes for button styling
    
    Args:
        variant: "primary", "secondary", or "outline"
    
    Returns:
        String of CSS classes for NiceGUI
    """
    base = f"px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-150"
    
    if variant == "primary":
        return f"{base} bg-[{Colors.PRIMARY}] text-white hover:bg-[#2E3CB5]"
    elif variant == "secondary":
        return f"{base} bg-[{Colors.SECONDARY}] text-[{Colors.PRIMARY}] hover:bg-opacity-80"
    elif variant == "outline":
        return f"{base} border border-[{Colors.BORDER}] text-[{Colors.DARK_GRAY}] hover:bg-[{Colors.LIGHT_GRAY}]"
    
    return base


# ============================================================================
# CSS VARIABLES GENERATOR
# ============================================================================

def generate_css_variables() -> str:
    """
    Generate CSS variables string for use in <style> tags or CSS files
    
    Returns:
        CSS string with all design tokens as variables
    """
    css = """
:root {
  /* Colors */
  --color-primary: #3B4FE4;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #E8EAFF;
  --color-secondary-foreground: #3B4FE4;
  --color-background: #FFFFFF;
  --color-foreground: #1C1C1E;
  --color-card: #FFFFFF;
  --color-card-foreground: #1C1C1E;
  --color-muted: #F5F5F7;
  --color-muted-foreground: #8E8E93;
  --color-border: #E5E5EA;
  --color-accent: #FFD60A;
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-xxl: 24px;
  --spacing-xxxl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 24px;
  
  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-elevated: 0 10px 20px rgba(0, 0, 0, 0.15);
  
  /* Layout */
  --layout-header-height: 60px;
  --layout-input-height: 48px;
  --layout-sidebar-width: 60px;
  --layout-conversation-list-width: 280px;
}
"""
    return css
