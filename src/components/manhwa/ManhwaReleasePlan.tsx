import { useState, type FormEvent } from 'react';

interface ManhwaReleasePlanProps {
  seriesTitle: string;
  chapters: ReadonlyArray<{ chapter_number: number; title: string }>;
}

const episodeDurationSeconds = 60 * 60;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function ManhwaReleasePlan({ seriesTitle, chapters }: ManhwaReleasePlanProps) {
  const [firstDate, setFirstDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [error, setError] = useState('');

  function downloadPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstRelease = Date.parse(`${firstDate}T${publishTime}:00+05:30`);
    if (!Number.isFinite(firstRelease) || firstRelease <= Date.now()) {
      setError('Choose a future start date and time in IST.');
      return;
    }

    const episodes = [...chapters]
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((chapter, index) => ({
        chapterNumber: chapter.chapter_number,
        chapterTitle: chapter.title,
        targetDurationSeconds: episodeDurationSeconds,
        plannedReleaseAt: new Date(firstRelease + index * millisecondsPerDay).toISOString(),
        visibility: 'public',
      }));
    const plan = { seriesTitle, platform: 'youtube', timeZone: 'Asia/Kolkata', episodes };
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], {
      type: 'application/json',
    }));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'manhwa-youtube-release-plan.json';
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setError('');
  }

  return (
    <form onSubmit={downloadPlan} className="mb-6 rounded-xl border border-slate-800 p-4">
      <h2 className="text-sm font-bold text-white">YouTube release plan</h2>
      <p className="my-2 text-xs text-slate-400">
        Plan one 60-minute public video per day in chapter order. Downloading a plan creates no video or upload.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-slate-300">
          First release date (IST)
          <input required type="date" value={firstDate} onChange={(event) => setFirstDate(event.target.value)}
            className="rounded border border-slate-700 bg-slate-900 p-2 text-white" />
        </label>
        <label className="grid gap-1 text-xs text-slate-300">
          Daily release time (IST)
          <input required type="time" value={publishTime} onChange={(event) => setPublishTime(event.target.value)}
            className="rounded border border-slate-700 bg-slate-900 p-2 text-white" />
        </label>
        <button type="submit" disabled={chapters.length === 0}
          className="rounded bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-40">
          Download plan ({chapters.length} chapters)
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
