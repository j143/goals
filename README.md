# LinkedIn Career Questions Chrome Extension

A Chrome extension that shows contextual career questions while browsing LinkedIn to help you stay focused on your career goals.

## Features

- **Goal-Based Questions**: Set your target role once and get relevant questions based on LinkedIn content
- **Smart Content Detection**: Automatically detects job posts, company updates, skill mentions, and network posts
- **Minimal UI**: Unobtrusive overlay that appears in the bottom-right corner
- **Quick Interactions**: Simple Yes/Relevant or No/Skip buttons
- **Auto-Hide**: Questions disappear after 5 seconds if not answered

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Visit LinkedIn and click the extension icon to set your career goal

## How It Works

1. **Setup**: Click the extension icon and enter your target role (e.g., "Software Engineer", "Product Manager")
2. **Browse**: Normal LinkedIn browsing - the extension works in the background
3. **Engage**: When relevant content is detected, a question appears asking if it's worth your attention
4. **Focus**: Answer or ignore questions to stay focused on career-relevant content

## Question Types

- **Job Posts**: "Is this role aligned with your career direction?"
- **Company News**: "Should you research this company further?"
- **Skill Mentions**: "Do you need to develop this skill?"
- **Network Posts**: "Worth engaging with this person?"

## Privacy

- All data stored locally in your browser
- No external servers or data collection
- Only works on LinkedIn pages
- Goal and responses stay on your device

## Technical Details

- Built with Chrome Extension Manifest V3
- Uses content scripts for LinkedIn integration
- Local storage for goal persistence
- Simple keyword matching (no AI dependencies)