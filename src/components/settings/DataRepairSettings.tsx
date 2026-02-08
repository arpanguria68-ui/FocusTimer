import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDataSync } from '@/components/DataSyncProvider';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';

export function DataRepairSettings() {
  const { validateDataIntegrity, forceRepair, isSyncing } = useDataSync();
  const { toast } = useToast();
  const [validationResult, setValidationResult] = useState<{ valid: boolean; issues: string[] } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleValidate = () => {
    const result = validateDataIntegrity();
    setValidationResult(result);
    
    if (result.valid) {
      toast({
        title: "Data Integrity Check",
        description: "All data is valid! No issues found.",
      });
    } else {
      toast({
        title: "Data Issues Found",
        description: `Found ${result.issues.length} issue(s). Click Repair to fix them.`,
        variant: "destructive",
      });
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      await forceRepair();
      toast({
        title: "Repair Complete",
        description: "Data has been repaired successfully. Please refresh if needed.",
      });
      // Re-validate after repair
      const result = validateDataIntegrity();
      setValidationResult(result);
    } catch (error) {
      toast({
        title: "Repair Failed",
        description: "An error occurred while repairing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('This will clear all cached data. Your data in the cloud is safe. Continue?')) {
      // Clear quotes-related localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quotes-state_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Cache Cleared",
        description: "Local cache has been cleared. Data will be re-synced from the cloud.",
      });
      
      // Reload to re-fetch from cloud
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5 text-blue-400" />
            Data Synchronization
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your playlist and quote data. Use these tools if you notice issues with quotes not appearing in the smile popup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleValidate}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
              disabled={isSyncing()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Check Data Integrity
            </Button>
            
            <Button
              onClick={handleRepair}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
              disabled={isRepairing || isSyncing()}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
              {isRepairing ? 'Repairing...' : 'Repair Data'}
            </Button>
            
            <Button
              onClick={handleClearCache}
              variant="outline"
              className="border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Clear Local Cache
            </Button>
          </div>

          {validationResult && !validationResult.valid && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Data Issues Detected</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationResult.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validationResult && validationResult.valid && (
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">All Good!</AlertTitle>
              <AlertDescription>
                Your data is healthy and properly synchronized.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">What This Does</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-400 space-y-2">
          <p><strong className="text-slate-300">Check Data Integrity:</strong> Scans your data for issues like playlists without quotes.</p>
          <p><strong className="text-slate-300">Repair Data:</strong> Automatically fixes issues by syncing data between your device and the cloud.</p>
          <p><strong className="text-slate-300">Clear Local Cache:</strong> Removes all cached data locally. Your cloud data remains safe and will be re-downloaded.</p>
        </CardContent>
      </Card>
    </div>
  );
}
