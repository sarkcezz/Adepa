import { Check, Printer } from "lucide-react";
import type { EventBooking } from "@/lib/types";
import { formatGhs, formatEventDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

/** Branded ticket-style confirmation — shown right after booking, emailed as HTML, and printable as a PDF. */
export function EventConfirmation({ booking, showPrintButton = true }: { booking: EventBooking; showPrintButton?: boolean }) {
  const { event, companions, management_code: code } = booking;
  const partySize = 1 + companions.length;
  const isFree = event.flat_rate_kobo === 0;
  const total = event.flat_rate_kobo * partySize;
  const guests = [booking.attendee_name, ...companions];

  return (
    <div className="mx-auto w-full max-w-lg">
      {showPrintButton && (
        <div className="mb-4 flex justify-end print:hidden">
          <Button variant="outline" className="w-full rounded-full sm:w-auto" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card print:rounded-none print:border-0">
        {/* Masthead */}
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-5 sm:px-7">
          <Logo className="h-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-base font-semibold leading-tight">Adepa Pork Hub</p>
            <p className="truncate text-[11px] text-muted-foreground">A Symas Group company</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--chart-3)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[color:var(--chart-3)]">
            <Check className="size-3.5" /> Confirmed
          </span>
        </div>

        {/* Event */}
        <div className="px-5 pb-2 pt-6 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Booking confirmation</p>
          <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {event.name}
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Date &amp; time</p>
              <p className="mt-0.5 text-sm text-foreground">{formatEventDateTime(event.event_date, event.event_time)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Venue</p>
              <p className="mt-0.5 text-sm text-foreground">
                {event.venue_name}
                {event.venue_address ? (
                  event.venue_address.startsWith("http") ? (
                    <>
                      <br />
                      <a href={event.venue_address} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 print:text-foreground">
                        View on map
                      </a>
                    </>
                  ) : (
                    <>
                      <br />
                      {event.venue_address}
                    </>
                  )
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* Party */}
        <div className="flex items-center gap-3 px-5 pt-5 sm:px-7">
          <div className="h-px flex-1 bg-border" />
          <p className="shrink-0 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Party of {partySize}</p>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-col gap-2.5 px-5 pb-2 pt-4 sm:px-7">
          {guests.map((name, i) => (
            <div key={i} className={`flex items-baseline justify-between gap-3 pb-2.5 text-sm ${i < guests.length - 1 ? "border-b border-dashed border-border" : ""}`}>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate font-semibold text-foreground">{name}</span>
              </span>
              {i === 0 && <span className="shrink-0 text-xs text-muted-foreground">{booking.attendee_phone}</span>}
            </div>
          ))}
        </div>

        {/* Payment */}
        <div className="mx-5 my-5 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/40 px-4.5 py-4 sm:mx-7">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Payment</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isFree ? "Free entry" : `${formatGhs(event.flat_rate_kobo)} × ${partySize} — pay cash at the event`}
            </p>
          </div>
          <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl font-semibold text-primary">
            {isFree ? "FREE" : formatGhs(total)}
          </p>
        </div>

        {/* Perforation */}
        <div className="relative border-t-2 border-dashed border-border">
          <span className="absolute -left-2.5 -top-2.5 size-5 rounded-full border border-border bg-background" />
          <span className="absolute -right-2.5 -top-2.5 size-5 rounded-full border border-border bg-background" />
        </div>

        {/* Stub */}
        <div className="flex flex-col gap-4 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Your booking code</p>
              <p className="mt-1 max-w-[26ch] text-xs text-muted-foreground">Keep this to view, edit, or cancel your booking — no account needed.</p>
            </div>
            <p className="rounded-xl border-2 border-[color:var(--chart-3)]/40 bg-[color:var(--chart-3)]/10 px-4 py-2.5 font-mono text-xl font-bold tracking-[0.14em] text-primary">
              {code}
            </p>
          </div>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border/60 bg-secondary/40 px-3.5 py-2.5 font-mono text-[12.5px] text-muted-foreground">
            adepaporkhub.shop/events/manage/<span className="font-bold text-primary">{code}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-5 py-5 sm:px-7">
          <p className="text-xs font-bold text-foreground">Questions? WhatsApp us anytime.</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Ejisu-Krapa, Ashanti Region, Ghana · wa.me/233240425561 · orders@adepaporkhub.shop
            <br />Pork sourced fresh from Symas Farms.
          </p>
        </div>
      </div>
    </div>
  );
}
