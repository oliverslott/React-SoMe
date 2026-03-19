from datetime import datetime, timedelta, timezone
import hashlib
from pathlib import Path
import secrets
import sqlite3

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


DATABASE_PATH = Path(__file__).with_name("database.db")
PASSWORD_HASH_ITERATIONS = 100_000
SESSION_COOKIE_NAME = "react_some_session"
SESSION_DURATION = timedelta(days=7)
sessions: dict[str, tuple[int, datetime]] = {}


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def user_payload(user: sqlite3.Row) -> dict[str, str | int]:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
    }


def hash_password(password: str, *, salt: str | None = None) -> str:
    password_salt = salt or secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        PASSWORD_HASH_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${password_salt}${password_hash}"


def verify_password(password: str, stored_password: str) -> bool:
    if not stored_password.startswith("pbkdf2_sha256$"):
        return secrets.compare_digest(password, stored_password)

    try:
        _, iteration_count, password_salt, stored_hash = stored_password.split("$", 3)
    except ValueError:
        return False

    computed_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        int(iteration_count),
    ).hex()
    return secrets.compare_digest(computed_hash, stored_hash)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def session_expiry() -> datetime:
    return now_utc() + SESSION_DURATION


def purge_expired_sessions() -> None:
    current_time = now_utc()
    expired_session_ids = [
        session_id
        for session_id, (_, expires_at) in sessions.items()
        if expires_at <= current_time
    ]

    for session_id in expired_session_ids:
        sessions.pop(session_id, None)


def set_session_cookie(response: Response, session_id: str, expires_at: datetime) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=int(SESSION_DURATION.total_seconds()),
        expires=expires_at.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")


def get_authenticated_user(request: Request) -> sqlite3.Row:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)

    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    purge_expired_sessions()
    session = sessions.get(session_id)

    if session is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    user_id, _ = session

    with get_connection() as connection:
        user = connection.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE id = ?
            """,
            (user_id,),
        ).fetchone()

    if user is None:
        sessions.pop(session_id, None)
        raise HTTPException(status_code=401, detail="Not authenticated.")

    return user


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

        cursor.execute("DROP TABLE IF EXISTS sessions")

        connection.commit()


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


@app.get("/me")
def read_current_user(request: Request):
    return {"user": user_payload(get_authenticated_user(request))}


@app.post("/register")
def register_account(payload: RegisterRequest):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    with get_connection() as connection:
        existing_user = connection.execute(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            (email,),
        ).fetchone()

        if existing_user is not None:
            raise HTTPException(status_code=409, detail="An account with that email already exists.")

        cursor = connection.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (name, email, hash_password(password)),
        )
        connection.commit()

    return {
        "message": "Account created successfully.",
        "user": {
            "id": cursor.lastrowid,
            "name": name,
            "email": email,
        },
    }


@app.post("/login")
def login_account(payload: LoginRequest, response: Response):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name, email, password FROM users WHERE LOWER(email) = LOWER(?)",
            (email,),
        ).fetchone()

        if user is None or not verify_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password.")

        if not user["password"].startswith("pbkdf2_sha256$"):
            connection.execute(
                "UPDATE users SET password = ? WHERE id = ?",
                (hash_password(password), user["id"]),
            )

        session_id = secrets.token_urlsafe(32)
        expires_at = session_expiry()
        connection.commit()

    purge_expired_sessions()
    sessions[session_id] = (user["id"], expires_at)
    set_session_cookie(response, session_id, expires_at)
    return {
        "message": "Login successful.",
        "user": user_payload(user),
    }


@app.post("/logout")
def logout_account(request: Request, response: Response):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)

    if session_id:
        sessions.pop(session_id, None)

    clear_session_cookie(response)
    return {"message": "Logged out."}


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
