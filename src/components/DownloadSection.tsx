import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileIcon, Clock } from "lucide-react";

interface DownloadSectionProps {
  username: string;
}

const DownloadSection = ({ username }: DownloadSectionProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!code.trim() || code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "Digite um código de 6 caracteres.",
      });
      return;
    }

    setLoading(true);
    setFiles([]);

    try {
      const { data, error } = await supabase
        .from("shared_files")
        .select("*")
        .eq("code", code.toUpperCase());

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Código não encontrado",
          description: "Verifique o código e tente novamente.",
        });
        return;
      }

      const now = new Date();
      const validFiles = data.filter((file) => new Date(file.expire_at) > now);

      if (validFiles.length === 0) {
        toast({
          variant: "destructive",
          title: "Código expirado",
          description: "Este código já não é mais válido.",
        });
        return;
      }

      setFiles(validFiles);
      toast({
        title: "Arquivos encontrados!",
        description: `${validFiles.length} arquivo(s) disponível(is)`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar arquivos",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("shared-files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado!",
        description: file.file_name,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao baixar arquivo",
        description: error.message || "Erro ao baixar o arquivo",
      });
    }
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

  return (
    <Card className="border-border/50 shadow-medium">
      <CardHeader>
        <CardTitle>Baixar Arquivos</CardTitle>
        <CardDescription>
          Digite o código de compartilhamento para acessar os arquivos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="code" className="sr-only">Código</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="uppercase text-lg tracking-wider font-semibold"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buscar"
            )}
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Arquivos disponíveis:</h3>
            {files.map((file) => (
              <Card key={file.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileIcon className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeLeft(file.expire_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(file)}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadSection;