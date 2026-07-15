/** Minimal brand marks — lucide-react no longer ships these. */

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.6c-.13 1.1-.86 2.75-2.47 3.86l-.02.15 3.59 2.78.25.03c2.28-2.1 3.57-5.19 3.57-8.49Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.78-2.93c-1.01.7-2.37 1.19-4.16 1.19-3.18 0-5.88-2.1-6.84-5.02l-.14.01-3.73 2.89-.05.14C3.24 21.3 7.29 24 12 24Z" />
      <path fill="#FBBC05" d="M5.16 14.34a7.4 7.4 0 0 1-.4-2.34c0-.82.15-1.6.39-2.34l-.01-.16-3.78-2.94-.12.06A11.93 11.93 0 0 0 0 12c0 1.93.47 3.76 1.24 5.38l3.92-3.04Z" />
      <path fill="#EA4335" d="M12 4.75c2.25 0 3.77.97 4.64 1.79l3.39-3.31C17.94 1.19 15.24 0 12 0 7.29 0 3.24 2.7 1.24 6.62l3.91 3.04c.97-2.92 3.67-4.91 6.85-4.91Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.5-1.46H16.5V4.35C16.24 4.32 15.36 4.25 14.33 4.25c-2.15 0-3.62 1.31-3.62 3.72V10.5H8.2v3h2.5V21h2.8Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v2.7c-1.4 0-2.7-.4-3.8-1.2v6.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V3h2.5Z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
      <path d="M10.5 9.5v5l4.3-2.5-4.3-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
