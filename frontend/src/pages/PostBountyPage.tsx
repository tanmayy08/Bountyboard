import { PostBountyForm } from "../components/PostBountyForm";

export function PostBountyPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Post a bounty</h1>
        <p className="mt-1 text-sm text-zinc-400">Fund escrow and publish work for solvers.</p>
      </div>
      <PostBountyForm />
    </section>
  );
}

