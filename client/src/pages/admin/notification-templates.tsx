import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import type { NotificationTemplate } from '@shared/schema';

const CHANNELS = ['EMAIL', 'SMS', 'PUSH'] as const;
const TRIGGERS = [
  'matter_created',
  'task_completed',
  'document_uploaded',
  'settlement_date_set',
  'milestone_reached',
  'referral_created',
] as const;

const channelBadgeClass: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700 border-blue-200',
  SMS: 'bg-green-100 text-green-700 border-green-200',
  PUSH: 'bg-purple-100 text-purple-700 border-purple-200',
};

interface TemplateForm {
  name: string;
  channel: string;
  trigger: string;
  subject: string;
  body: string;
  active: boolean;
}

const emptyForm: TemplateForm = {
  name: '',
  channel: 'EMAIL',
  trigger: 'matter_created',
  subject: '',
  body: '',
  active: true,
};

export default function NotificationTemplatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ['/api/notification-templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateForm) => {
      const res = await apiRequest('POST', '/api/notification-templates', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
      setEditorOpen(false);
      toast({ title: 'Template created' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateForm> }) => {
      const res = await apiRequest('PATCH', `/api/notification-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
      setEditorOpen(false);
      toast({ title: 'Template updated' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notification-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
      setDeleteId(null);
      toast({ title: 'Template deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const testMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest('POST', '/api/notifications/test', { templateId });
      return res.json();
    },
    onSuccess: () => toast({ title: 'Test notification sent' }),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await apiRequest('PATCH', `/api/notification-templates/${id}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-templates'] });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (t: NotificationTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      channel: t.channel,
      trigger: t.trigger,
      subject: t.subject || '',
      body: t.body,
      active: t.active,
    });
    setEditorOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout role="ADMIN">
      <div className="space-y-6" data-testid="notification-templates-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#181d27] font-['Inter',sans-serif]" data-testid="text-page-title">Notification Templates</h1>
            <p className="text-sm text-[#717680] font-['Inter',sans-serif]">Manage notification templates for automated delivery.</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-[#415b58] hover:bg-[#354a47] text-white font-['Inter',sans-serif]"
            data-testid="button-create-template"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Template
          </Button>
        </div>

        <Card className="bg-white border-[#d5d7da] rounded-[8px]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-[#717680] font-['Inter',sans-serif]" data-testid="text-loading">Loading...</div>
            ) : !templates?.length ? (
              <div className="p-8 text-center text-[#717680] font-['Inter',sans-serif]" data-testid="text-empty-state">No templates yet. Create your first one.</div>
            ) : (
              <div className="divide-y divide-[#e9eaeb]">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors cursor-pointer"
                    data-testid={`row-template-${t.id}`}
                    onClick={() => openEdit(t)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#181d27] font-['Inter',sans-serif] truncate" data-testid={`text-template-name-${t.id}`}>{t.name}</p>
                      <p className="text-xs text-[#717680] font-['Inter',sans-serif]">{t.trigger.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge className={`${channelBadgeClass[t.channel] || ''} text-xs font-medium border`} data-testid={`badge-channel-${t.id}`}>
                      {t.channel}
                    </Badge>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={t.active}
                        onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: t.id, active: checked })}
                        data-testid={`switch-active-${t.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => testMutation.mutate(t.id)}
                        disabled={testMutation.isPending}
                        data-testid={`button-test-${t.id}`}
                        title="Send Test"
                      >
                        <Send className="h-4 w-4 text-[#717680]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(t.id)}
                        data-testid={`button-delete-${t.id}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="sm:max-w-[540px] font-['Inter',sans-serif]" data-testid="dialog-template-editor">
            <DialogHeader>
              <DialogTitle data-testid="text-editor-title">{editingId ? 'Edit Template' : 'Create Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Welcome Email"
                  data-testid="input-template-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Channel</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                    <SelectTrigger data-testid="select-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trigger</Label>
                  <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                    <SelectTrigger data-testid="select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.channel === 'EMAIL' && (
                <div>
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Email subject line"
                    data-testid="input-template-subject"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="template-body">Body</Label>
                <Textarea
                  id="template-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Notification body text..."
                  rows={6}
                  data-testid="input-template-body"
                />
                <p className="text-xs text-[#717680] mt-1">
                  Available variables: <code className="bg-gray-100 px-1 rounded">{'{{clientName}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{matterAddress}}'}</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{taskTitle}}'}</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="template-active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                  data-testid="switch-template-active"
                />
                <Label htmlFor="template-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditorOpen(false)} data-testid="button-cancel">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.name || !form.body}
                className="bg-[#415b58] hover:bg-[#354a47] text-white"
                data-testid="button-save-template"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
