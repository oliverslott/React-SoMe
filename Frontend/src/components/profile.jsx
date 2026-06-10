import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";

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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0f0f10_35%,_#060606_100%)] px-4 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-[36px] border border-white/10 bg-[#101012]/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
                    <div className="border-b border-white/10 bg-white/[0.02] px-6 py-8 sm:px-8">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/60">
                            SoMe
                        </span>

                        <div className="mt-6 flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-lg">
                                <UserRound className="h-7 w-7 text-white/80" aria-hidden="true" />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                                    Din konto
                                </p>
                                <h1 className="m-0 mt-1 text-3xl font-semibold tracking-tight text-white">
                                    Profil
                                </h1>
                            </div>
                        </div>

                        <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
                            Opdater det navn, som andre brugere ser på dine opslag og kommentarer.
                        </p>
                    </div>

                    <div className="p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="profile-name" className="block text-sm font-medium text-white">
                                    Nyt brugernavn
                                </label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    placeholder="Indtast dit nye brugernavn"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-[#0c0c0e] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                                />
                                <p className="text-xs leading-5 text-white/45">
                                    Dit nye navn bliver vist på tværs af SoMe.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[#101012]"
                            >
                                Gem nyt navn
                            </button>
                        </form>

                        <div className="my-7 h-px bg-white/10" />

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Tilbage til forsiden
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}

