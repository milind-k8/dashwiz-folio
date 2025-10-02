import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

interface CategoryManagementDialogProps {
  userId: string;
}

export const CategoryManagementDialog = ({ userId }: CategoryManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, userId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setIsAdding(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: newCategory.trim(),
        is_default: false,
      })
      .select()
      .single();

    setIsAdding(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "Category already exists" 
          : "Failed to add category",
        variant: "destructive",
      });
      return;
    }

    setCategories([...categories, data]);
    setNewCategory('');
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  const handleDeleteCategory = async (categoryId: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Error",
        description: "Cannot delete default categories",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
      return;
    }

    setCategories(categories.filter(c => c.id !== categoryId));
    toast({
      title: "Success",
      description: "Category deleted successfully",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add custom categories or delete existing ones. Default categories cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
            />
            <Button
              onClick={handleAddCategory}
              disabled={isAdding || !newCategory.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {category.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {!category.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id, category.is_default)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
