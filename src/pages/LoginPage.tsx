import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Server, Loader2, AlertCircle } from 'lucide-react';

const steamApiKey = import.meta.env.VITE_STEAM_API_KEY as string | undefined;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register: registerUser, loginWithSteam, hasAuthService } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form
  const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  });
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Register form
  const registerSchema = z.object({
    username: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(6),
    steamId: z.string().optional(),
  });
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', steamId: '' },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setError('');
    setLoading(true);
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (e: unknown) {
      setError((e as Error).message || t('errLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setError('');
    setLoading(true);
    try {
      await registerUser({
        username: values.username || undefined,
        email: values.email,
        password: values.password,
        steamId: values.steamId || undefined,
      });
      navigate('/');
    } catch (e: unknown) {
      setError((e as Error).message || t('errRegisterFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Server className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground font-display">{t('loginTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('loginDesc')}</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Steam Login */}
        {steamApiKey && hasAuthService && (
          <Button
            onClick={loginWithSteam}
            className="w-full gap-2 bg-[hsl(215_60%_35%)] hover:bg-[hsl(215_60%_40%)] text-white"
            size="lg"
          >
            🎮 {t('loginWithSteam')}
          </Button>
        )}

        {/* Divider */}
        {steamApiKey && hasAuthService && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('or')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Local Login / Register */}
        {hasAuthService && !showRegister && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('loginSubmit')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
                  <FormField control={loginForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginEmail')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginPassword')}</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t('loginSubmit')}
                  </Button>
                </form>
              </Form>
              <Button variant="link" className="mt-2 text-xs p-0 h-auto" onClick={() => setShowRegister(true)}>
                {t('loginRegisterLink')}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasAuthService && showRegister && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('registerTitle')}</CardTitle>
              <CardDescription>{t('registerDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
                  <FormField control={registerForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerUsername')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerEmail')}</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerPassword')}</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="steamId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registerSteamId')}</FormLabel>
                      <FormControl><Input {...field} placeholder="76561198..." /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t('registerSubmit')}
                  </Button>
                </form>
              </Form>
              <Button variant="link" className="mt-2 text-xs p-0 h-auto" onClick={() => setShowRegister(false)}>
                {t('loginSubmit')}
              </Button>
            </CardContent>
          </Card>
        )}

        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/setup')}>
          {t('back')}
        </Button>
      </div>
    </div>
  );
}
