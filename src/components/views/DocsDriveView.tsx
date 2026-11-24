'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatDateInTZ } from '@/lib/format';
import { useLifeOs } from '@/store/life-os-context';
import { FolderIcon, LinkExternalIcon } from '../Icons';

interface DriveOAuthStatus {
  oauthConfigured: boolean;
  connected: boolean;
  accountEmail: string | null;
  source: 'supabase' | 'cookie' | 'none';
}

export function DocsDriveView() {
  const {
    data,
    timezone,
    googleOAuthConfigured,
    toggleDriveConnection,
    updateDriveSettings,
    computeAutoFolderPath,
    createManualDriveFolder,
    uploadDriveFiles,
    attachDriveLink,
    toast,
  } = useLifeOs();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'attach_link'>('upload');
  const [rootUrlDraft, setRootUrlDraft] = useState(data.drive.rootFolderUrl);
  const [rootPathDraft, setRootPathDraft] = useState(data.drive.rootFolder);
  const [uploadingReal, setUploadingReal] = useState(false);

  const [oauthStatus, setOauthStatus] = useState<DriveOAuthStatus>({
    oauthConfigured: googleOAuthConfigured,
    connected: false,
    accountEmail: null,
    source: 'none',
  });

  // Target folder metadata
  const [moduleName, setModuleName] = useState('Travel');
  const [relation, setRelation] = useState('Trip Yogyakarta');
  const [category, setCategory] = useState('Foto Kegiatan');
  const [access, setAccess] = useState('Privat (Hanya Pemilik)');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('ALL');

  // Attach Link Google Drive form
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Manual folder creation
  const [manualFolder, setManualFolder] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/google-drive/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DriveOAuthStatus | null) => {
        if (active && json) setOauthStatus(json);
      })
      .catch(() => {
        // Ignore network errors in offline preview
      });
    return () => {
      active = false;
    };
  }, []);

  const previewFolderPath = computeAutoFolderPath(moduleName, relation, category);
  const visibleFiles =
    activeFolderFilter === 'ALL'
      ? data.drive.files
      : data.drive.files.filter((f) => f.folderPath === activeFolderFilter);

  const handleDisconnectOAuth = async () => {
    try {
      await fetch('/api/google-drive/disconnect', { method: 'POST' });
      setOauthStatus((prev) => ({ ...prev, connected: false, accountEmail: null, source: 'none' }));
      toast('Koneksi OAuth Google Drive diputus.');
    } catch {
      toast('Gagal memutus OAuth Google Drive.');
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const rawFiles = Array.from(fileList);

    // If real Google Drive OAuth is connected, upload straight to Drive v3 API with auto-folder creation
    if (oauthStatus.oauthConfigured && oauthStatus.connected) {
      setUploadingReal(true);
      try {
        const fd = new FormData();
        fd.append('folderPath', previewFolderPath);
        fd.append('moduleName', moduleName);
        fd.append('category', category);
        fd.append('accessLevel', access);
        rawFiles.forEach((f) => fd.append('files', f));

        const res = await fetch('/api/google-drive/upload', {
          method: 'POST',
          body: fd,
        });
        const json = (await res.json()) as {
          ok: boolean;
          message?: string;
          files?: Array<{
            name: string;
            driveUrl: string;
            sizeBytes: number;
            mimeType: string;
          }>;
        };

        if (res.ok && json.ok && json.files) {
          uploadDriveFiles({
            files: json.files.map((rf) => ({
              name: rf.name,
              mime: rf.mimeType,
              sizeBytes: rf.sizeBytes,
              driveUrl: rf.driveUrl,
              status: 'Tersinkron Google Drive',
            })),
            moduleName,
            relation,
            category,
            access,
          });
          setUploadingReal(false);
          return;
        }
        toast(json.message || 'Gagal upload ke Google Drive, menggunakan mode lokal.');
      } catch {
        toast('Koneksi API Google Drive gagal, menggunakan mode lokal.');
      } finally {
        setUploadingReal(false);
      }
    }

    // Fallback to local state simulation when Google OAuth is not yet connected
    const mapped = rawFiles.map((f) => ({
      name: f.name,
      mime: f.type || 'application/octet-stream',
      sizeBytes: f.size,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
    }));
    uploadDriveFiles({
      files: mapped,
      moduleName,
      relation,
      category,
      access,
    });
  };

  const isRealConnected = oauthStatus.oauthConfigured && oauthStatus.connected;

  return (
    <div className="space-y-4">
      <header className="rounded-2xl p-5 card-surface flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isRealConnected
                  ? 'bg-[var(--status-success-bg)] text-[var(--status-success-fg)]'
                  : data.drive.connected
                  ? 'bg-[var(--bg-lime)] text-[var(--ink-on-lime)]'
                  : 'bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
              }`}
            >
              {isRealConnected
                ? 'OAuth Google Drive Aktif (Live API v3)'
                : oauthStatus.oauthConfigured
                ? 'OAuth Siap Dihubungkan'
                : data.drive.connected
                ? 'Mode Simulasi (Siap OAuth Production)'
                : 'Belum Terhubung'}
            </span>
            <span className="text-xs text-[var(--ink-muted)]">
              {oauthStatus.accountEmail || data.drive.accountEmail}
            </span>
          </div>
          <h1 className="text-lg font-bold">10. Dokumentasi &amp; Google Drive (Auto-Folder + Attach Link)</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Mendukung OAuth 2.0 scope minimal (<code>drive.file</code>), pembuatan folder bertingkat otomatis di Google Drive API v3, serta lampiran link manual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {oauthStatus.oauthConfigured ? (
            isRealConnected ? (
              <button
                type="button"
                onClick={handleDisconnectOAuth}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white"
              >
                Putuskan OAuth Drive
              </button>
            ) : (
              <a
                href="/api/google-drive/connect"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] hover:bg-[var(--cta-primary-hover)] text-white"
              >
                Hubungkan OAuth Google Drive
              </a>
            )
          ) : (
            <button
              type="button"
              onClick={toggleDriveConnection}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-panel-deep)] text-white"
            >
              {data.drive.connected ? 'Putuskan Sementara (Simulasi)' : 'Aktifkan Simulasi Drive'}
            </button>
          )}
        </div>
      </header>

      {/* Root Folder Link & Auto-Folder Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 card-surface space-y-3">
          <h2 className="text-sm font-bold">1. Attach Link Folder Root Google Drive</h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Tempel URL folder utama Google Drive Anda agar dapat dibuka langsung dari workspace ini.
          </p>
          <div className="space-y-2">
            <div>
              <label htmlFor="drv-root-path" className="block text-xs font-semibold mb-1">Nama Folder Root</label>
              <input
                id="drv-root-path"
                type="text"
                value={rootPathDraft}
                onChange={(e) => setRootPathDraft(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs card-canvas"
              />
            </div>
            <div>
              <label htmlFor="drv-root-url" className="block text-xs font-semibold mb-1">Link Folder Root Google Drive</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="drv-root-url"
                  type="url"
                  value={rootUrlDraft}
                  onChange={(e) => setRootUrlDraft(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs card-canvas"
                />
                <button
                  type="button"
                  onClick={() => updateDriveSettings({ rootFolder: rootPathDraft, rootFolderUrl: rootUrlDraft.trim() })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
                >
                  Simpan Link Root
                </button>
              </div>
            </div>
            {data.drive.rootFolderUrl && (
              <a
                href={data.drive.rootFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--link-accent)] hover:underline"
              >
                <LinkExternalIcon /> Buka Folder Root di Google Drive
              </a>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-5 card-surface space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">2. Aturan Pembuatan Folder Otomatis</h2>
            <label htmlFor="drv-auto-toggle" className="inline-flex items-center gap-2 text-xs font-semibold">
              <input
                id="drv-auto-toggle"
                type="checkbox"
                checked={data.drive.autoCreateFolder}
                onChange={(e) => updateDriveSettings({ autoCreateFolder: e.target.checked })}
                className="w-4 h-4 accent-[var(--cta-primary)]"
              />
              Aktifkan Auto-Folder
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              ['module_year_object', '/Modul/Tahun/Relasi'],
              ['year_month_module', '/Tahun/Bulan/Modul'],
              ['module_category', '/Modul/Kategori'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => updateDriveSettings({ folderPattern: val as typeof data.drive.folderPattern })}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left border ${
                  data.drive.folderPattern === val
                    ? 'bg-[var(--bg-lime)] text-[var(--ink-on-lime)] border-transparent'
                    : 'card-canvas hover:bg-[var(--bg-hover)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-3 rounded-xl card-canvas text-xs">
            <p className="text-[11px] text-[var(--ink-muted)]">Preview Folder Tujuan Otomatis:</p>
            <p className="font-mono font-semibold mt-0.5 break-all">{previewFolderPath}</p>
          </div>
        </div>
      </div>

      {/* Upload or Attach Link Workspace */}
      <div className="rounded-2xl p-5 card-surface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">3. Tambah Dokumentasi (Upload File atau Attach Link Google Drive)</h2>
          <div className="flex gap-1.5" role="tablist" aria-label="Mode tambah dokumentasi">
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'upload'}
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                inputMode === 'upload' ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === 'attach_link'}
              onClick={() => setInputMode('attach_link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                inputMode === 'attach_link' ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas'
              }`}
            >
              Attach Link Google Drive
            </button>
          </div>
        </div>

        {/* Shared metadata row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label htmlFor="drv-mod" className="block text-xs font-semibold mb-1">Modul Tujuan</label>
            <select id="drv-mod" value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Travel">Travel</option>
              <option value="Academic">Academic</option>
              <option value="Finance">Finance</option>
              <option value="Daily Life">Daily Life</option>
              <option value="Task & Project">Task &amp; Project</option>
              <option value="Journal & Archive">Journal &amp; Archive</option>
            </select>
          </div>
          <div>
            <label htmlFor="drv-rel" className="block text-xs font-semibold mb-1">Nama Objek / Relasi</label>
            <input id="drv-rel" type="text" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Contoh: Trip Yogyakarta / Tesis" className="w-full px-3 py-2 rounded-xl text-xs card-canvas" />
          </div>
          <div>
            <label htmlFor="drv-cat" className="block text-xs font-semibold mb-1">Kategori Berkas</label>
            <select id="drv-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Foto Kegiatan">Foto Kegiatan</option>
              <option value="Struk & Bukti Bayar">Struk &amp; Bukti Bayar</option>
              <option value="Draft / PDF Akademik">Draft / PDF Akademik</option>
              <option value="Dokumen & Peta">Dokumen &amp; Peta</option>
              <option value="Sertifikat / Legal">Sertifikat / Legal</option>
            </select>
          </div>
          <div>
            <label htmlFor="drv-acc" className="block text-xs font-semibold mb-1">Hak Akses</label>
            <select id="drv-acc" value={access} onChange={(e) => setAccess(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs card-canvas">
              <option value="Privat (Hanya Pemilik)">Privat (Hanya Pemilik)</option>
              <option value="Tautan Terbatas (Pembimbing/Tim)">Tautan Terbatas (Pembimbing/Tim)</option>
            </select>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFilesSelected(e.dataTransfer.files);
            }}
            className="rounded-2xl border-2 border-dashed border-[var(--border-strong)] p-6 text-center card-canvas space-y-3"
          >
            <p className="text-sm font-semibold">
              {uploadingReal
                ? 'Mengunggah langsung ke Google Drive API v3...'
                : 'Tarik & letakkan file di sini, atau pilih dari perangkat'}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Tujuan otomatis: <span className="font-mono font-semibold">{previewFolderPath}</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                void handleFilesSelected(e.target.files);
              }}
              className="hidden"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={uploadingReal}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
              >
                {uploadingReal ? 'Mengunggah...' : 'Pilih File dari Perangkat'}
              </button>
              <button
                type="button"
                disabled={uploadingReal}
                onClick={() =>
                  uploadDriveFiles({
                    files: [
                      {
                        name: `Dokumentasi_${moduleName.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`,
                        mime: 'application/pdf',
                        sizeBytes: 640000,
                      },
                    ],
                    moduleName,
                    relation,
                    category,
                    access,
                  })
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
              >
                + Simulasi Upload File Contoh
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = attachDriveLink({
                title: linkTitle,
                driveUrl: linkUrl,
                moduleName,
                relation,
                category,
                access,
              });
              if (res) {
                setLinkTitle('');
                setLinkUrl('');
              }
            }}
            className="p-4 rounded-2xl card-canvas grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div>
              <label htmlFor="drv-link-title" className="block text-xs font-semibold mb-1">Judul File / Folder</label>
              <input
                id="drv-link-title"
                type="text"
                required
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Contoh: Folder Foto Yogyakarta"
                className="w-full px-3 py-2 rounded-xl text-xs card-surface"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="drv-link-url" className="block text-xs font-semibold mb-1">URL Google Drive (File / Docs / Sheets / Folder)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="drv-link-url"
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs card-surface"
                />
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white shrink-0">
                  + Lampirkan Link Drive
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Folder Explorer & Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 card-surface space-y-3">
          <h2 className="text-sm font-bold">Folder Explorer ({data.drive.folders.length})</h2>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveFolderFilter('ALL')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                activeFolderFilter === 'ALL' ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span>Semua Folder</span>
              <span>{data.drive.files.length}</span>
            </button>
            {data.drive.folders.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setActiveFolderFilter(f.path)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2 ${
                  activeFolderFilter === f.path ? 'bg-[var(--bg-panel-deep)] text-white' : 'card-canvas hover:bg-[var(--bg-hover)]'
                }`}
              >
                <FolderIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-all">{f.path}</p>
                  <p className={`text-[10px] ${activeFolderFilter === f.path ? 'text-[var(--bg-lime)]' : 'text-[var(--ink-muted)]'}`}>
                    {f.module} · {f.autoCreated ? 'Auto-Folder' : 'Manual'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualFolder.trim()) return;
              createManualDriveFolder(manualFolder, moduleName);
              setManualFolder('');
            }}
            className="pt-3 border-t border-[var(--border-hairline)] flex gap-1.5"
          >
            <input aria-label="Nama folder manual baru" type="text" value={manualFolder} onChange={(e) => setManualFolder(e.target.value)} placeholder="Subfolder baru..." className="flex-1 px-2.5 py-1.5 rounded-lg text-xs card-canvas" />
            <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--cta-primary)] text-white">+ Folder</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5 card-surface space-y-3">
            <h2 className="text-sm font-bold">Berkas &amp; Tautan Dokumentasi ({visibleFiles.length})</h2>
            <div className="space-y-2">
              {visibleFiles.map((file) => (
                <div key={file.id} className="p-3 rounded-xl card-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{file.name}</p>
                    <p className="text-[11px] text-[var(--ink-muted)] break-all">
                      {file.folderPath} · {file.sizeLabel} · {file.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[10px] font-semibold">{file.module}</span>
                    {file.driveUrl && (
                      <a
                        href={file.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-[var(--bg-lime)] text-[var(--ink-on-lime)]"
                      >
                        <LinkExternalIcon /> Buka Drive
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 card-surface space-y-2">
            <h2 className="text-sm font-bold">Log Sinkronisasi Google Drive</h2>
            {data.drive.syncLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl card-canvas text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-medium break-all">
                  <strong className="text-[var(--link-accent)]">[{log.action}]</strong> {log.detail}
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] shrink-0">{formatDateInTZ(log.time, timezone)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
