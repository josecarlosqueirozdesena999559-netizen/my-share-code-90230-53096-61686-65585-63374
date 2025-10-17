import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Share2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const generateUsernameSuggestions = (baseUsername: string) => {
    const suggestions = [
      `${baseUsername}${Math.floor(Math.random() * 99) + 1}`,
      `${baseUsername}${Math.floor(Math.random() * 999) + 100}`,
      `${baseUsername}_${Math.floor(Math.random() * 99) + 1}`,
      `${baseUsername}.${Math.floor(Math.random() * 99) + 1}`,
      `${baseUsername}${new Date().getFullYear().toString().slice(-2)}`,
    ];
    return suggestions;
  };

  useEffect(() => {
    if (!isLogin && username.length >= 3) {
      const timer = setTimeout(async () => {
        setCheckingUsername(true);
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .maybeSingle();
        
        const isAvailable = !data;
        setUsernameAvailable(isAvailable);
        
        if (!isAvailable) {
          setUsernameSuggestions(generateUsernameSuggestions(username));
        } else {
          setUsernameSuggestions([]);
        }
        
        setCheckingUsername(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    }
  }, [username, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta.",
        });
      } else {
        if (!usernameAvailable) {
          toast({
            variant: "destructive",
            title: "Username indisponível",
            description: "Escolha outro username.",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Você já pode fazer login.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-primary rounded-2xl">
              <Share2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ShareBox
          </h1>
          <p className="text-muted-foreground">
            Compartilhe arquivos de forma segura
          </p>
        </div>

        <Card className="border-border/50 shadow-large">
          <CardHeader>
            <CardTitle>{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Entre com suas credenciais"
                : "Preencha os dados para criar sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                      className="pr-10"
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <span className="absolute right-3 top-3 text-green-600">✓</span>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <span className="absolute right-3 top-3 text-destructive">✗</span>
                    )}
                  </div>
                  {usernameAvailable === false && (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive font-medium">Username já existe</p>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sugestões disponíveis:</p>
                        <div className="flex flex-wrap gap-2">
                          {usernameSuggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setUsername(suggestion)}
                              className="h-7 text-xs bg-accent/10 hover:bg-accent/20 border-accent/30"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || (!isLogin && !usernameAvailable)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Entrar" : "Criar conta"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-accent hover:underline"
                >
                  {isLogin
                    ? "Não tem conta? Cadastre-se"
                    : "Já tem conta? Entre"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;