interface sendEmailProps {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}