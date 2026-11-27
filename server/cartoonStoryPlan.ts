import { randomUUID } from 'node:crypto';
import {
  MAX_STORY_UNITS, STORY_EFFECTS, STORY_FRAMINGS, STORY_SCENES_PER_UNIT,
  type CartoonStoryPlan, type CartoonStoryScene, type CartoonStoryUnit,
} from '../src/data/cartoonStoryPlan.ts';

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const englishBeats = [
  ['First clue', 'The lead follows an unexpected sign and must decide whether to share it.'],
  ['An unlikely ally', 'An ally offers an incomplete explanation and asks the lead to earn their trust.'],
  ['The wrong turn', 'The obvious route fails, revealing a smaller clue that everyone overlooked.'],
  ['The hidden cost', 'A discovery forces the team to choose between a quick win and helping someone.'],
  ['A second chance', 'The team repairs a mistake and tests a new plan with what they have learned.'],
  ['The truth comes out', 'Conflicting clues fit together and expose who has misunderstood the central problem.'],
  ['The final choice', 'The lead puts the discoveries together, takes responsibility and resolves the central conflict.'],
];
const kannadaBeats = [
  ['ಮೊದಲ ಸುಳಿವು', 'ಮುಖ್ಯ ಪಾತ್ರಕ್ಕೆ ಅನಿರೀಕ್ಷಿತ ಗುರುತು ಕಾಣುತ್ತದೆ. ಕಂಡದ್ದನ್ನು ಯಾರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಕೆಂದು ಆ ಪಾತ್ರ ನಿರ್ಧರಿಸುತ್ತದೆ.'],
  ['ಅನಿರೀಕ್ಷಿತ ಗೆಳೆಯ', 'ಹೊಸ ಗೆಳೆಯನಿಗೆ ವಿಷಯದ ಒಂದು ಭಾಗ ಗೊತ್ತಿದೆ. ಅವನ ನಂಬಿಕೆ ಗಳಿಸಿದಾಗ ಮುಂದಿನ ದಾರಿ ಕಾಣುತ್ತದೆ.'],
  ['ತಪ್ಪಿದ ದಾರಿ', 'ಸುಲಭವೆನಿಸಿದ ದಾರಿ ಮುಚ್ಚುತ್ತದೆ. ಎಲ್ಲರೂ ಗಮನಿಸದೆ ಬಿಟ್ಟಿದ್ದ ಚಿಕ್ಕ ಸುಳಿವು ಈಗ ಸಹಾಯಕ್ಕೆ ಬರುತ್ತದೆ.'],
  ['ನಿರ್ಧಾರದ ಬೆಲೆ', 'ತಕ್ಷಣ ಗೆಲ್ಲುವ ಅವಕಾಶ ಸಿಗುತ್ತದೆ. ಆದರೆ ಸಂಕಟದಲ್ಲಿರುವ ಮತ್ತೊಬ್ಬರಿಗೆ ನೆರವಾಗಬೇಕೆಂಬ ಆಯ್ಕೆಯೂ ಎದುರಾಗುತ್ತದೆ.'],
  ['ಮತ್ತೊಂದು ಅವಕಾಶ', 'ತಂಡ ತನ್ನ ತಪ್ಪನ್ನು ಸರಿಪಡಿಸಿ, ಈಗಾಗಲೇ ತಿಳಿದ ವಿಷಯಗಳನ್ನು ಬಳಸಿ ಹೊಸ ಪ್ರಯತ್ನ ಮಾಡುತ್ತದೆ.'],
  ['ಬಯಲಾದ ಸತ್ಯ', 'ಹಿಂದಿನ ಸುಳಿವುಗಳು ಒಂದಕ್ಕೊಂದು ಹೊಂದುತ್ತವೆ. ಸಮಸ್ಯೆಯನ್ನು ತಪ್ಪಾಗಿ ಅರ್ಥಮಾಡಿಕೊಂಡದ್ದು ಯಾರೆಂಬುದು ತಿಳಿಯುತ್ತದೆ.'],
  ['ಕೊನೆಯ ಆಯ್ಕೆ', 'ಮುಖ್ಯ ಪಾತ್ರ ಎಲ್ಲ ಸುಳಿವುಗಳನ್ನು ಜೋಡಿಸಿ ಹೊಣೆ ಹೊರುತ್ತದೆ. ಕಥೆಯ ಮುಖ್ಯ ಸಂಘರ್ಷಕ್ಕೆ ಪರಿಹಾರ ಸಿಗುತ್ತದೆ.'],
];

export function readCartoonStoryRequest(input: Record<string, unknown>) {
  const title = text(input.title, 120);
  const premise = text(input.premise, 3800);
  const format = input.format === 'chapters' ? 'chapters' : 'episodes';
  const count = Number(input.count);
  const titles = typeof input.unitTitles === 'string'
    ? input.unitTitles.split(/\r?\n/).map(title => title.trim()).filter(Boolean)
    : [];
  if (!title) throw new Error('Enter the main story title.');
  if (!Number.isInteger(count) || count < 1 || count > MAX_STORY_UNITS) {
    throw new Error('Choose between 1 and ' + MAX_STORY_UNITS + ' episodes or chapters.');
  }
  if (titles.length > count || titles.some(value => value.length > 120)) {
    throw new Error('Use one title per line, up to the selected count and 120 characters per title.');
  }
  return { title, premise, format, count, titles } as const;
}

type StoryRequest = ReturnType<typeof readCartoonStoryRequest>;
type StorySettings = { language: string; style: string; aspect: string };

function makeDraftUnits(request: StoryRequest, settings: StorySettings): CartoonStoryUnit[] {
  const isKannada = /kannada|^kn(?:-|$)|ಕನ್ನಡ/i.test(settings.language);
  const beats = isKannada ? kannadaBeats : englishBeats;
  const premise = request.premise || request.title;
  const names = isKannada ? ['ಆರಂಭ', 'ಪ್ರಯತ್ನ', 'ಪರಿಣಾಮ'] : ['Opening', 'Attempt', 'Payoff'];
  const locations = isKannada ? ['ಸ್ಥಳದ ಪರಿಚಯ', 'ಘರ್ಷಣೆ ನಡೆಯುವ ಸ್ಥಳ', 'ನಿರ್ಧಾರವಾಗುವ ಸ್ಥಳ'] : ['Established setting', 'Point of conflict', 'Decision point'];
  const sfx = isKannada
    ? ['ಸ್ಥಳದ ಸಹಜ ಶಬ್ದ, ನಂತರ ಮೃದುವಾದ ಹಿನ್ನೆಲೆ ಸಂಗೀತ', 'ಕ್ರಿಯೆಗೆ ತಕ್ಕ ಸದ್ದು, ಮಾತಿನ ಸಮಯದಲ್ಲಿ ಸಂಗೀತ ನಿಧಾನವಾಗಿರಲಿ', 'ಕ್ರಿಯೆಯ ಕೊನೆಯ ಸದ್ದು, ನಂತರ ಧ್ವನಿ ನಿಧಾನವಾಗಿ ಇಳಿಯಲಿ']
    : ['Establish ambient sound and introduce a quiet score.', 'Add an action cue and keep the music under the dialogue.', 'Resolve the sound cue and taper the music.'];
  const vfx = isKannada
    ? ['ದೃಶ್ಯ ನಿಧಾನವಾಗಿ ಕಾಣಿಸಲಿ', 'ಸುಳಿವಿನತ್ತ ನಿಧಾನವಾಗಿ ಕ್ಯಾಮೆರಾ ಜೂಮ್ ಆಗಲಿ', 'ಪರಿಹಾರದ ಕ್ಷಣದಲ್ಲಿ ಬೆಚ್ಚಗಿನ ಬಣ್ಣ ಬಳಸಿ']
    : ['Fade in on the scene.', 'Slowly push toward the clue.', 'Use a warmer grade for the outcome.'];
  return Array.from({ length: request.count }, (_, index) => {
    const final = index === request.count - 1;
    const [beatTitle, beat] = beats[final ? beats.length - 1 : index % (beats.length - 1)];
    const unitTitle = request.titles[index] || (index < beats.length - 1 || final ? beatTitle : (index + 1) + '. ' + beatTitle);
    const story = isKannada
      ? premise + '\n“' + unitTitle + '” ಅಧ್ಯಾಯದ ಮುಖ್ಯ ಘಟನೆ. ' + beat
      : premise + '\nIn “' + unitTitle + '”, ' + beat;
    const actions = isKannada
      ? ['“' + unitTitle + '”ಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಬದಲಾವಣೆ ಮೊದಲು ಕಾಣುತ್ತದೆ. ಮುಖ್ಯ ಪಾತ್ರ ಪರಿಸ್ಥಿತಿಯನ್ನು ಗಮನಿಸುತ್ತದೆ.', beat, final ? 'ಮುಖ್ಯ ಪಾತ್ರದ ಆಯ್ಕೆಯ ಪರಿಣಾಮ ಕಾಣುತ್ತದೆ. ಆರಂಭದ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಸಿಗುತ್ತದೆ.' : 'ಅವರ ನಿರ್ಧಾರದಿಂದ ಹೊಸ ಸುಳಿವು ಸಿಗುತ್ತದೆ. ಅದು ಮುಂದಿನ ಭಾಗಕ್ಕೆ ದಾರಿ ಮಾಡಿಕೊಡುತ್ತದೆ.']
      : ['Begin with a visible change tied to “' + unitTitle + '”. The lead pauses to observe it.', beat, final ? 'Show the result of the decision and answer the question posed at the start.' : 'Reveal the consequence as a concrete clue that leads into the next part.'];
    const dialogue = isKannada
      ? ['ಈ ಬದಲಾವಣೆಯನ್ನು ಮೊದಲು ಗಮನಿಸಿ. ಏನೋ ಹೊಸದು ಕಾಣುತ್ತಿದೆ.', 'ನಾವು ಕಂಡ ಗುರುತುಗಳನ್ನು ಒಟ್ಟಿಗೆ ನೋಡೋಣ. ಉತ್ತರ ಇಲ್ಲಿಯೇ ಇರಬಹುದು.', final ? 'ಈಗ ನಮಗೆ ಉತ್ತರ ಗೊತ್ತಾಯಿತು. ನಾವು ಇದನ್ನು ಒಟ್ಟಿಗೆ ಸಾಧಿಸಿದೆವು.' : 'ಈ ಸುಳಿವು ನಮ್ಮನ್ನು ಮುಂದೆ ಕರೆದೊಯ್ಯುತ್ತದೆ. ಬನ್ನಿ, ನೋಡೋಣ.']
      : ['Look closely. Something has changed.', 'Let’s put the clues together. The answer might be here.', final ? 'We found the answer because we worked together.' : 'This clue gives us somewhere to go. Let’s find out.'];
    const scenes: CartoonStoryScene[] = names.map((name, sceneIndex) => ({
      title: name,
      location: locations[sceneIndex],
      action: actions[sceneIndex],
      framing: (['Establishing', 'Medium Shot', 'Close-up'] as const)[sceneIndex],
      imagePrompt: [settings.style, request.title, unitTitle, premise, locations[sceneIndex], actions[sceneIndex], 'Consistent character design, clean readable silhouettes, no text, ' + settings.aspect].join('. '),
      dialogue: dialogue[sceneIndex],
      audioDirection: sfx[sceneIndex],
      effectsDirection: vfx[sceneIndex],
      effect: (['fade', 'zoom', 'warm'] as const)[sceneIndex],
      subtitle: dialogue[sceneIndex],
      seconds: [5, 7, 5][sceneIndex],
    }));
    return { number: index + 1, title: unitTitle, story, scenes };
  });
}

function readProviderUnits(raw: string, request: StoryRequest): CartoonStoryUnit[] {
  const data = JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/gi, ''));
  if (!Array.isArray(data.units) || data.units.length !== request.count) throw new Error('Invalid story unit count.');
  return data.units.map((unit: any, index: number) => {
    const title = request.titles[index] || text(unit.title, 120);
    const story = text(unit.story, 5000);
    if (!title || !story || !Array.isArray(unit.scenes) || unit.scenes.length !== STORY_SCENES_PER_UNIT) {
      throw new Error('A story unit is missing its title, story or scenes.');
    }
    const scenes = unit.scenes.map((scene: any): CartoonStoryScene => {
      const fields = {
        title: text(scene.title, 120),
        location: text(scene.location, 350),
        action: text(scene.action, 1100),
        imagePrompt: text(scene.imagePrompt, 2000),
        dialogue: text(scene.dialogue, 800),
        audioDirection: text(scene.audioDirection, 550),
        effectsDirection: text(scene.effectsDirection, 550),
      };
      if (!Object.values(fields).every(Boolean)) throw new Error('A production scene is incomplete.');
      return {
        ...fields,
        framing: STORY_FRAMINGS.includes(scene.framing) ? scene.framing : 'Medium Shot',
        effect: Object.hasOwn(STORY_EFFECTS, scene.effect) ? scene.effect : 'none',
        seconds: Math.max(3, Math.min(20, Math.round(Number(scene.seconds) || 5))),
        subtitle: text(scene.subtitle, 800) || fields.dialogue,
      };
    });
    return { number: index + 1, title, story, scenes };
  });
}

export async function createCartoonStoryPlan(
  request: StoryRequest,
  settings: StorySettings,
  generateText?: (prompt: string) => Promise<string>,
): Promise<CartoonStoryPlan> {
  const base = { id: randomUUID(), title: request.title, premise: request.premise, format: request.format };
  if (generateText && request.count <= 8) {
    try {
      const prompt = [
        'Write a coherent animated story series. Return JSON only.',
        JSON.stringify({ ...request, ...settings }),
        'Return {"units":[{"title":"...","story":"...","scenes":[{"title":"...","location":"...","action":"...","framing":"...","imagePrompt":"...","dialogue":"...","subtitle":"...","audioDirection":"...","effectsDirection":"...","effect":"...","seconds":5}]}]}.',
        'Use exactly the requested count and 3 scenes per unit. Preserve any supplied unit titles. Give each unit a distinct plot and a bridge to the next one. Resolve the main conflict in the last unit.',
        'Keep characters visually consistent. Describe framing, action, setting and character design in each image prompt. Supply speakable narration or dialogue, music and sound cues, and time-specific visual effects.',
        'Write the story, dialogue and subtitles in the requested language. Use short dialogue that fits 3 to 20 seconds.',
        'Effect choices: ' + Object.keys(STORY_EFFECTS).join(', ') + '. Framing choices: ' + STORY_FRAMINGS.join(', ') + '.',
      ].join('\n');
      const units = readProviderUnits(await generateText(prompt), request);
      return { ...base, units, source: 'gemini' };
    } catch {
      // A complete local production draft remains available if the provider is unavailable.
    }
  }
  return { ...base, units: makeDraftUnits(request, settings), source: 'studio_draft' };
}
