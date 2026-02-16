import React from 'react';
import { useStore } from '@/lib/store';
import { Layout } from '@/components/layout';
import { ProgressPillar } from '@/components/progress-pillar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, Upload, ChevronRight, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ClientDashboard() {
  const { currentUser, matters, tasks } = useStore();
  
  // For MVP, just grab the first matter for this user
  const matter = matters.find(m => m.clientUserId === currentUser?.id);
  const myTasks = tasks.filter(t => t.matterId === matter?.id);

  if (!matter) {
    return (
       <Layout role="CLIENT">
         <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
           <div className="bg-muted p-4 rounded-full">
             <FileText className="h-8 w-8 text-muted-foreground" />
           </div>
           <h2 className="text-xl font-bold">No active matters</h2>
           <p className="text-muted-foreground">Ready to start? Upload a contract to begin.</p>
           <Button>Upload Contract</Button>
         </div>
       </Layout>
    );
  }

  return (
    <Layout role="CLIENT">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold">G'day, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's where your property settlement is at.</p>
        </div>

        {/* Progress */}
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                 {matter.transactionType}
               </Badge>
               <span className="text-xs font-mono text-muted-foreground">
                 {matter.status}
               </span>
             </div>
             <CardTitle className="text-lg mt-2">{matter.address}</CardTitle>
           </CardHeader>
           <CardContent>
             <ProgressPillar percent={matter.milestonePercent} />
           </CardContent>
        </Card>

        {/* Action Items */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-lg flex items-center gap-2">
            Your Tasks <Badge className="rounded-full h-5 px-1.5 min-w-5">{myTasks.filter(t => t.status !== 'COMPLETE').length}</Badge>
          </h3>
          
          {myTasks.map(task => (
            <Card key={task.id} className={`overflow-hidden transition-all active:scale-[0.98] ${task.status === 'COMPLETE' ? 'opacity-60 bg-muted/30' : 'border-l-4 border-l-primary shadow-sm'}`}>
              <div className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1 ${task.status === 'COMPLETE' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                   {task.status === 'COMPLETE' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${task.status === 'COMPLETE' && 'line-through'}`}>{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.status === 'COMPLETE' ? 'Completed' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                {task.status !== 'COMPLETE' && (
                  <Button size="sm" variant={task.type === 'UPLOAD' ? 'default' : 'outline'} className="h-8 text-xs">
                    {task.type === 'UPLOAD' ? 'Upload' : 'View'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Conveyancer Contact */}
        <Card className="bg-slate-900 text-slate-50 border-none">
          <CardContent className="p-4 flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
               LE
             </div>
             <div>
               <p className="font-medium text-sm">Legal Eagles Conveyancing</p>
               <p className="text-xs text-slate-400">Your dedicated team</p>
             </div>
             <Button variant="ghost" size="icon" className="ml-auto text-slate-300 hover:text-white hover:bg-slate-800">
               <ChevronRight className="h-5 w-5" />
             </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
