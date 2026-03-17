import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Plus, Loader2, ChevronDown, FolderOpen } from 'lucide-react';
import { useAuth } from './AuthContext';
import { uploadDocument, listDocuments } from '../api/client';
import { useToast } from './Toast';

const DOC_TYPES = [
  { value: 'nda',                   label: 'Non-Disclosure Agreement', roles: ['admin','analyst','readonly'] },
  { value: 'employment',            label: 'Employment Contract',      roles: ['admin','analyst'] },
  { value: 'board_resolution',      label: 'Board Resolution',         roles: ['admin'] },
  { value: 'shareholder_agreement', label: 'Shareholder Agreement',    roles: ['admin','analyst'] },
];

const DOC_CLS = {
  nda:                   'doc-badge doc-nda',
  employment:            'doc-badge doc-employment',
  board_resolution:      'doc-badge doc-board_resolution',
  shareholder_agreement: 'doc-badge doc-shareholder_agreement',
};

const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB';

export default function DocumentSidebar({ onDocumentUploaded }) {
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const [files,        setFiles]        = useState([]);
  const [docType,      setDocType]      = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [documents,    setDocuments]    = useState([]);
  const [loadingDocs,  setLoadingDocs]  = useState(true);
  const [isDragging,   setIsDragging]   = useState(false);
  const [panelOpen,    setPanelOpen]    = useState(true);

  const canUpload    = user?.role !== 'readonly';
  const permitted    = useMemo(() => DOC_TYPES.filter(t => t.roles.includes(user?.role || 'readonly')), [user?.role]);

  useEffect(() => {
    if (!docType && permitted.length > 0) setDocType(permitted[0].value);
  }, [docType, permitted]);

  const fetchDocs = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const data = await listDocuments(user.access_token);
      setDocuments(data);
    } catch { showToast('Failed to load documents', 'error'); }
    finally { setLoadingDocs(false); }
  }, [user?.access_token, showToast]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const onDrop = e => {
    e.preventDefault(); setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files)
      .filter(f => /\.(pdf|docx)$/i.test(f.name));
    setFiles(prev => [...prev, ...dropped]);
  };

  const onPick  = e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
  const rmFile  = i  => setFiles(f => f.filter((_, j) => j !== i));

  const handleUpload = async () => {
    if (!files.length || !docType || uploading) return;
    setUploading(true);
    for (const file of files) {
      try {
        const res = await uploadDocument({ file, doc_type: docType, token: user.access_token });
        showToast(`✓ ${file.name} — ${res.chunks} chunks`, 'success');
      } catch (e) { showToast(`✗ ${file.name}: ${e.message}`, 'error'); }
    }
    setFiles([]);
    setUploading(false);
    await fetchDocs();
    onDocumentUploaded?.();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="text-gold-400" />
          <span className="text-sm font-semibold text-platinum-100">Documents</span>
          <div className="ml-auto w-5 h-5 rounded-full text-xs font-mono flex items-center justify-center bg-gold-500/10 text-gold-400 border border-gold-500/20">
            {documents.length}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll p-3 flex flex-col gap-3">

        {/* Upload panel (analyst + admin only) */}
        {canUpload && (
          <div className="glass-card overflow-hidden">
            <button onClick={() => setPanelOpen(o => !o)}
              className="w-full flex items-center justify-between p-3 text-sm text-platinum-200 hover:text-gold-400 transition-colors">
              <div className="flex items-center gap-2">
                <Upload size={13} className="text-gold-400" />
                <span className="font-medium">Upload Documents</span>
              </div>
              <motion.div animate={{ rotate: panelOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={13} />
              </motion.div>
            </button>

            <AnimatePresence>
              {panelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  className="overflow-hidden">
                  <div className="px-3 pb-3 border-t border-white/5 pt-3 flex flex-col gap-3">

                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={onDrop}
                      onClick={() => document.getElementById('lex-file-input').click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                        isDragging ? 'border-gold-400 bg-gold-500/10' : 'border-white/10 hover:border-gold-500/40 hover:bg-gold-500/5'
                      }`}>
                      <Upload size={18} className="mx-auto mb-2 text-platinum-400" />
                      <p className="text-xs text-platinum-400">Drop PDF or DOCX</p>
                      <p className="text-xs text-platinum-400 opacity-50 mt-0.5">or click to browse</p>
                    </div>
                    <input id="lex-file-input" type="file" multiple accept=".pdf,.docx" className="hidden" onChange={onPick} />

                    {/* File list */}
                    <AnimatePresence>
                      {files.map((f, i) => (
                        <motion.div key={`file-${f.name}-${f.size}-${i}`}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-2 text-xs bg-obsidian-900/50 rounded-lg p-2">
                          <FileText size={11} className="text-gold-400 shrink-0" />
                          <span className="text-platinum-300 truncate flex-1">{f.name}</span>
                          <span className="text-platinum-400 shrink-0">{fmtBytes(f.size)}</span>
                          <button onClick={() => rmFile(i)} className="text-platinum-400 hover:text-red-400 transition-colors">
                            <X size={11} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Doc type */}
                    <div>
                      <label className="text-xs text-platinum-400 block mb-1">Document Type</label>
                      <select value={docType} onChange={e => setDocType(e.target.value)} className="lex-input text-xs">
                        {permitted.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>

                    <button onClick={handleUpload} disabled={!files.length || uploading}
                      className="btn-gold w-full flex items-center justify-center gap-2 text-xs py-2.5">
                      {uploading
                        ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
                        : <><Plus size={12} /> Upload {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Document list */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-platinum-400 px-1 font-medium">Your Corpus</p>
          {loadingDocs ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gold-400" /></div>
          ) : documents.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <FileText size={22} className="mx-auto mb-2 text-platinum-400 opacity-40" />
              <p className="text-xs text-platinum-400 opacity-50 italic">No documents yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div key={doc.doc_id || `doc-${i}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card p-3 flex items-start gap-2.5">
                  <FileText size={13} className="text-gold-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-platinum-200 truncate font-medium" title={doc.filename}>
                      {doc.filename.length > 26 ? doc.filename.slice(0,26)+'…' : doc.filename}
                    </p>
                    <span className={DOC_CLS[doc.doc_type] || 'doc-badge'} style={{ marginTop: '4px', display: 'inline-block' }}>
                      {doc.doc_type?.replace(/_/g,' ')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
