import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ServerConfig } from '@/types/server';
import { Server, Globe, HardDrive } from 'lucide-react';

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => Promise<ServerConfig>;
  isFixedMode?: boolean;
}

export function AddServerDialog({ open, onOpenChange, onAdd, isFixedMode }: AddServerDialogProps) {
  const { t } = useTranslation();

  const formSchema = z.object({
    label: z.string().trim().min(1, t('validationNameRequired')).max(50, t('validationNameMax')),
    queryUrl: z.string().trim().url(t('validationUrlInvalid')).max(500, t('validationUrlMax')),
    backendUrl: z.string().trim().max(500, t('validationUrlMax')).optional().or(z.literal('')),
    public: z.boolean().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { label: '', queryUrl: '', backendUrl: '', public: false },
  });

  async function onSubmit(values: FormValues) {
    await onAdd({
      label: values.label,
      queryUrl: values.queryUrl.endsWith('/') ? values.queryUrl : values.queryUrl + '/',
      backendUrl: values.backendUrl || undefined,
      ...(isFixedMode ? { public: values.public ?? false } : {}),
    });
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary/20 border border-primary/30">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">{t('addServerTitle')}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {t('addServerDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-primary" />
                    {t('serverNameLabel')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('serverNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="queryUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    {t('queryUrlLabel')}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('queryUrlPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {t('queryUrlDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backendUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('backendUrlLabel')}{' '}
                    <span className="text-muted-foreground font-normal text-xs">{t('backendUrlOptional')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('backendUrlPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {t('backendUrlDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFixedMode && (
              <FormField
                control={form.control}
                name="public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('serverPublic')}</FormLabel>
                      <FormDescription className="text-xs">{t('serverPublicDesc')}</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => { form.reset(); onOpenChange(false); }}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t('add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
