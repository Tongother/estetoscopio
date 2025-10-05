// Next JS y React
import Link from "next/link";
import { redirect } from "next/navigation";

// Libs
import { auth } from "@/auth";

// Funciones OAuth
import { signInWithGoogle } from "@/app/lib/signInOAuth";

// Components
import OAuthCard from "@/app/components/login/OAuthCard";
import SubmitButton from "@/app/components/login/SubmitButton";
import { sendEmail } from "@/mail/helpers";
import { welcomeTemplate } from "@/mail/templates";

export const metadata = {
  title: 'Iniciar sesión',
  description: 'Página de inicio de sesión',
}

const Login = ({ searchParams }: Props) =>{

  const registerAction = async (formdata: FormData) => {
    "use server"

    const name = formdata.get("user-name") as string;
    const email = formdata.get("user-email") as string;
    const password = formdata.get("user-password") as string;


    // Validación de contraseña
    const hasMinLength = password.length >= 10;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const numberCount = (password.match(/\d/g) || []).length;
    const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    
    if (!hasMinLength || !hasLowerCase || !hasUpperCase || numberCount < 2 || specialCharCount < 2)
      redirect("/signUp?error=invalid_password");

    try{
      const response =  await auth.api.signUpEmail({
        body: {
          name: name,
          email: email,
          password: password,
          callbackURL: "/login?message=account_created"
        }
      })

      console.log(response);

      if(!(response.user && response.token))
        redirect("/signUp?error=server_error");

      sendEmail({
        to: email,
        subject: "Bienvenido a Estetoscopio",
        html: welcomeTemplate(name)
      })

      redirect("/login?message=account_created");
    }catch(error: unknown){
      const err = error as { status?: number, statusCode?: number };
      if(err.status === 400 || err.statusCode === 400){
        // Email ya registrado
        redirect("/signUp?error=invalid_credentials");
      } else {
        // Error del servidor
        redirect("/signUp?error=server_error");
      }
    } 
  }

  // Función para mostrar el mensaje de error
  const getStatusMessage = (error: string | string[] | undefined) => {
    switch(error) {
      case 'invalid_password':
        return 'La contraseña no cumple con los requisitos de seguridad.';
      case 'server_error':
        return 'Error del servidor, inténtalo más tarde.';
      default:
        return 'Ha ocurrido un error inesperado';
    }
  }

  const errorMessage = Array.isArray(searchParams.error) ? searchParams.error[0] : searchParams.error;

  return (
    <main className="w-dvw h-dvh flex justify-center items-center">
      <div className="p-8 shadow-xl rounded-3xl">
        <h1 className="text-center p-2 text-2xl font-semibold"> Registro </h1>

        {searchParams.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {getStatusMessage(errorMessage)}
          </div>
        )}
        
        <form className="flex flex-col justify-center items-center gap-4" action={registerAction}>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="user" className="text-lg"> Ingrese su usuario </label>
            <input type="text" name="user-name" id="user" required className="p-2 rounded-md bg-gray-100 shadow" />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="email" className="text-lg"> Ingrese su email </label>
            <input type="email" name="user-email" id="email" placeholder="ejemplo@correo.com" required className="p-2 rounded-md bg-gray-100 shadow" />
          </div>

          <div className="flex flex-col w-xl gap-2">
            <label htmlFor="password" className="text-lg"> Ingrese su contraseña </label>
            <input type="password" name="user-password" id="password" 
              className="p-2 rounded-md bg-gray-100 shadow" 
              required
            />
            <small className="text-gray-700">Mínimo 10 caracteres, una mayúscula, una minúscula, 2 números y 2 caracteres especiales, ejemplo: A1bc13!jH!</small>
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