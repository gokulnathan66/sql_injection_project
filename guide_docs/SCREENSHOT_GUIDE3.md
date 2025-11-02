# Screenshot Guide

## How to Capture Screenshots

To complete the README with actual screenshots, please capture the following screens from your browser at http://localhost:3000:

### Required Screenshots

1. **Dashboard View** (`screenshots/dashboard.png`)
   - Navigate to the Dashboard tab
   - Show the statistics cards and recent activity
   - Capture the full page

2. **Query Tester - Benign Query** (`screenshots/query-tester-benign.png`)
   - Navigate to Query Tester tab
   - Test a benign query: `SELECT * FROM users WHERE id = 1`
   - Capture the results showing "BENIGN" status

3. **Query Tester - Malicious Query** (`screenshots/query-tester-malicious.png`)
   - Test a malicious query: `' UNION SELECT username, password FROM users--`
   - Capture the results showing "MALICIOUS" status with attack type

4. **Analytics View** (`screenshots/analytics.png`)
   - Navigate to Analytics tab
   - Show the charts and attack history table
   - Capture the full page

5. **Live Attack Alert** (`screenshots/live-alert.png`)
   - On Dashboard, capture when a live attack alert appears
   - Show the real-time notification

### Steps to Capture

1. Open http://localhost:3000 in your browser
2. Use your browser's screenshot tool or:
   - macOS: `Cmd + Shift + 4` then select area
   - Windows: `Win + Shift + S`
   - Or use browser DevTools screenshot feature
3. Save screenshots to `screenshots/` directory
4. Name them exactly as shown above

### After Capturing

Once you have the screenshots, they will automatically appear in the README.md file.

