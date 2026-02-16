import React, { useRef } from 'react';
import { useStore } from '@/lib/store';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Lock, UploadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ClientDocuments() {
  const { documents, uploadDocument, deleteDocument, currentUser } = useStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter docs for this user's matter (mock logic: all docs for matter m1 which belongs to u1)
  const myDocs = documents.filter(d => d.matterId === 'm1'); 

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Mock upload
      const newDoc = {
        id: `d${Date.now()}`,
        matterId: 'm1',
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(),
        locked: false,
      };
      
      uploadDocument(newDoc);
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been securely stored.`,
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    toast({
      title: "Document Deleted",
      description: "The file has been removed from your vault.",
      variant: "destructive"
    });
  };

  return (
    <Layout role="CLIENT">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Document Vault</h1>
            <p className="text-muted-foreground text-sm">Secure storage for your settlement.</p>
          </div>
          <Button size="sm" onClick={handleUploadClick}>
            <UploadCloud className="h-4 w-4 mr-2" /> Upload
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-3">
          {myDocs.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No documents yet.</p>
            </div>
          ) : (
            myDocs.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                      {doc.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Download className="h-4 w-4" />
                    </Button>
                    {!doc.locked && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 flex gap-3">
           <Lock className="h-4 w-4 shrink-0 mt-0.5" />
           <p>
             Some documents like the Contract of Sale are locked for your security. 
             Contact your conveyancer if you need to update them.
           </p>
        </div>
      </div>
    </Layout>
  );
}
