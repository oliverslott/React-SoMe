import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'
import Post from './post'

function Frontpage() {
  const [postText, setPostText] = useState('')
  const [posts, setPosts] = useState([])
  const [postAuthorName, setPostAuthorName] = useState('dig')

  const onlineUsers = ['Oliver', 'Malthe', 'Hussein', 'Muddi']

  useEffect(() => {
    let isMounted = true

    async function loadPostAuthor() {
      try {
        const response = await getJson('/post-author')

        if (isMounted) {
          setPostAuthorName(response.user.name)
        }
      } catch (error) {
        console.error('Kunne ikke hente post-forfatter:', error)
      }
    }

    loadPostAuthor()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedPost = postText.trim()

    if (!trimmedPost) {
      return
    }

    const newPost = {
      id: crypto.randomUUID(),
      text: trimmedPost,
      comments: [],
      createdAt: new Date().toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setPostText('')
  }

  const handleAddComment = (postId, commentText) => {
    const newComment = {
      id: crypto.randomUUID(),
      authorName: postAuthorName,
      text: commentText,
      createdAt: new Date().toLocaleTimeString('da-DK', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newComment],
            }
          : post
      )
    )
  }

  return (
    <main
      className="
        min-h-screen
        bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0f0f10_35%,_#060606_100%)]
        px-4
        py-10
        text-white
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-[calc(100vh-5rem)]
          w-full
          max-w-6xl
          items-start
          justify-center
          gap-8
        "
      >
        <aside
          className="
            hidden
            min-h-[720px]
            w-64
            rounded-[32px]
            border
            border-white/10
            bg-white/[0.03]
            p-6
            shadow-2xl
            backdrop-blur
            md:block
          "
        >
          <h2 className="mb-4 text-lg font-semibold text-white">#Trending</h2>
        </aside>

        <section
          className="
            w-full
            max-w-2xl
            rounded-[36px]
            border
            border-white/10
            bg-[#101012]/90
            p-6
            shadow-[0_30px_80px_rgba(0,0,0,0.45)]
            backdrop-blur
          "
        >
          <header className="mb-8 text-center">
            <h1
              className="
                mt-3
                text-5xl
                font-semibold
                tracking-[0.08em]
                text-white
              "
            >
              SoMe
            </h1>

            <p
              className="
                text-sm
                uppercase
                tracking-[0.45em]
                text-white/45
              "
            >
              What is happening today?
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="
              mb-8
              rounded-[28px]
              border
              border-white/10
              bg-[#151518]
              p-5
            "
          >
            <label
              htmlFor="post-text"
              className="
                mb-3
                block
                text-sm
                text-white/75
              "
            >
              Opret et opslag
            </label>

            <textarea
              id="post-text"
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="Hvad vil du dele i dag?"
              className="
                min-h-32
                w-full
                resize-none
                rounded-2xl
                border
                border-white/10
                bg-[#0c0c0e]
                px-4
                py-3
                text-base
                text-white
                placeholder:text-white/30
                focus:border-white/25
                focus:outline-none
              "
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-white/45">Tilføj # for at komme på trending.</p>

              <button
                type="submit"
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-white/90
                "
              >
                Slå op
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div
                className="
                  rounded-[28px]
                  border
                  border-dashed
                  border-white/10
                  bg-white/[0.03]
                  px-6
                  py-10
                  text-center
                  text-white/55
                "
              >
                Dit feed er tomt lige nu. Skriv dit første opslag ovenfor.
              </div>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  authorName={postAuthorName}
                  commenterName={postAuthorName}
                  onAddComment={handleAddComment}
                />
              ))
            )}
          </div>
        </section>

        <aside
          className="
            hidden
            min-h-[720px]
            w-64
            rounded-[32px]
            border
            border-white/10
            bg-white/[0.03]
            p-6
            shadow-2xl
            backdrop-blur
            xl:block
          "
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Online:</h2>

          <div className="space-y-3">
            {onlineUsers.map((user) => (
              <div
                key={user}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="text-sm text-white/85">{user}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Frontpage
