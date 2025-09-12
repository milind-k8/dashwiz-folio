import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFileName = (fileName: string): { isValid: boolean; bankName?: string; error?: string } => {
    // Check if file ends with .json
    if (!fileName.toLowerCase().endsWith('.json')) {
      return { isValid: false, error: 'File must be a JSON file (.json)' };
    }

    // Check if file follows pattern: xyzTransaction.json
    const pattern = /^([a-zA-Z]+)Transaction\.json$/i;
    const match = fileName.match(pattern);
    
    if (!match) {
      return { 
        isValid: false, 
        error: 'File name must follow pattern: bankNameTransaction.json (e.g., hdfcTransaction.json)' 
      };
    }

    const bankName = match[1].toLowerCase();
    return { isValid: true, bankName };
  };

  const validateFileContent = (content: string): boolean => {
    try {
      const jsonData = JSON.parse(content);
      // Basic validation - should be an array of objects
      if (!Array.isArray(jsonData)) {
        throw new Error('JSON file should contain an array of transactions');
      }
      return true;
    } catch (error) {
      toast({
        title: "Invalid JSON File",
        description: error instanceof Error ? error.message : "File contains invalid JSON format",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFileName(file.name);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid File Name",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    if (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JSON file only",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} is ready to upload`,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const content = await selectedFile.text();
      
      if (!validateFileContent(content)) {
        setIsUploading(false);
        return;
      }

      const validation = validateFileName(selectedFile.name);
      
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would typically save the data to your store or send to API
      console.log('Uploading bank data:', {
        bankName: validation.bankName,
        fileName: selectedFile.name,
        data: JSON.parse(content)
      });

      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });

      // Reset and close
      setSelectedFile(null);
      setIsUploading(false);
      onClose();
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    clearFile();
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Upload Bank Transaction Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <Card 
            className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : selectedFile 
                  ? 'border-success bg-success/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex flex-col items-center text-center space-y-2">
              {selectedFile ? (
                <>
                  <Check className="w-8 h-8 text-success" />
                  <div>
                    <p className="font-medium text-success">File Selected</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your JSON file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* File Requirements */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
            <p className="font-medium">File Requirements:</p>
            <ul className="space-y-1 ml-2">
              <li>• File must be in JSON format (.json)</li>
              <li>• File name pattern: bankNameTransaction.json</li>
              <li>• Examples: hdfcTransaction.json, iciciTransaction.json</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="min-w-[100px]"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}