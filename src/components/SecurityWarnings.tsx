import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Trash2, AlertTriangle } from "lucide-react";

const SecurityWarnings = () => {
  return (
    <div className="space-y-3">
      <Alert className="border-primary/30 bg-primary/5">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Senha Criptografada:</strong> Suas senhas são protegidas com criptografia de ponta a ponta.
        </AlertDescription>
      </Alert>

      <Alert className="border-accent/30 bg-accent/5">
        <Shield className="h-4 w-4 text-accent" />
        <AlertDescription className="text-sm">
          <strong>Privacidade Garantida:</strong> Seus dados são mantidos seguros e respeitamos sua privacidade.
        </AlertDescription>
      </Alert>

      <Alert className="border-blue-500/30 bg-blue-500/5">
        <Trash2 className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-sm">
          <strong>Auto-Exclusão:</strong> Arquivos são automaticamente deletados após 24 horas.
        </AlertDescription>
      </Alert>

      <Alert className="border-destructive/30 bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-sm">
          <strong>Não Compartilhe o Código:</strong> Mantenha seu código de compartilhamento seguro e privado.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SecurityWarnings;
