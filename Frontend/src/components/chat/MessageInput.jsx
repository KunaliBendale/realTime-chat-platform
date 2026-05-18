import { useState } from "react";

export function MessageInput() {
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#d9dee8] bg-white px-4 py-3 sm:px-5"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <button
          type="button"
          className="size-11 shrink-0 border border-[#cfd6e3] text-xl text-[#172033] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          aria-label="Attach image"
        >
          +
        </button>

        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            rows={1}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a message"
            className="max-h-28 min-h-11 w-full resize-none border border-[#cfd6e3] bg-[#f7f8fb] px-3 py-2.5 text-sm text-[#172033] outline-none placeholder:text-[#8b97aa] focus:border-[#2563eb]"
          />
        </label>

        <button
          type="submit"
          disabled={!message.trim()}
          className="h-11 shrink-0 bg-[#2563eb] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:bg-[#93aeea]"
        >
          Send
        </button>
      </div>
    </form>
  );
}
