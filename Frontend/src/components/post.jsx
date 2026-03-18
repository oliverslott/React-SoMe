function Post({ post }) {
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
        <span>@dig</span>
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
    </article>
  )
}

export default Post
