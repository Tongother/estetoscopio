// Next JS y React
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Libs
import { auth } from "@/auth";

// Funciones OAuth
import { signInWithGoogle } from "@/app/lib/signInOAuth";

// Components
import OAuthCard from "@/app/components/login/OAuthCard";
import SubmitButton from "@/app/components/login/SubmitButton";

export const metadata = {
  title: 'Iniciar sesión',
  description: 'Página de inicio de sesión',
}

const Login = ({ searchParams }: { searchParams: { error?: string, message?: string } }) => {

  const loginAction = async (formdata: FormData) => {
    "use server"

    try{
      const response = await auth.api.signInEmail({
        body: {
          email: formdata.get("user-email") as string,
          password: formdata.get("user-password") as string,
          callbackURL: "/"
        },
        headers: await headers(),
      })

      if(response.user && response.token)
        redirect("/");
      
    }catch(error: any){
      if(error.status === 400 || error.statusCode === 400){
        // Email o contraseña inválidos
        redirect("/login?error=invalid_credentials");
      } else if(error.status === 401 || error.statusCode === 401){
        // Credenciales incorrectas
        redirect("/login?error=unauthorized");
      } else {
        // Error del servidor
        redirect("/login?error=server_error");
      }
    }
  }

  // Función para mostrar el mensaje de error
  const getErrorMessage = (error: string) => {
    switch(error) {
      case 'invalid_credentials':
        return 'Email o contraseña incorrectos, verifica tus datos.';
      case 'unauthorized':
        return 'No tienes autorización para acceder, verifica tus credenciales.';
      case 'server_error':
        return 'Error del servidor, inténtalo más tarde.';
      default:
        return 'Ha ocurrido un error inesperado';
    }
  }

  return (
    <main className="w-dvw h-dvh flex justify-center items-center">
      <div className="p-8 shadow-xl rounded-3xl">
        <h1 className="text-center p-2 text-2xl font-semibold"> Inició de sesión </h1>
        
        {/* Mostrar mensaje de error si existe */}
        {searchParams.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {getErrorMessage(searchParams.error)}
          </div>
        )}

        { /* Mostrar mensaje de éxito y mencionar se ha enviado el correo de verificación */}
        {searchParams.message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {searchParams.message}
          </div>
        )}

        <form className="flex flex-col justify-center items-center gap-4" action={loginAction}>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="user" className="text-lg"> Ingrese su email </label>
            <input type="email" name="user-email" id="user" className="p-2 rounded-md bg-gray-100 shadow" required />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="password" className="text-lg"> Ingrese su contraseña </label>
            <input 
              type="password" 
              name="user-password" 
              id="password"
              title="La contraseña no puede estar vacía"
              className="p-2 rounded-md bg-gray-100 shadow" 
              required
            />
          </div>
          
          <SubmitButton text="Iniciar" />

        </form>

        <p className="my-4">¿No tienes una cuenta? <Link href="/signUp" className="text-blue-500">Regístrate aquí</Link></p>

        <div className=" w-full p-2 mt-4 shadow rounded-3xl">
          <h2 className="text-center tracking-tight text-2xl font-semibold"> Otras formas de iniciar sesión </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <OAuthCard imageSrc="/icons/google.png" signInWith={signInWithGoogle} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login;