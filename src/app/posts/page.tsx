// app/page.tsx
import { createPost, getPosts, deletePost } from "../../actions/posts";

export default async function HomePage() {
  // READ: Fetch posts directly in this Server Component
  const posts = await getPosts();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">My Drizzle Blog</h1>

      {/* CREATE: Form to add a new post */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Create a New Post</h2>
        <form action={createPost} className="flex flex-col gap-4">
          <input
            type="text"
            name="title"
            placeholder="Post Title"
            required
            className="p-2 border rounded text-black"
          />
          <textarea
            name="content"
            placeholder="Post Content"
            required
            rows={4}
            className="p-2 border rounded text-black"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
          >
            Submit Post
          </button>
        </form>
      </section>

      {/* READ: Display the list of posts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Posts</h2>
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="p-4 border rounded-lg shadow-sm">
                <h3 className="text-xl font-bold">{post.title}</h3>
                <p className="text-gray-300 my-2">{post.content}</p>
                <div className="flex justify-between items-center mt-4">
                  <small className="text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </small>
                  
                  {/* DELETE: Form with a button to delete a post */}
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p>No posts yet. Be the first to create one!</p>
          )}
        </div>
      </section>
      
      {/* NOTE on UPDATE: The `updatePost` action is ready.
          A full UI for updating would typically involve a separate [id]/edit page.
          You would fetch a single post, populate a form, and then call `updatePost` on submit.
          The logic is already in actions.ts. */}
    </main>
  );
}