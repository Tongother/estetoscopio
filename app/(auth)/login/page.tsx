// Next JS y React
import Link from "next/link";

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

const Login = () =>{

  const loginAction = async (formdata: FormData) => {
    "use server"

    const response = await auth.api.signInEmail({
      body: {
        email: formdata.get("user-email") as string,
        password: formdata.get("user-password") as string,
        callbackURL: "/",
      },
    })

    console.log("Response", response);
  }

  return (
    <main className="w-dvw h-dvh flex justify-center items-center">
      <div className="p-8 shadow-xl rounded-3xl">
        <h1 className="text-center p-2 text-2xl font-semibold"> Inició de sesión </h1>
        <form className="flex flex-col justify-center items-center gap-4" action={loginAction}>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="user" className="text-lg"> Ingrese su email </label>
            <input type="text" name="user-email" id="user" className="p-2 rounded-md bg-gray-100 shadow" />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="password" className="text-lg"> Ingrese su contraseña </label>
            <input type="password" name="user-password" id="password" className="p-2 rounded-md bg-gray-100 shadow" />
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