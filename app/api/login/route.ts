import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Se obtienen los headers de la petición
    const headersList = await headers();

    // Se lee especificamente el header de autorización
    const authHeader = headersList.get("Authorization");
    
    // Si no existe o no tiene el formato correcto, retornar error 401 (Unauthorized)
    if (!authHeader || !authHeader.startsWith("Bearer ")) 
      return new NextResponse("Token no proporcionado o formato incorrecto", { status: 401 });

    // Se extrae el token del header, quitando el prefijo "Bearer "
    const token = authHeader.split(" ")[1];
  } catch (error) {
    return new NextResponse("Error en la autenticación", { status: 500 });
  }
}