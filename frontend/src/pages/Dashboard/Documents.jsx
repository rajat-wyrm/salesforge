// Documents page.
import React, { useEffect, useState, useRef } from "react";
import { documentService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { FolderOpen, Upload, Download, Pencil, Trash2, X, Check, FileText, Image, FileArchive, FileCode } from "lucide-react";
import { toast } from "sonner";

// Resolve what icon / thumbnail to show based on mimetype or extension
const getFileIcon = (doc) => {
  const type = (doc.mimeType || doc.type || "").toLowerCase();
  const name = (doc.name || doc.title || "").toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) {
    return "image";
  }
  if (type.includes("zip") || type.includes("tar") || /\.(zip|rar|gz|7z)$/.test(name)) return "archive";
  if (type.includes("code") || /\.(js|ts|py|html|css|json|xml)$/.test(name)) return "code";
  return "file";
};

const FileIconBadge = ({ doc }) => {
  const kind = getFileIcon(doc);
  const cfg = {
    image:   { icon: Image,       bg: "bg-violet-100 dark:bg-violet-500/20", color: "text-violet-500" },
    archive: { icon: FileArchive, bg: "bg-amber-100 dark:bg-amber-500/20",   color: "text-amber-500"  },
    code:    { icon: FileCode,    bg: "bg-cyan-100 dark:bg-cyan-500/20",     color: "text-cyan-500"   },
    file:    { icon: FileText,    bg: "bg-teal-100 dark:bg-teal-500/20",     color: "text-teal-500"   },
  }[kind];
  const Icon = cfg.icon;
  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      <Icon className={`w-6 h-6 ${cfg.color}`} />
    </div>
  );
};

const Documents = () => {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [uploading, setUploading] = useState(false);

  // Edit state: which doc id is being renamed + current input value
  const [editId, setEditId]       = useState(null);
  const [editName, setEditName]   = useState("");

  // Confirm delete state
  const [deleteId, setDeleteId]   = useState(null);

  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await documentService.list({ limit: 100 });
      setItems(res?.items || res || []);
      setError(null);
    } catch (e) { setError(e?.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Upload ──────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await documentService.upload(fd);
      toast.success("File uploaded successfully");
      load();
    } catch (err) { toast.error(err?.message || "Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  // ── Download ─────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      const res = await documentService.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name || doc.title || "document";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error("Download failed"); }
  };

  // ── Rename ────────────────────────────────────────────────
  const startEdit = (doc) => {
    setEditId(doc.id);
    setEditName(doc.name || doc.title || "");
    setDeleteId(null); // close any confirm dialogs
  };

  const cancelEdit = () => { setEditId(null); setEditName(""); };

  const saveEdit = async (doc) => {
    const trimmed = editName.trim();
    if (!trimmed) { toast.error("Name cannot be empty"); return; }
    try {
      await documentService.update(doc.id, { name: trimmed });
      toast.success("Document renamed");
      cancelEdit();
      load();
    } catch (err) { toast.error(err?.message || "Rename failed"); }
  };

  // ── Delete ────────────────────────────────────────────────
  const confirmDelete = (doc) => { setDeleteId(doc.id); setEditId(null); };
  const cancelDelete  = ()    => setDeleteId(null);

  const handleDelete = async (doc) => {
    try {
      await documentService.remove(doc.id);
      toast.success("Document deleted");
      setDeleteId(null);
      load();
    } catch (err) { toast.error(err?.message || "Delete failed"); }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Documents"
        subtitle="Sales collateral, contracts, and shared files"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={handleUpload}
            />
            <UptoButton
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-1.5 h-4 w-4 inline" />
              {uploading ? "Uploading…" : "Upload"}
            </UptoButton>
          </>
        }
      />

      <UptoCard>
        {loading && <UptoSpinner />}
        {error   && <UptoError message={error} onRetry={load} />}

        {!loading && !error && items.length === 0 && (
          <UptoEmptyState
            icon={FolderOpen}
            title="No documents yet"
            body="Upload files to share with your team."
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((doc) => {
              const isEditing  = editId   === doc.id;
              const isDeleting = deleteId === doc.id;
              const size = doc.size ? `${Math.round(doc.size / 1024)} KB` : null;

              return (
                <div
                  key={doc.id}
                  className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all duration-200"
                >
                  {/* ── Main content row ── */}
                  <div className="flex items-start gap-3">
                    <FileIconBadge doc={doc} />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        /* Inline rename input */
                        <div className="flex items-center gap-2 mt-0.5">
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")  saveEdit(doc);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-slate-50 dark:bg-slate-900 min-w-0"
                          />
                          <button
                            onClick={() => saveEdit(doc)}
                            className="p-1 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                          {doc.name || doc.title || "Document"}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {size && <span className="text-xs text-slate-400">{size}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 capitalize">
                          {doc.type || doc.mimeType?.split("/")[1] || "file"}
                        </span>
                        {doc.createdAt && (
                          <span className="text-xs text-slate-400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Delete confirm banner ── */}
                  {isDeleting && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm">
                      <p className="font-medium text-red-700 dark:text-red-400 mb-2">Delete this document?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(doc)}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Action buttons (visible on hover) ── */}
                  {!isEditing && !isDeleting && (
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        onClick={() => startEdit(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Rename
                      </button>
                      <button
                        onClick={() => confirmDelete(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors ml-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default Documents;



