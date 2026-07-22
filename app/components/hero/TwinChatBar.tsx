'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * "Frag deinen Twin …" chat entry field at the base of the hero. No new AI
 * API is introduced here — submitting navigates to the existing
 * /frag-deinen-twin chat route (see app/frag-deinen-twin/page.tsx).
 */
export default function TwinChatBar() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push('/frag-deinen-twin');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm focus-within:border-[#46C8C8]/40"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="flex-shrink-0 text-[#58D7D4]">
        <path
          d="M1 10h4l2-6 4 12 2-6h6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <label htmlFor="vt-hero-chat-input" className="sr-only">
        Frag deinen Twin
      </label>
      <input
        id="vt-hero-chat-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Frag deinen Twin …"
        className="min-w-0 flex-1 bg-transparent text-sm text-[#F5F2EA] placeholder:text-[#8E969F] focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Frage an deinen Twin senden"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#46C8C8] text-[#0B1118] transition hover:bg-[#58D7D4]"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 10h13M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
