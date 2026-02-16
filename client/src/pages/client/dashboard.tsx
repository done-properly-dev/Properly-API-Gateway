import React from 'react';
import { useStore } from '@/lib/store';
import { Layout } from '@/components/layout';
import { ProgressCircle } from '@/components/progress-circle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, Upload, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
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
           <div className="bg-secondary p-6 rounded-full">
             <FileText className="h-10 w-10 text-primary" />
           </div>
           <h2 className="text-2xl font-bold font-heading">Welcome to Properly</h2>
           <p className="text-muted-foreground max-w-xs mx-auto">Your journey to settlement starts here. Upload your contract to get moving.</p>
           <Button className="bg-primary hover:bg-primary/90 text-white">Upload Contract</Button>
         </div>
       </Layout>
    );
  }

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
                 <Calendar className="h-4 w-4" /> Settlement: {new Date(matter.settlementDate).toLocaleDateString()}
               </span>
            </div>
          </div>

          {/* Progress Card - "Buying tasks desktop" style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-white border shadow-sm overflow-hidden relative">
               <CardHeader>
                 <CardTitle>Milestone Progress</CardTitle>
               </CardHeader>
               <CardContent>
                  <ProgressCircle percent={matter.milestonePercent} />
               </CardContent>
             </Card>

             <Card className="bg-[#e7f6f3] border-none shadow-sm flex flex-col justify-center items-center text-center p-6">
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">On Track</h3>
                <p className="text-sm text-muted-foreground">Everything is looking good for your settlement date. No blockers detected.</p>
             </Card>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="font-heading font-bold text-xl">Your Tasks</h3>
               <Button variant="outline" size="sm">View All</Button>
            </div>
            
            <div className="grid gap-3">
              {myTasks.map(task => (
                <div key={task.id} className="group bg-white border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${task.status === 'COMPLETE' ? 'bg-green-100 text-green-600' : 'bg-[#fac515]/20 text-yellow-700'}`}>
                     {task.status === 'COMPLETE' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-base ${task.status === 'COMPLETE' && 'text-muted-foreground line-through'}`}>{task.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {task.status === 'COMPLETE' ? 'Completed' : `Due by ${new Date(task.dueDate).toLocaleDateString()}`}
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
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Check our playbook for guides on what to expect during settlement.
              </p>
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90 border-none">
                Read Guides
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
