import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        const response = await fetch("http://localhost:8000/me/name", {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            console.error("Failed to update name");
            return;
        }

        const data = await response.json();
        console.log(data);
    }

    return (
        <div>
            <h1>Profile Page</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="New username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button type="submit">Change Name</button>
            </form>
            <button onClick={() => navigate("/")}>
                Back to homepage
            </button>
        </div>
    );
}

