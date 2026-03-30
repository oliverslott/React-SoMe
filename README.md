# React SoMe

This project has two parts:

- `Frontend/`: a React app built with Vite
- `Backend/`: a FastAPI server with a local SQLite database

## Prerequisites

Install these before starting:

- Python 3.10 or newer
- Node.js and npm

## Project Structure

```text
React-SoMe/
|- Backend/
|  \- main.py
\- Frontend/
   \- package.json
```

## Backend Setup

Open a terminal in the project root, then move into the backend folder:

```powershell
cd Backend
```

### 1. Create a virtual environment

```powershell
python -m venv .venv
```

If `python` does not work on your machine, try:

```powershell
py -m venv .venv
```

### 2. Activate the virtual environment

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Command Prompt:

```cmd
.\.venv\Scripts\activate.bat
```

Git Bash:

```bash
source .venv/Scripts/activate
```

### 3. Install backend dependencies

This repo does not currently include a `requirements.txt`, so install the packages directly:

```powershell
pip install fastapi uvicorn pydantic
```

### 4. Start the backend

Run this from inside `Backend/`:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- `http://127.0.0.1:8000`
- `http://localhost:8000`

When the backend starts for the first time, it will automatically create `Backend/database.db`.

### 5. Deactivate the virtual environment

When you are done:

```powershell
deactivate
```

## Frontend Setup

Open a second terminal in the project root, then move into the frontend folder:

```powershell
cd Frontend
```

### 1. Install frontend dependencies

```powershell
npm install
```

### 2. Start the frontend

```powershell
npm run dev
```

The frontend will usually run at:

- `http://localhost:5173`

## Running the Full App

Start both services in separate terminals:

1. Start the backend from `Backend/`
2. Start the frontend from `Frontend/`
3. Open `http://localhost:5173` in your browser

The frontend is already set up to talk to the backend on port `8000`.

## Notes

- The backend allows local frontend origins such as `localhost:5173` and `127.0.0.1:5173`
- Authentication uses cookies, so keep the backend running while testing login and posts
- If you want the frontend to use a different backend URL, set `VITE_API_URL`

Example:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev
```
