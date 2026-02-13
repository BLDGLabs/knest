# Knest - Task Management System

A modern, dark-themed task management system built with React and AWS DynamoDB, featuring dual views (Kanban board & prioritized list), drag-and-drop functionality, Epic-based filtering, due dates, priority management, and a sleek UI inspired by mission control interfaces.

![Knest Task Manager](https://img.shields.io/badge/React-v18-blue) ![Vite](https://img.shields.io/badge/Vite-v7-646CFF) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8) ![DynamoDB](https://img.shields.io/badge/DynamoDB-AWS-orange)

## ✨ Features

### Dual View System
- **📋 List View** - NEW! Prioritized task list with smart filtering and sorting
  - Priority-based sorting (Urgent → High → Medium → Low)
  - Due date tracking with visual overdue indicators
  - Filter by Today, Upcoming, Overdue
  - Quick-complete checkbox interface
  - Auto-prioritization based on due dates
- **📊 Board View** - Classic Kanban board with drag-and-drop
  - Three columns: Backlog, In Progress, Done
  - Drag tasks between columns
  - Visual cards with full task details

### Task Management
- **📅 Due Dates** - Set deadlines and track progress
- **🚨 Priority Levels** - 5 priority tiers (Urgent, High, Medium, Low, None)
- **🎯 Epic Management** - Organize tasks into Epics (large initiatives) with color-coded indicators
- **🔍 Epic Filtering** - Filter the entire board by Epic to focus on specific work streams
- **👤 Assignee System** - Assign tasks to Jason, Miti, or leave Unassigned
- **🎨 Assignee Filtering** - Filter board by assignee to see "My Tasks" or team member tasks
- **🔗 Task Dependencies** - Create dependency chains with visual blocked indicators
- **🔒 Dependency Blocking** - Tasks show "blocked" status when dependencies are incomplete

### Technical Features
- **☁️ DynamoDB Backend** - Cloud-persisted data with AWS DynamoDB single-table design
- **🔄 Drag & Drop** - Intuitive task management with @dnd-kit (Board view)
- **🏷️ Color-Coded Tags** - Organize tasks with bug, feature, improvement, urgent, and documentation labels
- **📈 Stats Dashboard** - Track tasks this week, in progress, total count, and completion rate
- **📋 Activity Feed** - Real-time sidebar showing recent actions
- **✏️ Full CRUD** - Add, edit, delete, and complete tasks and epics with ease
- **📱 Collapsible Sidebar** - Epic sidebar can be collapsed to maximize board space
- **🎨 Dark Theme UI** - Sleek, modern interface with subtle borders and dark backgrounds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- AWS Account with DynamoDB access
- AWS credentials (Access Key ID and Secret Access Key)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/mission-control-kanban.git
cd mission-control-kanban
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure AWS credentials:**

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-west-2
DYNAMODB_TABLE_NAME=mission-control-tasks
```

**Getting AWS Credentials:**
1. Log into AWS Console → IAM
2. Create a new user (or use existing)
3. Attach policy: `AmazonDynamoDBFullAccess`
4. Create access keys under "Security credentials"
5. Copy Access Key ID and Secret Access Key to `.env`

4. **Create DynamoDB table:**
```bash
node scripts/setup-dynamodb.js
```

This creates the `mission-control-tasks` table with:
- Primary keys: PK (partition), SK (sort)
- GSI1: epicId-based queries
- GSI2: assignee-based queries
- Billing mode: On-demand (pay per request)

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser to `http://localhost:5173`**

On first load, sample data will be automatically migrated to DynamoDB.

## 🗄️ DynamoDB Schema

### Single-Table Design

The app uses a single-table design pattern for optimal DynamoDB performance:

#### Epic Record
```
PK: EPIC#{epicId}
SK: METADATA
Attributes: name, description, color, createdAt
```

#### Task Record
```
PK: TASK#{taskId}
SK: METADATA
Attributes: title, description, column, epicId, assignedTo, tags, createdAt, updatedAt, completedAt
```

#### Task Dependency Records
```
DEPENDS_ON:
  PK: TASK#{taskId}
  SK: DEPENDS_ON#{dependentTaskId}

BLOCKS:
  PK: TASK#{dependentTaskId}
  SK: BLOCKS#{taskId}
```

### Global Secondary Indexes (GSIs)

**GSI1 - Epic Filter:**
- PK: `epicId`
- SK: `taskId`
- Use case: Query all tasks for a specific epic

**GSI2 - Assignee Filter:**
- PK: `assignedTo`
- SK: `createdAt`
- Use case: Query all tasks for a specific assignee

### Data Access Patterns

| Pattern | Method | Index |
|---------|--------|-------|
| Get all epics | Scan | Main table |
| Get all tasks | Scan | Main table |
| Get tasks by epic | Query | GSI1 |
| Get tasks by assignee | Query | GSI2 |
| Get task dependencies | Query | Main table (PK + SK prefix) |
| Create/Update/Delete | Put/Delete | Main table |

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **@dnd-kit** - Drag and drop functionality
- **AWS SDK v3** - DynamoDB client
- **DynamoDB** - NoSQL database (cloud-persisted data)

## 📦 Project Structure

```
mission-control-kanban/
├── scripts/
│   └── setup-dynamodb.js       # DynamoDB table creation script
├── src/
│   ├── components/
│   │   ├── ActivityFeed.jsx    # Activity sidebar
│   │   ├── Column.jsx          # Kanban column container
│   │   ├── EpicSidebar.jsx     # Epic list and filtering sidebar
│   │   ├── EpicModal.jsx       # Epic creation/editing modal
│   │   ├── StatsBar.jsx        # Top statistics bar
│   │   ├── TaskCard.jsx        # Individual task card
│   │   └── TaskModal.jsx       # Add/edit task modal
│   ├── services/
│   │   └── dynamodb.js         # DynamoDB service layer (CRUD operations)
│   ├── App.jsx                 # Main app component
│   ├── index.css               # Global styles
│   └── main.jsx                # Entry point
├── .env                        # AWS credentials (DO NOT COMMIT)
├── .env.example                # Environment variable template
├── tailwind.config.js
├── vite.config.js              # Vite config with env loading
└── package.json
```

## 🎯 Usage

### Switching Between Views

#### Board View (Kanban)
- Click the **Board icon** (columns) in the header
- Drag and drop tasks between columns
- Visual columns: Backlog, In Progress, Done
- Great for team workflow visualization

#### List View (Prioritized To-Do)
- Click the **List icon** (lines) in the header
- Tasks displayed in priority order
- **Filters:**
  - All - Show all active tasks
  - Today - Tasks due today
  - Upcoming - Tasks due within 7 days
  - Overdue - Past-due tasks
- **Sorting:**
  - By Priority (default) - Urgent tasks first
  - By Due Date - Earliest deadlines first
  - By Created - Newest tasks first
- **Quick Actions:**
  - Click ○ to mark complete (moves to Done)
  - Click ✓ to reopen completed task
  - Click task card to view full details

#### Task Priority System
Tasks are automatically prioritized based on due dates:
- **Urgent** (Red) - Overdue or due today/tomorrow
- **High** (Orange) - Due within 3 days
- **Medium** (Yellow) - Due within 7 days
- **Low** (Blue) - Manually set
- **None** (Gray) - No due date or explicit priority

You can also set explicit priority when creating/editing a task.

### Managing Epics

#### Creating an Epic
1. Click "+ New Epic" in the left sidebar
2. Enter epic name, description (optional), and choose a color
3. Click "Create" to save (persisted to DynamoDB)

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
3. Click "All Tasks" to remove the filter

### Managing Tasks

#### Creating Tasks
1. Click "+ New Task" button
2. Fill in title, description, select column
3. **Set due date** (optional) - Click calendar picker
4. **Set priority** (optional) - Choose from dropdown (Urgent/High/Medium/Low/None)
5. Select an Epic from the dropdown (optional)
6. Select assignee (Miti, Jason, or Unassigned)
7. Select dependencies (if any)
8. Add tags
9. Click "Create Task" (saved to DynamoDB)

#### Task Operations
- **Drag & Drop**: Click and drag tasks between columns (updates DynamoDB)
- **Edit**: Hover over a task and click the ✏️ icon
- **Complete**: Click the ✓ icon to mark as done
- **Delete**: Click the 🗑️ icon to remove

### Task Dependencies

#### Setting Dependencies
1. Open TaskModal (create or edit task)
2. Scroll to "Dependencies" section
3. Check tasks this one depends on
4. Save task

#### Blocked Tasks
- Tasks with incomplete dependencies show 🔒 icon
- Orange "Blocked by X tasks" banner
- Cannot be completed until dependencies are in Review column

## 👥 Assignee Feature

### Assigning Tasks
- **Miti** - Purple badge with "M" initial
- **Jason** - Blue badge with "J" initial
- **Unassigned** - No assignee set

### Filtering by Assignee
Click assignee in sidebar to show only their tasks:
- "Everyone" - All tasks
- "Miti" - Only Miti's tasks
- "Jason" - Only Jason's tasks
- "Unassigned" - Tasks with no assignee

**Important:** Tasks assigned to Miti should be worked on by her. This enables future proactive task management.

## 💾 Data Migration

### From LocalStorage

On first load, the app automatically checks for existing localStorage data and migrates it to DynamoDB:

1. Detects empty DynamoDB table
2. Checks for `kanban-tasks` and `kanban-epics` in localStorage
3. Migrates data to DynamoDB
4. Clears localStorage after successful migration

### Manual Migration

To manually migrate data:

```js
import { migrateData } from './src/services/dynamodb';

await migrateData(epicsArray, tasksArray);
```

### Clear All Data

To reset DynamoDB table:

```js
import { clearAllData } from './src/services/dynamodb';

await clearAllData();
```

## 🌐 Deployment

### Environment Variables

**Important:** Never commit `.env` to version control!

For production deployments, set environment variables in your hosting platform:

**Vercel/Netlify:**
- Go to Project Settings → Environment Variables
- Add: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `DYNAMODB_TABLE_NAME`

**AWS Amplify:**
- Build settings → Environment variables
- Add the same variables

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables
6. Click "Deploy"

### Deploy to AWS Amplify

1. Push your code to GitHub
2. Visit [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. Click "New app" → "Host web app"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Add environment variables
7. Click "Save and Deploy"

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use IAM roles in production** - Avoid hardcoded credentials
3. **Limit IAM permissions** - Only grant DynamoDB access to specific table
4. **Rotate credentials regularly** - Update access keys periodically
5. **Use AWS Secrets Manager** - For production credential storage

## 🎨 Customization

### Epic Colors
Edit preset colors in `src/components/EpicModal.jsx`:

```js
const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#ef4444',
];
```

### Theme Colors
Edit `tailwind.config.js`:

```js
colors: {
  dark: {
    bg: '#0a0a0f',
    card: '#15151f',
    border: '#2a2a3a',
  }
}
```

### Columns
Modify in `src/App.jsx`:

```js
const COLUMNS = ['Recurring', 'Backlog', 'In Progress', 'Review'];
```

## 🧪 Testing

### Test CRUD Operations

```bash
# Create table
node scripts/setup-dynamodb.js

# Start dev server
npm run dev

# Test in browser:
# - Create epic
# - Create task linked to epic
# - Edit task
# - Filter by epic
# - Delete task
```

### Verify DynamoDB

1. Log into AWS Console → DynamoDB
2. Select `mission-control-tasks` table
3. Click "Explore items"
4. Verify records match app data

## 📝 Troubleshooting

### Error: "Failed to load data from DynamoDB"

**Check:**
1. AWS credentials in `.env` are correct
2. DynamoDB table exists (`node scripts/setup-dynamodb.js`)
3. IAM user has DynamoDB permissions
4. Table region matches `.env` region

### Table already exists error

This is normal - the script checks before creating. If you need to recreate:

1. Delete table in AWS Console
2. Run `node scripts/setup-dynamodb.js` again

### Build errors with environment variables

Ensure `.env` variables are loaded in `vite.config.js`:

```js
define: {
  'import.meta.env.VITE_AWS_ACCESS_KEY_ID': JSON.stringify(env.AWS_ACCESS_KEY_ID),
  // ...
}
```

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

Built with ❤️ using React + Vite + Tailwind CSS + AWS DynamoDB
