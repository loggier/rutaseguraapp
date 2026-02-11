'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useUser } from '@/contexts/user-context';
import { useToast } from '@/hooks/use-toast';

// ¡IMPORTANTE! Reemplaza esta clave con la CLAVE PÚBLICA (VAPID) de tu proyecto de Firebase.
// La encuentras en: Configuración del proyecto > Cloud Messaging > Certificados push web.
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

  // Registrar el Service Worker al cargar el componente
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('[SW] Attempting to register Service Worker...');
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('%c[SW] Registration successful!', 'color: green', 'Scope is:', registration.scope);
        } catch (registrationError) {
          console.error('%c[SW] Registration failed!', 'color: red', registrationError);
        }
      }
    };
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app && permission === 'granted') {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('[PUSH] Mensaje recibido en primer plano. ', payload);
            // Para consistencia con el service worker, leemos del payload 'data'
            toast({
                title: payload.data?.title,
                description: payload.data?.body,
            });
        });
        return () => unsubscribe();
    }
  }, [toast, permission]);

  const requestPermission = useCallback(async () => {
    console.log('[PUSH] Iniciando el proceso para obtener el token.');
    if (!user?.id) {
        console.warn('[PUSH] Proceso detenido: El usuario no ha iniciado sesión.');
        return;
    }
    console.log('[PUSH] Usuario verificado:', user.id);

    if (!VAPID_KEY || VAPID_KEY === 'BJtny6eUPVaTLAf3ngDLqOH0sEwLlUulebyi4szv-qzrcrjI6CNFDuN2iqDtrlvLLZ6tFSeKZJP_hbx5rnQIXHM') {
        const errorMsg = "No se ha proporcionado una clave VAPID pública válida. Reemplaza el valor de ejemplo en 'src/components/firebase-messaging-provider.tsx'.";
        console.error(`[PUSH] ERROR: ${errorMsg}`);
        toast({ variant: 'destructive', title: 'Error de Configuración', description: errorMsg });
        return;
    }
    console.log('[PUSH] Clave VAPID verificada.');

    if (typeof window === 'undefined' || !('Notification' in window) || !app) {
        console.error('[PUSH] ERROR: El navegador no soporta notificaciones o Firebase no se ha inicializado.');
        toast({ variant: 'destructive', title: 'Error', description: 'Tu navegador no soporta notificaciones.' });
        return;
    }
    console.log('[PUSH] Navegador compatible.');

    const messaging = getMessaging(app);

    try {
        console.log('[PUSH] Solicitando permiso al usuario...');
        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
        console.log(`[PUSH] Permiso del usuario: ${currentPermission}`);

        if (currentPermission === 'granted') {
            toast({ title: '¡Permiso concedido!', description: 'Obteniendo token de dispositivo...' });
            console.log('%c[PUSH] Permiso concedido. Esperando que el Service Worker esté listo...', 'color: green');
            
            const registration = await navigator.serviceWorker.ready;
            console.log('%c[PUSH] Service Worker está listo (activo). Obteniendo token de FCM...', 'color: blue', registration);
            
            const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (currentToken) {
                console.log('%c[PUSH] ¡TOKEN OBTENIDO! ->', 'color: green; font-weight: bold;', currentToken);
                toast({ title: 'Token Obtenido', description: 'Registrando dispositivo...' });
                
                console.log(`[PUSH] Enviando token al servidor para el usuario ${user.id}...`);
                const response = await fetch('/api/profile/save-fcm-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, token: currentToken }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    console.error('[PUSH] ERROR al guardar token en el servidor:', result.message);
                    throw new Error(result.message || 'Error del servidor al guardar el token.');
                }
                
                toast({ title: '¡Dispositivo Registrado!', description: 'Tu dispositivo ahora puede recibir notificaciones.'});
                console.log('%c[PUSH] Token guardado exitosamente en la base de datos.', 'color: green');

            } else {
                 console.error('%c[PUSH] ERROR: No se pudo obtener el token de registro. Posibles causas: \n1. La configuración de Firebase (firebaseConfig) en public/sw.js es incorrecta.\n2. La clave VAPID es incorrecta.\n3. Hay un problema con el Service Worker.', 'color: red');
                 toast({ variant: 'destructive', title: 'Error de Token', description: 'No se pudo obtener el token. Revisa la consola para más detalles.' });
            }
        } else {
            console.warn('[PUSH] Permiso de notificación denegado por el usuario.');
        }
    } catch (err: any) {
        console.error('%c[PUSH] ERROR INESPERADO durante el proceso de obtención del token:', 'color: red', err);
        toast({ variant: 'destructive', title: 'Error Inesperado', description: err.message || 'Ocurrió un error al procesar la solicitud de notificación.' });
    }
  }, [user, toast]);

    useEffect(() => {
        if (user?.id && permission === 'default') {
        const timer = setTimeout(() => {
            console.log("[PUSH] Solicitud automática de permiso después de 3 segundos del login.");
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
