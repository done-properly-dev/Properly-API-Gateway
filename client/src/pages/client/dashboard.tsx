import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { ProgressCircle } from '@/components/progress-circle';
import { FivePillars } from '@/components/five-pillars';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, Upload, ChevronRight, AlertCircle, Calendar, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import type { Matter, Task } from '@shared/schema';

export default function ClientDashboard() {
  const { user } = useAuth();
  
  const { data: matters, isLoading: mattersLoading } = useQuery<Matter[]>({
    queryKey: ["/api/matters"],
  });

  const matter = matters?.find(m => m.clientUserId === user?.id) || matters?.[0];

  const { data: myTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/matters", matter?.id, "tasks"],
    enabled: !!matter?.id,
  });

  if (mattersLoading) {
    return (
      <Layout role="CLIENT">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!matter) {
    return (
       <Layout role="CLIENT">
         <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 px-4">
           <div className="bg-[#e7f6f3] p-8 rounded-full">
             <FileText className="h-12 w-12 text-primary" />
           </div>
           <div className="space-y-2">
             <h2 className="text-3xl font-bold font-heading" data-testid="empty-state-heading">G'day, {user?.name?.split(' ')[0]}!</h2>
             <p className="text-muted-foreground max-w-md mx-auto text-lg">
               Your settlement journey starts here. Once your conveyancer sets things up, 
               you'll see your progress, tasks, and key dates right on this dashboard.
             </p>
           </div>
           <div className="flex flex-col sm:flex-row gap-3">
             <Button className="bg-primary hover:bg-primary/90 text-white px-6" data-testid="button-upload-contract">
               <Upload className="mr-2 h-4 w-4" /> Upload Contract
             </Button>
             <Link href="/client/playbook">
               <Button variant="outline" className="px-6" data-testid="button-browse-playbook">
                 <BookOpen className="mr-2 h-4 w-4" /> Browse The Playbook
               </Button>
             </Link>
           </div>
           <p className="text-sm text-muted-foreground">
             New to property settlement? Check out our guides — they're written in plain English, promise.
           </p>
         </div>
       </Layout>
    );
  }

  const tasks = myTasks || [];

  return (
    <Layout role="CLIENT">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Progress & Header */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {matter.address}
            </h1>
            <div className="flex items-center gap-3">
               <Badge variant="outline" className="bg-secondary border-secondary-foreground/10 text-primary font-medium px-3 py-1">
                 {matter.transactionType}
               </Badge>
               <span className="text-sm text-muted-foreground flex items-center gap-1">
                 <Calendar className="h-4 w-4" /> Settlement: {matter.settlementDate ? new Date(matter.settlementDate).toLocaleDateString() : 'TBD'}
               </span>
            </div>
          </div>

          {/* 5-Pillar Progress Bar */}
          <Card className="bg-white border shadow-sm p-6">
            <FivePillars matter={matter} variant="full" />
          </Card>

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="font-heading font-bold text-xl">Your Tasks</h3>
               <Button variant="outline" size="sm">View All</Button>
            </div>
            
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tasks.map(task => (
                  <div key={task.id} className="group bg-white border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${task.status === 'COMPLETE' ? 'bg-green-100 text-green-600' : 'bg-[#fac515]/20 text-yellow-700'}`}>
                       {task.status === 'COMPLETE' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-base ${task.status === 'COMPLETE' && 'text-muted-foreground line-through'}`}>{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.status === 'COMPLETE' ? 'Completed' : task.dueDate ? `Due by ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                    {task.status !== 'COMPLETE' && (
                      <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-lg">
                        {task.type === 'UPLOAD' ? 'Upload' : 'Start'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Contacts & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white shadow-sm border">
            <CardHeader>
              <CardTitle className="text-base">Your Conveyancer</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center gap-4 mb-6">
                 <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary text-lg">
                   LE
                 </div>
                 <div>
                   <p className="font-bold">Legal Eagles</p>
                   <p className="text-sm text-muted-foreground">Properly Partner</p>
                 </div>
               </div>
               <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start h-10">
                   <span className="mr-2">📞</span> Call Team
                 </Button>
                 <Button variant="outline" className="w-full justify-start h-10">
                   <span className="mr-2">✉️</span> Email Support
                 </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-md">
            <CardContent className="p-6">
              <BookOpen className="h-8 w-8 mb-3 text-white/80" />
              <h3 className="font-bold text-lg mb-2">The Playbook</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Your go-to guide for understanding the settlement process. No jargon, just helpful info.
              </p>
              <Link href="/client/playbook">
                <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 border-none" data-testid="button-read-playbook">
                  Read Guides
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
