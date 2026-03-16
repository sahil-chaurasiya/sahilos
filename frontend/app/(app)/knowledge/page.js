"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Search, BookOpen, Film, Quote, User, FileText, Hash, X, Star } from "lucide-react";
import { useKnowledge } from "@/hooks/useKnowledge";
import { Button, Badge, Spinner, EmptyState, Input, Select, Textarea } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import PageWrapper from "@/components/layout/PageWrapper";
import clsx from "clsx";

// ── Category config (no "idea" — we have a dedicated Ideas module) ────────────
const CATEGORIES = [
  { value: "book",    label: "Books",    icon: BookOpen, color: "bg-blue-500/15 text-blue-400",    border: "border-blue-500/20" },
  { value: "movie",   label: "Movies",   icon: Film,     color: "bg-pink-500/15 text-pink-400",    border: "border-pink-500/20" },
  { value: "quote",   label: "Quotes",   icon: Quote,    color: "bg-violet-500/15 text-violet-400", border: "border-violet-500/20" },
  { value: "person",  label: "People",   icon: User,     color: "bg-emerald-500/15 text-emerald-400", border: "border-emerald-500/20" },
  { value: "article", label: "Articles", icon: FileText, color: "bg-cyan-500/15 text-cyan-400",    border: "border-cyan-500/20" },
  { value: "other",   label: "Other",    icon: Hash,     color: "bg-slate-500/15 text-slate-400",  border: "border-slate-500/20" },
];

const STATUSES = [
  { value: "want",        label: "Want to read/watch" },
  { value: "in-progress", label: "In Progress" },
  { value: "done",        label: "Done" },
];

function catMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[5];
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-1.5">Your Rating</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? null : n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className={clsx(
              "text-2xl transition-colors",
              (hovered || value) >= n ? "text-amber-400" : "text-slate-700"
            )}
          >
            ★
          </button>
        ))}
        {value && (
          <button onClick={() => onChange(null)} className="text-xs text-slate-600 hover:text-slate-400 ml-2 self-center">
            clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Per-category field schemas ────────────────────────────────────────────────
// Each returns JSX of extra fields relevant to that category
function ExtraFields({ category, form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  switch (category) {
    case "book":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Author" value={form.author || ""} onChange={set("author")} placeholder="Author name" />
            <Select label="Status" value={form.status || "want"} onChange={set("status")}>
              <option value="want">Want to Read</option>
              <option value="in-progress">Currently Reading</option>
              <option value="done">Finished</option>
            </Select>
          </div>
          <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          <Textarea
            label="Key Takeaways / Notes"
            value={form.content || ""}
            onChange={set("content")}
            rows={4}
            placeholder="What did you learn? Key ideas, memorable passages…"
          />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="self-help, psychology, must-read" />
        </>
      );

    case "movie":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Director" value={form.author || ""} onChange={set("author")} placeholder="Director's name" />
            <Select label="Status" value={form.status || "want"} onChange={set("status")}>
              <option value="want">Want to Watch</option>
              <option value="in-progress">Watching</option>
              <option value="done">Watched</option>
            </Select>
          </div>
          <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          <Textarea
            label="Review / Thoughts"
            value={form.content || ""}
            onChange={set("content")}
            rows={4}
            placeholder="What did you think? What stuck with you?"
          />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="thriller, sci-fi, must-watch" />
        </>
      );

    case "quote":
      return (
        <>
          <Input label="Who said it" value={form.author || ""} onChange={set("author")} placeholder="Person, book, movie…" />
          <Textarea
            label="The Quote *"
            value={form.content || ""}
            onChange={set("content")}
            rows={4}
            placeholder="Write the full quote here…"
          />
          <Textarea
            label="Why it resonates"
            value={form.notes || ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="What does this quote mean to you? When did you first encounter it?"
          />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="life, stoicism, motivation" />
        </>
      );

    case "person":
      return (
        <>
          <Input label="Who are they / Role" value={form.author || ""} onChange={set("author")} placeholder="e.g. Entrepreneur, Mentor, Author" />
          <Textarea
            label="Why they inspire you"
            value={form.content || ""}
            onChange={set("content")}
            rows={3}
            placeholder="What have they accomplished? What can you learn from them?"
          />
          <Input label="Links / Resources" value={form.link || ""} onChange={set("link")} placeholder="Twitter, website, book, YouTube…" />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="tech, entrepreneurship, design" />
        </>
      );

    case "article":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Author / Source" value={form.author || ""} onChange={set("author")} placeholder="Author or publication" />
            <Select label="Status" value={form.status || "want"} onChange={set("status")}>
              <option value="want">Want to Read</option>
              <option value="in-progress">Reading</option>
              <option value="done">Read</option>
            </Select>
          </div>
          <Input label="URL" value={form.link || ""} onChange={set("link")} placeholder="https://…" />
          <Textarea
            label="Key Points / Summary"
            value={form.content || ""}
            onChange={set("content")}
            rows={4}
            placeholder="What are the main ideas? What do you want to remember?"
          />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="AI, productivity, design" />
        </>
      );

    case "other":
    default:
      return (
        <>
          <Input label="Source / Reference" value={form.author || ""} onChange={set("author")} placeholder="Where is this from?" />
          <Textarea
            label="Notes"
            value={form.content || ""}
            onChange={set("content")}
            rows={5}
            placeholder="Whatever you want to capture…"
          />
          <Input label="Tags" value={form.tags || ""} onChange={set("tags")} placeholder="Add tags…" />
        </>
      );
  }
}

// ── Entry Modal ───────────────────────────────────────────────────────────────
function EntryModal({ open, onClose, onSave, initial }) {
  const blank = { title: "", category: "book", content: "", notes: "", tags: "", author: "", link: "", rating: null, status: "want" };
  const [form, setForm]     = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...blank, ...initial, tags: (initial.tags || []).join(", "), rating: initial.rating || null }
          : blank
      );
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      // Merge extra "notes" field into content for quote category
      const contentFinal = form.category === "quote" && form.notes
        ? `${form.content}\n\n---\n${form.notes}`.trim()
        : form.content;

      await onSave({
        title:    form.title.trim(),
        category: form.category,
        content:  contentFinal,
        author:   form.author || "",
        rating:   form.rating ? Number(form.rating) : null,
        status:   form.status || "want",
        tags:     form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cat = catMeta(form.category);
  const Icon = cat.icon;

  const titlePlaceholders = {
    book:    "Book title…",
    movie:   "Movie title…",
    quote:   "A short label for this quote…",
    person:  "Person's name…",
    article: "Article title…",
    other:   "Title / Name…",
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Entry" : "New Entry"} size="lg">
      <div className="space-y-4">

        {/* Category selector — visual tabs */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: CatIcon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: value }))}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  form.category === value
                    ? `${color} border-current`
                    : "bg-surface-2 text-slate-500 border-transparent hover:border-surface-3 hover:text-slate-300"
                )}
              >
                <CatIcon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title *"
          value={form.title}
          onChange={set("title")}
          placeholder={titlePlaceholders[form.category] || "Title…"}
        />

        {/* Dynamic fields per category */}
        <ExtraFields category={form.category} form={form} setForm={setForm} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add to Vault"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Entry Card ────────────────────────────────────────────────────────────────
function EntryCard({ entry, onEdit, onDelete, onClick }) {
  const cat  = catMeta(entry.category);
  const Icon = cat.icon;

  return (
    <div
      className={clsx("card-hover p-5 group cursor-pointer flex flex-col gap-3 border", cat.border)}
      onClick={() => onClick(entry)}
    >
      <div className="flex items-start justify-between">
        <div className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", cat.color)}>
          <Icon size={12} />
          {cat.label}
        </div>
        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => onEdit(entry)} className="p-1.5 rounded text-slate-500 hover:text-brand hover:bg-white/5">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(entry._id)} className="p-1.5 rounded text-slate-500 hover:text-danger hover:bg-danger/5">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div>
        <p className="font-semibold text-slate-200 leading-snug">{entry.title}</p>
        {entry.author && <p className="text-xs text-slate-500 mt-0.5">{entry.author}</p>}
      </div>

      {entry.rating && (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= entry.rating ? "text-amber-400 text-sm" : "text-slate-700 text-sm"}>★</span>
          ))}
        </div>
      )}

      {entry.content && (
        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{entry.content}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {entry.status && entry.status !== "want" && (
          <Badge className={clsx("text-[10px]",
            entry.status === "done" ? "bg-success/15 text-success" : "bg-blue-500/15 text-blue-400")}>
            {entry.status}
          </Badge>
        )}
        {entry.tags?.slice(0, 3).map((t) => (
          <Badge key={t} className="bg-surface-3 text-slate-600 text-[10px]">#{t}</Badge>
        ))}
      </div>
    </div>
  );
}

// ── Entry Detail Drawer ───────────────────────────────────────────────────────
function EntryDetail({ entry, onClose, onEdit }) {
  if (!entry) return null;
  const cat  = catMeta(entry.category);
  const Icon = cat.icon;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg bg-surface shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-start gap-3">
          <div className={clsx("p-2.5 rounded-xl", cat.color)}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 leading-snug">{entry.title}</h2>
            {entry.author && <p className="text-sm text-slate-500 mt-0.5">{entry.author}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {entry.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= entry.rating ? "text-amber-400 text-2xl" : "text-slate-700 text-2xl"}>★</span>
              ))}
            </div>
          )}

          {entry.content && (
            <div className="bg-surface-2 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          )}

          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((t) => (
                <Badge key={t} className="bg-surface-3 text-slate-400">#{t}</Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-700">
            Added {new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.06]">
          <Button variant="primary" className="w-full" onClick={() => { onClose(); setTimeout(() => onEdit(entry), 100); }}>
            <Edit2 size={14} /> Edit Entry
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch]                 = useState("");
  const [modalOpen, setModal]               = useState(false);
  const [editing, setEditing]               = useState(null);
  const [viewing, setViewing]               = useState(null);

  const params = {};
  if (activeCategory) params.category = activeCategory;
  if (search)         params.search   = search;

  const { entries, loading, hasMore, loadMore, createEntry, updateEntry, deleteEntry } = useKnowledge(params);

  const openEdit   = (e) => { setViewing(null); setEditing(e); setModal(true); };
  const openCreate = () =>  { setEditing(null); setModal(true); };

  const handleSave = async (payload) => {
    if (editing) await updateEntry(editing._id, payload);
    else         await createEntry(payload);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    if (viewing?._id === id) setViewing(null);
    await deleteEntry(id);
  };

  const counts = entries.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc; }, {});

  return (
    <PageWrapper className="p-0 overflow-hidden">
      <div className="flex h-full">

        {/* Left sidebar */}
        <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-surface-3 p-4 gap-1 overflow-y-auto">
          <p className="section-title mb-2 px-2">Categories</p>
          <button
            onClick={() => setActiveCategory("")}
            className={clsx("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              !activeCategory ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-surface-2 hover:text-slate-200")}>
            <span>All</span>
            <span className="text-xs opacity-60">{entries.length}</span>
          </button>
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button key={value}
              onClick={() => setActiveCategory(value === activeCategory ? "" : value)}
              className={clsx("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeCategory === value ? "bg-brand/15 text-brand" : "text-slate-400 hover:bg-surface-2 hover:text-slate-200")}>
              <div className="flex items-center gap-2">
                <Icon size={13} />
                {label}
              </div>
              {counts[value] ? <span className="text-xs opacity-60">{counts[value]}</span> : null}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="page-title">Knowledge Vault</h1>
              <p className="text-sm text-slate-500 mt-0.5">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
            </div>
            <Button variant="primary" onClick={openCreate}><Plus size={15} /> Add Entry</Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-base pl-9" placeholder="Search entries…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Mobile category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            <button onClick={() => setActiveCategory("")}
              className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium",
                !activeCategory ? "bg-brand/15 text-brand" : "bg-surface-2 text-slate-400")}>All</button>
            {CATEGORIES.map(({ value, label }) => (
              <button key={value} onClick={() => setActiveCategory(value === activeCategory ? "" : value)}
                className={clsx("shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium",
                  activeCategory === value ? "bg-brand/15 text-brand" : "bg-surface-2 text-slate-400")}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : entries.length === 0 ? (
            <EmptyState icon={BookOpen} title="Vault is empty"
              description="Capture books, movies, quotes, people, and articles."
              action={<Button variant="primary" onClick={openCreate}><Plus size={15} />Add Entry</Button>} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {entries.map((e) => (
                  <EntryCard key={e._id} entry={e} onEdit={openEdit} onDelete={handleDelete} onClick={setViewing} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" onClick={loadMore}>Load More</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {viewing && <EntryDetail entry={viewing} onClose={() => setViewing(null)} onEdit={openEdit} />}

      <EntryModal open={modalOpen} onClose={() => setModal(false)} onSave={handleSave} initial={editing} />
    </PageWrapper>
  );
}