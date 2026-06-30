import { format } from "date-fns";
import { CalendarDays, Clock, DollarSign, Send, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  assertWalletNetwork,
  missingContractConfig,
  postBounty,
} from "../lib/contracts";
import { useFreighter } from "../lib/hooks/useFreighter";
import { Button } from "./ui/Button";
import { Calendar } from "./ui/Calendar";
import { Input } from "./ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover";
import { Textarea } from "./ui/Textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";

type AmountMode = "xlm" | "usd";
const USD_PER_XLM_ESTIMATE = 0.1;

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateToInputValue(date: Date | null) {
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

export function PostBountyForm() {
  const { address, connect, network, sign } = useFreighter();
  const configError = missingContractConfig();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountMode, setAmountMode] = useState<AmountMode>("xlm");
  const [amount, setAmount] = useState("");
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [deadlineTime, setDeadlineTime] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const xlmAmount = useMemo(() => {
    if (amountMode === "xlm") return amount;
    const usd = numberValue(amount);
    if (usd <= 0) return "";
    return (usd / USD_PER_XLM_ESTIMATE).toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
  }, [amount, amountMode]);

  const deadline = useMemo(() => {
    if (!deadlineDate) return "";
    const [hours, minutes] = deadlineTime.split(":").map(Number);
    const next = new Date(deadlineDate);
    next.setHours(hours || 0, minutes || 0, 0, 0);
    return dateToInputValue(next);
  }, [deadlineDate, deadlineTime]);

  const validationError = useMemo(() => {
    if (!title.trim()) return "Title is required.";
    if (!description.trim()) return "Description is required.";
    const parsedAmount = Number(xlmAmount);
    if (!xlmAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return amountMode === "usd"
        ? "Enter a USD amount and XLM/USD rate greater than zero."
        : "Amount must be greater than zero.";
    }
    if (!deadline) return "Deadline is required.";
    if (new Date(deadline).getTime() <= Date.now()) {
      return "Deadline must be in the future.";
    }
    return null;
  }, [amountMode, deadline, description, title, xlmAmount]);

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
          amount: xlmAmount,
          deadline,
        },
        sign,
      );
      setTitle("");
      setDescription("");
      setAmount("");
      setDeadlineDate(null);
      setDeadlineTime("17:00");
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
      className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30"
    >
      <div className="border-b border-zinc-800 bg-[#101218] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
            <Sparkles aria-hidden="true" size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Bounty details</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Funds are escrowed in XLM when the wallet transaction is signed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5">
        {configError ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {configError}
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-200">Title</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contract audit, frontend task, design review"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-200">Description</span>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Scope, acceptance criteria, acceptance links, expected delivery"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-md border border-zinc-800 bg-[#0b0d11] p-3">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="text-sm font-medium text-zinc-200">Reward amount</label>
                <p className="mt-1 text-xs text-zinc-500">The contract receives XLM.</p>
              </div>
              <ToggleGroup
                type="single"
                value={amountMode}
                onValueChange={(value) => value && setAmountMode(value as AmountMode)}
                className="grid w-full grid-cols-2 rounded-md border border-zinc-800 bg-zinc-950 p-1 sm:w-44"
              >
                <ToggleGroupItem value="xlm">XLM</ToggleGroupItem>
                <ToggleGroupItem value="usd">USD</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-medium text-zinc-400">
                  {amountMode === "xlm" ? "XLM amount" : "USD budget"}
                </span>
                <div className="relative">
                  {amountMode === "usd" ? (
                    <DollarSign
                      aria-hidden="true"
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                  ) : null}
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={amountMode === "usd" ? "pl-8" : ""}
                    inputMode="decimal"
                    placeholder={amountMode === "xlm" ? "0.10" : "25.00"}
                  />
                </div>
              </label>
            </div>

          </div>

          <div className="rounded-md border border-zinc-800 bg-[#0b0d11] p-3">
            <label className="text-sm font-medium text-zinc-200">Deadline</label>
            <p className="mt-1 text-xs text-zinc-500">Choose a date and exact time.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_132px] lg:grid-cols-1 xl:grid-cols-[1fr_132px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="justify-start px-3 font-medium">
                    <CalendarDays aria-hidden="true" size={17} />
                    <span>
                      {deadlineDate ? format(deadlineDate, "MMM d, yyyy") : "Pick date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={deadlineDate ?? undefined}
                    onSelect={(date: Date | undefined) => setDeadlineDate(date ?? null)}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              <label className="relative">
                <Clock
                  aria-hidden="true"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <Input
                  type="time"
                  value={deadlineTime}
                  onChange={(event) => setDeadlineTime(event.target.value)}
                  className="pl-9"
                />
              </label>
            </div>
          </div>
        </div>

        {submitMessage ? (
          <div className="rounded-md border border-zinc-800 bg-[#08090c] px-3 py-2 text-sm text-zinc-300">
            {submitMessage}
          </div>
        ) : null}

        <Button type="submit" disabled={submitDisabled} className="w-full">
          <Send aria-hidden="true" size={17} />
          <span>{submitting ? "Posting" : "Post bounty"}</span>
        </Button>
      </div>
    </form>
  );
}
