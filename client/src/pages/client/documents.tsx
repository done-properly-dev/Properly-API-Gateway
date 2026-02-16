import React, { useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Lock, UploadCloud, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Matter, Document } from '@shared/schema';

export default function ClientDocuments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
            myDocs.map((doc) => (
              <Card key={doc.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${doc.locked ? 'bg-amber-50 text-amber-600' : 'bg-[#e7f6f3] text-primary'}`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm truncate text-foreground">{doc.name}</h4>
                      {doc.locked && <Lock className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-0.5 rounded text-primary font-medium">{doc.size}</span>
                      <span>•</span>
                      <span>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary">
                      <Download className="h-4 w-4" />
                    </Button>
                    {!doc.locked && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
