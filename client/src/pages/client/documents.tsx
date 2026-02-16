import React, { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Lock, UploadCloud, File, X, Eye, Image, FileCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProperlyLoader } from '@/components/properly-loader';
import type { Matter, Document } from '@shared/schema';

function getFileType(name: string): 'image' | 'pdf' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

function getFileIcon(name: string) {
  const type = getFileType(name);
  if (type === 'image') return Image;
  return FileText;
}

function DocumentPreviewModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const fileType = getFileType(doc.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="document-preview-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-[#e7f6f3] text-primary">
              {fileType === 'image' ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-foreground truncate" data-testid="preview-doc-name">{doc.name}</h3>
              <p className="text-xs text-muted-foreground">
                {doc.size} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                {doc.category && ` · ${doc.category}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {fileType === 'image' && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} data-testid="button-zoom-out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(3, z + 0.25))} data-testid="button-zoom-in">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={onClose} data-testid="button-close-preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-8" style={{ minHeight: '400px' }}>
          {fileType === 'image' ? (
            <div className="transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border">
                <div className="bg-gradient-to-br from-[#e7f6f3] via-[#d5ece7] to-[#c8e0db] flex items-center justify-center" style={{ width: '480px', height: '360px' }}>
                  <div className="text-center space-y-3">
                    <div className="bg-white/80 backdrop-blur rounded-full p-4 mx-auto w-fit">
                      <Image className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{doc.name}</p>
                      <p className="text-xs text-primary/60 mt-1">Image preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : fileType === 'pdf' ? (
            <div className="bg-white rounded-lg shadow-lg border overflow-hidden" style={{ width: '420px' }}>
              <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-semibold text-sm text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded-full w-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-11/12" />
                  <div className="h-3 bg-gray-200 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-200 rounded-full w-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded-full w-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-5/6" />
                  <div className="h-3 bg-gray-200 rounded-full w-11/12" />
                  <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded-full w-full" />
                  <div className="h-3 bg-gray-200 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-200 rounded-full w-11/12" />
                </div>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page 1 of 1</span>
                <div className="flex items-center gap-1">
                  <FileCheck className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-white rounded-full p-6 mx-auto w-fit shadow-lg">
                <File className="h-16 w-16 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{doc.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{doc.size}</p>
                <p className="text-xs text-muted-foreground mt-2">Preview not available for this file type</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {doc.locked && (
              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" /> Protected
              </span>
            )}
            <span className="bg-secondary px-2 py-1 rounded-full text-primary font-medium">{doc.category || 'document'}</span>
          </div>
          <Button className="bg-primary text-white hover:bg-primary/90" size="sm" data-testid="button-download-preview">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClientDocuments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const { data: matters } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
  });

  const matter = matters?.find(m => m.clientUserId === user?.id) || matters?.[0];
  const matterId = matter?.id;

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/matters", matterId, "documents"],
    enabled: !!matterId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { matterId: string; name: string; size: string }) => {
      await apiRequest("POST", "/api/documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matters", matterId, "documents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matters", matterId, "documents"] });
    },
  });

  const myDocs = documents || [];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && matterId) {
      uploadMutation.mutate(
        {
          matterId,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        },
        {
          onSuccess: () => {
            toast({
              title: "Document Uploaded",
              description: `${file.name} has been securely stored.`,
            });
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Document Deleted",
          description: "The file has been removed from your vault.",
          variant: "destructive"
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Layout role="CLIENT">
        <ProperlyLoader size="lg" text="Loading documents..." fullPage />
      </Layout>
    );
  }

  return (
    <Layout role="CLIENT">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Document Vault</h1>
            <p className="text-muted-foreground text-sm">Secure storage for your settlement.</p>
          </div>
          <Button onClick={handleUploadClick} className="bg-primary text-white hover:bg-primary/90" disabled={!matterId}>
            <UploadCloud className="h-4 w-4 mr-2" /> Upload
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>

        <div className="grid gap-4">
          {myDocs.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed border-muted">
              <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto mb-3">
                 <File className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                Documents shared by your conveyancer or uploaded by you will appear here.
              </p>
              <Button variant="outline" onClick={handleUploadClick} disabled={!matterId}>Upload First Doc</Button>
            </div>
          ) : (
            myDocs.map((doc) => {
              const IconComponent = getFileIcon(doc.name);
              return (
                <Card
                  key={doc.id}
                  className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setPreviewDoc(doc)}
                  data-testid={`doc-card-${doc.id}`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${doc.locked ? 'bg-amber-50 text-amber-600' : 'bg-[#e7f6f3] text-primary'}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm truncate text-foreground">{doc.name}</h4>
                        {doc.locked && <Lock className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="bg-secondary px-2 py-0.5 rounded text-primary font-medium">{doc.size}</span>
                        <span>·</span>
                        <span>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                        data-testid={`button-preview-${doc.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary" onClick={(e) => e.stopPropagation()}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {!doc.locked && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </Layout>
  );
}
