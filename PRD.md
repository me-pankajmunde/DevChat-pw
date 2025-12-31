# DevChat Local - Product Requirements Document

A Progressive Web App that enables developers to chat with their local OpenAI API using a custom API key, providing a clean, distraction-free interface for AI-assisted development workflows.

**Experience Qualities**:
1. **Technical** - The interface should feel purpose-built for developers, with attention to code formatting, syntax highlighting, and technical details
2. **Efficient** - Responses should stream smoothly, settings should be easily accessible, and the chat should feel fast and responsive
3. **Focused** - A minimal, distraction-free environment that lets developers concentrate on their conversation with the AI

**Complexity Level**: Light Application (multiple features with basic state)
This is a straightforward chat interface with settings management, message history, and API integration - it doesn't require complex routing or advanced state management patterns.

## Essential Features

### GitHub Authentication
- **Functionality**: Secure login via GitHub OAuth to access the application
- **Purpose**: Authenticate users, enable personalized experience, and secure access to cloud sync features
- **Trigger**: Application launch when user is not authenticated
- **Progression**: View login screen → Click "Sign in with GitHub" → GitHub OAuth flow → Authenticated → Main app loads
- **Success criteria**: User successfully authenticates, avatar and username display in header, logout option available

### API Configuration
- **Functionality**: Store and validate OpenAI API endpoint, key, and model name
- **Purpose**: Allow developers to connect to their local or custom OpenAI-compatible API with any supported model
- **Trigger**: First launch or clicking settings button
- **Progression**: Click settings → Enter API endpoint URL → Enter API key → Enter model name → Save → Validation feedback
- **Success criteria**: Successfully store credentials and make test connection

### Chat Interface
- **Functionality**: Send messages and receive streaming responses from the AI
- **Purpose**: Enable natural conversation with the AI assistant
- **Trigger**: Type message and press Enter or click send button
- **Progression**: Type message → Send → Show loading state → Stream response tokens → Display complete message
- **Success criteria**: Messages persist across sessions, responses stream smoothly, code blocks are properly formatted

### Session Management
- **Functionality**: Create, switch, rename, and delete chat sessions with independent conversation histories, organize sessions into color-coded folders, and filter by tags
- **Purpose**: Organize multiple conversations and maintain separate contexts for different tasks or topics with advanced organization capabilities
- **Trigger**: Click new chat button in sidebar, or select existing session from history
- **Progression**: Click new chat → Session created with "New Chat" title → First message auto-generates descriptive title → Switch between sessions via sidebar → Rename via edit icon → Delete via trash icon with confirmation → Create folders with custom colors → Rename/recolor folders → Move sessions between folders → Add/remove tags → Filter by tags
- **Success criteria**: Each session maintains independent message history, sessions persist between page loads, titles update automatically from first message, search filters sessions by title, folders maintain custom colors and names, folder reorganization is intuitive, tag filtering works in real-time

### Message History
- **Functionality**: Display conversation history with user and AI messages within the current session
- **Purpose**: Maintain context and allow reviewing previous exchanges
- **Trigger**: Automatic on page load or session switch
- **Progression**: Load app → Fetch stored messages for current session → Display in chronological order → Scroll to latest
- **Success criteria**: Messages persist between sessions, auto-scroll works smoothly, old messages remain accessible

### Clear Conversation
- **Functionality**: Delete all messages in the current session and start fresh
- **Purpose**: Begin new conversation without previous context while keeping session
- **Trigger**: Click clear button in header
- **Progression**: Click clear → Confirm dialog → Clear all messages in current session → Show empty state
- **Success criteria**: All messages in session removed, confirmation prevents accidental deletion, other sessions unaffected

### Chat Wallpaper
- **Functionality**: Apply subtle background patterns to the chat area
- **Purpose**: Personalize the chat interface with WhatsApp-style wallpaper options
- **Trigger**: Select wallpaper from settings dialog
- **Progression**: Open settings → Choose wallpaper pattern → Preview → Save → Pattern applied to chat background
- **Success criteria**: Pattern displays correctly, doesn't interfere with message readability, persists between sessions

### Code Block Rendering with Syntax Highlighting
- **Functionality**: Detect and render code blocks with professional syntax highlighting using react-syntax-highlighter
- **Purpose**: Make code highly readable with language-specific color coding and proper formatting
- **Trigger**: AI response contains code blocks with language identifiers (e.g., ```javascript, ```python)
- **Progression**: Receive message with ```language``` → Parse markdown → Apply VS Code Dark Plus theme → Render with syntax highlighting → Show copy button
- **Success criteria**: Code blocks have language-specific syntax highlighting, line numbers visible, copy button works, supports 100+ programming languages

### Image Attachments
- **Functionality**: Attach images to messages for vision-based AI analysis
- **Purpose**: Enable users to send images to vision-capable models for analysis, description, or code extraction
- **Trigger**: Click image attachment button in message input area
- **Progression**: Click image button → Select image file(s) → Preview thumbnails → Send with message → AI analyzes image(s) → Response includes image context
- **Success criteria**: Images upload smoothly, multiple images supported, preview shows before sending, images display in chat history, base64 encoding works with OpenAI vision API

### Model Comparison View
- **Functionality**: Send the same query to multiple models simultaneously and view responses side-by-side
- **Purpose**: Compare how different models respond to the same prompt, useful for evaluating model quality, consistency, and style
- **Trigger**: Click compare button in header to switch to compare mode
- **Progression**: Click compare → Select models via checkboxes → Enter query → Send → Watch all models stream responses in parallel → View side-by-side results in grid layout → Return to chat view
- **Success criteria**: Multiple models stream simultaneously, responses display in organized grid (1-3 columns based on selection), each response shows model name with icon, streaming indicators and completion badges work correctly, errors display per-model without blocking others

### Supabase Cloud Sync
- **Functionality**: Backup and restore chat data to/from Supabase database with automatic sync capabilities and GitHub authentication
- **Purpose**: Provide cloud backup using modern database infrastructure, enable cross-device sync, protect against data loss, and maintain backup history with Row Level Security
- **Trigger**: Click Database icon in header, or automatic sync at configured intervals
- **Progression**: Manual: Click Database icon → Sign in with GitHub → Configure Supabase credentials in Settings → Click "Sync to Supabase" → Data uploaded to database → Success confirmation. Auto: Enable auto-sync → Set interval → Automatic backups run in background → Toast notifications on completion
- **Success criteria**: Supabase connection established successfully, data synced without errors, conflict resolution works correctly (merge/remote/local options), auto-sync runs on schedule, restore functionality recovers data accurately, sync status displays correctly, Row Level Security ensures data privacy

## Edge Case Handling
- **Unauthenticated State**: Show branded login screen with feature highlights, prevent access to app features until authenticated
- **Authentication Failure**: Display clear error message if GitHub authentication fails, provide retry option
- **Session Expiry**: Handle expired authentication gracefully, allow user to re-authenticate without data loss
- **Missing API Configuration**: Show prominent setup prompt with clear instructions instead of allowing message attempts
- **API Connection Failure**: Display clear error message with troubleshooting hints (check endpoint, verify key, ensure API is running)
- **Empty Messages**: Disable send button when input is empty and no images attached to prevent API waste
- **Long Responses**: Auto-scroll during streaming, allow manual scroll to stop auto-scrolling
- **Malformed API Responses**: Gracefully handle errors and display user-friendly error messages
- **Code Block Edge Cases**: Handle inline code, missing language specifiers, and unclosed code blocks. Inline code uses accent color for visibility, block code defaults to plaintext when no language specified
- **Wallpaper Readability**: All wallpaper patterns use subtle opacity to ensure text remains readable
- **Image Upload Validation**: Enforce 20MB file size limit, validate image formats (JPEG, PNG, GIF, WebP), show clear error messages for invalid files
- **Multiple Images**: Support multiple image attachments per message, show file sizes, allow removal before sending
- **Session Edge Cases**: Handle deleting the current session by auto-selecting another, prevent deleting last session without creating a new one, clear input and attachments when switching sessions
- **Empty Sessions**: Show appropriate empty state for new sessions, auto-generate title from first message content
- **Session Search**: Filter sessions in real-time as user types, show "no results" state when search has no matches
- **Folder Management**: Allow folder renaming and color customization, maintain folder state when deleting folders (sessions move to uncategorized), preserve folder expand/collapse state during session
- **Tag Filtering**: Support multiple tag selection for filtering, show all sessions when no tags selected, combine tag filtering with search functionality
- **Compare View Errors**: Handle model-specific errors gracefully without blocking other models, show error alerts within model cards, allow continuing with successful models even if some fail
- **Compare Model Selection**: Require at least one model to be selected, disable compare button when no input provided, preserve last model selection for convenience
- **Compare Layout**: Adapt grid layout based on number of models (1 column for single model, 2 columns for 2 models, 3 columns for 3+ models on desktop), stack vertically on mobile
- **GitHub Authentication**: Handle unauthenticated state gracefully with clear instructions, verify GitHub token validity before sync operations
- **Sync Conflicts**: Detect when remote data differs from local data, provide three resolution strategies (merge, use remote, use local), warn users before overwriting data
- **Repository Creation**: Automatically create private backup repository if it doesn't exist, handle repository creation failures with helpful error messages
- **Network Failures**: Handle offline state gracefully, retry sync operations with exponential backoff, show clear error messages for network issues
- **Large Datasets**: Handle large chat histories efficiently, provide progress indicators for long uploads/downloads, implement chunking if needed

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
  - Button for send, clear, settings, and session management actions with hover states
  - Input and Textarea for message composition and session renaming
  - ScrollArea for message history and session list with auto-scroll behavior
  - Alert for error states and validation feedback
  - Badge for message metadata (timestamp, token count if available)
  - Separator for visual breaks between message groups
  - Select for theme, model, message density, and wallpaper choices
  - Sidebar component for session history and management
  - Folder organization with custom color selection (8 colors: Blue, Green, Orange, Purple, Pink, Red, Teal, Yellow)
  - Tag management system for flexible session categorization
  - Folder rename and color customization dialog
  
- **Customizations**: 
  - Custom markdown renderer with react-syntax-highlighter using VS Code Dark Plus theme
  - Support for bold, italic, links, headings, blockquotes, lists, and tables
  - Inline code highlighting with accent color for visibility
  - Code blocks with language badges, copy buttons, and professional syntax highlighting
  - Streaming text component that animates token arrival
  - Custom empty state illustration for first-time experience
  - Wallpaper system with 8 pattern options (none, dots, grid, waves, geometric, bubbles, diagonal, hexagon)
  - Visual wallpaper previews in settings with interactive selection
  - Session sidebar with collapsible/expandable functionality
  - Inline session title editing with save/cancel actions
  - Session search with real-time filtering
  - Folder creation with color picker (8 preset colors)
  - Folder editing dialog for renaming and color changes
  - Tag badges with filtering capability
  
- **States**: 
  - Buttons: Rest (subtle border), Hover (accent glow), Active (pressed inset), Disabled (muted with reduced opacity)
  - Inputs: Unfocused (subtle border), Focused (accent border glow), Error (destructive border), Success (primary border)
  - Messages: Sending (reduced opacity + pulse), Streaming (gradient shimmer on latest token), Complete (full opacity)
  - Sessions: Active (accent background), Hover (subtle highlight), Editing (inline input visible)
  
- **Icon Selection**: 
  - PaperPlaneRight for send
  - Gear for settings
  - Trash for clear conversation and delete sessions
  - Code for code block toggle
  - Copy for copy to clipboard
  - Check for confirmation states
  - Warning for error states
  - Image for image attachment
  - X for removing attached images and canceling edits
  - Plus for creating new chat sessions
  - PencilSimple for editing session titles
  - ChatCircle for session indicators
  - MagnifyingGlass for session search
  - Sidebar for toggling sidebar visibility
  - Folder/FolderOpen for folder indicators
  - FolderPlus for creating new folders
  - Tag for tag management
  - CaretRight/CaretDown for folder expand/collapse
  - DotsThree for dropdown menus
  - ArrowsLeftRight for model comparison toggle
  - FileArrowDown for export/import functionality
  - GithubLogo for GitHub cloud sync and authentication
  - SignOut for logout functionality
  - CloudArrowUp for uploading to cloud
  - CloudArrowDown for downloading from cloud
  - ArrowsClockwise for sync in progress
  - Lock for security features
  - CheckCircle for feature highlights
  
- **Spacing**: 
  - Container padding: p-6 (24px)
  - Message gaps: gap-4 (16px)
  - Input groups: gap-2 (8px)
  - Button padding: px-4 py-2 (16px/8px)
  - Card padding: p-4 (16px)
  - Sidebar width: 320px (w-80)
  - Session list gaps: gap-1 (4px)
  - Compare view grid gaps: gap-4 (16px)
  - Model selector horizontal gaps: gap-2 (8px)
  
- **Mobile**: 
  - Stack settings inline with chat on desktop, use sheet drawer on mobile
  - Reduce container padding to p-4 on small screens
  - Make input area sticky at bottom with safe area padding
  - Collapse header to icon-only buttons on mobile
  - Single column layout throughout
  - Sidebar slides over content on mobile, can be toggled via hamburger icon
  - Session search remains accessible in mobile sidebar
  - Compare view stacks model cards vertically on mobile, maintains grid on tablet/desktop
  - Compare mode takes full screen with close button to return to chat
