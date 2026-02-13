# Knest Application Updates - Task List View

## Changes Made

### 1. New Task List View Component
Created a new prioritized task list view (`TaskListView.jsx`) with the following features:

**Features:**
- **Clean, prioritized task list** with a less Kanban-y feel
- **Priority-based sorting** with automatic priority calculation from due dates
- **Due date support** with visual indicators for:
  - Overdue tasks (red with alert icon)
  - Tasks due today
  - Tasks due tomorrow
  - Tasks due within 7 days
- **Multiple filter modes:**
  - All tasks
  - Today (tasks due today)
  - Upcoming (tasks due within 7 days)
  - Overdue (past due date)
- **Sorting options:**
  - By priority (default)
  - By due date
  - By created date
- **Visual priority badges:**
  - Urgent (red)
  - High (orange)
  - Medium (yellow)
  - Low (blue)
  - None (gray)
- **Quick task completion** - click the circle to mark done
- **Epic and assignee indicators**
- **Status column displayed** for context

### 2. View Toggle
Added a view switcher in the header with two modes:
- **Board View** (original Kanban layout) 
- **List View** (new prioritized task list)

The Kanban board remains untouched and fully functional.

### 3. Due Date & Priority Fields
Added new task properties:
- **Due Date** - Calendar picker in the task modal
- **Priority** - Dropdown with 5 levels (Urgent, High, Medium, Low, None)

These fields are:
- Stored in DynamoDB
- Editable in the task modal
- Displayed in both board and list views
- Used for auto-prioritization in list view

### 4. Database Schema Updates
Updated `dynamodb.js` to support:
- `dueDate` field (nullable)
- `priority` field (defaults to 'none')

### 5. Task Modal Enhancements
Extended the task creation/editing modal with:
- Due date picker
- Priority dropdown
- Both fields are optional

## How It Works

**Auto-Prioritization Logic:**
If no explicit priority is set, the system calculates priority based on the due date:
- Overdue or due today/tomorrow → Urgent
- Due within 3 days → High  
- Due within 7 days → Medium
- No due date or further out → None

Tasks with explicit "urgent" tag are also marked as urgent.

**List View Workflow:**
1. Click the List View icon in the header
2. Tasks are displayed in priority order
3. Filter by Today/Upcoming/Overdue as needed
4. Click any task to view details
5. Click the circle to mark complete
6. Sort by different criteria using the dropdown

## Files Modified

1. `src/App.jsx` - Added view mode state and conditional rendering
2. `src/components/TaskListView.jsx` - New component (created)
3. `src/components/TaskModal.jsx` - Added due date and priority fields
4. `src/services/dynamodb.js` - Updated schema to include new fields

## Next Steps / Future Enhancements

Potential improvements:
- Add drag-to-reorder in list view
- Recurring task support
- Task grouping by epic in list view
- Bulk actions (complete multiple, batch edit)
- Custom priority colors/levels
- Calendar view
- Due date reminders
- Task templates

## Testing

To test the changes:
1. Run `npm install` (if needed)
2. Run `npm run dev`
3. Open the application
4. Click the List View icon (|||) in the header
5. Create a new task with a due date and priority
6. Try the different filters and sorting options
7. Toggle between Board and List views

The original Kanban board functionality remains unchanged and can be accessed by clicking the Board icon.
