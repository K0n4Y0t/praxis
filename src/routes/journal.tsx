import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LESSON_MAP } from "@/lib/curriculum/lessons";
import { useProgress } from "@/lib/progress/store";
import { Button, Eyebrow, Panel } from "@/components/ui";

export const Route = createFileRoute("/journal")({ component: JournalPage });

function JournalPage() {
  const data = useProgress();
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippet, setSnippet] = useState("");
  const [entry, setEntry] = useState("");
  const needle = query.trim().toLowerCase();
  const match = (text: string) => !needle || text.toLowerCase().includes(needle);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <Eyebrow>ความรู้ที่คุณเป็นเจ้าของ</Eyebrow>
        <h1 className="text-4xl font-semibold">สมุดบันทึก</h1>
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="ค้นบันทึก" placeholder="ค้นจากคำ" className="min-h-11 rounded-full border border-line bg-surface-2 px-4" />
      </header>

      <Panel className="grid gap-3">
        <h2 className="font-semibold">บันทึกส่วนตัว</h2>
        <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="หัวบันทึก" placeholder="หัวข้อ" className="min-h-11 rounded-md border border-line bg-bg px-3" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} aria-label="เนื้อบันทึก" className="rounded-md border border-line bg-bg px-3 py-2" />
        <Button type="button" onClick={() => { if (!title.trim() || !body.trim()) return; data.addNote(title.trim(), body.trim()); setTitle(""); setBody(""); }}>เก็บบันทึก</Button>
        <ul className="grid gap-3">
          {data.notes.filter((note) => match(`${note.title} ${note.body}`)).map((note) => (
            <li key={note.id} className="border-t border-line pt-3 text-sm">
              <p className="font-semibold">{note.title}</p>
              <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
              <button className="mt-2 text-muted" onClick={() => data.removeEntry("notes", note.id)}>ลบ</button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="grid gap-3">
        <h2 className="font-semibold">สมุดความผิดพลาด</h2>
        {data.mistakes.filter((item) => match(`${item.title} ${item.cause} ${item.learned}`)).map((item) => (
          <article key={item.id} className="border-t border-line pt-3 text-sm">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1">สาเหตุ: {item.cause}</p>
            <p>ที่ได้เรียนรู้: {item.learned}</p>
            <button className="mt-2 text-muted" onClick={() => data.removeEntry("mistakes", item.id)}>ลบ</button>
          </article>
        ))}
        {data.mistakes.length === 0 ? <p className="text-sm text-muted">ยังว่าง บันทึกได้จากท้ายแล็บ</p> : null}
      </Panel>

      <Panel className="grid gap-3">
        <h2 className="font-semibold">ชิ้นส่วนโค้ด</h2>
        <input value={snippetTitle} onChange={(event) => setSnippetTitle(event.target.value)} aria-label="ชื่อชิ้นโค้ด" placeholder="ชื่อ" className="min-h-11 rounded-md border border-line bg-bg px-3" />
        <textarea value={snippet} onChange={(event) => setSnippet(event.target.value)} rows={4} aria-label="โค้ด" className="rounded-md border border-line bg-bg px-3 py-2 font-mono text-sm" />
        <Button type="button" variant="ghost" onClick={() => { if (!snippetTitle.trim() || !snippet.trim()) return; data.addSnippet(snippetTitle.trim(), snippet); setSnippetTitle(""); setSnippet(""); }}>เก็บโค้ด</Button>
        {data.snippets.filter((item) => match(`${item.title} ${item.code}`)).map((item) => (
          <article key={item.id} className="border-t border-line pt-3">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <pre className="mt-2 overflow-auto font-mono text-sm whitespace-pre-wrap">{item.code}</pre>
            <button className="mt-2 text-sm text-muted" onClick={() => data.removeEntry("snippets", item.id)}>ลบ</button>
          </article>
        ))}
      </Panel>

      <Panel className="grid gap-3">
        <h2 className="font-semibold">บันทึกประจำวัน</h2>
        <textarea value={entry} onChange={(event) => setEntry(event.target.value)} rows={3} aria-label="บันทึกประจำวัน" className="rounded-md border border-line bg-bg px-3 py-2" />
        <Button type="button" variant="ghost" onClick={() => { if (!entry.trim()) return; data.addJournal(entry.trim()); setEntry(""); }}>เขียนวันนี้</Button>
        {data.journal.filter((item) => match(item.body)).map((item) => (
          <p key={item.id} className="border-t border-line pt-3 text-sm whitespace-pre-wrap">{item.body}</p>
        ))}
      </Panel>

      <Panel>
        <h2 className="font-semibold">ที่คั่นและคำศัพท์จากบท</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {data.bookmarks.map((id) => {
            const lesson = LESSON_MAP.get(id);
            return lesson ? (
              <li key={id}><Link className="font-semibold text-accent" to="/learn/$lessonId" params={{ lessonId: id }}>{lesson.title}</Link></li>
            ) : null;
          })}
        </ul>
        <ul className="mt-4 grid gap-2 text-sm">
          {Array.from(LESSON_MAP.values()).flatMap((lesson) => lesson.vocab).filter((item, index, list) => list.findIndex((other) => other.term === item.term) === index).filter((item) => match(`${item.term} ${item.meaning}`)).map((item) => (
            <li key={item.term}><span className="font-semibold">{item.term}</span> — {item.meaning}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
