
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';

// **ACCIÓN REQUERIDA:** Reemplaza esta clave con tu clave VAPID de la consola de Firebase.
const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';

async function requestPermissionAndGetToken(userId: string) {
    if (typeof window === 'undefined' || !('Notification' in window) || !app) {
        console.log('Este navegador no soporta notificaciones o Firebase no está inicializado.');
        return;
    }

    const messaging = getMessaging(app);

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificación concedido.');
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            });
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                // Enviar el token a tu servidor para guardarlo
                await fetch('/api/profile/save-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, token: currentToken }),
                });
            } else {
                console.log('No se pudo obtener el token de registro. Pide permiso de notificación.');
            }
        } else {
            console.log('No se pudo obtener permiso para notificaciones.');
        }
    } catch (err) {
        console.error('Ocurrió un error al obtener el token.', err);
    }
}


export function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
        requestPermissionAndGetToken(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app) {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Mensaje recibido en primer plano. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });
        return () => {
            unsubscribe();
        };
    }
  }, [toast]);

  return <>{children}</>;
}
