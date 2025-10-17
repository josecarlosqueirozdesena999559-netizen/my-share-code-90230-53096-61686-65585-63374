import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, LogOut, Share2, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UploadSection from "@/components/UploadSection";
import DownloadSection from "@/components/DownloadSection";
import MyShares from "@/components/MyShares";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "download" | "myshares">("upload");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(avatarPath);
    return data.publicUrl;
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Share2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold">ShareBox</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/settings")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20 bg-black">
                <AvatarImage src={getAvatarUrl(profile.avatar_url) || undefined} />
                <AvatarFallback className="text-white text-xs bg-black">
                  {profile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Configurações</span>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "upload" ? "default" : "outline"}
            onClick={() => setActiveTab("upload")}
            className="flex-shrink-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            Enviar Arquivos
          </Button>
          <Button
            variant={activeTab === "download" ? "default" : "outline"}
            onClick={() => setActiveTab("download")}
            className="flex-shrink-0"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Baixar com Código
          </Button>
          <Button
            variant={activeTab === "myshares" ? "default" : "outline"}
            onClick={() => setActiveTab("myshares")}
            className="flex-shrink-0"
          >
            Meus Compartilhamentos
          </Button>
        </div>

        <div className="animate-fade-in">
          {activeTab === "upload" && <UploadSection userId={user.id} />}
          {activeTab === "download" && <DownloadSection username={profile.username} />}
          {activeTab === "myshares" && <MyShares userId={user.id} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;