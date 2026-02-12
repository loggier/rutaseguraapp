'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestStreamSchema = z.object({
  imei: z.string().min(1, 'IMEI es requerido'),
  channel: z.number().int().min(1, 'El canal debe ser un número positivo.'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = requestStreamSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: 'Datos inválidos.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { imei, channel } = validation.data;
        
        const woxUrl = process.env.URL_WOX; 
        if (!woxUrl) {
            return NextResponse.json({ success: false, message: 'La URL del servicio de video no está configurada.' }, { status: 500 });
        }

        const cmdContent = {
            dataType: 0,
            codeStreamType: 1,
            channel: channel,
            videoIP: "gps.securityyoucar.com",
            videoTCPPort: "10002",
            videoUDPPort: 0,
        };

        const requestUrl = `${woxUrl}/app/send-instruct`;
        
        const requestBody = new URLSearchParams();
        requestBody.append('imei', imei);
        requestBody.append('cmdContent', JSON.stringify(cmdContent));
        requestBody.append('serverFlagId', '0');
        requestBody.append('proNo', '37121');
        requestBody.append('platform', 'web');
        requestBody.append('requestId', '6');
        requestBody.append('cmdType', 'normallns');
        requestBody.append('token', '123');
        requestBody.append('offLineFlag', '1');

        const woxResponse = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody.toString(),
        });

        const responseText = await woxResponse.text();

        if (!woxResponse.ok) {
            console.error('Error en la solicitud a WOX:', responseText);
            return NextResponse.json({ success: false, message: `El dispositivo de video no respondió. Causa: ${responseText}` }, { status: woxResponse.status });
        }

        const responseData = JSON.parse(responseText);

        if (responseData.code !== 0) {
             console.error('Error en la respuesta de WOX:', responseData);
             return NextResponse.json({ success: false, message: `El dispositivo devolvió un error: ${JSON.stringify(responseData)}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Solicitud de video enviada.' });

    } catch (error: any) {
        console.error("Error requesting video stream:", error);
        return NextResponse.json({ success: false, message: 'Error interno del servidor al solicitar el video.' }, { status: 500 });
    }
}
