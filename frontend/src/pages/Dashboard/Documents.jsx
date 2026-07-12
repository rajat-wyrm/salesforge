// Documents page.
import React, { useEffect, useState, useRef } from "react";
import { documentService } from "@/services";
import {
  UptoPage, UptoHero, UptoButton, UptoInput, UptoBadge,
  UptoSpinner, UptoError, UptoEmptyState, UptoCard,
} from "@/components/UI/UptoHooks";
import { FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";

const Documents = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  const handleUploadClick = () => {
    console.log("Upload clicked");
    console.log(fileInputRef.current);

    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await documentService.upload(fd);
      toast.success("Uploaded");
      load();
    } catch (err) { toast.error(err?.message || "Upload failed"); }
    finally { 
      setUploading(false); 
      e.target.value = "";
    }
  };

  return (
    <UptoPage>
      <UptoHero
        title="Documents"
        subtitle={`Sales collateral, contracts, and shared files (Updated: ${Date.now()})`}
        actions={
          <>
            <input type="file" id="doc-upload" className="sr-only" onChange={handleUpload} />
            <UptoButton as="label" htmlFor="doc-upload" className="cursor-pointer" disabled={uploading}>
              <Upload className="mr-1 h-4 w-4 inline" /> {uploading ? "Uploading..." : "Upload"}
            </UptoButton>
          </>
        }
      />
      <UptoCard>
        {loading && <UptoSpinner />}
        {error && <UptoError message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <UptoEmptyState icon={FolderOpen} title="No documents" body="Upload files to share with your team." />
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {items.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-medium truncate">{d.name || d.title || "Document"}</div>
                <div className="text-xs text-slate-500 mt-1">{d.size ? `${Math.round(d.size / 1024)} KB` : ""}</div>
                <div className="mt-2"><UptoBadge>{d.type || "file"}</UptoBadge></div>
              </div>
            ))}
          </div>
        )}
      </UptoCard>
    </UptoPage>
  );
};

export default Documents;
