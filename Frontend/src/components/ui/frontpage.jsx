import { useState } from 'react'

function Frontpage() {
  const [postText, setPostText] = useState('')
  const [posts, setPosts] = useState([])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedPost = postText.trim()

    if (!trimmedPost) {
      return
    }

    const newPost = {
      id: crypto.randomUUID(),
      text: trimmedPost,
      createdAt: new Date().toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setPostText('')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#5b2a86_0%,_#2d1245_40%,_#14081f_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-start justify-center gap-8">
        <aside className="hidden min-h-[720px] w-64 rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur md:block" />

        <section className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-[#1b0f2bcc]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <header className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.45em] text-fuchsia-200/80">
              dit sociale feed
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[0.08em] text-white">
              SoMe
            </h1>
          </header>

          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-[28px] border border-fuchsia-200/15 bg-[#2a163f] p-5"
          >
            <label htmlFor="post-text" className="mb-3 block text-sm text-fuchsia-100">
              Opret et opslag
            </label>

            <textarea
              id="post-text"
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="Hvad vil du dele i dag?"
              className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-[#12091d] px-4 py-3 text-base text-white placeholder:text-fuchsia-100/40 focus:border-fuchsia-300 focus:outline-none"
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-fuchsia-100/60">
                Dit opslag bliver kun gemt midlertidigt i siden.
              </p>

              <button
                type="submit"
                className="rounded-full bg-fuchsia-300 px-5 py-2.5 text-sm font-semibold text-[#2b1242] transition hover:bg-fuchsia-200"
              >
                Slaa op
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-fuchsia-100/75">
                Dit feed er tomt lige nu. Skriv dit første opslag ovenfor.
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-[28px] border border-white/10 bg-[#241237] p-5 shadow-lg"
                >
                  <div className="mb-3 flex items-center justify-between text-sm text-fuchsia-100/60">
                    <span>@dig</span>
                    <span>{post.createdAt}</span>
                  </div>

                  <p className="whitespace-pre-wrap text-base leading-7 text-white/95">
                    {post.text}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="hidden min-h-[720px] w-64 rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur xl:block" />
      </div>
    </main>
  )
}

export default Frontpage
