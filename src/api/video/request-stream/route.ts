'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestStreamSchema = z.object({
  imei: z.string().min(1, 'IMEI es requerido'),
  channel: z.number().int(), // Channel can be 0-indexed or 1-indexed
  model: z.string().optional().nullable(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = requestStreamSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: 'Datos inválidos.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { imei, channel, model } = validation.data;
        
        const woxUrl = process.env.URL_WOX; 
        if (!woxUrl) {
            return NextResponse.json({ success: false, message: 'La URL del servicio de video no está configurada.' }, { status: 500 });
        }

        const targetPath = model === 'jc400' 
            ? '/proxy/whatsgps-video-jimi-jc400' 
            : '/proxy/whatsgps-video-jimi';
        
        const requestUrl = `${woxUrl}${targetPath}`;
        const requestBody = {
            IMEI: imei,
            channel: channel,
        };

        console.log('--- INICIO DEBUG VIDEO ---');
        console.log('[DEBUG] URL de destino:', requestUrl);
        console.log('[DEBUG] Parámetros enviados:', JSON.stringify(requestBody, null, 2));

        const woxResponse = await fetch(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(requestBody),
        });

        const responseText = await woxResponse.text();
        console.log('[DEBUG] Respuesta recibida (texto plano):', responseText);

        if (!woxResponse.ok) {
            console.error('Error en la solicitud al proxy de video:', responseText);
            console.log('--- FIN DEBUG VIDEO (ERROR) ---');
            return NextResponse.json({ success: false, message: `El servicio de video no respondió. Causa: ${responseText}` }, { status: 500 });
        }

        try {
            const responseData = JSON.parse(responseText);

            if (responseData.data?._code === 300) {
                 console.error('Error en la respuesta del servicio de video:', responseData);
                 const errorMessage = responseData.data?.msg || 'Error desconocido del servicio de video.';
                 console.log('--- FIN DEBUG VIDEO (ERROR 300) ---');
                 return NextResponse.json({ success: false, message: `No se pudo obtener la URL para el canal ${channel}: ${errorMessage}` }, { status: 400 });
            }

            if (!responseData.url) {
                console.error('La respuesta del servicio de video no contiene una URL:', responseData);
                console.log('--- FIN DEBUG VIDEO (SIN URL) ---');
                return NextResponse.json({ success: false, message: `La respuesta para el canal ${channel} no incluyó una URL.` }, { status: 500 });
            }
            
            console.log('[DEBUG] URL de video obtenida con éxito:', responseData.url);
            console.log('--- FIN DEBUG VIDEO (ÉXITO) ---');
            
            return NextResponse.json({ success: true, url: responseData.url });

        } catch (parseError) {
             console.error('Error al parsear la respuesta JSON:', parseError);
             console.log('[DEBUG] Respuesta que causó el error de parseo:', responseText);
             console.log('--- FIN DEBUG VIDEO (ERROR DE PARSEO) ---');
             return NextResponse.json({ success: false, message: `Error al interpretar la respuesta del servicio de video.` }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error al solicitar la URL del stream de video:", error);
        console.log('--- FIN DEBUG VIDEO (ERROR CATCH) ---');
        return NextResponse.json({ success: false, message: 'Error interno del servidor al procesar la solicitud de video.' }, { status: 500 });
    }
}
