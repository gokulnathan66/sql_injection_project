# Quick Reference Card

## 🚀 Start the POC

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```
✅ Backend: http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend: http://localhost:3000

## 🔧 First Time Setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_model.py

# Frontend
cd frontend
npm install
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/detect` | POST | Detect SQL injection |
| `/api/attacks` | GET | Get attack history |
| `/api/stats` | GET | Get statistics |
| `/api/timeline` | GET | Get 24h timeline |
| `/api/patterns` | GET | Get attack patterns |
| `/api/ws` | WS | WebSocket updates |

## 🧪 Test Queries

### Benign
```sql
SELECT * FROM users WHERE id = 1
SELECT name, email FROM customers
```

### Malicious
```sql
' UNION SELECT username, password FROM users--
' OR '1'='1
'; DROP TABLE users--
```

## 📊 Features

- ✅ Real-time detection (<50ms)
- ✅ 6 attack types detected
- ✅ >95% accuracy
- ✅ Live WebSocket updates
- ✅ Beautiful React dashboard
- ✅ Analytics & charts

## 🐛 Troubleshooting

**Backend won't start?**
```bash
# Check if model is trained
ls backend/app/models/rf_detector.pkl
# If not found, run:
python train_model.py
```

**Frontend can't connect?**
```bash
# Ensure backend is running on port 8000
curl http://localhost:8000/health
```

**Port already in use?**
```bash
# Backend: Change port in backend/main.py
# Frontend: Vite will auto-select next port
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/train_model.py` | Train ML model |
| `backend/test_poc.py` | Test detection |
| `backend/app/main.py` | FastAPI app |
| `frontend/src/App.jsx` | React app |
| `README.md` | Full documentation |
| `SETUP_GUIDE.md` | Setup instructions |

## 🎯 Quick Test

```bash
cd backend
python test_poc.py
```

## 📖 Documentation

- Full docs: `README.md`
- Setup guide: `SETUP_GUIDE.md`
- Project summary: `PROJECT_SUMMARY.md`
- API docs: http://localhost:8000/docs

## 🎨 Tech Stack

**Backend**: FastAPI, scikit-learn, SQLite, WebSockets
**Frontend**: React, Vite, Tailwind CSS, Recharts
**ML**: Random Forest (28 features)

## 📞 Support

Check documentation or review code comments for detailed information.

---

**Status**: ✅ POC Complete | **Version**: 1.0.0

