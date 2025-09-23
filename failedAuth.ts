// Librerías
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// import { V4 } from "paseto";
import { createPublicKey, createPrivateKey } from "node:crypto";

// Claves PASETO, para firmar y verificar los tokens
// Se convierten de PEM a objetos KeyObject

// Private: Se usa para firmar el token (servidor)
// Public: Se usa para verificar el token (cualquier servicio)
const privateKey = createPrivateKey(process.env.PASETO_PRIVATE_KEY!);
const publicKey = createPublicKey(process.env.PASETO_PUBLIC_KEY!);

const sessionMaxAge = 60 * 60 * 24 * 7; // 7 días

if (!privateKey || !publicKey) 
  throw new Error("Faltan las claves PASETO en las variables de entorno");

// Se exporta el runtime para que NextAuth use Node.js
export const runtime = "nodejs";

// Configuración principal de Auth.js
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Se definen los proveedores de autenticación
  providers: [Google],
  // Configuración de la estrategia de sesión
  // Auth.js guardará el token en una cookie httpOnly/secure (producción)
  session: { strategy: "jwt", maxAge: sessionMaxAge },

  // El callback para manejar el JWT
  callbacks: {
    // Al crear el JWT, se añade el id del usuario al token
    // Se ejecuta cuando se crea el token o se actualiza
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    // Se ejecuta cada vez que se accede a la sesión para el cliente
    async session({ session, token }){
      session.user.id = String(token.userId);
      session.user.email = String(token.email);
      session.user.name = String(token.name);
      return session;
    }
  },
  jwt: {
    encode: async ({ token, maxAge }) => {
      // Crea el payload del token con issued at y expiration
      // Si no se especifica maxAge, se usa sessionMaxAge
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + (maxAge ?? sessionMaxAge);
      const payload: Record<string, unknown> = {
        ...token,
        iat,
        exp,
      }
      return await V4.sign(payload, privateKey)
    },
    
    decode: async ({ token }) => {
      if (!token) return null;

      try {
        // Verifica la firma y decodifica el token con la clave pública PASETO
        const payload = await V4.verify(token, publicKey);

        // Verifica que el token no haya expirado
        if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;

        return payload;
        
      } catch (error) {
        return null;
      }
    }
  },
})