I want to completely redesign the UI/UX of this project while keeping the existing backend, RAG functionality, source indexing, chat functionality, and all working features intact.

The current UI is too basic and feels like an unfinished internal dashboard. I want this to look and feel like a polished, modern, production-grade SaaS product.

Use the existing project structure and codebase. First inspect the entire frontend and understand the current routing, components, state management, API integration, chat flow, source management, and existing functionality. Then implement the redesign properly instead of creating disconnected mock screens.

## 1. Public Homepage Must Be the Default Route

Currently, opening the project directly takes me to the dashboard.

Change this.

When the application is opened at the main URL, it should first show a proper **public homepage**.

The homepage should include:

* Professional navbar
* Brand/logo
* Home
* Features
* How It Works
* About
* Sources / Knowledge Base
* Chat / Get Started CTA
* Settings or appropriate navigation where relevant
* Responsive mobile navigation
* Professional hero section
* Clear product description
* RAG/source-grounded AI explanation
* Feature sections
* How the system works
* Source/document ingestion explanation
* Chat/answer/reference explanation
* Professional CTA section
* Footer
* Proper links to all public pages

The homepage should feel like a real SaaS product website, not an admin dashboard.

Do not simply move the existing dashboard onto the homepage.

Create a proper marketing/product website experience.

## 2. Proper Application Entry Flow

The structure should be approximately:

Public Website
→ Homepage
→ About
→ Features / How It Works
→ Get Started / Open Workspace
→ Application Dashboard

The dashboard should be treated as the actual authenticated/workspace application.

The root URL should NOT automatically open the dashboard.

The user should intentionally enter the application through something like:

**Get Started**
or
**Open Workspace**
or
**Start Chat**

Use the existing routing architecture where possible instead of unnecessarily rewriting the whole application.

## 3. Completely Redesign the Application Sidebar

The current sidebar is too small and only contains a few options such as:

* Dashboard
* Sources
* Chat
* Settings

This feels incomplete.

Create a much more professional application navigation system.

The sidebar should contain logically grouped options such as:

### Workspace

* Overview / Dashboard
* Chat
* Sources
* Documents
* Websites
* Search
* Collections / Knowledge Base

### Management

* Upload
* Activity / Indexing
* History
* Analytics

### Configuration

* Settings
* AI / Model Settings
* Retrieval Settings
* Integrations

### Account

* Profile
* Preferences
* Help / Documentation

Do not blindly add unnecessary pages if the backend does not support them.

For pages that are not currently implemented, create a clean UI structure that clearly communicates the section without pretending that backend functionality exists.

The sidebar should support:

* Icons
* Active state
* Hover state
* Tooltips when collapsed
* Expand/collapse behavior
* Proper spacing
* Section labels
* Responsive behavior
* Mobile drawer navigation
* Workspace/brand area
* User/profile area

The sidebar should look like a modern AI SaaS application.

## 4. Add a Proper Global Search

Add a professional search experience to the application header.

The search should allow the user to search across relevant knowledge-base content where the existing backend supports it.

Design it like a real SaaS command/search interface.

Include:

* Search icon
* Search input
* Keyboard shortcut such as `/` or `Ctrl/Cmd + K`
* Search results
* Recent searches where appropriate
* Empty state
* Loading state
* No-results state

Do not add fake search results.

Connect it to existing functionality where possible.

## 5. Source Upload Must Open a Centered Modal

This is very important.

When the user clicks:

**Add Source**
or
**Upload Source**

DO NOT navigate to another ugly/basic page.

Instead, open a professional centered modal/dialog.

The modal should contain two clear source options:

### Website URL

A proper URL input:

`https://example.com`

Include:

* URL input
* URL validation
* Clear label
* Helpful description
* Submit/Add Website button
* Loading state
* Error state
* Success state

### Document Upload

Provide a proper drag-and-drop upload area.

For example:

**Drag & drop your document here**

or

**Browse files**

Support the document formats that the existing backend already supports.

Show:

* Selected filename
* File size
* File type
* Upload progress/loading state
* Remove file option
* Upload button
* Error handling
* Success state

The modal should look polished and compact.

The user should be able to choose between:

**Website**
and
**Document**

without leaving the current page.

Clicking outside the modal or pressing Escape should close it.

The modal must be hidden by default.

## 6. Sources Page Redesign

Completely redesign the Sources page.

It should provide a professional knowledge-base management interface.

Include:

* Page title
* Description
* Add Source button
* Search sources
* Filters
* Source type filter
* Status filter
* Sort options
* Source cards/table
* Website sources
* Document sources
* Processing state
* Ready state
* Failed state
* Source metadata
* Last indexed time
* Actions menu

Each source should clearly communicate its status.

For example:

**Ready**
**Processing**
**Failed**

Do not use excessive cards if a table/list would provide a cleaner experience.

Use the layout that makes the most sense for managing many sources.

## 7. Dashboard Redesign

The current dashboard shown in the screenshot is too empty and basic.

Redesign it into a useful workspace overview.

Include useful metrics based on actual backend data:

* Total Sources
* Ready Sources
* Processing
* Failed
* Documents
* Websites
* Recent Activity

Also include:

* Recent sources
* Recent searches/questions
* Indexing activity
* Quick actions
* Start Chat
* Add Source
* Upload Document

Do not invent fake statistics.

If the actual value is zero, show zero.

## 8. Chat Page Must Be Completely Different

This is extremely important.

When the user enters the Chat page, it should feel like a dedicated AI chat application.

The normal application sidebar should NOT remain visible if it makes the chat area unnecessarily constrained.

The Chat page should use the available screen width properly.

The layout should be:

---

## Top Chat Header

```
          Chat Conversation

   User message

   AI answer

   Sources button
```

---

```
          Message Composer
```

---

Do not keep unnecessary dashboard cards, navigation panels, metrics, or unrelated UI elements around the conversation.

The chat experience should be clean and focused.

## 9. Chat Answer Loading / Thinking Experience

When the user asks a question, do not immediately show an empty response area.

Show a polished AI processing experience.

For example:

**Thinking…**

and, when source retrieval is actually happening:

**Searching your sources…**

The loading state should be animated but subtle.

Important:

The loading indicators must represent the actual state.

Once the answer is completely generated:

* Remove "Thinking…"
* Remove "Searching your sources…"
* Display the final answer
* Display the Sources button if sources were actually used

Never leave a loading indicator visible after the response has completed.

## 10. Sources Button Under AI Answer

Do NOT display a large list of source references directly underneath every answer.

The chat should remain clean.

If sources exist, show only something like:

**[ Sources (5) ]**

The source details should remain hidden.

When the user clicks the Sources button:

→ Open a centered professional modal.

The modal should show:

**Sources (5)**

Then list every source used for that specific answer.

Each source can include:

* Source title/name
* Website/document type
* Relevant metadata
* Reference information
* Link if available
* Any useful citation details already provided by the backend

The modal should be scrollable if there are many sources.

When the user closes the modal:

→ Return to the exact same chat state.

The Sources modal must NEVER automatically open.

Default state must be:

`isSourcesModalOpen = false`

Only the user's explicit click on the Sources button can open it.

## 11. Chat Composer

Create a professional message composer at the bottom.

Include:

* Large input area
* Send button
* Enter to send
* Shift + Enter for newline
* Attachment/source-related action if supported
* Disabled state while appropriate
* Loading state
* Proper error handling

The composer should remain visually anchored near the bottom of the viewport.

The conversation area should scroll independently.

## 12. Chat Empty State

Before the first question, do not show unnecessary dashboard content.

Show a clean chat welcome state.

For example:

**Ask your knowledge base anything**

Then provide a few useful suggestion prompts based on the application's purpose.

Example:

* "Summarize the main topics in my sources"
* "What does my knowledge base say about..."
* "Find information about..."

These should be suggestions, not fake conversations.

## 13. Responsive Design

The entire redesign must be responsive.

Desktop:

* Proper sidebar
* Full workspace
* Clean content width
* Professional spacing

Tablet:

* Collapsible sidebar
* Responsive content

Mobile:

* Sidebar becomes a drawer
* Proper mobile header
* Full-width chat
* Responsive modal
* Touch-friendly controls
* No horizontal overflow

The UI must feel intentionally designed for mobile, not simply shrink the desktop layout.

## 14. Visual Design Direction

The design should feel like a modern AI/SaaS product.

Use:

* Clean typography
* Strong visual hierarchy
* Consistent spacing
* Professional cards
* Subtle borders
* Soft shadows where appropriate
* Clean icons
* Smooth transitions
* Proper hover states
* Proper focus states
* Consistent button styles
* Consistent radius system
* Professional empty states
* Professional loading states

Avoid:

* Excessive gradients
* Random colors
* Oversized cards
* Cluttered dashboards
* Too many borders
* Unnecessary animations
* Generic template-looking UI
* Huge amounts of empty space
* Fake statistics
* Fake functionality

The existing purple/white visual identity can be retained if it fits the current product, but refine it into a much more premium and consistent design system.

## 15. Important Functional Rule

This is a UI/UX redesign, NOT a request to break or replace the existing functionality.

Before making changes:

1. Inspect the entire existing frontend.
2. Identify all existing routes.
3. Identify all API calls.
4. Identify source ingestion logic.
5. Identify document upload logic.
6. Identify website indexing logic.
7. Identify RAG retrieval logic.
8. Identify chat streaming/state logic.
9. Identify source citation/reference logic.
10. Identify existing modal/state logic.

Then redesign the interface around the existing functionality.

Do not replace working backend functionality with mock data.

Do not remove existing API integrations.

Do not rewrite working RAG logic unnecessarily.

Do not create duplicate implementations of existing features.

## 16. Routing Structure

Create a clean routing structure similar to:

`/`
→ Public Homepage

`/about`
→ About

`/features`
→ Features / How It Works

`/app`
→ Application Dashboard

`/app/sources`
→ Sources

`/app/chat`
→ Dedicated Chat

`/app/search`
→ Search

`/app/settings`
→ Settings

Use the project's existing routing approach if it already has one.

The exact routes can be adjusted to fit the existing architecture.

## 17. Final Quality Requirement

Do not just make individual pages look better.

I want the entire product experience to feel connected.

The user journey should be:

**Open website**
→ Beautiful homepage
→ Understand what Sourcebound does
→ Click Get Started
→ Enter application
→ See professional workspace
→ Add a website/document
→ Source gets indexed
→ Open Chat
→ Ask a question
→ See proper thinking/searching state
→ Receive answer
→ See one Sources button
→ Click Sources
→ Review sources in a clean popup
→ Close popup
→ Continue chatting

Every transition should feel intentional and polished.

Use the uploaded screenshot as a reference for the current UI, but treat it as the **starting point that needs a substantial redesign**, not as the final design to preserve.

Before finishing, test the complete flow and make sure there are no UI state bugs, especially:

* Sources modal opening automatically
* Sources modal remaining open
* Searching indicator remaining after answer completion
* Chat layout showing unnecessary sidebar content
* Upload modal opening incorrectly
* Broken navigation
* Broken responsive layouts
* Fake data appearing
* Existing backend functionality being disconnected

The final result should look like a complete, professional AI knowledge-base/RAG SaaS product rather than a basic dashboard.
