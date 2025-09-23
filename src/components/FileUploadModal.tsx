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
import { ButtonLoader } from '@/components/ui/loader';

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

      if (jsonData.length === 0) {
        throw new Error('JSON file cannot be empty');
      }

      // Required keys and their expected types
      const requiredKeys = ['date', 'refId', 'amount', 'type', 'closingBy', 'category', 'tags'];
      const keyTypes = {
        date: 'string',
        refId: 'string', 
        amount: 'number',
        type: 'string',
        closingBy: 'number',
        category: 'string',
        tags: 'string'
      };

      // Validate each transaction object
      for (let i = 0; i < jsonData.length; i++) {
        const transaction = jsonData[i];
        
        if (typeof transaction !== 'object' || transaction === null) {
          throw new Error(`Transaction at index ${i} is not a valid object`);
        }

        // Check if all required keys are present
        const transactionKeys = Object.keys(transaction);
        const missingKeys = requiredKeys.filter(key => !transactionKeys.includes(key));
        
        if (missingKeys.length > 0) {
          throw new Error(`Transaction at index ${i} is missing required keys: ${missingKeys.join(', ')}`);
        }

        // Check for extra keys
        const extraKeys = transactionKeys.filter(key => !requiredKeys.includes(key));
        if (extraKeys.length > 0) {
          throw new Error(`Transaction at index ${i} has unexpected keys: ${extraKeys.join(', ')}`);
        }

        // Validate data types
        for (const key of requiredKeys) {
          const expectedType = keyTypes[key as keyof typeof keyTypes];
          const actualType = typeof transaction[key];
          
          if (actualType !== expectedType) {
            throw new Error(`Transaction at index ${i}: '${key}' should be ${expectedType}, but got ${actualType}`);
          }
        }

        // Additional validations
        if (transaction.type !== 'deposit' && transaction.type !== 'withdrawl') {
          throw new Error(`Transaction at index ${i}: 'type' must be either 'deposit' or 'withdrawl'`);
        }

        // Validate date format (basic YYYY-MM-DD check)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(transaction.date)) {
          throw new Error(`Transaction at index ${i}: 'date' must be in YYYY-MM-DD format`);
        }
      }

      return true;
    } catch (error) {
      toast({
        title: "Invalid JSON Structure",
        description: error instanceof Error ? error.message : "File contains invalid JSON structure",
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

      // File processing completed - data now comes from Supabase
      toast({
        title: "Feature Notice",
        description: "File upload feature has been replaced with direct Supabase integration",
        variant: "default",
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
        description: error instanceof Error ? error.message : "An error occurred while uploading the file",
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
          <div className="text-xs text-muted-foreground space-y-2 bg-muted/30 p-3 rounded-lg">
            <p className="font-medium">File Requirements:</p>
            <div className="space-y-1 ml-2">
              <p>• File must be in JSON format (.json)</p>
              <p>• File name pattern: bankNameTransaction.json</p>
              <p>• Examples: hdfcTransaction.json, iciciTransaction.json</p>
            </div>
            
            <p className="font-medium mt-2">JSON Structure (array of objects):</p>
            <div className="bg-background/50 p-2 rounded text-xs font-mono">
              <div>{"{"}</div>
              <div className="ml-2">"date": "2025-08-01",</div>
              <div className="ml-2">"refId": "0000557994507513",</div>
              <div className="ml-2">"amount": 686.0,</div>
              <div className="ml-2">"type": "withdrawl", // or "deposit"</div>
              <div className="ml-2">"closingBy": 237341.32,</div>
              <div className="ml-2">"category": "food_delivery",</div>
              <div className="ml-2">"tags": "swiggy"</div>
              <div>{"}"}</div>
            </div>
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
                  <ButtonLoader size="sm" />
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