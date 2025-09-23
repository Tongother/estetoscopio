// Next JS y React
import Link from "next/link";

// Libs
import { authClient } from "@/auth-client";

// Funciones OAuth
import { signInWithGoogle } from "@/app/lib/signInOAuth";

// Components
import OAuthCard from "@/app/components/login/OAuthCard";
import SubmitButton from "@/app/components/login/SubmitButton";

export const metadata = {
  title: 'Iniciar sesión',
  description: 'Página de inicio de sesión',
}

const Login = () =>{

  const registerAction = async (formdata: FormData) => {
    "use server"

    const { data, error } = await authClient.signUp.email({
      email: formdata.get("user-email") as string,
      password: formdata.get("user-password") as string,
      name: formdata.get("user-name") as string,
      callbackURL: "/",
    }, {
      onRequest: (ctx) => {
        console.log("Request", ctx)
      },
      onSuccess: (ctx) => {
        console.log("Success", ctx)
      },
      onError: (ctx) => {
        console.log("Error", ctx)
      }
    })
  }

  return (
    <main className="w-dvw h-dvh flex justify-center items-center">
      <div className="p-8 shadow-xl rounded-3xl">
        <h1 className="text-center p-2 text-2xl font-semibold"> Registro </h1>
        <form className="flex flex-col justify-center items-center gap-4" action={registerAction}>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="user" className="text-lg"> Ingrese su usuario </label>
            <input type="text" name="user-name" id="user" className="p-2 rounded-md bg-gray-100 shadow" />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="email" className="text-lg"> Ingrese su email </label>
            <input type="email" name="user-email" id="email" className="p-2 rounded-md bg-gray-100 shadow" />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="password" className="text-lg"> Ingrese su contraseña </label>
            <input type="password" name="user-password" id="password" className="p-2 rounded-md bg-gray-100 shadow" />
          </div>
          
          <SubmitButton text="Registrarse" />

        </form>

        <p className="my-4">¿Ya tienes una cuenta? <Link href="/login" className="text-blue-500">Inicia sesión aquí</Link></p>
        <div className=" w-full p-2 mt-4 shadow rounded-3xl">
          <h2 className="text-center tracking-tight text-2xl font-semibold"> Otras formas de registrarte </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <OAuthCard imageSrc="/icons/google.png" signInWith={signInWithGoogle} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login;