'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';

// **ACCIÓN REQUERIDA:** Reemplaza esta clave con tu clave VAPID de la consola de Firebase.
const VAPID_KEY = 'BJtny6eUPVaTLAf3ngDLqOH0sEwLlUulebyi4szv-qzrcrjI6CNFDuN2iqDtrlvLLZ6tFSeKZJP_hbx5rnQIXHM';

type FirebaseMessagingContextType = {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
};

const FirebaseMessagingContext = createContext<FirebaseMessagingContextType | null>(null);

export const useFirebaseMessaging = () => {
    const context = useContext(FirebaseMessagingContext);
    if (!context) {
        throw new Error("useFirebaseMessaging debe usarse dentro de un FirebaseMessagingProvider");
    }
    return context;
};

export function FirebaseMessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Comprueba el estado del permiso inicial cuando el componente se monta
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Escucha los mensajes cuando la app está en primer plano
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app && permission === 'granted') {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Mensaje recibido en primer plano. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });
        return () => unsubscribe();
    }
  }, [toast, permission]);

  const requestPermission = useCallback(async () => {
    if (!user?.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para activar las notificaciones.' });
        return;
    }
    if (!VAPID_KEY) {
        console.error("No se ha proporcionado la clave VAPID de Firebase. Las notificaciones no funcionarán.");
        toast({ variant: 'destructive', title: 'Error de Configuración', description: 'Falta la clave VAPID para las notificaciones.' });
        return;
    }
    if (typeof window === 'undefined' || !('Notification' in window) || !app) {
        toast({ variant: 'destructive', title: 'Error', description: 'Tu navegador no soporta notificaciones.' });
        return;
    }

    const messaging = getMessaging(app);

    try {
        // Solicita permiso al usuario
        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission); // Actualiza el estado local

        if (currentPermission === 'granted') {
            toast({ title: '¡Éxito!', description: 'Permiso de notificación concedido.' });
            // Obtiene el token y lo guarda
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
                console.log('FCM Token obtenido y guardado:', currentToken);
                await fetch('/api/profile/save-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, token: currentToken }),
                });
            } else {
                 console.log('No se pudo obtener el token de registro.');
                 toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener el token para las notificaciones.' });
            }
        } else {
            console.log('No se pudo obtener permiso para notificaciones.');
            toast({ variant: 'destructive', title: 'Permiso denegado', description: 'No has permitido las notificaciones.' });
        }
    } catch (err) {
        console.error('Ocurrió un error al solicitar el token.', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al solicitar el permiso.' });
    }
  }, [user, toast]);

    // Solicita permiso automáticamente al iniciar sesión si aún no se ha pedido
    useEffect(() => {
        if (user?.id && permission === 'default') {
        // Usamos un pequeño timeout para no bombardear al usuario inmediatamente
        const timer = setTimeout(() => {
            requestPermission();
        }, 3000); // 3 segundos de cortesía

        return () => clearTimeout(timer);
        }
    }, [user, permission, requestPermission]);

  return (
    <FirebaseMessagingContext.Provider value={{ permission, requestPermission }}>
      {children}
    </FirebaseMessagingContext.Provider>
  );
}
