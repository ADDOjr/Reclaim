import { supabase } from '@/lib/supabase';
import type { AppNotification, NotificationType } from '@/types';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link: link ?? null,
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  return (data as AppNotification[]) ?? [];
}

/**
 * Notifies both the item owner and the potential match owner about a strong match.
 * Also triggers an email via the edge function if the user has email notifications enabled.
 */
export async function notifyMatchFound(
  sourceItem: Item,
  matchedItem: Item,
  score: number,
  sourceOwnerEmail: string,
  matchedOwnerEmail: string
): Promise<void> {
  // In-app notification to the source item owner
  await createNotification(
    sourceItem.user_id,
    'match',
    'Strong match found!',
    `Your ${sourceItem.type} item "${sourceItem.title}" may have been ${matchedItem.type === 'lost' ? 'reported lost' : 'found'}. Match score: ${score}%`,
    `/app/item/${matchedItem.id}`
  );

  // In-app notification to the matched item owner
  await createNotification(
    matchedItem.user_id,
    'match',
    'Strong match found!',
    `Someone reported a ${sourceItem.type} item that may match your "${matchedItem.title}". Match score: ${score}%`,
    `/app/item/${sourceItem.id}`
  );

  // Trigger email notifications via edge function
  try {
    const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`;
    await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        emails: [sourceOwnerEmail, matchedOwnerEmail],
        subject: `Strong match found — ${score}% similarity`,
        matchScore: score,
        sourceItem: sourceItem.title,
        matchedItem: matchedItem.title,
      }),
    });
  } catch {
    // Email is best-effort; in-app notifications are the primary channel
  }
}

// Minimal Item type to avoid circular import
interface Item {
  id: string;
  user_id: string;
  type: 'lost' | 'found';
  title: string;
}
