# Mission Control - Kanban Task Board

A modern, dark-themed Kanban task board built with React, featuring drag-and-drop functionality, Epic-based filtering, activity tracking, and a sleek UI inspired by mission control interfaces.

![Mission Control Kanban Board](https://img.shields.io/badge/React-v18-blue) ![Vite](https://img.shields.io/badge/Vite-v6-646CFF) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38BDF8)

## ✨ Features

- **🎯 Epic Management** - Organize tasks into Epics (large initiatives) with color-coded indicators
- **🔍 Epic Filtering** - Filter the entire board by Epic to focus on specific work streams
- **👤 Assignee System** - Assign tasks to Jason, Miti, or leave Unassigned
- **🎨 Assignee Filtering** - Filter board by assignee to see "My Tasks" or team member tasks
- **🔗 Task Dependencies** - Create dependency chains with visual blocked indicators
- **🔒 Dependency Blocking** - Tasks show "blocked" status when dependencies are incomplete
- **🎨 Dark Theme UI** - Sleek, modern interface with subtle borders and dark backgrounds
- **📊 4 Kanban Columns** - Recurring, Backlog, In Progress, Review
- **🔄 Drag & Drop** - Intuitive task management with @dnd-kit
- **🏷️ Color-Coded Tags** - Organize tasks with bug, feature, improvement, urgent, and documentation labels
- **📈 Stats Dashboard** - Track tasks this week, in progress, total count, and completion rate (updates based on filters)
- **📋 Activity Feed** - Real-time sidebar showing recent actions (created, moved, completed, deleted)
- **💾 Local Storage** - All data persists in browser, no backend needed
- **✏️ Full CRUD** - Add, edit, delete, and complete tasks and epics with ease
- **⏱️ Smart Timestamps** - Relative time display (e.g., "2h ago")
- **📱 Collapsible Sidebar** - Epic sidebar can be collapsed to maximize board space

## 👥 Assignee Feature

### Assigning Tasks

Tasks can be assigned to team members to track ownership and responsibility.

**Available assignees:**
- **Miti** - Purple badge with "M" initial
- **Jason** - Blue badge with "J" initial
- **Unassigned** - No assignee set

### Assignee Functionality

- **Assign in TaskModal** - Select assignee when creating or editing tasks using button group
- **Visual Badges** - Task cards display assignee initials in colored circles (M for Miti, J for Jason)
- **Filter by Assignee** - Click assignee in sidebar to show only their tasks
  - "Everyone" - Shows all tasks
  - "Miti" - Shows only Miti's tasks
  - "Jason" - Shows only Jason's tasks
  - "Unassigned" - Shows tasks with no assignee
- **Task Counts** - Each assignee shows real-time task count
- **Combined Filtering** - Assignee and Epic filters work together (e.g., "Miti's tasks in Q1 Platform Improvements Epic")

### Important Context

**If tasks are assigned to Miti, she should work on them.** This sets up future functionality where Miti can proactively identify and work on her assigned tasks.

## 🔗 Task Dependencies Feature

### What are Task Dependencies?

Task dependencies create relationships between tasks, ensuring work happens in the correct order. For example:
- **Task A**: "Jason sets up S3 bucket" (assigned to Jason)
- **Task B**: "Miti builds S3 integration" (assigned to Miti, **depends on Task A**)

Task B cannot be completed until Task A is done (in Review column).

### Dependency Functionality

- **Set Dependencies** - In TaskModal, select which tasks this one depends on
- **Blocked Status** - Tasks with incomplete dependencies show:
  - 🔒 Lock icon
  - Orange "Blocked by X tasks" banner
  - Orange border styling
  - Hover tooltip showing blocking tasks
- **Dependency Validation**:
  - Circular dependency detection (prevents A → B → A loops)
  - Alert shown if circular dependency attempted
  - Cannot depend on self
- **Smart Status Detection**:
  - Task is **blocked** if any dependency is not in "Review" column
  - Task is **unblocked** when all dependencies are in "Review"
- **Visual Indicators**:
  - Blocked tasks highlighted in orange
  - Dependency count shown on card
  - List of blocking tasks on hover

### Example Workflow

1. **Setup Task**: Jason creates "Setup S3 bucket" (assigned to Jason)
2. **Dependent Task**: Miti creates "Build S3 integration" (assigned to Miti)
   - In TaskModal, check "Setup S3 bucket" under Dependencies
   - Save task
3. **Blocked State**: "Build S3 integration" shows as 🔒 **Blocked by 1 task**
4. **Jason Completes**: Jason moves "Setup S3 bucket" to Review
5. **Unblocked**: "Build S3 integration" automatically becomes unblocked
6. **Miti Works**: Miti can now work on the integration task

## 🎯 Epic Feature

### What are Epics?

Epics are large initiatives or themes that group related tasks together. For example:
- **Q1 Platform Improvements** - All platform enhancement tasks
- **Mobile App Launch** - iOS and Android development tasks
- **Security Hardening** - Security-related work items

### Epic Functionality

- **Create Epics** - Define new epics with name, description, and color
- **Link Tasks to Epics** - Assign tasks to epics when creating or editing
- **Filter by Epic** - Click an epic in the sidebar to show only its tasks
- **Visual Indicators** - Tasks display epic color badges on cards
- **Task Counts** - Each epic shows how many tasks are linked to it
- **Edit & Delete** - Manage epics with inline edit/delete actions (deleting an epic unlinks tasks, doesn't delete them)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mission-control-kanban.git
cd mission-control-kanban
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **@dnd-kit** - Drag and drop functionality
- **LocalStorage API** - Data persistence

## 📦 Project Structure

```
mission-control-kanban/
├── src/
│   ├── components/
│   │   ├── ActivityFeed.jsx    # Activity sidebar
│   │   ├── Column.jsx           # Kanban column container
│   │   ├── EpicSidebar.jsx      # Epic list and filtering sidebar
│   │   ├── EpicModal.jsx        # Epic creation/editing modal
│   │   ├── StatsBar.jsx         # Top statistics bar
│   │   ├── TaskCard.jsx         # Individual task card with epic badge
│   │   └── TaskModal.jsx        # Add/edit task modal with epic selector
│   ├── App.jsx                  # Main app component
│   ├── index.css                # Global styles
│   └── main.jsx                 # Entry point
├── tailwind.config.js
└── package.json
```

## 🎯 Usage

### Managing Epics

#### Creating an Epic
1. Click "+ New Epic" in the left sidebar
2. Enter epic name, description (optional), and choose a color
3. Click "Create" to save

#### Editing an Epic
1. Hover over an epic in the sidebar
2. Click the ✏️ icon
3. Make changes and click "Save Changes"

#### Deleting an Epic
1. Hover over an epic in the sidebar
2. Click the 🗑️ icon
3. Confirm deletion (tasks will be unlinked but not deleted)

#### Filtering by Epic
1. Click any epic in the sidebar to filter the board
2. Only tasks linked to that epic will display
3. Stats update to reflect the filtered view
4. Click "All Tasks" to remove the filter

### Creating Tasks
1. Click "+ New Task" button
2. Fill in title, description, select column
3. **Select an Epic** from the dropdown (optional)
4. Add tags
5. Click "Create Task"

### Managing Tasks
- **Drag & Drop**: Click and drag tasks between columns
- **Edit**: Hover over a task and click the ✏️ icon
  - Change epic assignment in the edit modal
- **Complete**: Click the ✓ icon to mark as done (moves to activity feed)
- **Delete**: Click the 🗑️ icon to remove
- **Epic Badge**: Task cards show a colored epic indicator when linked

### Activity Feed
The right sidebar shows all recent actions with timestamps, keeping you updated on task movements and changes. Activity feed is **not filtered** by epic - it shows all activity.

## 🌐 Deployment

### Deploy to AWS Amplify (Recommended)

1. Push your code to GitHub
2. Visit [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Click "New app" → "Host web app"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18+ (or use `.nvmrc` if needed)
6. Click "Save and Deploy"

AWS Amplify will automatically deploy on every push to your main branch.

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Vercel auto-detects Vite - click "Deploy"

### Deploy to GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/mission-control-kanban",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.js`:
```js
export default defineConfig({
  base: '/mission-control-kanban/',
  plugins: [react()],
})
```

4. Deploy:
```bash
npm run deploy
```

## 🎨 Customization

### Epic Colors
Epic colors are preset in `src/components/EpicModal.jsx` and `src/components/EpicSidebar.jsx`:

```js
const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
];
```

### Theme Colors
Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  dark: {
    bg: '#0a0a0f',      // Main background
    card: '#15151f',    // Card background
    border: '#2a2a3a',  // Border color
    hover: '#1f1f2f',   // Hover state
  }
}
```

### Tags
Add or modify tags in `src/components/TaskModal.jsx`:

```js
const AVAILABLE_TAGS = ['bug', 'feature', 'improvement', 'urgent', 'documentation'];
```

### Columns
Modify columns in `src/App.jsx`:

```js
const COLUMNS = ['Recurring', 'Backlog', 'In Progress', 'Review'];
```

## 💾 Data Structure

### Epic Object
```js
{
  id: 'epic-1',
  name: 'Q1 Platform Improvements',
  description: 'Major platform enhancements for Q1 2026',
  color: '#3b82f6',
  createdAt: '2026-01-25T10:00:00.000Z'
}
```

### Task Object
```js
{
  id: 1,
  title: 'Fix authentication bug',
  description: 'Users reporting login issues on mobile',
  column: 'In Progress',
  tags: ['bug', 'urgent'],
  epicId: 'epic-1',  // Links to epic
  assignedTo: 'Miti', // Assigned to Miti (or 'Jason', or null for unassigned)
  dependsOn: [5, 8], // Array of task IDs this task depends on
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-03T15:30:00.000Z'
}
```

### Dependency Logic
- **Blocked**: Task has dependencies AND any dependency is not in "Review" column
- **Unblocked**: Task has no dependencies OR all dependencies are in "Review" column
- **Circular Check**: System prevents circular dependencies (A → B → A)

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

Built with ❤️ using React + Vite + Tailwind CSS
