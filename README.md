# Graduate 4th Master - Medical AI Application

A full-stack healthcare application with AI-powered medical analysis, built for a graduate thesis project.

## Architecture

- **Frontend**: Next.js 15 with React 18, TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: FastAPI (Python) with machine learning integration
- **AI/ML**: Scikit-learn model for medical predictions, Google Gemini for chatbot
- **Database**: SQLite (for development, can be upgraded to PostgreSQL)

## Features

- **AI Analysis**: Analyze medical images and lab values using ML models
- **Medical Chatbot**: AI-powered assistant using Google Gemini
- **Patient Management**: View patient data, lab tests, and medical history
- **Dashboard**: Comprehensive healthcare dashboard with visualizations

## Setup and Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `.env` and add your Google Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

4. Train the ML model:
   ```bash
   python model.py
   ```

5. Run the backend server:
   ```bash
   python main.py
   # or
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set backend URL in `.env.local`:
   ```
   BACKEND_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Backend (FastAPI)
- `GET /` - Health check
- `POST /analyze` - Analyze medical data (images or lab values)
- `POST /chatbot` - Medical chatbot using Gemini AI
- `GET /patient-data` - Get patient information and lab tests
- `GET /lab-tests?patientId={id}` - Get lab tests for specific patient

### Frontend (Next.js API Routes)
All frontend API routes proxy to the backend for seamless integration.

## Usage

1. Start the backend server (port 8000)
2. Start the frontend server (port 3000)
3. Access the application at `http://localhost:3000`
4. Use the dashboard to navigate between features

## Development

- **Frontend**: Located in root directory
- **Backend**: Located in `backend/` directory
- **Models**: ML models saved in `backend/models/`
- **Environment**: Use `.env` files for configuration

## Technologies Used

### Frontend
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts (for data visualization)

### Backend
- FastAPI
- Python 3.8+
- Scikit-learn
- Google Generative AI
- SQLAlchemy (future database integration)

## Future Enhancements

- Add user authentication and authorization
- Implement real database (PostgreSQL)
- Add more sophisticated ML models
- Implement image analysis with computer vision
- Add real-time notifications
- Deploy to cloud platform

## License

This project is for educational purposes as part of a graduate thesis.