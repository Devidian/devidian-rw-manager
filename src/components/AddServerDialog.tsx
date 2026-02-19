import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ServerConfig } from '@/types/server';
import { Server, Globe, HardDrive } from 'lucide-react';

const formSchema = z.object({
  label: z.string().trim().min(1, 'Name ist erforderlich').max(50, 'Max. 50 Zeichen'),
  queryUrl: z
    .string()
    .trim()
    .url('Bitte gültige URL eingeben (z.B. http://gs1.example.de:4254/)')
    .max(500, 'URL zu lang'),
  backendUrl: z
    .string()
    .trim()
    .max(500, 'URL zu lang')
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<ServerConfig, 'id' | 'createdAt'>) => void;
}

export function AddServerDialog({ open, onOpenChange, onAdd }: AddServerDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { label: '', queryUrl: '', backendUrl: '' },
  });

  function onSubmit(values: FormValues) {
    onAdd({
      label: values.label,
      queryUrl: values.queryUrl.endsWith('/') ? values.queryUrl : values.queryUrl + '/',
      backendUrl: values.backendUrl || undefined,
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
            <DialogTitle className="text-lg">Server hinzufügen</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Trage die Query-URL deines RisingWorld-Servers ein.
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
                    Server-Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Mein RisingWorld Server" {...field} />
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
                    Query-URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="http://gs1.example.de:4254/" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Die öffentliche JSON-Status-URL des Servers.
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
                    Backend-URL{' '}
                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:3001" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Nur nötig wenn der Server auf derselben Maschine läuft (für Player.db-Zugriff).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { form.reset(); onOpenChange(false); }}
              >
                Abbrechen
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Hinzufügen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
