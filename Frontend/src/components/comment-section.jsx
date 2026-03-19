import { useId, useState } from 'react'

function CommentSection({ comments, commenterName, onAddComment }) {
  const inputId = useId()
  const [commentText, setCommentText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const trimmedComment = commentText.trim()

    if (!trimmedComment) {
      return
    }

    onAddComment(trimmedComment)
    setCommentText('')
  }

  return (
    <section className="mt-5 border-t border-white/10 pt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor={inputId} className="block text-sm text-white/65">
          Skriv en kommentar
        </label>

        <p className="text-xs text-white/40">Kommenterer som @{commenterName}</p>

        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="text"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Skriv din kommentar her..."
            className="
              w-full
              rounded-full
              border
              border-white/10
              bg-[#0c0c0e]
              px-4
              py-2.5
              text-sm
              text-white
              placeholder:text-white/30
              focus:border-white/25
              focus:outline-none
            "
          />

          <button
            type="submit"
            className="
              rounded-full
              border
              border-white/10
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-white/90
            "
          >
            Kommenter
          </button>
        </div>
      </form>

      {comments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <div className="mb-1 flex items-center justify-between text-xs text-white/45">
                <span>@{comment.authorName}</span>
                <span>{comment.createdAt}</span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-white/85">
                {comment.text}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default CommentSection
