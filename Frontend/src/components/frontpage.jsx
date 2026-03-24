import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJson, postJson } from '@/lib/api'
import Post from './post'

function formatPostTime(timestamp) {
  return new Date(timestamp).toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapApiPost(post) {
  return {
    id: post.id,
    text: post.content,
    authorName: post.author_name,
    createdAt: formatPostTime(post.created_at),
    liked: post.liked_by_current_user ?? false,
    likeCount: post.like_count ?? 0,
    comments: (post.comments ?? []).map((comment) => ({
      id: comment.id,
      authorName: comment.author_name,
      text: comment.content,
      createdAt: formatPostTime(comment.created_at),
    })),
  }
}

function Frontpage() {
  const [postText, setPostText] = useState('')
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const onlineUsers = ['Oliver', 'Malthe', 'Hussein', 'Muddi']

  useEffect(() => {
    let isCancelled = false

    async function loadCurrentUser() {
      try {
        const response = await getJson('/me')

        if (!isCancelled) {
          setCurrentUser(response.user)
          setErrorMessage('')
        }
      } catch {
        if (!isCancelled) {
          setCurrentUser(null)
        }
      }
    }

    async function loadPosts() {
      try {
        const response = await getJson('/posts')

        if (!isCancelled) {
          setPosts(response.posts.map(mapApiPost))
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error.message)
        }
      }
    }

    loadCurrentUser()
    loadPosts()

    return () => {
      isCancelled = true
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    const trimmedPost = postText.trim()

    if (!trimmedPost) {
      return
    }

    if (!currentUser) {
      setErrorMessage('Log ind for at oprette et opslag.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await postJson('/posts', {
        content: trimmedPost,
      })

      setPosts((currentPosts) => [mapApiPost(response.post), ...currentPosts])
      setPostText('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddComment(postId, commentText) {
    if (!currentUser) {
      setErrorMessage('Log ind for at kommentere opslag.')
      throw new Error('Not authenticated.')
    }

    setErrorMessage('')

    try {
      const response = await postJson(`/posts/${postId}/comments`, {
        content: commentText,
      })

      const newComment = {
        id: response.comment.id,
        authorName: response.comment.author_name,
        text: response.comment.content,
        createdAt: formatPostTime(response.comment.created_at),
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
    } catch (error) {
      setErrorMessage(error.message)
      throw error
    }
  }

  async function handleToggleLike(postId) {
    if (!currentUser) {
      setErrorMessage('Log ind for at like opslag.')
      return
    }

    setErrorMessage('')

    try {
      const response = await postJson(`/posts/${postId}/likes`)

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: response.liked,
                likeCount: response.like_count,
              }
            : post
        )
      )
    } catch (error) {
      setErrorMessage(error.message)
    }
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

            <p className="mt-3 text-sm text-white/55">
              {currentUser ? `Logget ind som ${currentUser.name}` : 'Du er ikke logget ind endnu.'}
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
              disabled={isSubmitting || !currentUser}
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

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-white/45">
                {currentUser ? 'Tilføj # for at komme på trending.' : (
                  <>
                    <Link className="underline underline-offset-4" to="/login">
                      Log ind
                    </Link>{' '}
                    for at kunne skrive opslag.
                  </>
                )}
              </p>

              <button
                type="submit"
                disabled={isSubmitting || !currentUser}
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
                  disabled:cursor-not-allowed
                  disabled:bg-white/40
                "
              >
                {isSubmitting ? 'Slår op...' : 'Slå op'}
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
                  commenterName={currentUser?.name ?? 'gæst'}
                  commentsDisabled={!currentUser}
                  onAddComment={handleAddComment}
                  onToggleLike={handleToggleLike}
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
