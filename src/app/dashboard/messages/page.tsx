'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCheck, ImagePlus, Loader2, MessageSquare, Search, Send } from 'lucide-react';
import { chatApi, mediaApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';
import { formatRelativeTime, getInitials } from '@/utils/format';
import type { Conversation } from '@/types';

const HEIGHT = 'h-[calc(100dvh-11.5rem)] lg:h-[calc(100dvh-9rem)]';

/** Réponses toutes faites : on écrit souvent les mêmes choses, surtout depuis un téléphone. */
const QUICK_REPLIES = {
  PROVIDER: ['Je suis disponible.', 'Je peux passer aujourd’hui.', 'Pouvez-vous m’envoyer une photo du problème ?', 'Je suis en route.'],
  CLIENT: ['Bonjour, êtes-vous disponible ?', 'Quel serait votre prix ?', 'Je vous envoie une photo.', 'Merci, à tout à l’heure.'],
} as const;

function Avatar({ name, url, size = 'md' }: { name: string; url: string | null; size?: 'md' | 'sm' }) {
  const dims = size === 'md' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-xs';
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-200', dims)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar servi par l'API
        <img loading="lazy" decoding="async" src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Aujourd’hui';
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ConversationList({ conversations, selectedId, onSelect }: { conversations: Conversation[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const filtered = conversations.filter((c) => !search || c.other.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h1 className="font-display text-xl font-bold">Messages</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une conversation"
            placeholder="Rechercher un nom"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-transparent bg-muted pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:bg-card focus:ring-[3px] focus:ring-brand-600/15"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-6 py-14 text-center text-sm text-muted-foreground">
            {conversations.length === 0 ? 'Vos échanges avec les prestataires et clients apparaîtront ici.' : 'Aucun nom ne correspond.'}
          </li>
        ) : (
          filtered.map((conv) => {
            const active = selectedId === conv.id;
            const unread = conv.unreadCount > 0;
            return (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn('relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper', active && 'bg-paper')}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sun-400" aria-hidden="true" />}
                  <Avatar name={conv.other.name} url={conv.other.avatarUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate', unread ? 'font-bold' : 'font-semibold')}>{conv.other.name}</span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">{conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt) : ''}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', unread ? 'font-medium text-foreground' : 'text-muted-foreground')}>{conv.lastMessage || 'Aucun message'}</span>
                      {unread && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sun-400 px-1.5 text-[11px] font-bold text-gray-950">
                          {conv.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function ChatArea({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const [text, setText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.messages(conversationId),
    refetchInterval: 5000,
  });
  const { data: conversations } = useQuery({ queryKey: ['conversations'], queryFn: chatApi.listConversations });
  const conv = conversations?.find((c) => c.id === conversationId);

  const send = useMutation({
    mutationFn: (data: { text?: string; imageUrl?: string }) => chatApi.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setText('');
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // Zone de saisie qui grandit avec le texte, jusqu'à 5 lignes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const grouped = useMemo(() => {
    const out: { day: string; items: typeof messages }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.sentAt);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [messages]);

  const submit = (value = text) => {
    if (!value.trim() || send.isPending) return;
    send.mutate({ text: value.trim() });
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await mediaApi.upload(file);
      send.mutate({ imageUrl: url });
    } catch {
      setUploadError('La photo n’a pas pu être envoyée (8 Mo maximum).');
    } finally {
      setUploading(false);
    }
  };

  const replies = role === 'PROVIDER' ? QUICK_REPLIES.PROVIDER : QUICK_REPLIES.CLIENT;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden" aria-label="Retour aux conversations">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {conv && (
          <>
            <Avatar name={conv.other.name} url={conv.other.avatarUrl} size="sm" />
            <p className="truncate font-semibold">{conv.other.name}</p>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-paper px-4 py-5" aria-live="polite">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-semibold">Commencez la conversation</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Décrivez votre besoin, envoyez une photo : les échanges restent sur Ouvra.</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="space-y-1.5">
              <p className="sticky top-0 z-10 py-2 text-center">
                <span className="rounded-full bg-card px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">{g.day}</span>
              </p>
              {g.items.map((m) => (
                <div key={m.id} className={cn('flex', m.sentByMe ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2 sm:max-w-[65%]',
                      m.sentByMe ? 'rounded-br-md bg-brand-800 text-white dark:bg-brand-300 dark:text-brand-950' : 'rounded-bl-md bg-card text-foreground ring-1 ring-border'
                    )}
                  >
                    {m.imageUrl && (
                      <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
                        {/* eslint-disable-next-line @next/next/no-img-element -- photo envoyée dans la conversation */}
                        <img loading="lazy" decoding="async" src={m.imageUrl} alt="Photo envoyée" className="max-h-64 max-w-[240px] rounded-xl object-cover" />
                      </a>
                    )}
                    {m.text && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.text}</p>}
                    <p className={cn('mt-0.5 flex items-center justify-end gap-1 text-[11px]', m.sentByMe ? 'text-white/70 dark:text-brand-950/70' : 'text-muted-foreground')}>
                      {new Date(m.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {m.sentByMe && (m.read ? <CheckCheck className="h-3.5 w-3.5" aria-label="Lu" /> : <Check className="h-3.5 w-3.5" aria-label="Envoyé" />)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-card px-3 py-3">
        {!text && (
          <div className="hide-scrollbar mb-2 flex gap-2 overflow-x-auto px-1">
            {replies.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => submit(r)}
                className="h-8 shrink-0 rounded-full border border-border px-3 text-[13px] font-medium transition-colors hover:border-brand-600 hover:text-brand-800 dark:hover:text-brand-200"
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {uploadError && <p role="alert" className="mb-2 px-1 text-[13px] text-red-700 dark:text-red-300">{uploadError}</p>}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input type="file" ref={fileRef} onChange={upload} accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
            aria-label="Envoyer une photo"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          </button>
          <label htmlFor="chat-input" className="sr-only">
            Votre message
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Écrire un message"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-border bg-paper px-3.5 py-2.5 text-[15px] leading-snug outline-none focus:border-brand-600 focus:bg-card focus:ring-[3px] focus:ring-brand-600/15"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sun-400 text-gray-950 transition-colors hover:bg-sun-300 disabled:opacity-40"
            aria-label="Envoyer"
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conv') ?? searchParams.get('id'));
  const { data: conversations = [], isLoading } = useQuery({ queryKey: ['conversations'], queryFn: chatApi.listConversations, refetchInterval: 15000 });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', HEIGHT)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-border bg-card', HEIGHT)}>
      <div className={cn('w-full shrink-0 border-r border-border lg:w-80 xl:w-96', selectedId ? 'hidden lg:block' : 'block')}>
        <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      <div className={cn('min-w-0 flex-1', !selectedId ? 'hidden lg:flex' : 'flex')}>
        {selectedId ? (
          <ChatArea key={selectedId} conversationId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-paper px-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Choisissez une conversation</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Pour écrire à un nouveau prestataire, ouvrez son profil et touchez « Écrire ».</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className={cn('flex items-center justify-center', HEIGHT)}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
