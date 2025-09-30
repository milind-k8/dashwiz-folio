import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';

export function UserGreeting() {
  const { user } = useAuth();

  const getUserInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getUserName = (email: string) => {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground font-roboto">
        Hi! {getUserName(user.email || '')}
      </span>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ''} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium font-google">
          {user.email ? getUserInitials(user.email) : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
