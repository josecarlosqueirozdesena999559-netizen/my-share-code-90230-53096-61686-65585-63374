import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);

  useEffect(() => {
    // Verificar se já foi instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    
    if (isInstalled || hasSeenPrompt) {
      return;
    }

    // Detectar plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) {
      setPlatform('ios');
      setShowInstallPrompt(true);
    } else if (isAndroid) {
      setPlatform('android');
    } else if (isDesktop) {
      setPlatform('desktop');
    }

    // Listener para Android e Desktop (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const renderContent = () => {
    if (platform === 'ios') {
      return (
        <>
          <AlertDialogTitle>Instalar ShareBox no iPhone</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>Para instalar este app no seu iPhone:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Toque no botão <Share className="inline w-4 h-4 mx-1" /> (Compartilhar) no Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Role para baixo e toque em "Adicionar à Tela Início" <Plus className="inline w-4 h-4 mx-1" /></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">3.</span>
                <span>Toque em "Adicionar" no canto superior direito</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-4">
              O app ficará disponível na sua tela inicial como um aplicativo nativo!
            </p>
          </AlertDialogDescription>
        </>
      );
    }

    if (platform === 'android' || platform === 'desktop') {
      return (
        <>
          <AlertDialogTitle>Instalar ShareBox</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>Instale o ShareBox na sua {platform === 'android' ? 'tela inicial' : 'área de trabalho'} para acesso rápido e experiência completa de aplicativo!</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={handleClose}>
                Usar no navegador
              </Button>
              <Button onClick={handleInstall}>
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
            </div>
          </AlertDialogDescription>
        </>
      );
    }

    return null;
  };

  return (
    <AlertDialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
      <AlertDialogContent className="max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>
        <AlertDialogHeader>
          {renderContent()}
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
