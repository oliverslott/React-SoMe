import { useId, useState } from 'react'
import Comment from './comment'

function CommentSection({ comments, commenterName, onAddComment, disabled = false }) {
  const inputId = useId()
  const [commentText, setCommentText] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (disabled) {
      return
    }

    const trimmedComment = commentText.trim()

    if (!trimmedComment) {
      return
    }

    try {
      await onAddComment(trimmedComment)
      setCommentText('')
    } catch {
      // Frontpage shows the user-facing error message.
    }
  }

  return (
    <section className="mt-5 border-t border-white/10 pt-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor={inputId} className="block text-sm text-white/65">
          Skriv en kommentar
        </label>

        <p className="text-xs text-white/40">
          {disabled ? 'Log ind for at kommentere.' : `Kommenterer som @${commenterName}`}
        </p>

        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="text"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Skriv din kommentar her..."
            disabled={disabled}
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
            disabled={disabled}
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
              disabled:cursor-not-allowed
              disabled:bg-white/40
            "
          >
            Kommenter
          </button>
        </div>
      </form>

      {comments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default CommentSection
