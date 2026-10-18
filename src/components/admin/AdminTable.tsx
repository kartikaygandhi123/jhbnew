import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/external-client";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/lib/content";
import { uploadMedia } from "@/lib/upload";
import { requireWrittenRow, saveArticle } from "@/lib/article-write";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "file"
  | "select"
  | "dropdown"
  | "date"
  | "color"
  | "category";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Lets a field update sibling fields (e.g. a date label or "today" toggle). */
  sideEffect?: (row: Record<string, unknown>, value: unknown) => Record<string, unknown>;
}

type Row = Record<string, unknown>;

export interface TableApi {
  list: () => Promise<Row[]>;
  save: (row: Row) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

interface Props {
  table: string;
  title: string;
  fields: FieldDef[];
  orderBy?: string;
  filter?: { column: string; value: string };
  defaults?: Row;
  api?: TableApi;
  /** Custom text for each row in the list. */
  rowLabel?: (row: Row) => string;
}


export function AdminTable({ table, title, fields, orderBy = "sort_order", filter, defaults, api, rowLabel }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const [draft, setDraft] = useState<Row | null>(null);

  const listKey = ["admin", table, filter?.value ?? ""];

  const { data: rows, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: async (): Promise<Row[]> => {
      if (api) return api.list();
      let q = supabase.from(table as never).select("*");
      if (filter) q = q.eq(filter.column, filter.value);
      const { data, error } = await q.order(orderBy);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const invalidate = async () => {
    await Promise.all([qc.invalidateQueries(), router.invalidate()]);
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const payload = { ...row };
      delete payload['created_at'];
      delete payload['updated_at'];
      if (api) {
        await api.save(payload);
        return;
      }
      if (table === "articles") {
        await saveArticle(payload, async (next) => {
          const id = next['id'] as string | undefined;
          if (id) {
            return await supabase.from(table as never).update(next as never).eq("id", id).select("id").maybeSingle();
          }
          const insert = { ...next };
          delete insert['id'];
          return await supabase.from(table as never).insert(insert as never).select("id").maybeSingle();
        });
        return;
      }
      const id = payload['id'] as string | undefined;
      if (id) {
        const { data, error } = await supabase
          .from(table as never)
          .update(payload as never)
          .eq("id", id).select("id").maybeSingle();
        if (error) throw error;
        requireWrittenRow(data);
      } else {
        delete payload['id'];
        const { data, error } = await supabase.from(table as never).insert(payload as never).select("id").maybeSingle();
        if (error) throw error;
        requireWrittenRow(data);
      }
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("सेव हो गया");
      setDraft(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (api) {
        await api.remove(id);
        return;
      }
      const { data, error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id).select("id").maybeSingle();
      if (error) throw error;
      requireWrittenRow(data);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("हटा दिया गया");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startNew = () => {
    const blank: Row = { ...defaults };
    if (filter) blank[filter.column] = filter.value;
    for (const f of fields) {
      if (!(f.name in blank)) blank[f.name] = f.type === "boolean" ? false : f.type === "number" ? 0 : "";
    }
    setDraft(blank);
  };

  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="headline text-base font-bold">{title}</h2>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> नया
        </button>
      </header>

      {draft && (
        <RecordForm
          fields={fields}
          value={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => save.mutate(draft)}
          saving={save.isPending}
        />
      )}

      <div className="divide-y divide-border">
        {isLoading && <p className="px-3 py-4 text-xs text-muted-foreground">लोड हो रहा है…</p>}
        {(rows ?? []).map((row) => (
          <RowItem
            key={String(row['id'])}
            row={row}
            fields={fields}
            {...(rowLabel ? { label: rowLabel(row) } : {})}
            onSave={(next) => save.mutate(next)}
            onDelete={() => remove.mutate(String(row['id']))}
            saving={save.isPending}
          />
        ))}
        {!isLoading && (rows ?? []).length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground">कोई रिकॉर्ड नहीं।</p>
        )}
      </div>
    </section>
  );
}

function RowItem({
  row,
  fields,
  label,
  onSave,
  onDelete,
  saving,
}: {
  row: Row;
  fields: FieldDef[];
  label?: string;
  onSave: (row: Row) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Row>(row);
  const primary = fields[0]?.name ?? "id";

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
            onClick={() => {
              if (!open) setValue(row);
              setOpen((v) => !v);
            }}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold hover:text-primary"
        >
          {label || String(row[primary] || row['id'])}
        </button>

        <button
          type="button"
          aria-label="हटाएं"
          onClick={() => {
            if (confirm("क्या आप वाकई हटाना चाहते हैं?")) onDelete();
          }}
          className="grid h-8 w-8 place-items-center rounded-md border border-border text-primary hover:bg-accent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <RecordForm
          fields={fields}
          value={value}
          onChange={setValue}
          onCancel={() => setOpen(false)}
          onSave={() => onSave(value)}
          saving={saving}
        />
      )}
    </div>
  );
}

function RecordForm({
  fields,
  value,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  fields: FieldDef[];
  value: Row;
  onChange: (row: Row) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [uploading, setUploading] = useState<string | null>(null);

  const set = (name: string, v: unknown) => {
    const field = fields.find((f) => f.name === name);
    let next: Row = { ...value, [name]: v };
    if (field?.sideEffect) next = field.sideEffect(next, v);
    onChange(next);
  };


  const pick = async (name: string, file: File | undefined, folder: string) => {
    if (!file) return;
    setUploading(name);
    try {
      set(name, await uploadMedia(file, folder));
      toast.success("फ़ाइल अपलोड हो गई");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "अपलोड विफल");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="grid gap-3 border-t border-border bg-surface p-3 sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f.name} className={`block text-xs ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
          <span className="mb-1 block font-semibold text-muted-foreground">{f.label}</span>

          {f.type === "textarea" && (
            <textarea
              rows={5}
              value={String(value[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-border bg-background p-2 text-sm"
            />
          )}

          {f.type === "boolean" && (
            <input
              type="checkbox"
              checked={Boolean(value[f.name])}
              onChange={(e) => set(f.name, e.target.checked)}
              className="h-4 w-4"
            />
          )}

          {f.type === "number" && (
            <input
              type="number"
              value={Number(value[f.name] ?? 0)}
              onChange={(e) => set(f.name, Number(e.target.value))}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            />
          )}

          {f.type === "select" && (
            <select
              value={String(value[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="">—</option>
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}

          {f.type === "date" && (
            <input
              type="date"
              value={String(value[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            />
          )}

          {f.type === "dropdown" && (
            <DropdownPicker
              value={String(value[f.name] ?? "")}
              options={f.options ?? []}
              onPick={(v) => set(f.name, v)}
            />
          )}

          {f.type === "category" && (
            <CategoryPicker slug={String(value[f.name] ?? "")} onPick={(slug, label) => onChange({ ...value, [f.name]: slug, category_label: label })} />
          )}

          {f.type === "color" && (
            <span className="flex flex-wrap gap-2" role="group" aria-label={f.label}>
              {(f.options ?? []).map((option) => (
                <Button key={option.value} type="button" size="sm" variant="outline"
                  title={option.label} aria-label={option.label} aria-pressed={value[f.name] === option.value}
                  onClick={() => set(f.name, option.value)}
                  className={value[f.name] === option.value ? "ring-2 ring-ring" : ""}>
                  <span className={`h-4 w-4 rounded-full kicker-swatch-${option.value}`} aria-hidden="true" />
                  {option.label}
                </Button>
              ))}
            </span>
          )}





          {(f.type === "image" || f.type === "file") && (
            <span className="flex items-center gap-2">
              <input
                value={String(value[f.name] ?? "")}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder="URL या अपलोड करें"
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              />
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold hover:bg-accent">
                {uploading === f.name ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                अपलोड
                <input
                  type="file"
                  accept={f.type === "image" ? "image/*" : undefined}
                  className="hidden"
                  onChange={(e) => void pick(f.name, e.target.files?.[0], f.type === "image" ? "images" : "files")}
                />
              </label>
            </span>
          )}

          {f.type === "text" && (
            <input
              value={String(value[f.name] ?? "")}
              onChange={(e) => set(f.name, e.target.value)}
              placeholder={f.placeholder}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            />
          )}
        </label>
      ))}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" /> सेव करें
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"
        >
          बंद करें
        </button>
      </div>
    </div>
  );
}

/** Category dropdown with an inline "add new category" form. */
function CategoryPicker({ slug, onPick }: { slug: string; onPick: (slug: string, label: string) => void }) {
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const l = label.trim();
    const s = (newSlug.trim() || l.toLowerCase().replace(/\s+/g, "-")).replace(/[^a-z0-9-]/g, "");
    if (!l || !s) {
      toast.error("नाम और स्लग भरें");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("categories").insert({ label: l, slug: s, sort_order: 100 });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["categories"] });
      onPick(s, l);
      setAdding(false);
      setLabel("");
      setNewSlug("");
      toast.success("श्रेणी जुड़ गई");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "श्रेणी नहीं जुड़ी");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="block">
      <select
        value={slug}
        onChange={(e) => {
          const found = (categories ?? []).find((c) => c.slug === e.target.value);
          onPick(e.target.value, found?.label ?? "");
        }}
        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
      >
        <option value="">— श्रेणी चुनें —</option>
        {(categories ?? []).map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.label}
          </option>
        ))}
      </select>

      {adding ? (
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="नई श्रेणी का नाम"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="slug"
            className="h-9 w-28 rounded-md border border-border bg-background px-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void create()}
            className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            जोड़ें
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="h-9 rounded-md border border-border px-3 text-xs font-semibold"
          >
            रद्द
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-accent"
        >
          <Plus className="h-3 w-3" /> नई श्रेणी जोड़ें
        </button>
      )}
    </span>
  );
}

/** Dropdown that also lets the operator type a brand new option. */
function DropdownPicker({
  value,
  options,
  onPick,
}: {
  value: string;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
}) {
  const [extra, setExtra] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const all = [...options.map((o) => o.value), ...extra];
  if (value && !all.includes(value)) all.push(value);

  return (
    <span className="block">
      <select
        value={value}
        onChange={(e) => onPick(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
      >
        <option value="">— चुनें —</option>
        {all.map((v) => (
          <option key={v} value={v}>
            {options.find((o) => o.value === v)?.label ?? v}
          </option>
        ))}
      </select>

      {adding ? (
        <span className="mt-2 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="नया विकल्प"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const v = text.trim();
              if (!v) return;
              setExtra((list) => [...list, v]);
              onPick(v);
              setText("");
              setAdding(false);
            }}
            className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            जोड़ें
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="h-9 rounded-md border border-border px-3 text-xs font-semibold"
          >
            रद्द
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold hover:bg-accent"
        >
          <Plus className="h-3 w-3" /> नया विकल्प जोड़ें
        </button>
      )}
    </span>
  );
}

