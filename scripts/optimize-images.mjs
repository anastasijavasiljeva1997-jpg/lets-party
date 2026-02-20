import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();

const TARGET_DIRS = [
  path.join(ROOT, 'public/gallery'),
  path.join(ROOT, 'public/proofs'),
];

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

const PROFILES = {
  gallery: {
    maxDimension: 1600,
    maxSizeBytes: 350 * 1024,
    jpegQuality: 68,
    webpQuality: 68,
    avifQuality: 45,
  },
  proofs: {
    maxDimension: 1800,
    maxSizeBytes: 500 * 1024,
    jpegQuality: 72,
    webpQuality: 72,
    avifQuality: 50,
  },
  default: {
    maxDimension: 1600,
    maxSizeBytes: 400 * 1024,
    jpegQuality: 70,
    webpQuality: 70,
    avifQuality: 48,
  },
};

let sharpLib = null;

async function collectFiles(dir) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectFiles(entryPath);
      if (!entry.isFile()) return [];
      return [entryPath];
    }),
  );

  return files.flat();
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function getProfile(filePath) {
  if (filePath.includes(`${path.sep}public${path.sep}gallery${path.sep}`)) {
    return PROFILES.gallery;
  }
  if (filePath.includes(`${path.sep}public${path.sep}proofs${path.sep}`)) {
    return PROFILES.proofs;
  }
  return PROFILES.default;
}

function applyFormatPipeline(instance, extension, sourceBytes, profile) {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return instance.jpeg({
        quality: profile.jpegQuality,
        mozjpeg: true,
        progressive: true,
      });
    case '.png':
      return instance.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: sourceBytes > 1.5 * 1024 * 1024,
      });
    case '.webp':
      return instance.webp({ quality: profile.webpQuality });
    case '.avif':
      return instance.avif({ quality: profile.avifQuality });
    default:
      return instance;
  }
}

async function optimizeImage(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return { type: 'skipped', reason: 'unsupported', filePath };
  }

  const stat = await fs.stat(filePath);
  const sourceBytes = stat.size;
  const profile = getProfile(filePath);
  const source = sharpLib(filePath, { failOn: 'none' });
  const metadata = await source.metadata();

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const longestSide = Math.max(width, height);

  const shouldResize = longestSide > profile.maxDimension;
  const shouldCompress = sourceBytes > profile.maxSizeBytes;

  if (!shouldResize && !shouldCompress) {
    return { type: 'skipped', reason: 'already-optimized', filePath };
  }

  let pipeline = sharpLib(filePath, { failOn: 'none' }).rotate();
  if (shouldResize) {
    pipeline = pipeline.resize({
      width: profile.maxDimension,
      height: profile.maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  pipeline = applyFormatPipeline(pipeline, extension, sourceBytes, profile);
  const output = await pipeline.toBuffer();

  if (!shouldResize && output.length >= sourceBytes * 0.98) {
    return { type: 'skipped', reason: 'no-gain', filePath };
  }

  await fs.writeFile(filePath, output);
  return {
    type: 'optimized',
    filePath,
    beforeBytes: sourceBytes,
    afterBytes: output.length,
  };
}

async function main() {
  try {
    ({ default: sharpLib } = await import('sharp'));
  } catch {
    console.warn(
      'optimize-images: package "sharp" is not installed; skipping image optimization.',
    );
    return;
  }

  const files = (await Promise.all(TARGET_DIRS.map(collectFiles))).flat();
  let optimized = 0;
  let skipped = 0;
  let savedBytes = 0;

  for (const filePath of files) {
    try {
      const result = await optimizeImage(filePath);

      if (result.type === 'optimized') {
        optimized += 1;
        savedBytes += result.beforeBytes - result.afterBytes;
        console.log(
          `optimized: ${path.relative(ROOT, result.filePath)} (${formatKb(
            result.beforeBytes,
          )} -> ${formatKb(result.afterBytes)})`,
        );
      } else {
        skipped += 1;
      }
    } catch (error) {
      skipped += 1;
      console.warn(
        `skipped: ${path.relative(ROOT, filePath)} (${error.message})`,
      );
    }
  }

  console.log('');
  console.log(`done: optimized ${optimized}, skipped ${skipped}`);
  console.log(`saved: ${formatKb(savedBytes)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
