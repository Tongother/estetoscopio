import { transporter, defaultMailOptions } from "./config";

// Función para verificar la conexión
export const verifyConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ SMTP conexión exitosa');
    return true;
  } catch (error) {
    console.error('❌ SMTP conexión fallida:', error);
    return false;
  }
};

// Función helper para enviar emails
export const sendEmail = async (options: sendEmailProps) => {
  try {
    const info = await transporter.sendMail({
      ...defaultMailOptions,
      ...options,
    });
    console.log('📧 Correo enviado satisfactoriamente:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
    throw error;
  }
};