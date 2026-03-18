from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


DATABASE_PATH = Path(__file__).with_name("database.db")


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def init_db() -> None:
    with get_connection() as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS post_likes (
                user_id INTEGER NOT NULL,
                post_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            );
            """
        )

        connection.commit()


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "React SoMe backend is running"}


@app.post("/register")
def register_account(payload: RegisterRequest):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    with get_connection() as connection:
        cursor = connection.cursor()
        existing_user = cursor.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            (email,),
        ).fetchone()

        if existing_user is not None:
            raise HTTPException(status_code=409, detail="An account with that email already exists.")

        # store password as plaintext to keep backend simple, but should be hashed + salted in a real application.
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, password),
        )
        connection.commit()

        user_id = cursor.lastrowid

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
        },
    }


@app.post("/login")
def login_account(payload: LoginRequest):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name, email, password FROM users WHERE LOWER(email) = LOWER(?)",
            (email,),
        ).fetchone()

    if user is None or user["password"] != password:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {
        "message": "Login successful.",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


@app.get("/post-author")
def get_post_author():
    hardcoded_user_id = 1

    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name FROM users WHERE id = ?",
            (hardcoded_user_id,),
        ).fetchone()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="The hardcoded post author with user_id 1 was not found.",
        )

    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
        }
    }
