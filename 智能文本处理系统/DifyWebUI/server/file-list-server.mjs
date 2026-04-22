import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const ROOT = process.cwd();
const PUBLIC_BASE = path.resolve(ROOT, 'public', 'file_list');
const PUBLIC_MANIFEST_PATH = path.resolve(PUBLIC_BASE, 'manifest.json');

function isSafeSegment(seg) {
  if (typeof seg !== 'string') return false;
  const s = seg.trim();
  if (!s) return false;
  if (s.length > 120) return false;
  if (s.includes('..')) return false;
  if (s.includes('/') || s.includes('\\')) return false;

  // Windows/NTFS disallowed characters in file/folder names: \ / : * ? " < > |
  // Also reject control characters.
  if (/[\u0000-\u001f]/.test(s)) return false;
  if (/[\\/:*?"<>|]/.test(s)) return false;
  return true;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function listSubFolders(baseDir) {
  const items = await fs.readdir(baseDir, { withFileTypes: true });
  return items.filter(i => i.isDirectory()).map(i => i.name).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

async function listFilesInFolder(baseDir, folder) {
  const full = path.resolve(baseDir, folder);
  const items = await fs.readdir(full, { withFileTypes: true });
  return items
    .filter(i => i.isFile())
    .map(i => i.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

async function buildManifestFromPublic() {
  await ensureDir(PUBLIC_BASE);

  const folders = await listSubFolders(PUBLIC_BASE);
  const files = [];
  for (const folder of folders) {
    const names = await listFilesInFolder(PUBLIC_BASE, folder);
    for (const name of names) {
      if (name === 'manifest.json') continue;
      files.push({
        name,
        category: folder,
        path: `file_list/${folder}/${name}`.replaceAll('\\', '/'),
      });
    }
  }
  return { basePath: 'file_list', folders, files };
}

async function ensureFolderSkeleton(folders) {
  await ensureDir(PUBLIC_BASE);
  for (const folder of folders) {
    await ensureDir(path.resolve(PUBLIC_BASE, folder));
  }
}

async function writeManifest(files) {
  const payload = { basePath: 'file_list', files };
  await ensureDir(PUBLIC_BASE);
  await fs.writeFile(PUBLIC_MANIFEST_PATH, JSON.stringify(payload, null, 2), 'utf-8');
}

app.get('/local-api/file-list', async (_req, res) => {
  try {
    const manifest = await buildManifestFromPublic();
    await ensureFolderSkeleton(manifest.folders);
    await writeManifest(manifest.files);
    res.json(manifest);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/local-api/folder', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!isSafeSegment(name)) return res.status(400).json({ error: 'invalid folder' });

    await ensureDir(PUBLIC_BASE);
    const target = path.resolve(PUBLIC_BASE, name);

    try {
      const stat = await fs.stat(target);
      if (stat?.isDirectory()) return res.status(409).json({ error: 'folder exists' });
      return res.status(409).json({ error: 'path exists' });
    } catch {
      // ignore not-exists
    }

    await ensureDir(target);

    const manifest = await buildManifestFromPublic();
    await ensureFolderSkeleton(manifest.folders);
    await writeManifest(manifest.files);

    res.json({ ok: true, folder: name });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

app.post('/local-api/upload', upload.single('file'), async (req, res) => {
  try {
    const folder = String(req.body?.folder || '').trim();
    const file = req.file;
    if (!isSafeSegment(folder)) return res.status(400).json({ error: 'invalid folder' });
    if (!file?.originalname) return res.status(400).json({ error: 'missing file' });

    const filename = path.basename(file.originalname);
    if (!isSafeSegment(filename)) return res.status(400).json({ error: 'invalid filename' });

    const publicTargetFolder = path.resolve(PUBLIC_BASE, folder);
    await ensureDir(publicTargetFolder);

    const publicTargetFile = path.resolve(publicTargetFolder, filename);

    await fs.writeFile(publicTargetFile, file.buffer);

    const manifest = await buildManifestFromPublic();
    await ensureFolderSkeleton(manifest.folders);
    await writeManifest(manifest.files);

    res.json({ ok: true, savedTo: [`public/file_list/${folder}/${filename}`] });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

const port = Number(process.env.FILE_LIST_SERVER_PORT || 5174);
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[file-list-server] listening on http://localhost:${port}`);
});

