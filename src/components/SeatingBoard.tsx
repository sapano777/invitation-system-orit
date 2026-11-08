"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition, type DragEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { addTables, assignSeat, deleteTable, updateTable, type SeatingResult } from "@/app/admin/events/[id]/tables/actions";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import type { EventTableRow } from "@/lib/types/database";

export type SeatingGuest = { id: string; full_name: string; guest_count: number };

type Props = {
  eventId: string;
  tables: EventTableRow[];
  guests: SeatingGuest[];
  // registration id -> table id
  assignments: Record<string, string>;
};

type Seating = { tables: EventTableRow[]; assignments: Record<string, string> };

type Change =
  | { type: "assign"; registrationId: string; tableId: string | null }
  | { type: "update"; tableId: string; name: string; capacity: number }
  | { type: "delete"; tableId: string };

// Applies a change locally so the board responds at once; the server result
// replaces it when the action finishes (or it rolls back on failure).
function apply(state: Seating, change: Change): Seating {
  switch (change.type) {
    case "assign": {
      const assignments = { ...state.assignments };
      if (change.tableId) assignments[change.registrationId] = change.tableId;
      else delete assignments[change.registrationId];
      return { ...state, assignments };
    }
    case "update":
      return {
        ...state,
        tables: state.tables.map((t) => (t.id === change.tableId ? { ...t, name: change.name, capacity: change.capacity } : t)),
      };
    case "delete":
      return {
        tables: state.tables.filter((t) => t.id !== change.tableId),
        assignments: Object.fromEntries(Object.entries(state.assignments).filter(([, tableId]) => tableId !== change.tableId)),
      };
  }
}

const DRAG_TYPE = "application/x-registration-id";

export function SeatingBoard({ eventId, tables, guests, assignments }: Props) {
  const t = useTranslations("seating");
  const [seating, addChange] = useOptimistic<Seating, Change>({ tables, assignments }, apply);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");

  // Leaving while a change is still saving would lose it; let the browser ask.
  useEffect(() => {
    if (!pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);

  function run(change: Change | null, action: () => Promise<SeatingResult>) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      if (change) addChange(change);
      const result = await action();
      if (result.ok) setSaved(true);
      else setError(t(`errors.${result.error}`));
    });
  }

  const move = (registrationId: string, tableId: string | null) => {
    if ((seating.assignments[registrationId] ?? null) === tableId) return;
    run({ type: "assign", registrationId, tableId }, () => assignSeat(eventId, registrationId, tableId));
  };

  const byTable = useMemo(() => {
    const map = new Map<string | null, SeatingGuest[]>();
    for (const guest of guests) {
      const tableId = seating.assignments[guest.id] ?? null;
      // A seat at a table that no longer exists counts as unseated.
      const key = tableId && seating.tables.some((tb) => tb.id === tableId) ? tableId : null;
      map.set(key, [...(map.get(key) ?? []), guest]);
    }
    return map;
  }, [guests, seating]);

  const unseated = byTable.get(null) ?? [];
  const totalGuests = guests.reduce((sum, g) => sum + g.guest_count, 0);
  const unseatedGuests = unseated.reduce((sum, g) => sum + g.guest_count, 0);
  const totalSeats = seating.tables.reduce((sum, tb) => sum + tb.capacity, 0);
  const filteredUnseated = query.trim()
    ? unseated.filter((g) => g.full_name.toLowerCase().includes(query.trim().toLowerCase()))
    : unseated;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          // Kept left-to-right so "20 / 31" isn't flipped in Hebrew.
          [t("summary.seated"), <span key="seated" dir="ltr">{`${totalGuests - unseatedGuests} / ${totalGuests}`}</span>],
          [t("summary.unseated"), unseatedGuests],
          [t("summary.tables"), seating.tables.length],
          [t("summary.seats"), totalSeats],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-surface p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-2xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <AddTables
        pending={pending}
        onAdd={(input) => run(null, () => addTables(eventId, { ...input, prefix: t("tablePrefix") }))}
      />

      <p role="status" className={`min-h-5 text-sm ${error ? "text-red-600" : "text-muted"}`}>
        {pending ? t("saving") : error ?? (saved ? t("saved") : "")}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
        <DropZone
          label={t("unseated")}
          onDropGuest={(id) => move(id, null)}
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("unseated")}</h2>
            <span className="text-sm text-muted">{t("guests", { count: unseatedGuests })}</span>
          </div>
          {unseated.length > 5 && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className={`${inputClass} py-1.5 text-sm`}
            />
          )}
          {unseated.length === 0 ? (
            <p className="text-sm text-muted">{guests.length === 0 ? t("noGuests") : t("allSeated")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredUnseated.map((guest) => (
                <GuestCard key={guest.id} guest={guest} tables={seating.tables} tableId={null} onMove={move} />
              ))}
            </ul>
          )}
        </DropZone>

        {seating.tables.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">{t("noTables")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {seating.tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                tables={seating.tables}
                guests={byTable.get(table.id) ?? []}
                onMove={move}
                onUpdate={(name, capacity) =>
                  run({ type: "update", tableId: table.id, name, capacity }, () => updateTable(eventId, table.id, { name, capacity }))
                }
                onDelete={() => run({ type: "delete", tableId: table.id }, () => deleteTable(eventId, table.id))}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddTables({ pending, onAdd }: { pending: boolean; onAdd: (input: { count: number; capacity: number }) => void }) {
  const t = useTranslations("seating");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onAdd({ count: Number(data.get("count")), capacity: Number(data.get("capacity")) });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("add.count")}
        <input name="count" type="number" min={1} max={100} defaultValue={1} required className={`${inputClass} w-24`} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("add.capacity")}
        <input name="capacity" type="number" min={1} max={200} defaultValue={10} required className={`${inputClass} w-24`} />
      </label>
      <Button type="submit" disabled={pending}>{t("add.submit")}</Button>
    </form>
  );
}

function DropZone({
  label,
  onDropGuest,
  className,
  children,
}: {
  label: string;
  onDropGuest: (registrationId: string) => void;
  className: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);

  function onDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOver(true);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (id) onDropGuest(id);
  }

  return (
    <section
      aria-label={label}
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
      className={`${className} transition-colors ${over ? "border-accent bg-accent/5 outline-2 outline-accent" : ""}`}
    >
      {children}
    </section>
  );
}

function GuestCard({
  guest,
  tables,
  tableId,
  onMove,
}: {
  guest: SeatingGuest;
  tables: EventTableRow[];
  tableId: string | null;
  onMove: (registrationId: string, tableId: string | null) => void;
}) {
  const t = useTranslations("seating");
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, guest.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      data-guest={guest.full_name}
      className="flex cursor-grab flex-col gap-1.5 rounded-xl border border-border bg-background px-3 py-2 active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-muted">⋮⋮</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={guest.full_name}>{guest.full_name}</span>
        <span className="shrink-0 rounded-full bg-surface px-2 text-xs tabular-nums" title={t("guests", { count: guest.guest_count })}>
          <span aria-hidden>{guest.guest_count}</span>
          <span className="sr-only">{t("guests", { count: guest.guest_count })}</span>
        </span>
      </div>
      {/* Works with touch and keyboard, where drag and drop doesn't. */}
      <select
        value={tableId ?? ""}
        onChange={(e) => onMove(guest.id, e.target.value || null)}
        aria-label={t("moveTo", { name: guest.full_name })}
        className="w-full rounded-md border border-border bg-surface px-1.5 py-1 text-xs"
      >
        <option value="">{t("noTable")}</option>
        {tables.map((tb) => (
          <option key={tb.id} value={tb.id}>{tb.name}</option>
        ))}
      </select>
    </li>
  );
}

function TableCard({
  table,
  tables,
  guests,
  onMove,
  onUpdate,
  onDelete,
}: {
  table: EventTableRow;
  tables: EventTableRow[];
  guests: SeatingGuest[];
  onMove: (registrationId: string, tableId: string | null) => void;
  onUpdate: (name: string, capacity: number) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("seating");
  const [editing, setEditing] = useState(false);
  const seated = guests.reduce((sum, g) => sum + g.guest_count, 0);
  const over = seated > table.capacity;
  const percent = Math.min(100, (seated / table.capacity) * 100);

  return (
    <li>
      <DropZone
        label={table.name}
        onDropGuest={(id) => onMove(id, table.id)}
        className={`flex h-full flex-col gap-3 rounded-2xl border bg-surface p-4 ${over ? "border-red-400" : "border-border"}`}
      >
        {editing ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              onUpdate(String(data.get("name")), Number(data.get("capacity")));
              setEditing(false);
            }}
          >
            <label className="flex flex-1 flex-col gap-1 text-xs">
              {t("edit.name")}
              <input name="name" defaultValue={table.name} maxLength={60} required autoFocus className={`${inputClass} py-1.5 text-sm`} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              {t("edit.capacity")}
              <input name="capacity" type="number" min={1} max={200} defaultValue={table.capacity} required className={`${inputClass} w-20 py-1.5 text-sm`} />
            </label>
            <Button type="submit" className="px-3 py-1.5">{t("edit.save")}</Button>
            <Button type="button" variant="ghost" className="px-2 py-1.5" onClick={() => setEditing(false)}>{t("edit.cancel")}</Button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{table.name}</h3>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-muted underline-offset-2 hover:underline" onClick={() => setEditing(true)}>
                {t("edit.button")}
              </button>
              <button
                type="button"
                className="text-red-600 underline-offset-2 hover:underline"
                onClick={() => {
                  if (window.confirm(t("deleteConfirm", { name: table.name }))) onDelete();
                }}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className={over ? "font-semibold text-red-600" : "text-muted"}>
              {over ? t("overCapacity", { count: seated - table.capacity }) : t("seatsLeft", { count: table.capacity - seated })}
            </span>
            <span dir="ltr" className="tabular-nums" aria-label={t("occupancy", { seated, capacity: table.capacity })}>
              {seated}/{table.capacity}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-background">
            <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-accent"}`} style={{ width: `${percent}%` }} />
          </div>
        </div>

        {guests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">{t("dropHere")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {guests.map((guest) => (
              <GuestCard key={guest.id} guest={guest} tables={tables} tableId={table.id} onMove={onMove} />
            ))}
          </ul>
        )}
      </DropZone>
    </li>
  );
}
