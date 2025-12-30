# Planning Guide

A Progressive Web App that enables developers to chat with their local OpenAI API using a custom API key, providing a clean, distraction-free interface for AI-assisted development workflows.

**Experience Qualities**:
1. **Technical** - The interface should feel purpose-built for developers, with attention to code formatting, syntax highlighting, and technical details
2. **Efficient** - Responses should stream smoothly, settings should be easily accessible, and the chat should feel fast and responsive
3. **Focused** - A minimal, distraction-free environment that lets developers concentrate on their conversation with the AI

**Complexity Level**: Light Application (multiple features with basic state)
This is a straightforward chat interface with settings management, message history, and API integration - it doesn't require complex routing or advanced state management patterns.

## Essential Features

### API Configuration
- **Functionality**: Store and validate OpenAI API endpoint and key
- **Purpose**: Allow developers to connect to their local or custom OpenAI-compatible API
- **Trigger**: First launch or clicking settings button
- **Progression**: Click settings → Enter API endpoint URL → Enter API key → Save → Validation feedback
- **Success criteria**: Successfully store credentials and make test connection

### Chat Interface
- **Functionality**: Send messages and receive streaming responses from the AI
- **Purpose**: Enable natural conversation with the AI assistant
- **Trigger**: Type message and press Enter or click send button
- **Progression**: Type message → Send → Show loading state → Stream response tokens → Display complete message
- **Success criteria**: Messages persist across sessions, responses stream smoothly, code blocks are properly formatted

### Message History
- **Functionality**: Display conversation history with user and AI messages
- **Purpose**: Maintain context and allow reviewing previous exchanges
- **Trigger**: Automatic on page load
- **Progression**: Load app → Fetch stored messages → Display in chronological order → Scroll to latest
- **Success criteria**: Messages persist between sessions, auto-scroll works smoothly, old messages remain accessible

### Clear Conversation
- **Functionality**: Delete all messages and start fresh
- **Purpose**: Begin new conversation without previous context
- **Trigger**: Click clear button
- **Progression**: Click clear → Confirm dialog → Clear all messages → Show empty state
- **Success criteria**: All messages removed, confirmation prevents accidental deletion

### Code Block Rendering
- **Functionality**: Detect and render code blocks with syntax highlighting
- **Purpose**: Make code readable and distinguishable from regular text
- **Trigger**: AI response contains code blocks
- **Progression**: Receive message with ```code``` → Parse markdown → Apply syntax highlighting → Render
- **Success criteria**: Code blocks are clearly formatted, copy button available, syntax highlighting works

## Edge Case Handling
- **Missing API Configuration**: Show prominent setup prompt with clear instructions instead of allowing message attempts
- **API Connection Failure**: Display clear error message with troubleshooting hints (check endpoint, verify key, ensure API is running)
- **Empty Messages**: Disable send button when input is empty to prevent API waste
- **Long Responses**: Auto-scroll during streaming, allow manual scroll to stop auto-scrolling
- **Malformed API Responses**: Gracefully handle errors and display user-friendly error messages
- **Code Block Edge Cases**: Handle inline code, missing language specifiers, and unclosed code blocks

## Design Direction
The design should feel like a developer's command center - technical, precise, and efficient. A dark-themed, terminal-inspired aesthetic with vibrant accent colors that suggest intelligence and energy. The interface should fade into the background, letting the conversation take center stage.

## Color Selection
A dark, sophisticated palette inspired by modern code editors with electric accent highlights.

- **Primary Color**: Deep cyan/teal (oklch(0.65 0.15 195)) - Communicates technical sophistication and digital intelligence
- **Secondary Colors**: Dark charcoal backgrounds (oklch(0.15 0.01 240)) with slightly lighter panels (oklch(0.20 0.01 240)) for depth and layering
- **Accent Color**: Electric violet/purple (oklch(0.70 0.20 290)) - For CTAs, highlights, and energy moments
- **Foreground/Background Pairings**: 
  - Background (Dark Charcoal oklch(0.15 0.01 240)): Light cyan text (oklch(0.92 0.02 200)) - Ratio 12.5:1 ✓
  - Card/Panel (Charcoal oklch(0.20 0.01 240)): Light cyan text (oklch(0.92 0.02 200)) - Ratio 10.8:1 ✓
  - Primary (Deep Cyan oklch(0.65 0.15 195)): Dark text (oklch(0.15 0.01 240)) - Ratio 8.2:1 ✓
  - Accent (Electric Violet oklch(0.70 0.20 290)): White text (oklch(1 0 0)) - Ratio 5.8:1 ✓

## Font Selection
Use JetBrains Mono for code and technical elements paired with Space Grotesk for headings and UI text, creating a modern, technical aesthetic that feels developer-focused.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Space Grotesk Bold/24px/tight letter spacing
  - H2 (Section Headers): Space Grotesk Medium/18px/normal spacing
  - Body (Messages): Inter Regular/15px/relaxed line-height (1.6)
  - Code (Inline/Blocks): JetBrains Mono Regular/14px/1.5 line-height
  - UI Labels: Space Grotesk Medium/13px/uppercase with wide spacing

## Animations
Animations should feel technical and precise - like systems activating and data flowing. Use subtle entrance animations for messages (fade + slide up), smooth height transitions for expanding code blocks, and gentle pulsing for the streaming indicator. All transitions should be quick (150-250ms) to maintain the efficient, responsive feel.

## Component Selection
- **Components**: 
  - Card for message bubbles with distinct styling for user vs AI
  - Dialog for settings configuration (API endpoint and key input)
  - Button for send, clear, and settings actions with hover states
  - Input and Textarea for message composition
  - ScrollArea for message history with auto-scroll behavior
  - Alert for error states and validation feedback
  - Badge for message metadata (timestamp, token count if available)
  - Separator for visual breaks between message groups
  
- **Customizations**: 
  - Custom markdown renderer for code blocks with copy button
  - Streaming text component that animates token arrival
  - Custom empty state illustration for first-time experience
  
- **States**: 
  - Buttons: Rest (subtle border), Hover (accent glow), Active (pressed inset), Disabled (muted with reduced opacity)
  - Inputs: Unfocused (subtle border), Focused (accent border glow), Error (destructive border), Success (primary border)
  - Messages: Sending (reduced opacity + pulse), Streaming (gradient shimmer on latest token), Complete (full opacity)
  
- **Icon Selection**: 
  - PaperPlaneRight for send
  - Gear for settings
  - Trash for clear conversation
  - Code for code block toggle
  - Copy for copy to clipboard
  - Check for confirmation states
  - Warning for error states
  
- **Spacing**: 
  - Container padding: p-6 (24px)
  - Message gaps: gap-4 (16px)
  - Input groups: gap-2 (8px)
  - Button padding: px-4 py-2 (16px/8px)
  - Card padding: p-4 (16px)
  
- **Mobile**: 
  - Stack settings inline with chat on desktop, use sheet drawer on mobile
  - Reduce container padding to p-4 on small screens
  - Make input area sticky at bottom with safe area padding
  - Collapse header to icon-only buttons on mobile
  - Single column layout throughout
