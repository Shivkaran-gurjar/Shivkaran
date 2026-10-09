# Shivkaran AI

Build “Shivkaran” — AI-Powered YouTube Experience

You are an expert product designer, frontend engineer, backend engineer, and AI application architect.

Build a modern web application called Shivkaran.

Product Vision

Shivkaran is a YouTube-focused intelligent media platform.

YouTube remains the primary content source, but Shivkaran provides a much more beautiful, organized, personalized, and AI-powered experience around YouTube content.

Do NOT turn this into a generic social network, productivity suite, email client, or “everything app”.

The product should stay focused on:

YouTube discovery

Video and music playback

Personal library

Smart recommendations

AI-powered understanding of YouTube content

Smart playlists and queues

A premium, polished user experience

The product should feel like a serious startup-quality application rather than a basic college project.

1. Brand

Product name:

Shivkaran

Tagline:

“Your YouTube. Smarter.”

Alternative supporting line:

“Discover, watch, listen, and understand.”

Brand personality:

Premium

Modern

Intelligent

Minimal

Fast

Personal

Immersive

Avoid childish UI, excessive gradients, excessive glassmorphism, unnecessary animations, and visual clutter.

2. Core Pages

Create these primary pages:

Home

Personalized dashboard containing:

Continue Watching

Recently Played

Recommended For You

Trending

Music For You

Educational / Learning suggestions

Quick AI actions

Recently saved content

Search

A powerful YouTube search interface with:

Search bar

Suggestions

Search history

Filters

Video results

Music results

Channels

Playlists

Duration filter

Upload-date filter

Sorting options

Watch / Player

Dedicated immersive player page containing:

YouTube embedded player

Video title

Channel

Like/save controls

Queue

Related content

AI assistant panel

Description

Chapters/topics where available

Comments link/access where supported

Share action

Music

A music-oriented section using YouTube content:

Recently played

Favorite songs

Mood-based discovery

Artist/channel discovery

Smart mixes

Custom playlists

Library

Personal content organization:

Favorites

Watch Later

Recently Watched

Playlists

Saved videos

Saved music

AI

A dedicated AI experience for interacting with YouTube content.

Profile

User preferences, history, personalization settings, and account controls.

3. Main Player Experience

The player is one of the most important parts of Shivkaran.

Use the official YouTube embedded player / supported YouTube APIs.

Do NOT download, rip, extract, cache, or separate YouTube audio/video content.

The player experience should include:

Play / pause

Previous / next

Volume

Seek

Playback speed

Quality where supported

Full screen

Mini player

Queue

Shuffle

Repeat

Picture-in-picture where supported

Keyboard shortcuts

Save

Add to playlist

Create a custom surrounding UI around the official player so the overall experience feels like Shivkaran rather than a plain YouTube page.

4. AI Features

AI is the main differentiator.

For the currently selected YouTube video, provide an AI side panel called:

“Ask Shivkaran”

Actions:

Summarize this video

Give key points

Explain this simply

Explain difficult concepts

Ask anything

Generate notes

Generate quiz

Generate flashcards

Translate / explain in another language

Create chapter/topic breakdown

Give important takeaways

The AI response should understand the current video context as much as the available metadata/transcript permits.

Do not pretend to know information that is not available.

Clearly indicate when transcript or context is unavailable.

5. Smart Search

Make search much more intelligent than a standard YouTube search interface.

Support natural-language queries such as:

“I want beginner Python tutorials around 30 minutes.”

“Find energetic Hindi songs.”

“Show me videos to learn DBMS from basics.”

“Find interviews about artificial intelligence.”

Interpret the intent and use YouTube search/filter capabilities appropriately.

Do not invent videos.

6. Smart Recommendations

Build a recommendation layer using available user behavior and YouTube metadata.

Consider:

Watch history

Search history

Saved videos

Likes/favorites inside Shivkaran

Playlist behavior

Topics

Categories

Channels

Artists

Duration

Recent activity

Show explanations such as:

“Because you watched…”

Do not over-personalize too aggressively.

Provide controls for users to clear/reset personalization.

7. Smart Queue

Create a beautiful queue system.

Users should be able to:

Add videos

Remove videos

Reorder videos

Shuffle

Repeat

Play next

Save queue as playlist

Allow natural-language queue generation.

Examples:

“Create a 1-hour workout music queue.”

“Create a beginner DSA learning sequence.”

“Give me 5 relaxing songs.”

“Create a Python learning session.”

Use available YouTube search results to create the queue.

8. Music Experience

Although Shivkaran is not only a music app, music should have an excellent experience.

Include:

Song discovery

Artist/channel discovery

Mood discovery

Smart mixes

Favorite songs

Music playlists

Recently played

Queue

Shuffle

Repeat

Rich now-playing interface

Do not attempt to bypass YouTube playback restrictions.

9. Beautiful UI

Design language:

Dark-first interface

Modern typography

Large artwork/thumbnails

Rounded but controlled cards

Excellent spacing

Smooth transitions

Strong visual hierarchy

Minimal clutter

Responsive layout

Desktop + tablet + mobile

Suggested layout:

Sidebar:

Home

Discover

Music

Library

AI

History

Main content:

Personalized content

Recommendations

Search

Collections

Bottom or persistent player:

Thumbnail

Title

Artist/channel

Previous

Play/pause

Next

Progress

Volume

Queue

On desktop, allow the AI assistant to appear as a contextual side panel.

10. UI Quality Requirements

The application must feel:

Fast

Premium

Smooth

Responsive

Consistent

Include:

Skeleton loading

Empty states

Error states

Toast notifications

Hover states

Keyboard accessibility

Mobile navigation

Proper loading indicators

Do not create huge blocks of text.

Do not overcrowd the home page.

Do not use random UI components just to show features.

Every component should serve a purpose.

11. Recommended Technology Stack

Frontend:

React

TypeScript

Tailwind CSS

Framer Motion

Backend:

Python

FastAPI

Database:

PostgreSQL

Authentication:

Google OAuth and/or secure JWT/session-based authentication

YouTube integration:

YouTube Data API

YouTube IFrame Player API

AI:

Gemini API or another configurable LLM provider

State management:

Zustand or another lightweight modern solution

Data fetching:

TanStack Query

Deployment architecture should allow:

Frontend deployment independently

Backend deployment independently

Secure environment variables

Database migrations

12. Backend Architecture

Create clean modular backend services.

Suggested structure:

backend/
app/
main.py
config/
api/
models/
schemas/
services/
youtube/
ai/
recommendations/
playlists/
history/
users/
repositories/
utils/

Frontend:

frontend/
src/
components/
pages/
layouts/
hooks/
services/
store/
types/
utils/

Keep YouTube API logic separate from AI logic.

Keep recommendation logic modular so it can evolve later.

13. Data Model

Design a clean relational database.

Entities may include:

User

UserPreferences

Video

Channel

Playlist

PlaylistItem

Favorite

WatchHistory

SearchHistory

Queue

QueueItem

AIConversation

AIMessage

SavedInsight

Store YouTube identifiers and metadata necessary for the application rather than storing copyrighted media files.

14. AI Context Architecture

When a user opens a video, create a context object similar to:

Video ID
Title
Channel
Description
Category
Published date
Available transcript/context
User question
Relevant saved user context

Send only the necessary information to the AI layer.

The AI should answer based on available context.

For educational videos, support structured output:

Summary
Key Concepts
Important Points
Notes
Quiz
Flashcards

15. Performance

Optimize heavily for speed.

Requirements:

Lazy loading

Image optimization

API caching where permitted

Debounced search

Pagination/infinite scrolling

Efficient database queries

Avoid unnecessary re-renders

Fast initial load

The UI should feel responsive even on average Indian internet connections.

16. Security

Implement:

Secure authentication

Input validation

API key protection

Rate limiting

Server-side secret management

Proper CORS

Authorization checks

Protection against common injection attacks

Safe handling of AI prompts

No API keys exposed in frontend code unless the API explicitly requires a public key

Never trust client-side permissions.

17. YouTube Compliance

Use official, supported YouTube APIs and the official embedded player.

Do NOT implement:

YouTube video downloading

YouTube audio extraction

Audio-only ripping from YouTube

Circumventing YouTube playback restrictions

Removing YouTube attribution when required

Blocking or modifying YouTube ads/player behavior in prohibited ways

Caching copyrighted media for offline playback

Shivkaran should provide independent value around YouTube content, not illegally reproduce or redistribute the underlying media.

18. Important UX Concept

The central interaction should be:

CONTENT → AI → ACTION

Examples:

Video
→ Summarize
→ Save notes

Video
→ Ask question
→ Understand

Video
→ Generate quiz
→ Learn

Music
→ Discover similar
→ Add to queue

Search
→ Refine
→ Build playlist

This should be visible throughout the product.

19. First-Version Scope

Do not build everything at once.

Build V1 with:

Authentication

Home

YouTube search

Video results

Official YouTube player

Queue

Favorites

Watch history

Playlists

Library

Basic AI video summary

Ask Shivkaran

Key points

Responsive premium UI

Make V1 stable and polished before adding advanced recommendation algorithms.

20. Future Expansion Architecture

Design the code so these can be added later without major rewrites:

Advanced recommendations

Mood detection

Smart learning paths

Better transcript intelligence

Voice interaction

More AI tools

Advanced personalization

More media-source integrations

Do not implement these unless requested.

21. Development Process

Follow this order:

Phase 1

Architecture + project setup

Phase 2

Database + authentication

Phase 3

YouTube integration

Phase 4

Player + queue

Phase 5

Library + history + playlists

Phase 6

AI layer

Phase 7

Recommendation system

Phase 8

UI polish + responsive optimization

Phase 9

Testing + security + performance

Phase 10

Deployment

After each phase, verify that the application still works.

22. Code Quality

Write production-quality code.

Requirements:

Type-safe frontend

Clean Python backend

Meaningful names

Reusable components

Modular services

Error handling

Logging

Environment configuration

Unit tests for important backend logic

API validation

Documentation

Do not generate giant monolithic files.

Do not duplicate code.

Do not create fake APIs or fake functionality without clearly marking it.

23. Important Instruction

Do not simply create a YouTube clone.

Create a distinct product with this identity:

YouTube provides the content.
Shivkaran provides the experience and intelligence.

The final application should feel like:

YouTube + intelligent search + premium player + personal library + AI understanding + smart queue + personalized discovery

but with its own unique UI, architecture, and product identity.

Start by creating the complete system architecture and folder structure, then implement the application phase by phase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1dd89a3d-e1e5-4ab6-99c7-3ac76c3dbd87).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
