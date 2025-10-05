interface searchParamsProps { 
  error?: string | string[]; 
  message?: string | string[];
}

interface OAuthCardProps {
  imageSrc: string;
  signInWith: () => void;
}

interface submitButtonProps {
  text: string;
}