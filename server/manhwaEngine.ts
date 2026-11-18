import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export type ManhwaLanguage = 'Kannada' | 'English' | 'Hindi' | 'Tamil' | 'Telugu';
export type ManhwaVoiceGender = 'male' | 'female';
export type ManhwaCameraMotion =
  | 'Slow Zoom In'
  | 'Zoom Out Reveal'
  | 'Pan Left-to-Right'
  | 'Pan Right-to-Left'
  | 'Vertical Scroll (Webtoon)'
  | 'Dramatic Shake';
export type ManhwaTransition =
  | 'Crossfade'
  | 'Hard Cut'
  | 'Flash White'
  | 'Wipe Left'
  | 'Zoom Blur';
export type ManhwaSfxPreset =
  | 'Impact Boom'
  | 'Sword Clash'
  | 'Whoosh'
  | 'Thunder'
  | 'Orchestral Chime'
  | 'Sub-Bass Drop'
  | 'Glitch'
  | 'None';

export interface ImportedManhwaPanel {
  id: string;
  title: string;
  imageUrl: string;
  sourceType: 'url' | 'upload' | 'sample';
  mimeType: string;
}

export interface ManhwaExportPanelInput {
  id: string;
  title: string;
  imageUrl: string;
  durationSec: number;
  cameraMotion: ManhwaCameraMotion;
  transition: ManhwaTransition;
  sfxPreset: ManhwaSfxPreset;
  voiceGender: ManhwaVoiceGender;
  dialogue: string;
  narration: string;
}

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

export async function importManhwaChapterFromUrl(chapterUrl: string): Promise<{
  success: boolean;
  protectedOrBlocked: boolean;
  chapterTitle: string;
  panels: ImportedManhwaPanel[];
  message: string;
}> {
  const trimmed = String(chapterUrl || '').trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      success: false,
      protectedOrBlocked: false,
      chapterTitle: '',
      panels: [],
      message: 'Please enter a valid chapter URL starting with https:// or upload JPG/PNG/WebP panel images directly.',
    };
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || isPrivateHostname(parsed.hostname)) {
    return {
      success: false,
      protectedOrBlocked: true,
      chapterTitle: '',
      panels: [],
      message: 'This URL cannot be fetched automatically. Please upload your JPG, PNG, or WebP images directly.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,image/webp,image/png,image/jpeg,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        success: false,
        protectedOrBlocked: true,
        chapterTitle: '',
        panels: [],
        message: `Chapter host returned HTTP ${response.status}. Protected or login-walled chapters do not permit automatic scraping — upload your panel images (JPG, PNG, WebP) directly.`,
      };
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // Direct image URL pasted by user
    if (contentType.startsWith('image/')) {
      const arr = await response.arrayBuffer();
      const buf = Buffer.from(arr);
      if (buf.length > 0 && buf.length <= 10 * 1024 * 1024) {
        const mime = contentType.split(';')[0].trim();
        return {
          success: true,
          protectedOrBlocked: false,
          chapterTitle: path.basename(parsed.pathname) || 'Imported Panel',
          panels: [
            {
              id: `manhwa-url-${Date.now()}-1`,
              title: 'Panel 01 (Imported Image)',
              imageUrl: `data:${mime};base64,${buf.toString('base64')}`,
              sourceType: 'url',
              mimeType: mime,
            },
          ],
          message: 'Imported 1 panel image from direct image link.',
        };
      }
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const chapterTitle = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 100)
      : parsed.hostname;

    const candidateUrls = new Set<string>();
    const imgAttrRegex = /(?:src|data-src|data-lazy-src|data-original|data-url)\s*=\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = imgAttrRegex.exec(html)) !== null) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith('data:')) continue;
      const lower = raw.toLowerCase();
      if (
        lower.includes('favicon') ||
        lower.includes('logo') ||
        lower.includes('avatar') ||
        lower.includes('icon') ||
        lower.includes('sprite') ||
        lower.includes('emoji') ||
        lower.endsWith('.svg') ||
        lower.endsWith('.ico')
      ) {
        continue;
      }
      try {
        const resolved = new URL(raw, parsed.origin);
        if (['http:', 'https:'].includes(resolved.protocol) && !isPrivateHostname(resolved.hostname)) {
          candidateUrls.add(resolved.toString());
        }
      } catch {
        // Ignore malformed relative URLs
      }
      if (candidateUrls.size >= 18) break;
    }

    if (candidateUrls.size === 0) {
      return {
        success: false,
        protectedOrBlocked: true,
        chapterTitle,
        panels: [],
        message:
          'No importable chapter images were found on this page (it may use protected canvas/JS rendering or require login). Please upload your JPG, PNG, or WebP panels directly.',
      };
    }

    const panels: ImportedManhwaPanel[] = [];
    let idx = 1;
    for (const imgUrl of candidateUrls) {
      if (panels.length >= 12) break;
      try {
        const imgController = new AbortController();
        const imgTimer = setTimeout(() => imgController.abort(), 5000);
        const imgRes = await fetch(imgUrl, {
          signal: imgController.signal,
          headers: {
            Referer: parsed.origin,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(imgTimer);
        if (!imgRes.ok) continue;

        const imgType = (imgRes.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(imgType)) continue;

        const buf = Buffer.from(await imgRes.arrayBuffer());
        // Skip tiny icons/spacers < 4KB or huge files > 8MB
        if (buf.length < 4096 || buf.length > 8 * 1024 * 1024) continue;

        const normalizedMime = imgType === 'image/jpg' ? 'image/jpeg' : imgType;
        panels.push({
          id: `manhwa-url-${Date.now()}-${idx}`,
          title: `Panel ${String(idx).padStart(2, '0')}`,
          imageUrl: `data:${normalizedMime};base64,${buf.toString('base64')}`,
          sourceType: 'url',
          mimeType: normalizedMime,
        });
        idx += 1;
      } catch {
        // Skip individual blocked image requests
      }
    }

    if (panels.length === 0) {
      return {
        success: false,
        protectedOrBlocked: true,
        chapterTitle,
        panels: [],
        message:
          'The chapter host blocked image hotlinking or protected the panel files. Please upload your JPG, PNG, or WebP images directly.',
      };
    }

    return {
      success: true,
      protectedOrBlocked: false,
      chapterTitle,
      panels,
      message: `Imported ${panels.length} panel image(s) from chapter page.`,
    };
  } catch (err: any) {
    return {
      success: false,
      protectedOrBlocked: true,
      chapterTitle: '',
      panels: [],
      message:
        err?.name === 'AbortError'
          ? 'Chapter link timed out. Upload your JPG, PNG, or WebP panels directly instead.'
          : 'Automatic chapter import was blocked by the remote site. Please upload your JPG, PNG, or WebP panels directly.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

interface GeneratedPanelScript {
  panelId: string;
  narration: string;
  dialogue: string;
  speakerName: string;
  voiceGender: ManhwaVoiceGender;
  sfxPreset: ManhwaSfxPreset;
  cameraMotion: ManhwaCameraMotion;
  transition: ManhwaTransition;
  durationSec: number;
}

const FALLBACK_SCRIPTS: Record<
  ManhwaLanguage,
  Array<{
    narration: string;
    dialogue: string;
    speakerName: string;
    voiceGender: ManhwaVoiceGender;
    sfxPreset: ManhwaSfxPreset;
    cameraMotion: ManhwaCameraMotion;
    transition: ManhwaTransition;
  }>
> = {
  Kannada: [
    {
      narration: 'ಮಂಜು ಮುಸುಕಿದ ಕಣಿವೆಯ ಅಂಚಿನಲ್ಲಿ ಯೋಧನು ತನ್ನ ನೀಲಿ ರತ್ನ ಖಡ್ಗವನ್ನು ಎತ್ತಿ ಹಿಡಿದನು.',
      dialogue: 'ಈ ರಾತ್ರಿ ಕತ್ತಲೆಯ ಕೋಟೆಯ ಬಾಗಿಲುಗಳು ಮುರಿಯಲಿವೆ. ನನ್ನ ಪ್ರತಿಜ್ಞೆ ಅಚಲವಾಗಿದೆ!',
      speakerName: 'ಕೈರೋ (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Whoosh',
      cameraMotion: 'Slow Zoom In',
      transition: 'Crossfade',
    },
    {
      narration: 'ಪ್ರಾಚೀನ ಗುಹೆಯ ದ್ವಾರದಲ್ಲಿ ಸುವರ್ಣ ದೀಪಗಳು ನಿಗೂಢವಾಗಿ ಬೆಳಗತೊಡಗಿದವು.',
      dialogue: 'ಎಚ್ಚರ! ಒಳಗಿರುವ ಮುದ್ರೆ ಈಗಾಗಲೇ ಜಾಗೃತವಾಗಿದೆ. ತಡಮಾಡದೆ ಒಳಗೆ ಬನ್ನಿ.',
      speakerName: 'ಆರ್ಯ (Mage)',
      voiceGender: 'female',
      sfxPreset: 'Orchestral Chime',
      cameraMotion: 'Vertical Scroll (Webtoon)',
      transition: 'Crossfade',
    },
    {
      narration: 'ಮಿಂಚಿನ ಆರ್ಭಟದ ನಡುವೆ ಇಬ್ಬರು ಮಹಾಯೋಧರ ಶಕ್ತಿಗಳು ಆಕಾಶದಲ್ಲಿ ಘರ್ಷಿಸಿದವು.',
      dialogue: 'ನಿನ್ನ ಕತ್ತಿ ಎಷ್ಟೇ ತೀಕ್ಷ್ಣವಾಗಿದ್ದರೂ, ಸತ್ಯದ ಜ್ವಾಲೆಯನ್ನು ತಡೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ!',
      speakerName: 'ಕೈರೋ (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Sword Clash',
      cameraMotion: 'Dramatic Shake',
      transition: 'Flash White',
    },
  ],
  English: [
    {
      narration: 'At the edge of the mist-covered ridge, the lone swordsman drew his glowing runic blade against the dying light.',
      dialogue: 'Tonight the seal breaks, and I will not turn back from what lies beyond the valley.',
      speakerName: 'Kairo',
      voiceGender: 'male',
      sfxPreset: 'Whoosh',
      cameraMotion: 'Slow Zoom In',
      transition: 'Crossfade',
    },
    {
      narration: 'Deep beneath the mountain, golden spirit lanterns flickered alive along the towering sanctuary gate.',
      dialogue: 'Step carefully. The ancient ward remembers every oath spoken at this threshold.',
      speakerName: 'Serena',
      voiceGender: 'female',
      sfxPreset: 'Orchestral Chime',
      cameraMotion: 'Vertical Scroll (Webtoon)',
      transition: 'Crossfade',
    },
    {
      narration: 'Thunder split the storm clouds as twin torrents of golden and crimson aura collided mid-air.',
      dialogue: 'Give everything you have—this clash decides the fate of the entire realm!',
      speakerName: 'Kairo',
      voiceGender: 'male',
      sfxPreset: 'Sword Clash',
      cameraMotion: 'Dramatic Shake',
      transition: 'Flash White',
    },
  ],
  Hindi: [
    {
      narration: 'कोहरे से ढकी घाटी के किनारे अकेले योद्धा ने अपनी चमकती नीली तलवार बाहर निकाली।',
      dialogue: 'आज रात अंधकार का यह बंधन टूटेगा, और मैं पीछे नहीं हटूंगा!',
      speakerName: 'कैरो (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Whoosh',
      cameraMotion: 'Slow Zoom In',
      transition: 'Crossfade',
    },
    {
      narration: 'पर्वत की गहरी गुफा में प्राचीन पत्थर के द्वार पर सुनहरे दीपक अचानक जल उठे।',
      dialogue: 'सावधान रहो! मंदिर की प्राचीन रक्षा शक्ति अब जाग चुकी है।',
      speakerName: 'सेरेना (Mage)',
      voiceGender: 'female',
      sfxPreset: 'Orchestral Chime',
      cameraMotion: 'Vertical Scroll (Webtoon)',
      transition: 'Crossfade',
    },
    {
      narration: 'तूफानी आसमान के नीचे दोनों महारथियों की ऊर्जा बिजली की तरह टकरा गई।',
      dialogue: 'अपनी पूरी शक्ति लगा दो—आज इस युद्ध का अंतिम निर्णय होगा!',
      speakerName: 'कैरो (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Sword Clash',
      cameraMotion: 'Dramatic Shake',
      transition: 'Flash White',
    },
  ],
  Tamil: [
    {
      narration: 'பனி சூழ்ந்த பள்ளத்தாக்கின் விளிம்பில் தனித்த வீரன் தன் ஒளிரும் வாளை உயர்த்தினான்.',
      dialogue: 'இன்று இரவு இருளின் கதவுகள் உடையும். என் சபதம் ஒருபோதும் மாறாது!',
      speakerName: 'கைரோ (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Whoosh',
      cameraMotion: 'Slow Zoom In',
      transition: 'Crossfade',
    },
    {
      narration: 'மலைக் குகையின் ஆழத்தில் பழமையான கோவில் வாயிலில் பொன் விளக்குகள் ஒளிர்ந்தன.',
      dialogue: 'கவனமாக இருங்கள்! இந்தப் புனித முத்திரை இப்போது விழித்தெழுந்துவிட்டது.',
      speakerName: 'செரீனா (Mage)',
      voiceGender: 'female',
      sfxPreset: 'Orchestral Chime',
      cameraMotion: 'Vertical Scroll (Webtoon)',
      transition: 'Crossfade',
    },
    {
      narration: 'புயல் மேகங்களுக்கு நடுவே இரு வீரர்களின் சக்தியும் வானில் மோதியது.',
      dialogue: 'உன் முழு வலிமையையும் காட்டு—இந்த மோதலே விதியை தீர்மானிக்கும்!',
      speakerName: 'கைரோ (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Sword Clash',
      cameraMotion: 'Dramatic Shake',
      transition: 'Flash White',
    },
  ],
  Telugu: [
    {
      narration: 'పొగమంచు కమ్మిన లోయ అంచున ఒంటరి యోధుడు తన మెరిసే నీలి ఖడ్గాన్ని పైకెత్తాడు.',
      dialogue: 'ఈ రాత్రి చీకటి కోట తలుపులు బద్దలవుతాయి. నా ప్రతిజ్ఞ ఎప్పటికీ చెదరదు!',
      speakerName: 'కైరో (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Whoosh',
      cameraMotion: 'Slow Zoom In',
      transition: 'Crossfade',
    },
    {
      narration: 'కొండ గుహ లోపల పురాతన రాతి ద్వారం వద్ద బంగారు దీపాలు వెలిగాయి.',
      dialogue: 'జాగ్రత్త! ఈ పవిత్ర ముద్ర ఇప్పటికే మేల్కొంది, వేగంగా లోపలికి రండి.',
      speakerName: 'సెరీనా (Mage)',
      voiceGender: 'female',
      sfxPreset: 'Orchestral Chime',
      cameraMotion: 'Vertical Scroll (Webtoon)',
      transition: 'Crossfade',
    },
    {
      narration: 'తుఫాను ఆకాశంలో ఇద్దరు మహా యోధుల శక్తులు మెరుపుల్లా ఢీకొన్నాయి.',
      dialogue: 'నీ పూర్తి బలాన్ని చూపించు—ఈ పోరాటమే మన విధిని నిర్ణయిస్తుంది!',
      speakerName: 'కైరో (Hero)',
      voiceGender: 'male',
      sfxPreset: 'Sword Clash',
      cameraMotion: 'Dramatic Shake',
      transition: 'Flash White',
    },
  ],
};

export async function generateManhwaDialogueAndAudioPlan(
  ai: GoogleGenAI | null,
  params: {
    chapterTitle: string;
    language: ManhwaLanguage;
    musicMood: string;
    panels: Array<{ id: string; title: string; imageUrl?: string; notes?: string }>;
  }
): Promise<{
  panels: GeneratedPanelScript[];
  musicTrackRecommendation: string;
  usedAi: boolean;
}> {
  const { chapterTitle, language, musicMood, panels } = params;
  const fallbackPool = FALLBACK_SCRIPTS[language] || FALLBACK_SCRIPTS.English;

  if (ai && panels.length > 0) {
    try {
      const parts: any[] = [];
      const panelDescriptions = panels.map((p, idx) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image/') && idx < 4) {
          const commaIdx = p.imageUrl.indexOf(',');
          const header = p.imageUrl.slice(5, commaIdx);
          const mimeType = header.split(';')[0] || 'image/jpeg';
          const base64Data = p.imageUrl.slice(commaIdx + 1);
          if (base64Data.length > 0 && base64Data.length < 1_600_000) {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }
        return `Panel ${idx + 1} (id: "${p.id}"): title="${p.title}", userNotes="${p.notes || 'dramatic manhwa scene'}"`;
      });

      parts.push({
        text: `You are an anime & webtoon video director adapting a Manhwa chapter into a voiced cinematic video.
Chapter Title: "${chapterTitle}"
Target Audio & Dialogue Language: "${language}" (Write narration and dialogue naturally in ${language} script!)
Music Mood: "${musicMood}"

Panels to adapt:
${panelDescriptions.join('\n')}

For each panel, return a JSON object matching the schema with:
- panelId: exact id string from above
- narration: dramatic 1-sentence third-person voiceover narration in ${language}
- dialogue: punchy 1-sentence character spoken line in ${language}
- speakerName: concise character name
- voiceGender: "male" or "female"
- sfxPreset: one of ["Impact Boom","Sword Clash","Whoosh","Thunder","Orchestral Chime","Sub-Bass Drop","Glitch","None"]
- cameraMotion: one of ["Slow Zoom In","Zoom Out Reveal","Pan Left-to-Right","Pan Right-to-Left","Vertical Scroll (Webtoon)","Dramatic Shake"]
- transition: one of ["Crossfade","Hard Cut","Flash White","Wipe Left","Zoom Blur"]
- durationSec: integer between 4 and 7`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              musicTrackRecommendation: { type: Type.STRING },
              panels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    panelId: { type: Type.STRING },
                    narration: { type: Type.STRING },
                    dialogue: { type: Type.STRING },
                    speakerName: { type: Type.STRING },
                    voiceGender: { type: Type.STRING },
                    sfxPreset: { type: Type.STRING },
                    cameraMotion: { type: Type.STRING },
                    transition: { type: Type.STRING },
                    durationSec: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      if (Array.isArray(parsed.panels) && parsed.panels.length > 0) {
        const mapped: GeneratedPanelScript[] = panels.map((p, idx) => {
          const item = parsed.panels[idx] || parsed.panels.find((x: any) => x.panelId === p.id) || {};
          const fb = fallbackPool[idx % fallbackPool.length];
          return {
            panelId: p.id,
            narration: item.narration || fb.narration,
            dialogue: item.dialogue || fb.dialogue,
            speakerName: item.speakerName || fb.speakerName,
            voiceGender: item.voiceGender === 'female' ? 'female' : 'male',
            sfxPreset: (item.sfxPreset as ManhwaSfxPreset) || fb.sfxPreset,
            cameraMotion: (item.cameraMotion as ManhwaCameraMotion) || fb.cameraMotion,
            transition: (item.transition as ManhwaTransition) || fb.transition,
            durationSec: Math.max(3, Math.min(10, Number(item.durationSec) || 5)),
          };
        });
        return {
          panels: mapped,
          musicTrackRecommendation: parsed.musicTrackRecommendation || `${musicMood} Score`,
          usedAi: true,
        };
      }
    } catch (err) {
      console.warn('Manhwa Gemini script generation fallback used:', err);
    }
  }

  return {
    panels: panels.map((p, idx) => {
      const fb = fallbackPool[idx % fallbackPool.length];
      return {
        panelId: p.id,
        narration: fb.narration,
        dialogue: fb.dialogue,
        speakerName: fb.speakerName,
        voiceGender: fb.voiceGender,
        sfxPreset: fb.sfxPreset,
        cameraMotion: fb.cameraMotion,
        transition: fb.transition,
        durationSec: 5,
      };
    }),
    musicTrackRecommendation: `${musicMood} · Dynamic Chapter Bed`,
    usedAi: false,
  };
}

function buildManhwaMixWavBuffer(
  panels: ManhwaExportPanelInput[],
  musicMood: string,
  includeAudio: boolean
): { buffer: Buffer; totalDurationSec: number } {
  const sampleRate = 22050;
  const totalDurationSec = Math.max(
    3,
    Math.min(
      90,
      panels.reduce((acc, p) => acc + Math.max(2, Math.min(12, Number(p.durationSec) || 4)), 0)
    )
  );
  const numSamples = Math.floor(sampleRate * totalDurationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  if (!includeAudio) {
    return { buffer, totalDurationSec };
  }

  const moodLower = musicMood.toLowerCase();
  const baseChord = moodLower.includes('piano')
    ? [261.63, 329.63, 392.0, 493.88]
    : moodLower.includes('suspense')
    ? [110.0, 155.56, 220.0, 233.08]
    : moodLower.includes('synth')
    ? [98.0, 146.83, 196.0, 293.66]
    : moodLower.includes('flute')
    ? [293.66, 349.23, 440.0, 587.33]
    : [73.42, 146.83, 220.0, 293.66];

  // Precompute panel windows
  const windows: Array<{
    startSec: number;
    endSec: number;
    sfx: ManhwaSfxPreset;
    pitchHz: number;
    hasVoice: boolean;
  }> = [];
  let cursor = 0;
  for (const p of panels) {
    const dur = Math.max(2, Math.min(12, Number(p.durationSec) || 4));
    windows.push({
      startSec: cursor,
      endSec: cursor + dur,
      sfx: p.sfxPreset || 'None',
      pitchHz: p.voiceGender === 'female' ? 215 : 138,
      hasVoice: Boolean((p.dialogue || '').trim() || (p.narration || '').trim()),
    });
    cursor += dur;
  }

  let windowIdx = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    while (windowIdx < windows.length - 1 && t >= windows[windowIdx].endSec) {
      windowIdx++;
    }
    const w = windows[windowIdx];
    const localT = Math.max(0, t - w.startSec);

    const fadeIn = Math.min(1, t * 1.6);
    const fadeOut = Math.min(1, (totalDurationSec - t) * 1.6);
    const barPulse = 0.72 + 0.28 * Math.sin(t * 2.1);

    // 1. Background music pad
    let sample =
      baseChord.reduce((acc, f, idx) => acc + Math.sin(2 * Math.PI * f * t) / (idx + 1.5), 0) *
      0.22 *
      barPulse;

    // 2. Per-panel SFX hit in first 1.2s of panel
    if (w && localT < 1.2 && w.sfx !== 'None') {
      const decay = Math.exp(-localT * 3.8);
      if (w.sfx === 'Impact Boom' || w.sfx === 'Sub-Bass Drop') {
        const freq = 115 * Math.exp(-localT * 2.2) + 28;
        sample += Math.sin(2 * Math.PI * freq * localT) * decay * 0.42;
      } else if (w.sfx === 'Sword Clash') {
        const ring =
          Math.sin(2 * Math.PI * 1420 * localT) * 0.5 +
          Math.sin(2 * Math.PI * 2180 * localT) * 0.35;
        sample += ring * Math.exp(-localT * 6.5) * 0.35;
      } else if (w.sfx === 'Orchestral Chime') {
        sample +=
          (Math.sin(2 * Math.PI * 523.25 * localT) +
            Math.sin(2 * Math.PI * 783.99 * localT) * 0.6) *
          decay *
          0.25;
      } else if (w.sfx === 'Thunder') {
        const pseudoNoise = Math.sin(t * 4321.7) * Math.cos(t * 1793.3);
        sample += (pseudoNoise * 0.25 + Math.sin(2 * Math.PI * 55 * localT) * 0.35) * decay;
      } else {
        // Whoosh / Glitch
        const sweepFreq = 260 + localT * 900;
        sample += Math.sin(2 * Math.PI * sweepFreq * localT) * decay * 0.24;
      }
    }

    sample *= fadeIn * fadeOut;
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return { buffer, totalDurationSec };
}

function resolveImageToTempFile(imageUrl: string, tempDir: string, index: number): string {
  const outBase = path.join(tempDir, `panel_${index}`);

  if (imageUrl.startsWith('data:image/')) {
    const commaIdx = imageUrl.indexOf(',');
    const meta = imageUrl.slice(5, commaIdx);
    const mime = meta.split(';')[0].toLowerCase();
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const filePath = `${outBase}.${ext}`;
    const raw = Buffer.from(imageUrl.slice(commaIdx + 1), 'base64');
    fs.writeFileSync(filePath, raw);
    return filePath;
  }

  const cleanBasename = path.basename(imageUrl.split('?')[0]);
  const candidates = [
    path.resolve(PROJECT_ROOT, 'public/assets/images', cleanBasename),
    path.resolve(PROJECT_ROOT, 'src/assets/images', cleanBasename),
    path.resolve(PROJECT_ROOT, 'public/assets/images/cinema_sci_fi_scene_1794406566762.jpg'),
    path.resolve(PROJECT_ROOT, 'src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) return found;

  throw new Error(`Could not resolve image asset for panel ${index + 1}`);
}

export async function renderManhwaExport(params: {
  title: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  fps: number;
  musicMood: string;
  includeAudio: boolean;
  exportFormat: 'mp4' | 'mp3';
  panels: ManhwaExportPanelInput[];
}) {
  const {
    title = 'Manhwa Chapter Video',
    aspectRatio = '9:16',
    fps = 24,
    musicMood = 'Epic Orchestral',
    includeAudio = true,
    exportFormat = 'mp4',
    panels = [],
  } = params;

  if (!Array.isArray(panels) || panels.length === 0) {
    throw new Error('Add at least one Manhwa panel image before exporting.');
  }

  const safeTitle =
    String(title)
      .replace(/[^a-zA-Z0-9\u0C80-\u0CFF\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Manhwa_Chapter';

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fvs-manhwa-'));

  try {
    const wavPath = path.join(tempDir, 'chapter_mix.wav');
    const { buffer: wavBuffer, totalDurationSec } = buildManhwaMixWavBuffer(
      panels,
      musicMood,
      includeAudio
    );
    fs.writeFileSync(wavPath, wavBuffer);

    if (exportFormat === 'mp3') {
      const outMp3Path = path.join(tempDir, `${safeTitle}.mp3`);
      await execFileAsync(
        'ffmpeg',
        ['-y', '-i', wavPath, '-c:a', 'libmp3lame', '-b:a', '192k', outMp3Path],
        { timeout: 30000 }
      );
      const mp3Buffer = fs.readFileSync(outMp3Path);
      return {
        success: true,
        exportFormat: 'mp3' as const,
        mimeType: 'audio/mpeg',
        extension: 'mp3',
        fileName: `${safeTitle}_Audio.mp3`,
        durationSec: totalDurationSec,
        sizeBytes: mp3Buffer.length,
        encoder: 'FFmpeg 4.4.2 (libmp3lame 192kbps)',
        audioBase64: mp3Buffer.toString('base64'),
      };
    }

    const targetFps = Math.max(24, Math.min(30, Number(fps) || 24));
    const size =
      aspectRatio === '9:16'
        ? { w: 720, h: 1280 }
        : aspectRatio === '1:1'
        ? { w: 1080, h: 1080 }
        : { w: 1280, h: 720 };

    const segmentPaths: string[] = [];
    const maxPanelsForRender = panels.slice(0, 12);

    for (let i = 0; i < maxPanelsForRender.length; i++) {
      const panel = maxPanelsForRender[i];
      const imgPath = resolveImageToTempFile(panel.imageUrl, tempDir, i);
      const segDur = Math.max(2, Math.min(12, Number(panel.durationSec) || 4));
      const totalFrames = Math.max(24, Math.round(segDur * targetFps));
      const segPath = path.join(tempDir, `seg_${i}.mp4`);

      // Build camera motion zoompan expression anchored on high-res scaled frame
      const overscanW = Math.round(size.w * 1.25);
      const overscanH = Math.round(size.h * 1.25);

      let zExpr = 'min(zoom+0.0018,1.18)';
      let xExpr = 'iw/2-(iw/zoom/2)';
      let yExpr = 'ih/2-(ih/zoom/2)';

      if (panel.cameraMotion === 'Zoom Out Reveal') {
        zExpr = 'if(eq(on,1),1.18,max(zoom-0.0018,1.0))';
      } else if (panel.cameraMotion === 'Pan Left-to-Right') {
        zExpr = '1.14';
        xExpr = `(iw-iw/zoom)*(on/${totalFrames})`;
      } else if (panel.cameraMotion === 'Pan Right-to-Left') {
        zExpr = '1.14';
        xExpr = `(iw-iw/zoom)*(1-on/${totalFrames})`;
      } else if (panel.cameraMotion === 'Vertical Scroll (Webtoon)') {
        zExpr = '1.16';
        yExpr = `(ih-ih/zoom)*(on/${totalFrames})`;
      } else if (panel.cameraMotion === 'Dramatic Shake') {
        zExpr = '1.12';
        xExpr = 'iw/2-(iw/zoom/2)+10*sin(on*0.9)';
        yExpr = 'ih/2-(ih/zoom/2)+8*cos(on*1.1)';
      }

      const fadeFrames = Math.min(10, Math.floor(totalFrames / 5));
      const fadeFilter =
        panel.transition === 'Flash White'
          ? `,fade=t=in:st=0:d=0.25:color=white`
          : panel.transition === 'Hard Cut'
          ? ''
          : `,fade=t=in:st=0:d=${(fadeFrames / targetFps).toFixed(2)},fade=t=out:st=${Math.max(
              0.2,
              segDur - fadeFrames / targetFps
            ).toFixed(2)}:d=${(fadeFrames / targetFps).toFixed(2)}`;

      const vf = `scale=${overscanW}:${overscanH}:force_original_aspect_ratio=increase,crop=${overscanW}:${overscanH},zoompan=z='${zExpr}':x='${xExpr}':y='${yExpr}':d=${totalFrames}:s=${size.w}x${size.h}:fps=${targetFps}${fadeFilter},format=yuv420p`;

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-i',
          imgPath,
          '-vf',
          vf,
          '-t',
          String(segDur),
          '-r',
          String(targetFps),
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-crf',
          '23',
          '-an',
          segPath,
        ],
        { timeout: 30000 }
      );
      segmentPaths.push(segPath);
    }

    const concatListPath = path.join(tempDir, 'concat_list.txt');
    fs.writeFileSync(
      concatListPath,
      segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
    );

    const outMp4Path = path.join(tempDir, `${safeTitle}.mp4`);
    const finalArgs = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-i',
      wavPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-movflags',
      '+faststart',
      outMp4Path,
    ];

    await execFileAsync('ffmpeg', finalArgs, { timeout: 45000 });
    const mp4Buffer = fs.readFileSync(outMp4Path);

    return {
      success: true,
      exportFormat: 'mp4' as const,
      mimeType: 'video/mp4',
      extension: 'mp4',
      fileName: `${safeTitle}_${aspectRatio.replace(':', 'x')}.mp4`,
      resolution: `${size.w}x${size.h}`,
      fps: targetFps,
      durationSec: totalDurationSec,
      sizeBytes: mp4Buffer.length,
      encoder: 'FFmpeg 4.4.2 (libx264 + AAC)',
      videoBase64: mp4Buffer.toString('base64'),
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
