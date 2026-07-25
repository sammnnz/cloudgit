---
globs: '["frontend/src/**/*.{ts,tsx}"]'
description: Standardize all React components to use MUI instead of ShadowRoot
  for style encapsulation
alwaysApply: true
---

Use Material-UI (MUI) components for all UI elements instead of custom ShadowRoot components. 

When creating new components:
1. Import from @mui/material (e.g., Box, Button, AppBar, Toolbar, Menu, MenuItem, Avatar, Stack, Typography)
2. Use MUI's sx prop for styling instead of CSS modules or inline styles
3. Use MUI's ThemeProvider with createTheme for consistent theming
4. Use MUI's built-in style isolation instead of custom ShadowRoot implementation
5. Use MUI's spacing system (theme.spacing()) instead of hardcoded pixel values
6. Use MUI's color palette from theme instead of hardcoded hex colors
7. Use MUI's typography system for fonts and text styling

For existing ShadowRoot components:
1. Replace ShadowRoot wrapper with MUI components
2. Replace CSS module imports with MUI sx prop styling
3. Use MUI Menu component for dropdowns instead of custom implementation
4. Use MUI AppBar/Toolbar for navigation bars
5. Use MUI Stack for layout and spacing

The goal is to completely eliminate ShadowRoot usage and use standard MUI components with built-in style encapsulation.