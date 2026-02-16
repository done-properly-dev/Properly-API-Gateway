import React from 'react';
import { ShieldCheck, Server, MapPin, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SovereigntyWidget() {
  const isSydney = true; // Hardcoded logic for MVP evidence

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <CardTitle className="text-base font-bold text-foreground">Data Sovereignty Guaranteed</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white/50 text-accent-foreground border-accent/20">
            ap-southeast-2
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Your data never leaves Australian shores. Strictly hosted in AWS Sydney.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
           {/* Abstract Map Visualization */}
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 80%, #10b981 0%, transparent 40%)' }}></div>
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/20 rounded-full animate-pulse"></div>
                <Server className="h-8 w-8 text-accent relative z-10" />
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-700">
                <MapPin className="h-3 w-3" /> Sydney, NSW
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-white rounded border flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Database</span>
            <span className="ml-auto font-mono">aws:syd</span>
          </div>
          <div className="p-2 bg-white rounded border flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Storage</span>
            <span className="ml-auto font-mono">aws:syd</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
