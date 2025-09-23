"use client"

import { useFormStatus } from "react-dom";

const SubmitButton = ({text}: submitButtonProps) => {

  const { pending } = useFormStatus();

  return (
    <input type="submit" value={ pending ? "Iniciando..." : text} 
      disabled={pending}
      className="py-2 px-8 w-xs bg-blue-800 rounded-lg font-semibold text-white cursor-pointer ease-out duration-300 hover:scale-105"
    />
  );
}

export default SubmitButton;