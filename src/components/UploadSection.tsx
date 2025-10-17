import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Copy, Check, Sparkles } from "lucide-react";
import UserAutocomplete from "@/components/UserAutocomplete";
import SecurityWarnings from "@/components/SecurityWarnings";

interface UploadSectionProps {
  userId: string;
}

const UploadSection = ({ userId }: UploadSectionProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo não permitido",
          description: "Por favor, envie PDF, DOC, TXT, XLS ou imagens.",
        });
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "Máximo de 50MB permitido.",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Selecione um arquivo",
      });
      return;
    }

    if (visibility === "private" && selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Adicione usuários permitidos",
        description: "Para arquivos privados, selecione ao menos um usuário.",
      });
      return;
    }

    setLoading(true);

    try {
      const code = generateCode();
      const fileName = `${userId}/${code}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("shared-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const expireAt = new Date();
      expireAt.setHours(expireAt.getHours() + 24);

      const { data: fileData, error: dbError } = await supabase
        .from("shared_files")
        .insert({
          code,
          user_id: userId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          visibility,
          expire_at: expireAt.toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (visibility === "private" && selectedUsers.length > 0) {
        const permissions = selectedUsers.map((user) => ({
          shared_file_id: fileData.id,
          username: user.username,
        }));

        const { error: permError } = await supabase
          .from("file_permissions")
          .insert(permissions);

        if (permError) throw permError;
      }

      setGeneratedCode(code);
      toast({
        title: "Arquivo enviado com sucesso!",
        description: `Código: ${code}`,
      });

      setFile(null);
      setSelectedUsers([]);
      setVisibility("public");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivo",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SecurityWarnings />
      
      <Card className="border-border/50 shadow-medium bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Enviar Arquivo</CardTitle>
          </div>
          <CardDescription>
            Escolha um arquivo e defina as permissões de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="file" className="text-base font-semibold">Arquivo</Label>
            <div className="relative border-2 border-dashed border-border rounded-lg p-6 transition-all hover:border-primary/50 hover:bg-accent/5">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {file ? file.name : "Clique ou arraste para escolher"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file 
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB` 
                      : "PDF, DOC, TXT, XLS ou Imagens (máx 50MB)"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className="space-y-3">
          <Label>Visibilidade</Label>
          <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="cursor-pointer">
                Público (qualquer um com o código pode baixar)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="cursor-pointer">
                Privado (apenas usuários específicos)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {visibility === "private" && (
          <div className="space-y-2">
            <Label htmlFor="users" className="text-base font-semibold">Usuários Permitidos</Label>
            <UserAutocomplete
              selectedUsers={selectedUsers}
              onUserAdd={(user) => setSelectedUsers([...selectedUsers, user])}
              onUserRemove={(userId) =>
                setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
              }
              currentUserId={userId}
            />
            <p className="text-xs text-muted-foreground">
              Digite o nome do usuário para buscar e adicionar múltiplos usuários
            </p>
          </div>
        )}

        <Button onClick={handleUpload} disabled={loading} className="w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Arquivo
            </>
          )}
        </Button>

        {generatedCode && (
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Código gerado:
                  </p>
                  <p className="text-3xl font-bold tracking-wider text-primary">
                    {generatedCode}
                  </p>
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    ⏰ Válido por 24 horas
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyCode}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default UploadSection;