import CommentSection from './comment-section'

function Post({ post, authorName, commenterName, onAddComment, onToggleLike }) {
  return (
    <article
      className="
        rounded-[28px]
        border
        border-white/10
        bg-[#141416]
        p-5
        shadow-lg
      "
    >
      <div
        className="
          mb-3
          flex
          items-center
          justify-between
          text-sm
          text-white/45
        "
      >
        <span>@{authorName}</span>
        <span>{post.createdAt}</span>
      </div>

      <p
        className="
          whitespace-pre-wrap
          text-base
          leading-7
          text-white/95
        "
      >
        {post.text}
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => onToggleLike(post.id)}
          className={`
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            px-4
            py-2
            text-sm
            font-semibold
            transition
            ${
              post.liked
                ? 'border-green-500/70 bg-green-500/15 text-green-400'
                : 'border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]'
            }
          `}
        >
          Like
          <span
            className={`
              rounded-full
              px-2
              py-0.5
              text-xs
              ${
                post.liked
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-white/8 text-white/65'
              }
            `}
          >
            {post.likeCount}
          </span>
        </button>
      </div>

      <CommentSection
        comments={post.comments}
        commenterName={commenterName}
        onAddComment={(commentText) => onAddComment(post.id, commentText)}
      />
    </article>
  )
}

export default Post
