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


class CreatePostRequest(BaseModel):
    content: str


class CreateCommentRequest(BaseModel):
    content: str


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


def post_payload(post: sqlite3.Row) -> dict[str, str | int]:
    return {
        "id": post["id"],
        "user_id": post["user_id"],
        "content": post["content"],
        "author_name": post["author_name"],
        "created_at": post["created_at"],
    }


def comment_payload(comment: sqlite3.Row) -> dict[str, str | int]:
    return {
        "id": comment["id"],
        "post_id": comment["post_id"],
        "user_id": comment["user_id"],
        "content": comment["content"],
        "author_name": comment["author_name"],
        "created_at": comment["created_at"],
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


def get_optional_authenticated_user(request: Request) -> sqlite3.Row | None:
    try:
        return get_authenticated_user(request)
    except HTTPException:
        return None


def ensure_column_exists(connection: sqlite3.Connection, table_name: str, column_name: str, definition: str) -> None:
    columns = connection.execute(f"PRAGMA table_info({table_name})").fetchall()

    if any(column["name"] == column_name for column in columns):
        return

    connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


def fetch_comments_by_post_id(connection: sqlite3.Connection) -> dict[int, list[dict[str, str | int]]]:
    comments = connection.execute(
        """
        SELECT comments.id, comments.post_id, comments.user_id, comments.content, comments.created_at, users.name AS author_name
        FROM comments
        JOIN users ON users.id = comments.user_id
        ORDER BY comments.id ASC
        """
    ).fetchall()

    comments_by_post_id: dict[int, list[dict[str, str | int]]] = {}

    for comment in comments:
        comments_by_post_id.setdefault(comment["post_id"], []).append(comment_payload(comment))

    return comments_by_post_id


def fetch_like_counts_by_post_id(connection: sqlite3.Connection) -> dict[int, int]:
    like_rows = connection.execute(
        """
        SELECT post_id, COUNT(*) AS like_count
        FROM post_likes
        GROUP BY post_id
        """
    ).fetchall()
    return {row["post_id"]: row["like_count"] for row in like_rows}


def fetch_liked_post_ids(connection: sqlite3.Connection, user_id: int | None) -> set[int]:
    if user_id is None:
        return set()

    liked_rows = connection.execute(
        """
        SELECT post_id
        FROM post_likes
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchall()
    return {row["post_id"] for row in liked_rows}


def serialize_post(
    post: sqlite3.Row,
    *,
    comments_by_post_id: dict[int, list[dict[str, str | int]]],
    like_counts_by_post_id: dict[int, int],
    liked_post_ids: set[int],
) -> dict[str, str | int | list[dict[str, str | int]] | bool]:
    payload = post_payload(post)
    payload["comments"] = comments_by_post_id.get(post["id"], [])
    payload["like_count"] = like_counts_by_post_id.get(post["id"], 0)
    payload["liked_by_current_user"] = post["id"] in liked_post_ids
    return payload


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
                created_at TEXT,
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
                created_at TEXT,
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

        ensure_column_exists(connection, "comments", "created_at", "TEXT")
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
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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

class UpdateNameRequest(BaseModel):
    name: str

@app.put("/me/name")
def update_name(payload: UpdateNameRequest, request: Request):
    user = get_authenticated_user(request)
    new_name = payload.name.strip()

    if not new_name:
        raise HTTPException(status_code=400, detail="Du kan ikke hedde ingenting.")
    with get_connection() as connection:
        connection.execute(
            "UPDATE users SET name = ? WHERE id = ?",
            (new_name, user["id"]),
        )
        connection.commit()

        updated_user = connection.execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            (user["id"],),
        ).fetchone()
    return {
        "message": "Navn updateret.",
        "user": user_payload(updated_user),
    }


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


@app.post("/posts")
def create_post(payload: CreatePostRequest, request: Request):
    user = get_authenticated_user(request)
    content = payload.content.strip()

    if not content:
        raise HTTPException(status_code=400, detail="Post content is required.")

    with get_connection() as connection:
        created_at = now_utc().isoformat()
        cursor = connection.execute(
            "INSERT INTO posts (user_id, content, created_at) VALUES (?, ?, ?)",
            (user["id"], content, created_at),
        )
        post = connection.execute(
            """
            SELECT posts.id, posts.user_id, posts.content, posts.created_at, users.name AS author_name
            FROM posts
            JOIN users ON users.id = posts.user_id
            WHERE posts.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
        comments_by_post_id = fetch_comments_by_post_id(connection)
        like_counts_by_post_id = fetch_like_counts_by_post_id(connection)
        liked_post_ids = fetch_liked_post_ids(connection, user["id"])
        connection.commit()

    return {
        "message": "Post created successfully.",
        "post": serialize_post(
            post,
            comments_by_post_id=comments_by_post_id,
            like_counts_by_post_id=like_counts_by_post_id,
            liked_post_ids=liked_post_ids,
        ),
        "user": user_payload(user),
    }


@app.post("/posts/{post_id}/comments")
def create_comment(post_id: int, payload: CreateCommentRequest, request: Request):
    user = get_authenticated_user(request)
    content = payload.content.strip()

    if not content:
        raise HTTPException(status_code=400, detail="Comment content is required.")

    with get_connection() as connection:
        post = connection.execute(
            "SELECT id FROM posts WHERE id = ?",
            (post_id,),
        ).fetchone()

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found.")

        created_at = now_utc().isoformat()
        cursor = connection.execute(
            "INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)",
            (post_id, user["id"], content, created_at),
        )
        comment = connection.execute(
            """
            SELECT comments.id, comments.post_id, comments.user_id, comments.content, comments.created_at, users.name AS author_name
            FROM comments
            JOIN users ON users.id = comments.user_id
            WHERE comments.id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
        connection.commit()

    return {
        "message": "Comment created successfully.",
        "comment": comment_payload(comment),
    }


@app.post("/posts/{post_id}/likes")
def toggle_post_like(post_id: int, request: Request):
    user = get_authenticated_user(request)

    with get_connection() as connection:
        post = connection.execute(
            "SELECT id FROM posts WHERE id = ?",
            (post_id,),
        ).fetchone()

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found.")

        existing_like = connection.execute(
            """
            SELECT 1
            FROM post_likes
            WHERE user_id = ? AND post_id = ?
            """,
            (user["id"], post_id),
        ).fetchone()

        if existing_like is None:
            connection.execute(
                "INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)",
                (user["id"], post_id),
            )
            liked = True
        else:
            connection.execute(
                "DELETE FROM post_likes WHERE user_id = ? AND post_id = ?",
                (user["id"], post_id),
            )
            liked = False

        like_count_row = connection.execute(
            """
            SELECT COUNT(*) AS like_count
            FROM post_likes
            WHERE post_id = ?
            """,
            (post_id,),
        ).fetchone()
        connection.commit()

    return {
        "message": "Post like updated successfully.",
        "post_id": post_id,
        "liked": liked,
        "like_count": like_count_row["like_count"],
    }


@app.get("/posts")
def read_posts(request: Request):
    current_user = get_optional_authenticated_user(request)
    current_user_id = None if current_user is None else current_user["id"]

    with get_connection() as connection:
        posts = connection.execute(
            """
            SELECT posts.id, posts.user_id, posts.content, posts.created_at, users.name AS author_name
            FROM posts
            JOIN users ON users.id = posts.user_id
            ORDER BY posts.id DESC
            """
        ).fetchall()
        comments_by_post_id = fetch_comments_by_post_id(connection)
        like_counts_by_post_id = fetch_like_counts_by_post_id(connection)
        liked_post_ids = fetch_liked_post_ids(connection, current_user_id)

    return {
        "posts": [
            serialize_post(
                post,
                comments_by_post_id=comments_by_post_id,
                like_counts_by_post_id=like_counts_by_post_id,
                liked_post_ids=liked_post_ids,
            )
            for post in posts
        ]
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
