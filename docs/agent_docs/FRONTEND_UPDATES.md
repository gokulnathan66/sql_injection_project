# Frontend Updates - Enhanced Monitoring & Management

## Overview
The frontend has been significantly enhanced to provide comprehensive monitoring and management capabilities for the SQL Injection Detection System, including federated learning, system monitoring, and organization management.

## New Features Added

### 1. System Monitor (`SystemMonitor.jsx`)
**Purpose:** Real-time monitoring of all system components and services

**Features:**
- **Service Status Monitoring**
  - Detection Engine status
  - Proxy Service status
  - Honeypot status
  - Federated Learning status
- **Database Statistics**
  - Total queries processed
  - Attacks detected
  - Detection rate
  - Average confidence scores
- **API Endpoints Overview**
  - Live status of all API endpoints
  - Health check indicators
- **System Information**
  - Application name, version, and status
  - Real-time health monitoring

**Auto-refresh:** Every 5 seconds

### 2. Organization Manager (`OrganizationManager.jsx`)
**Purpose:** Manage organizations participating in federated learning

**Features:**
- **Organization Registration**
  - Register new organizations with ID, name, and address
  - Form validation and submission
- **Organization Overview**
  - Total organizations count
  - Active organizations count
  - Current training round
- **Organization List**
  - View all registered organizations
  - Organization status (active/inactive)
  - Last update timestamp
  - Organization addresses

**Auto-refresh:** Every 10 seconds

### 3. Model Manager (`ModelManager.jsx`)
**Purpose:** Manage and monitor federated learning models

**Features:**
- **Model Information**
  - Current model version
  - Current training round
  - Total rounds completed
  - Active participants count
- **Training Controls**
  - Start new training round
  - Download global model
- **Training Progress Visualization**
  - Line chart showing accuracy and loss over rounds
  - Interactive tooltips with detailed metrics
- **Training History Table**
  - Round number
  - Number of participants
  - Accuracy and loss metrics
  - Timestamp of each round

**Auto-refresh:** Every 10 seconds

### 4. Enhanced API Service (`api.js`)
**New Endpoints Added:**

**Federated Learning:**
- `registerOrganization(orgId, orgName, address)` - Register new organization
- `getFederatedStatus()` - Get federated learning status
- `startFederatedRound(roundNumber)` - Start training round
- `getFederatedHistory(limit)` - Get training history
- `downloadGlobalModel()` - Download current global model

**System Monitoring:**
- `getSystemHealth()` - Check system health
- `getSystemInfo()` - Get system information and endpoints

### 5. Updated Navigation
**New Tabs:**
- Dashboard (existing)
- Query Tester (existing)
- Analytics (existing)
- **System Monitor** (new)
- **Organizations** (new)
- **Model Manager** (new)

## UI/UX Improvements

### Real-time Updates
- WebSocket integration for live attack alerts
- Auto-refreshing dashboards (5-10 second intervals)
- Animated loading states
- Pulse animations for active status indicators

### Visual Enhancements
- Consistent color scheme across all components
- Status indicators with color coding:
  - Green: Active/Healthy
  - Red: Malicious/Error
  - Yellow: Warning
  - Blue: Information
  - Purple: Federated Learning
- Responsive grid layouts
- Mobile-friendly navigation

### Data Visualization
- Line charts for training progress (Recharts)
- Real-time statistics cards
- Interactive tables with hover effects
- Progress indicators

## Component Structure

```
frontend/src/
├── components/
│   ├── Dashboard.jsx           (existing)
│   ├── QueryTester.jsx         (existing)
│   ├── Analytics.jsx           (existing)
│   ├── SystemMonitor.jsx       (NEW)
│   ├── OrganizationManager.jsx (NEW)
│   └── ModelManager.jsx        (NEW)
├── services/
│   ├── api.js                  (UPDATED)
│   └── websocket.js            (existing)
└── App.jsx                     (UPDATED)
```

## Integration with Backend

### Backend Endpoints Used

**Detection & Analytics:**
- `/api/detect` - SQL injection detection
- `/api/stats` - System statistics
- `/api/attacks` - Attack history
- `/api/timeline` - Attack timeline
- `/api/patterns` - Attack patterns

**Federated Learning:**
- `/api/federated/register` - Register organization
- `/api/federated/status` - Get FL status
- `/api/federated/start-round` - Start training
- `/api/federated/history` - Training history
- `/api/federated/download-model` - Download model

**System Monitoring:**
- `/health` - Health check
- `/` - System information

## Usage Instructions

### Accessing New Features

1. **System Monitor**
   - Click "System Monitor" tab
   - View real-time status of all services
   - Monitor database statistics
   - Check API endpoint health

2. **Organization Management**
   - Click "Organizations" tab
   - Click "Register Organization" to add new org
   - Fill in organization details
   - View all registered organizations in table

3. **Model Management**
   - Click "Model Manager" tab
   - View current model version and training status
   - Click "Start Training Round" to begin new round
   - Click "Download Model" to export current model
   - View training progress in charts
   - Review training history in table

### Real-time Monitoring

All monitoring components automatically refresh:
- System Monitor: Every 5 seconds
- Organization Manager: Every 10 seconds
- Model Manager: Every 10 seconds
- Live attack alerts: Instant via WebSocket

## Technical Details

### State Management
- React hooks (useState, useEffect)
- Automatic cleanup on component unmount
- Error handling for all API calls

### Performance
- Efficient re-rendering with React
- Debounced API calls
- Conditional rendering for loading states
- Optimized chart rendering

### Error Handling
- Try-catch blocks for all async operations
- Console error logging
- Graceful fallbacks for missing data
- Loading states during data fetch

## Future Enhancements

Potential additions:
- [ ] Real-time model performance metrics
- [ ] Organization-specific dashboards
- [ ] Advanced filtering and search
- [ ] Export functionality for reports
- [ ] Notification system for critical events
- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] Audit logs viewer
- [ ] Performance benchmarking tools
- [ ] Custom alert configuration

## Dependencies

No new dependencies required. Uses existing:
- React 18
- Recharts (for charts)
- Lucide React (for icons)
- Axios (for API calls)
- Tailwind CSS (for styling)

## Testing

To test the new features:

1. Start the backend:
   ```bash
   cd backend
   python main.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to http://localhost:3000

4. Test each new tab:
   - System Monitor: Verify all services show "active"
   - Organizations: Register a test organization
   - Model Manager: Start a training round and view results

## Notes

- All components are responsive and mobile-friendly
- Real-time updates require WebSocket connection
- Federated learning features require coordinator mode in backend
- System monitor shows actual backend service status
- All timestamps are displayed in local timezone

---

**Updated:** November 27, 2025
**Version:** 2.0.0
