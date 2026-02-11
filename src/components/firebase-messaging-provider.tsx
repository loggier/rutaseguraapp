'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';

// ¡IMPORTANTE! Reemplaza esta clave con la CLAVE PÚBLICA (VAPID) de tu proyecto de Firebase.
// La encuentras en: Configuración del proyecto > Cloud Messaging > Certificados push web.
const VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE_GOES_HERE';

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

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

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
    if (!VAPID_KEY || VAPID_KEY === 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE_GOES_HERE') {
        const errorMsg = "No se ha proporcionado una clave VAPID válida de Firebase en el código.";
        console.error(errorMsg);
        toast({ variant: 'destructive', title: 'Error de Configuración', description: 'Por favor, añade tu clave VAPID pública en firebase-messaging-provider.tsx' });
        return;
    }
    if (typeof window === 'undefined' || !('Notification' in window) || !app) {
        toast({ variant: 'destructive', title: 'Error', description: 'Tu navegador no soporta notificaciones.' });
        return;
    }

    const messaging = getMessaging(app);

    try {
        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
            toast({ title: '¡Éxito!', description: 'Permiso de notificación concedido. Obteniendo token...' });
            console.log('%c[PUSH] Permiso concedido. Esperando que el Service Worker esté listo...', 'color: green');
            
            const registration = await navigator.serviceWorker.ready;
            console.log('%c[PUSH] Service Worker listo. Obteniendo token de FCM...', 'color: blue');
            
            const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (currentToken) {
                console.log('%c[PUSH] Token de FCM obtenido:', 'color: green; font-weight: bold;', currentToken);
                toast({ title: 'Token Obtenido', description: 'Registrando el dispositivo en la base de datos...' });
                
                const response = await fetch('/api/profile/save-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, token: currentToken }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || 'Error del servidor al guardar el token.');
                }
                
                toast({ title: '¡Listo!', description: 'Tu dispositivo ahora puede recibir notificaciones.'});
                console.log('%c[PUSH] Token guardado exitosamente en la base de datos.', 'color: green');

            } else {
                 console.error('%c[PUSH] No se pudo obtener el token de registro. Asegúrate de que sw.js está configurado correctamente con las credenciales de Firebase y que la clave VAPID es la correcta.', 'color: red');
                 toast({ variant: 'destructive', title: 'Error de Token', description: 'No se pudo obtener el token. Revisa la configuración del Service Worker (sw.js) y tu clave VAPID.' });
            }
        } else {
            console.warn('%c[PUSH] Permiso de notificación denegado por el usuario.', 'color: orange');
            toast({ variant: 'destructive', title: 'Permiso denegado', description: 'No has permitido las notificaciones.' });
        }
    } catch (err: any) {
        console.error('%c[PUSH] Ocurrió un error al solicitar el token:', 'color: red', err);
        toast({ variant: 'destructive', title: 'Error Inesperado', description: err.message || 'Ocurrió un error al procesar la solicitud de notificación.' });
    }
  }, [user, toast]);

    useEffect(() => {
        if (user?.id && permission === 'default') {
        const timer = setTimeout(() => {
            requestPermission();
        }, 3000); 

        return () => clearTimeout(timer);
        }
    }, [user, permission, requestPermission]);

  return (
    <FirebaseMessagingContext.Provider value={{ permission, requestPermission }}>
      {children}
    </FirebaseMessagingContext.Provider>
  );
}
