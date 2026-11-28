import { useState, type FormEvent } from 'react';
import { MAX_STORY_UNITS, STORY_EFFECTS, type CartoonStoryPlan } from '../../data/cartoonStoryPlan';

interface Props {
  title: string;
  premise: string;
  plan?: CartoonStoryPlan;
  defaultCount: number;
  inputClassName: string;
  disabled: boolean;
  onGenerate: (input: { title: string; premise: string; format: string; count: number; unitTitles: string }) => Promise<void>;
  onOpen: (number: number) => Promise<void>;
}

export function CartoonStoryPlanner({ title, premise, plan, defaultCount, inputClassName, disabled, onGenerate, onOpen }: Props) {
  const [storyTitle, setStoryTitle] = useState(plan?.title || title);
  const [idea, setIdea] = useState(plan?.premise ?? premise);
  const [format, setFormat] = useState(plan?.format || 'episodes');
  const [count, setCount] = useState(plan?.units.length || defaultCount);
  const [titles, setTitles] = useState(plan?.units.map(unit => unit.title).join('\n') || '');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onGenerate({ title: storyTitle.trim(), premise: idea.trim(), format, count, unitTitles: titles });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = 'mt-1 w-full rounded-lg px-3 py-2 ' + inputClassName;
  return (
    <section aria-labelledby="cartoon-story-plan" className="space-y-4">
      <h3 id="cartoon-story-plan" className="text-sm font-bold">Story &amp; Episode Planner</h3>
      <form onSubmit={submit} className="space-y-3 text-xs">
        <label className="block font-medium">Main story title
          <input required maxLength={120} value={storyTitle} onChange={event => setStoryTitle(event.target.value)} className={fieldClass} />
        </label>
        <label className="block font-medium">Story idea, setting and characters
          <textarea rows={4} maxLength={3800} value={idea} onChange={event => setIdea(event.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="font-medium">Story structure
            <select value={format} onChange={event => setFormat(event.target.value as CartoonStoryPlan['format'])} className={fieldClass}>
              <option value="episodes">Episodes</option>
              <option value="chapters">Chapters</option>
            </select>
          </label>
          <label className="font-medium">Total {format}
            <input type="number" required min={1} max={MAX_STORY_UNITS} value={count}
              onChange={event => setCount(event.target.valueAsNumber || 0)} className={fieldClass} />
          </label>
        </div>
        <label className="block font-medium">Your {format === 'episodes' ? 'episode' : 'chapter'} titles (optional)
          <textarea rows={3} value={titles} onChange={event => setTitles(event.target.value)} maxLength={3100} className={fieldClass}
            placeholder="One title per line. Studio fills any remaining titles." />
        </label>
        <button type="submit" disabled={disabled || submitting || !storyTitle.trim()}
          className="rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
          {submitting ? 'Writing story and scenes…' : plan ? 'Regenerate Story Plan' : 'Generate Story and Screenplay'}
        </button>
      </form>
      {plan && (
        <div className="space-y-3 border-t border-slate-500/30 pt-4">
          <p className="text-xs font-semibold">
            {plan.title} · {plan.units.length} {plan.format} · {plan.source === 'gemini' ? 'Gemini story' : 'Studio draft'}
          </p>
          {plan.units.map(unit => (
            <details key={unit.number} className="rounded-xl border border-slate-500/30 p-3 text-xs">
              <summary className="cursor-pointer font-bold">{unit.number}. {unit.title}</summary>
              <p className="my-3 whitespace-pre-wrap leading-relaxed">{unit.story}</p>
              <div className="space-y-2">
                {unit.scenes.map((scene, index) => (
                  <details key={index} className="rounded-lg border border-slate-500/30 p-2">
                    <summary className="cursor-pointer font-semibold">Scene {index + 1} · {scene.title} · {scene.seconds}s</summary>
                    <dl className="mt-2 grid gap-2 leading-relaxed">
                      <div><dt className="font-semibold">Screenplay</dt><dd>{scene.location} · {scene.framing} · {scene.action}</dd></div>
                      <div><dt className="font-semibold">Image prompt</dt><dd>{scene.imagePrompt}</dd></div>
                      <div><dt className="font-semibold">Dialogue and audio cues</dt><dd>{scene.dialogue} · {scene.audioDirection}</dd></div>
                      <div><dt className="font-semibold">Visual effect</dt><dd>{STORY_EFFECTS[scene.effect]} · {scene.effectsDirection}</dd></div>
                      <div><dt className="font-semibold">Subtitle</dt><dd>{scene.subtitle}</dd></div>
                    </dl>
                  </details>
                ))}
              </div>
              <button type="button" disabled={disabled} onClick={() => void onOpen(unit.number)}
                className="mt-3 rounded-lg border border-amber-500/70 px-3 py-2 font-semibold hover:bg-amber-500/10 disabled:opacity-50">
                Open Video Production
              </button>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
