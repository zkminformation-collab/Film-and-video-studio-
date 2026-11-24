import type { StudioModule } from '../../types';
import type { JarvisLanguage } from './types';

export interface GuideTopic {
  module: StudioModule;
  label: Record<JarvisLanguage, string>;
  keywords: RegExp;
  steps: Record<JarvisLanguage, string>;
}

export const guideTopics: GuideTopic[] = [
  {
    module: 'cartoon_creator',
    label: { kn: 'ಕಾರ್ಟೂನ್ ಮತ್ತು ಅನಿಮೆ', en: 'Cartoon & anime' },
    keywords: /cartoon|anime|ಕಾರ್ಟೂನ್|ಅನಿಮೆ/i,
    steps: {
      kn: '1. Cartoon Creator‌ನಲ್ಲಿ ಕಥೆ ಮತ್ತು ಅನಿಮೇಶನ್ ಶೈಲಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n2. ಪಾತ್ರಗಳು ಮತ್ತು ದೃಶ್ಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.\n3. Step 12ರಲ್ಲಿ ಮುನ್ನೋಟ ಸೃಷ್ಟಿಸಿ. Step 13ರಲ್ಲಿ ದೃಶ್ಯಗಳನ್ನು Timeline‌ಗೆ ಸೇರಿಸಿ.\n4. Steps 14–15ರಲ್ಲಿ ಗುಣಮಟ್ಟ ಪರಿಶೀಲಿಸಿ, ಮುನ್ನೋಟವನ್ನು ಅನುಮೋದಿಸಿ. Steps 16–17ರಲ್ಲಿ MP4 ರೆಂಡರ್ ಮಾಡಿ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
      en: '1. Open Cartoon Creator and choose a story and animation style.\n2. Review the characters and scenes.\n3. Generate a preview in Step 12 and add scenes to the timeline in Step 13.\n4. Run quality checks and approve the preview in Steps 14–15. Render and download the MP4 in Steps 16–17.',
    },
  },
  {
    module: 'ai_wizard',
    label: { kn: 'ಚಿತ್ರಕಥೆ ಮತ್ತು Film Maker', en: 'Screenplay & Film Maker' },
    keywords: /screenplay|story|script|film|ಚಿತ್ರಕಥೆ|ಕಥೆ|ಸಿನಿಮಾ/i,
    steps: {
      kn: '1. AI Film Maker ತೆರೆದು ಕಥೆಯ ಸಾರಾಂಶ, ಭಾಷೆ ಮತ್ತು ದೃಶ್ಯಗಳ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.\n2. Screenplay, Characters ಮತ್ತು Scenes & Shots ಹಂತಗಳನ್ನು ಕ್ರಮವಾಗಿ ಪರಿಶೀಲಿಸಿ.\n3. ಧ್ವನಿ ಮತ್ತು ಉಪಶೀರ್ಷಿಕೆಗಳನ್ನು ಸೇರಿಸಿ.\n4. Timeline ಮತ್ತು MP4 ಹಂತದಲ್ಲಿ ಅಂತಿಮ ಮುನ್ನೋಟ ಪರಿಶೀಲಿಸಿ.',
      en: '1. In AI Film Maker, enter the premise, language and scene count.\n2. Review the screenplay, characters and planned shots.\n3. Add audio and subtitles.\n4. Assemble the timeline and check the preview before exporting.',
    },
  },
  {
    module: 'vfx',
    label: { kn: 'VFX ಮತ್ತು ಪರಿಣಾಮಗಳು', en: 'VFX & effects' },
    keywords: /vfx|effect|shader|ಪರಿಣಾಮ/i,
    steps: {
      kn: '1. VFX & Shaders ತೆರೆದು ದೃಶ್ಯಕ್ಕೆ ಹೊಂದುವ ಎಫೆಕ್ಟ್ ಆಯ್ಕೆಮಾಡಿ.\n2. ತೀವ್ರತೆ ಮತ್ತು ಅವಧಿಯನ್ನು ಹೊಂದಿಸಿ.\n3. Timeline ಮುನ್ನೋಟದಲ್ಲಿ ಪರಿಣಾಮ ಮತ್ತು ಮೂಲ ಕ್ಲಿಪ್ ಒಂದಕ್ಕೊಂದು ಹೊಂದಿಕೆಯಾಗುತ್ತವೆಯೇ ನೋಡಿ.',
      en: '1. Open VFX & Shaders and choose an effect for the shot.\n2. Set its intensity and duration.\n3. Preview the result with the underlying clip on the timeline.',
    },
  },
  {
    module: 'ai_voice',
    label: { kn: 'ಧ್ವನಿ ಮತ್ತು ಡಬ್ಬಿಂಗ್', en: 'Voice & dubbing' },
    keywords: /voice|dubb|narrat|speech|ಧ್ವನಿ|ಡಬ್ಬಿಂಗ್/i,
    steps: {
      kn: '1. Voice Studio ತೆರೆದು ಭಾಷೆ ಮತ್ತು ಧ್ವನಿ ಆಯ್ಕೆಮಾಡಿ.\n2. ಸಂಭಾಷಣೆ ನಮೂದಿಸಿ ಮತ್ತು ಉಚ್ಚಾರಣೆ ಪರಿಶೀಲಿಸಲು ಮೊದಲು ಒಂದು ಚಿಕ್ಕ ಮಾದರಿ ಸೃಷ್ಟಿಸಿ.\n3. ಧ್ವನಿಯನ್ನು Timeline‌ನ ಆಡಿಯೊ ಟ್ರ್ಯಾಕ್‌ಗೆ ಸೇರಿಸಿ ಮತ್ತು ಸಂಭಾಷಣೆಯ ಸಮಯ ಹೊಂದಿಸಿ.',
      en: '1. Open Voice Studio and select a language and voice.\n2. Generate a short narration sample to check pronunciation.\n3. Add the result to an audio track and align it with the scene.',
    },
  },
  {
    module: 'export',
    label: { kn: 'MP4 ರೆಂಡರ್ ಮತ್ತು ಡೌನ್‌ಲೋಡ್', en: 'MP4 render & export' },
    keywords: /export|render|mp4|download|ರೆಂಡರ್|ಡೌನ್‌ಲೋಡ್/i,
    steps: {
      kn: '1. Export & MP4 ತೆರೆದು ಗಾತ್ರ ಮತ್ತು ರೆಸಲ್ಯೂಶನ್ ಆಯ್ಕೆಮಾಡಿ.\n2. ಮುನ್ನೋಟದಲ್ಲಿ ಚಿತ್ರ ಮತ್ತು ಧ್ವನಿ ಎರಡನ್ನೂ ಪರಿಶೀಲಿಸಿ.\n3. ರೆಂಡರ್ ಪೂರ್ಣಗೊಂಡ ನಂತರ MP4 ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',
      en: '1. Open Export & MP4 and select the frame size and resolution.\n2. Check both picture and sound in the preview.\n3. Download the MP4 after rendering completes.',
    },
  },
];

export function getGuideReply(text: string, language: JarvisLanguage) {
  const topic = guideTopics.find(({ keywords }) => keywords.test(text));
  return topic
    ? { content: topic.steps[language], action: { module: topic.module, label: topic.label[language] } }
    : { content: language === 'kn'
        ? 'ಯಾವ ಹಂತಕ್ಕೆ ಸಹಾಯ ಬೇಕು? ಕಾರ್ಟೂನ್, ಚಿತ್ರಕಥೆ, VFX, ಧ್ವನಿ ಅಥವಾ MP4 ಆಯ್ಕೆಮಾಡಿ.'
        : 'Which step do you need help with? Choose cartoon, screenplay, VFX, voice, or MP4 export.' };
}
