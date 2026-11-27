import {
  LIBRARY_MEDIA_FORMATS, MAX_LIBRARY_UPLOAD_BYTES, type LibraryFileExtension,
} from '../src/data/libraryMediaFormats.ts';

const mimeAliases: Record<string, LibraryFileExtension> = {
  'image/jpg': 'jpg',
  'audio/mp3': 'mp3',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-m4a': 'm4a',
  'application/ogg': 'ogg',
};

function resolveExtension(name: string, mimeType: string): LibraryFileExtension {
  const filenameExtension = /\.([a-z0-9]+)$/i.exec(name)?.[1].toLowerCase() || '';
  if (Object.hasOwn(LIBRARY_MEDIA_FORMATS, filenameExtension)) {
    return filenameExtension as LibraryFileExtension;
  }
  const mime = mimeType.toLowerCase().split(';')[0].trim();
  const byMime = Object.entries(LIBRARY_MEDIA_FORMATS).find(([, format]) =>
    format.mime === mime && /^(?:image|video|audio)\//.test(mime)
  )?.[0] as LibraryFileExtension | undefined;
  const extension = Object.hasOwn(mimeAliases, mime) ? mimeAliases[mime] : byMime;
  if (extension) return extension;
  throw new Error('Unsupported file type. Choose a supported library file.');
}

function matchesFileFormat(extension: LibraryFileExtension, bytes: Buffer): boolean {
  const has = (value: string, offset = 0) =>
    bytes.subarray(offset, offset + value.length).toString('latin1') === value;
  switch (extension) {
    case 'jpg': case 'jpeg': return has('\xff\xd8\xff');
    case 'png': return has('\x89PNG\r\n\x1a\n');
    case 'webp': return has('RIFF') && has('WEBP', 8);
    case 'gif': return has('GIF87a') || has('GIF89a');
    case 'wav': return (has('RIFF') || has('RF64')) && has('WAVE', 8);
    case 'ogg': return has('OggS');
    case 'mp3': return has('ID3') || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case 'm4a': case 'mp4': return has('ftyp', 4);
    case 'mov': return ['ftyp', 'moov', 'mdat', 'wide', 'free'].some(tag => has(tag, 4));
    case 'webm': return has('\x1a\x45\xdf\xa3');
    case 'glb': return has('glTF');
    case 'zip': case 'lottie': return has('PK\x03\x04') || has('PK\x05\x06');
    case 'ttf': return has('\x00\x01\x00\x00') || has('true');
    case 'otf': return has('OTTO');
    case 'woff2': return has('wOF2');
    case 'hdr': return has('#?RADIANCE') || has('#?RGBE');
    case 'exr': return has('\x76\x2f\x31\x01');
    case 'srt': return /\d\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s+-->/.test(bytes.subarray(0, 4096).toString('utf8'));
    case 'vtt': return /^\uFEFF?WEBVTT\b/.test(bytes.subarray(0, 32).toString('utf8'));
    case 'cube': return /(?:^|\n)\s*LUT_(?:1D|3D)_SIZE\s+\d+/i.test(bytes.subarray(0, 4096).toString('utf8'));
    case 'obj': return /(?:^|\n)\s*(?:v|vn|vt|f)\s+-?\d/.test(bytes.subarray(0, 8192).toString('utf8'));
    case 'fbx': return has('Kaydara FBX Binary') || /^\s*;\s*FBX/.test(bytes.subarray(0, 256).toString('utf8'));
    case 'fvs':
      if (has('PK\x03\x04') || has('PK\x05\x06')) return true;
      // FVS projects can also use JSON.
    case 'gltf': case 'json':
      try {
        const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
        return parsed !== null && typeof parsed === 'object' &&
          (extension !== 'gltf' || typeof parsed.asset?.version === 'string');
      } catch {
        return false;
      }
  }
}

export function decodeLibraryUpload(name: string, mimeType: string, dataUrl: string) {
  const extension = resolveExtension(name, mimeType);
  const separator = dataUrl.indexOf(',');
  if (separator < 0 || !/^data:[^,]*;base64$/i.test(dataUrl.slice(0, separator))) {
    throw new Error('Invalid file payload. Select the file again.');
  }
  const payload = dataUrl.slice(separator + 1);
  if (payload.length > Math.ceil(MAX_LIBRARY_UPLOAD_BYTES / 3) * 4) {
    throw new Error('File size must be between 1 byte and 25 MB.');
  }
  if (payload.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
    throw new Error('Invalid file data. Select the file again.');
  }
  const bytes = Buffer.from(payload, 'base64');
  if (!bytes.length || bytes.length > MAX_LIBRARY_UPLOAD_BYTES) {
    throw new Error('File size must be between 1 byte and 25 MB.');
  }
  if (!matchesFileFormat(extension, bytes)) {
    throw new Error('File contents do not match the .' + extension + ' format.');
  }
  return { extension, bytes, ...LIBRARY_MEDIA_FORMATS[extension] };
}
