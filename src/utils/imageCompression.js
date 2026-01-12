const DEFAULT_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 2400;
const DEFAULT_MIN_DIMENSION = 1200;
const DEFAULT_QUALITY = 0.86;
const MIN_QUALITY = 0.6;
const QUALITY_STEP = 0.08;

const UNSUPPORTED_TYPES = new Set(['image/gif', 'image/svg+xml']);

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob || null);
      },
      type,
      quality
    );
  });

const getExtensionForType = (type) => {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
};

const renameFile = (name, type) => {
  const base = name.replace(/\.[^/.]+$/, '');
  const ext = getExtensionForType(type);
  return `${base}.${ext}`;
};

const renderToCanvas = (img, width, height, type) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

export async function compressImageFile(
  file,
  {
    maxBytes = DEFAULT_MAX_IMAGE_BYTES,
    maxDimension = DEFAULT_MAX_DIMENSION,
    minDimension = DEFAULT_MIN_DIMENSION,
    initialQuality = DEFAULT_QUALITY
  } = {}
) {
  if (!file || !file.type?.startsWith('image/')) {
    return { file, didCompress: false, error: 'not-image' };
  }
  if (UNSUPPORTED_TYPES.has(file.type)) {
    return { file, didCompress: false, error: 'unsupported' };
  }
  if (file.size <= maxBytes) {
    return { file, didCompress: false, originalSize: file.size, finalSize: file.size };
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { file, didCompress: false, error: 'no-browser' };
  }

  let img;
  try {
    img = await loadImage(file);
  } catch (err) {
    return { file, didCompress: false, error: 'load-failed' };
  }

  let outputType = file.type;
  if (file.type === 'image/png' || file.type === 'image/webp') {
    outputType = 'image/jpeg';
  }

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const maxSide = Math.max(width, height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  let quality = initialQuality;
  let attempts = 0;
  let blob = null;

  while (attempts < 12) {
    const canvas = renderToCanvas(img, width, height, outputType);
    if (!canvas) {
      return { file, didCompress: false, error: 'render-failed' };
    }
    blob = await canvasToBlob(canvas, outputType, quality);
    if (blob && blob.size <= maxBytes) {
      break;
    }
    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } else if (Math.max(width, height) > minDimension) {
      width = Math.max(1, Math.round(width * 0.85));
      height = Math.max(1, Math.round(height * 0.85));
      quality = Math.max(MIN_QUALITY, initialQuality - QUALITY_STEP);
    } else {
      break;
    }
    attempts += 1;
  }

  if (!blob) {
    return { file, didCompress: false, error: 'compression-failed' };
  }

  const finalFile = new File([blob], renameFile(file.name, blob.type || outputType), {
    type: blob.type || outputType,
    lastModified: Date.now()
  });

  if (finalFile.size > maxBytes) {
    return {
      file: finalFile,
      didCompress: true,
      originalSize: file.size,
      finalSize: finalFile.size,
      error: 'too-large'
    };
  }

  return {
    file: finalFile,
    didCompress: true,
    originalSize: file.size,
    finalSize: finalFile.size
  };
}
