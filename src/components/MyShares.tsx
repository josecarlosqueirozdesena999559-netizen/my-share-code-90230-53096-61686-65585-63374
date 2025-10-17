import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileIcon, Clock, Trash2, Copy, Check } from "lucide-react";

interface MySharesProps {
  userId: string;
}

const MyShares = ({ userId }: MySharesProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shared_files")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const validFiles = (data || []).filter((file) => new Date(file.expire_at) > now);
      setFiles(validFiles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar arquivos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      const { error: dbError } = await supabase
        .from("shared_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from("shared-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      toast({
        title: "Arquivo deletado",
        description: "O arquivo foi removido com sucesso.",
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar arquivo",
        description: error.message,
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Código copiado!",
      description: code,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatTimeLeft = (expireAt: string) => {
    const now = new Date();
    const expire = new Date(expireAt);
    const diff = expire.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="border-border/50 shadow-medium">
        <CardContent className="py-12 text-center">
          <FileIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Você ainda não compartilhou nenhum arquivo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Meus Compartilhamentos</h2>
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="border-border/50 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <FileIcon className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.file_name}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeLeft(file.expire_at)}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{file.visibility}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-mono font-semibold text-accent">
                      {file.code}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(file.code)}
                      className="h-6 px-2"
                    >
                      {copiedCode === file.code ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(file.id, file.file_path)}
                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyShares;