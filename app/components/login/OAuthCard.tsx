// Next JS y React
import Image from "next/image";

const OAuthCard = ({imageSrc, signInWith}: OAuthCardProps) => {

  return (
    <form
      action={signInWith}>
        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
          <Image src={imageSrc} alt="Google" width={30} height={30} />
          <span>Continuar con Google</span>
        </button>
    </form>
  );
};

export default OAuthCard;