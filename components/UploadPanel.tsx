'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { uploadDocument, listDocuments } from '@/lib/api-client';
import { useToast } from './Toast';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function UploadPanel({ onDocumentUploaded }: { onDocumentUploaded: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState('nda');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      const docs = await listDocuments(user.access_token);
      setDocuments(docs);
    } catch (err) {
      showToast('Failed to load documents', 'error');
    } finally {
      setLoadingDocs(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;
    setUploading(true);
    
    let successCount = 0;
    for (const file of files) {
      try {
        const res = await uploadDocument({ file, doc_type: docType, token: user.access_token });
        showToast(`✓ ${file.name} — ${res.chunks} chunks indexed`, 'success');
        successCount++;
      } catch (err: any) {
        showToast(`✗ ${file.name} — ${err.message}`, 'error');
      }
    }
    
    setUploading(false);
    if (successCount > 0) {
      setFiles([]);
      fetchDocs();
      onDocumentUploaded();
    }
  };

  const docTypeColors: Record<string, string> = {
    nda: 'bg-blue-100 text-blue-800',
    employment: 'bg-purple-100 text-purple-800',
    board_resolution: 'bg-orange-100 text-orange-800',
    shareholder_agreement: 'bg-green-100 text-green-800'
  };

  const permittedTypes = user?.permitted_doc_types || ['nda'];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 bg-white">
      {user?.role !== 'readonly' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-4"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Drop PDF or DOCX files here</p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx" 
              className="hidden" 
              ref={fileInputRef}
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="text-xs text-gray-600 flex justify-between bg-gray-50 p-2 rounded">
                  <span className="truncate max-w-[180px]">{f.name}</span>
                  <span>{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select className="lex-input" value={docType} onChange={e => setDocType(e.target.value)}>
              {permittedTypes.includes('nda') && <option value="nda">Non-Disclosure Agreement</option>}
              {permittedTypes.includes('employment') && <option value="employment">Employment Contract</option>}
              {permittedTypes.includes('board_resolution') && <option value="board_resolution">Board Resolution</option>}
              {permittedTypes.includes('shareholder_agreement') && <option value="shareholder_agreement">Shareholder Agreement</option>}
            </select>
          </div>

          <button 
            onClick={handleUpload} 
            disabled={files.length === 0 || uploading}
            className="lex-btn-primary w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </button>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h3>
        {loadingDocs ? (
          <div className="text-center text-sm text-gray-500 py-4">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center text-sm text-gray-500 italic py-4">No documents uploaded yet</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.filename}>
                    {doc.filename.length > 28 ? doc.filename.substring(0, 25) + '...' : doc.filename}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${docTypeColors[doc.doc_type] || 'bg-gray-100 text-gray-800'}`}>
                    {doc.doc_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
