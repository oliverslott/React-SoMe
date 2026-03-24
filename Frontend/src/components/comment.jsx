function Comment({ comment }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="mb-1 flex items-center justify-between text-xs text-white/45">
        <span>@{comment.authorName}</span>
        <span>{comment.createdAt}</span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-white/85">{comment.text}</p>
    </article>
  )
}

export default Comment
