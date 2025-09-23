import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export default async function middleware(req: NextRequest) {
  // Evita perjudicar los endpoints de auth (callback, sign-in, etc.)
  if (req.nextUrl.pathname.startsWith("/api/auth")) return NextResponse.next();

  // Validación real contra Better Auth
  const session = await auth.api.getSession({ headers: req.headers });

  // Si no hay sesión y no está en login o signUp, redirige a login
  if (!session && (req.nextUrl.pathname !== "/login" && req.nextUrl.pathname !== "/signUp")) {
    // Creamos una URL basada en la URL de la solicitud entrante
    const url = req.nextUrl.clone();
    // Redirigimos a la página de login y añadimos la URL original como parámetro "next"
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Si hay sesión y está en login o signUp, redirige a la página principal o a la que se indicó en "next"
  if(session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signUp")) {
    const url = req.nextUrl.clone();
    if(url.searchParams.get("next")) {
      url.pathname = url.searchParams.get("next")!;
      url.searchParams.delete("next");

      return NextResponse.redirect(url);
    }else{
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Si no hay sesión y está en login o signUp, permite el acceso
  }else if(!session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signUp")) {
    return NextResponse.next();
  }
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api/auth|_next|favicon.ico|robots.txt|sitemap.xml|icons/|images/|assets/|fonts/).*)", "/login", "/signUp"], 
};