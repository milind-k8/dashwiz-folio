import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  userId: string;
}

export const CategorySelector = ({ value, onValueChange, userId }: CategorySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
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
    onValueChange(data.name);
    setNewCategory('');
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select category..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandEmpty>
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground">No category found.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={isAdding || !newCategory.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CommandEmpty>
          <CommandGroup>
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                value={category.name}
                onSelect={() => {
                  onValueChange(category.name);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === category.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {category.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
