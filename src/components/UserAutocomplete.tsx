import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface UserAutocompleteProps {
  selectedUsers: User[];
  onUserAdd: (user: User) => void;
  onUserRemove: (userId: string) => void;
  currentUserId?: string;
}

const UserAutocomplete = ({ selectedUsers, onUserAdd, onUserRemove, currentUserId }: UserAutocompleteProps) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `${search}%`)
        .limit(5);

      if (data) {
        const filtered = data.filter(
          (user) => user.id !== currentUserId && !selectedUsers.find((u) => u.id === user.id)
        );
        setSuggestions(filtered);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedUsers]);

  const handleUserSelect = (user: User) => {
    onUserAdd(user);
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                  <AvatarFallback>
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">@{user.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-accent/20 rounded-full px-3 py-1.5 border border-accent/30"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                <AvatarFallback className="text-xs">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{user.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUserRemove(user.id)}
                className="h-5 w-5 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAutocomplete;
