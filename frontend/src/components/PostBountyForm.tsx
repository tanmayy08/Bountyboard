import { Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  assertWalletNetwork,
  missingContractConfig,
  postBounty,
} from "../lib/contracts";
import { useFreighter } from "../lib/hooks/useFreighter";

export function PostBountyForm() {
  const { address, connect, network, sign } = useFreighter();
  const configError = missingContractConfig();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!title.trim()) return "Title is required.";
    if (!description.trim()) return "Description is required.";
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return "Amount must be greater than zero.";
    }
    if (!deadline) return "Deadline is required.";
    if (new Date(deadline).getTime() <= Date.now()) {
      return "Deadline must be in the future.";
    }
    return null;
  }, [amount, deadline, description, title]);

  const submitDisabled = submitting || Boolean(validationError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationError) {
      setSubmitMessage(validationError);
      return;
    }
    if (configError) {
      setSubmitMessage(configError);
      return;
    }

    setSubmitting(true);
    setSubmitMessage("Preparing bounty transaction.");
    try {
      const client = address ?? (await connect());
      assertWalletNetwork(network);
      setSubmitMessage("Waiting for wallet signature.");
      const result = await postBounty(
        {
          client,
          title,
          description,
          amount,
          deadline,
        },
        sign,
      );
      setTitle("");
      setDescription("");
      setAmount("");
      setDeadline("");
      setSubmitMessage(`Bounty posted. Transaction: ${result.hash}`);
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Unable to post bounty.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-md border border-zinc-800 bg-zinc-950 p-4 sm:p-5"
    >
      {configError ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {configError}
        </div>
      ) : null}
      <label className="grid gap-2">
        <span className="text-sm font-medium text-zinc-200">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-md border border-zinc-800 bg-[#08090c] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
          placeholder="Contract audit, frontend task, design review"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-zinc-200">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-32 rounded-md border border-zinc-800 bg-[#08090c] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
          placeholder="Scope, acceptance criteria, references"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-200">Amount</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-11 rounded-md border border-zinc-800 bg-[#08090c] px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-200">Deadline</span>
          <input
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="h-11 rounded-md border border-zinc-800 bg-[#08090c] px-3 text-sm text-white outline-none transition focus:border-emerald-500"
            type="datetime-local"
          />
        </label>
      </div>
      {submitMessage ? (
        <div className="rounded-md border border-zinc-800 bg-[#08090c] px-3 py-2 text-sm text-zinc-300">
          {submitMessage}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send aria-hidden="true" size={17} />
        <span>{submitting ? "Posting" : "Post bounty"}</span>
      </button>
    </form>
  );
}
