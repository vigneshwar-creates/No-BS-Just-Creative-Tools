# JUST CREATIVE TOOLS - Specification

## 1. Project Overview

**Name**: JUST CREATIVE TOOLS (JCT)
**Type**: All-in-One Creative Visual Tools Web App
**Core Functionality**: A collection of visual creative tools (ASCII art, color palette, gradient, big text, image filters) with brutalist design aesthetic
**Target Users**: Designers, developers, content creators, fun seekers
**Monetization**: Buy Me a Coffee donation link
**License**: MIT License

---

## 2. UI/UX Specification

### Layout Structure

- **Single Page Application** - Vertical scroll, no routing
- **Header**: Fixed top bar with logo/title + donate button
- **Hero**: Brief tagline section
- **Tools Grid**: Card-based layout, 1 column mobile, 2 tablet, 3 desktop
- **Footer**: Credits, links, copyright

### Responsive Breakpoints
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3 columns)

### Visual Design

**Color Palette:**
- Background: `#F5F5F5` (light gray)
- Surface: `#FFFFFF` (white)
- Primary: `#000000` (black)
- Accent: `#FF00FF` (magenta)
- Secondary: `#00FF00` (lime green)
- Tertiary: `#00FFFF` (cyan)
- Text Primary: `#000000`
- Text Secondary: `#666666`

**Typography:**
- Headings: `"Space Mono", monospace` - Bold, uppercase
- Body: `"Space Mono", monospace` - Regular
- Font sizes:
  - H1: 3rem
  - H2: 2rem
  - H3: 1.5rem
  - Body: 1rem
  - Small: 0.875rem

**Spacing System:**
- Base unit: 8px
- Section padding: 64px vertical
- Card padding: 24px
- Gap between cards: 24px

**Visual Effects (Brutalist):**
- 4px solid black borders on all cards
- No border-radius (sharp corners)
- Box shadows: `8px 8px 0px #000000` (hard offset)
- Hover: shadow shifts to `4px 4px 0px #000000`
- No gradients in UI - flat colors only
- High contrast always

### Components

**Header:**
- Logo text: "BRUTAL TOOLBOX" - bold, uppercase
- Donate button: black bg, white text, 4px border

**Tool Cards:**
- Title with icon
- Tool interface (varies by tool)
- "Use Tool" / "Clear" / "Copy" buttons
- States: default, hover (shadow shift), active

**Tool Interfaces:**

1. **ASCII Art Generator**
   - Textarea for input
   - Font size slider (8-32px)
   - Output display (pre/code block)
   - Copy button

2. **Color Palette**
   - Image upload / paste area
   - Extract 5 dominant colors
   - Click to copy hex code
   - Palette display boxes

3. **Gradient Generator**
   - Color pickers (2-5 colors)
   - Direction slider (0-360°)
   - Preview box
   - CSS code output + copy

4. **Big Text / ASCII Text**
   - Input field
   - Font selector dropdown
   - Output display
   - Copy button

5. **Image Filter Preview**
   - Image upload / paste / drag-drop
   - Filter buttons: Vintage, Glitch, Neon, Grayscale, Invert
   - Before/After toggle
   - Download button

---

## 3. Functionality Specification

### Core Features

1. **ASCII Art Generator**
   - Convert text to ASCII art
   - Adjustable width/font
   - Copy to clipboard

2. **Color Palette Extractor**
   - Load image via file picker or paste
   - Extract 5 dominant colors using canvas
   - Click to copy hex codes

3. **Gradient Generator**
   - Add 2-5 gradient stops
   - Adjust angle
   - Live preview
   - Copy CSS code

4. **Big Text Generator**
   - Input text
   - Multiple ASCII-style fonts
   - Copy output

5. **Image Filters**
   - Load image
   - Apply CSS filters: grayscale, sepia, invert, hue-rotate, contrast
   - Download filtered image

### User Interactions
- All tools work client-side (no server)
- Instant feedback
- Copy buttons use Clipboard API
- Drag & drop for images
- Keyboard shortcuts where appropriate

### Data Handling
- All processing in browser
- No data sent to any server
- Images processed via Canvas API
- LocalStorage for theme preferences (optional)

### Edge Cases
- Empty input: Show placeholder message
- Large images: Resize to max 1000px width
- Invalid image: Show error message
- Copy fail: Show fallback "select all"

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Brutalist aesthetic: black borders, hard shadows, no rounded corners
- [ ] Responsive: works on mobile, tablet, desktop
- [ ] All 5 tools visible and accessible
- [ ] Donate button visible in header

### Functional Checkpoints
- [ ] ASCII art generates and copies
- [ ] Color palette extracts from image
- [ ] Gradient generates with live preview
- [ ] Big text generates with different fonts
- [ ] Image filters apply correctly
- [ ] Images can be uploaded, pasted, dragged
- [ ] Copy buttons work
- [ ] No console errors on load

### PWA Requirements
- [ ] manifest.json present
- [ ] App installable
- [ ] Works offline (basic)

---

## 5. Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom brutalist styles (no frameworks)
- **Vanilla JavaScript** - All functionality
- **PWA** - manifest.json + service worker (optional)
