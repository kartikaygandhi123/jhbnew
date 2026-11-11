import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Bold, CheckCircle2, ImagePlus, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
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
  | "category"
  | "richtext";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Shows a "current date and time" checkbox that fills this text field. */
  nowCheckbox?: boolean;
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
  /** Extra marker shown next to a row (e.g. "waiting for approval, sent by …"). */
  rowBadge?: (row: Row) => ReactNode;
  /** Shows a one-click "publish" button on unpublished rows. */
  quickPublish?: boolean;
}


export function AdminTable({ table, title, fields, orderBy = "sort_order", filter, defaults, api, rowLabel, rowBadge, quickPublish }: Props) {
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
            badge={rowBadge?.(row)}
            {...(quickPublish && row['published'] === false
              ? { onPublish: () => save.mutate({ ...row, published: true }) }
              : {})}
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
  badge,
  onPublish,
  onSave,
  onDelete,
  saving,
}: {
  row: Row;
  fields: FieldDef[];
  label?: string;
  badge?: ReactNode;
  onPublish?: () => void;
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

        {badge}
        {onPublish && (
          <button
            type="button"
            disabled={saving}
            onClick={onPublish}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> प्रकाशित करें
          </button>
        )}
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
        <label key={f.name} className={`block text-xs ${f.type === "textarea" || f.type === "richtext" ? "sm:col-span-2" : ""}`}>
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

          {f.type === "text" && f.nowCheckbox && (
            <span className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                onChange={(e) => {
                  if (e.target.checked) set(f.name, nowLabel());
                }}
              />
              वर्तमान दिनांक और समय डालें
            </span>
          )}

          {f.type === "richtext" && (
            <RichTextArea
              value={String(value[f.name] ?? "")}
              placeholder={f.placeholder}
              onChange={(v) => set(f.name, v)}
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



/** "12 नवंबर 2026, 12:30 PM" style label for the current moment (India time). */
export function nowLabel(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Article body box with "bold" and "add photo between paragraphs" buttons. */
function RichTextArea({ value, placeholder, onChange }: { value: string; placeholder?: string | undefined; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const wrapBold = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const picked = value.slice(a, b) || "बोल्ड शब्द";
    const next = `${value.slice(0, a)}**${picked}**${value.slice(b)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + 2, a + 2 + picked.length);
    });
  };

  const insertPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, "images");
      const caption = window.prompt("तस्वीर का कैप्शन (वैकल्पिक)") ?? "";
      const at = ref.current?.selectionEnd ?? value.length;
      const before = value.slice(0, at).replace(/\s*$/, "");
      const after = value.slice(at).replace(/^\s*/, "");
      const block = `![${caption.replace(/[\[\]]/g, "")}](${url})`;
      onChange([before, block, after].filter(Boolean).join("\n\n"));
      toast.success("तस्वीर जोड़ दी गई");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "अपलोड विफल");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <span className="block">
      <span className="mb-1 flex flex-wrap gap-2">
        <button type="button" onClick={wrapBold} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-semibold hover:bg-accent">
          <Bold className="h-3.5 w-3.5" /> बोल्ड
        </button>
        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-semibold hover:bg-accent disabled:opacity-50">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} बीच में तस्वीर जोड़ें
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void insertPhoto(e.target.files?.[0])} />
      </span>
      <textarea
        ref={ref}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background p-2 text-sm"
      />
      <span className="mt-1 block text-[10px] text-muted-foreground">
        शब्द चुनकर "बोल्ड" दबाएं। कर्सर जहां है, वहीं दो पैराग्राफ के बीच तस्वीर लगेगी।
      </span>
    </span>
  );
}
