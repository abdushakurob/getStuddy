'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadProgressProps {
  files: File[];
  onComplete?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  fileName: string;
  resourceId: string;
  status: 'success' | 'error';
  error?: string;
}

interface FileProgress {
  name: string;
  status: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export function UploadProgress({ files, onComplete, onError }: UploadProgressProps) {
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    // Initialize progress for all files
    const initialProgress = files.map(file => ({
      name: file.name,
      status: 'uploading' as const,
      progress: 0,
      message: 'Uploading...'
    }));
    setFileProgress(initialProgress);

    // Start upload process
    uploadFiles();
  }, [files]);

  const uploadFiles = async () => {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update: Uploading
        updateFileProgress(i, 'uploading', 20, 'Uploading to server...');
        
        // TODO: Replace with actual UploadThing upload
        await simulateDelay(1000);
        
        // Update: Processing
        updateFileProgress(i, 'processing', 50, 'Processing document...');
        await simulateDelay(1500);
        
        // Update: Analyzing with CiteKit
        updateFileProgress(i, 'analyzing', 80, 'Analyzing content structure...');
        await simulateDelay(2000);
        
        // Update: Complete
        updateFileProgress(i, 'complete', 100, 'Ready to study!');
        
        results.push({
          fileName: file.name,
          resourceId: 'temp_id', // TODO: Get from actual upload
          status: 'success'
        });
        
      } catch (error) {
        updateFileProgress(i, 'error', 0, 'Upload failed');
        results.push({
          fileName: file.name,
          resourceId: '',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Update overall progress
      setOverallProgress(((i + 1) / files.length) * 100);
    }
    
    // Notify completion
    if (onComplete) {
      onComplete(results);
    }
  };

  const updateFileProgress = (
    index: number, 
    status: FileProgress['status'], 
    progress: number, 
    message: string
  ) => {
    setFileProgress(prev => {
      const newProgress = [...prev];
      newProgress[index] = { ...newProgress[index], status, progress, message };
      return newProgress;
    });
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStatusIcon = (status: FileProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'analyzing':
        return <Sparkles className="h-4 w-4 animate-pulse text-purple-500" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <span className="h-4 w-4 text-red-500">✕</span>;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const allComplete = fileProgress.every(fp => fp.status === 'complete' || fp.status === 'error');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {allComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Upload Complete
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Materials
            </>
          )}
        </CardTitle>
        <CardDescription>
          {allComplete 
            ? `${files.length} file(s) ready to study` 
            : `Uploading and analyzing ${files.length} file(s)...`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Individual File Progress */}
        <div className="space-y-3">
          <AnimatePresence>
            {fileProgress.map((file, index) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2 p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    <span className="text-sm font-medium truncate">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {file.progress}%
                  </span>
                </div>
                
                <Progress value={file.progress} className="h-1" />
                
                <p className="text-xs text-muted-foreground">
                  {file.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Success Message */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900"
          >
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              ✨ All materials are ready! You can now start studying.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
