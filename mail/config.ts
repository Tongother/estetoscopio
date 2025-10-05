import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// Validar variables de entorno requeridas
const requiredEnvVars = ['EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0)
  throw new Error(`Se necesitan las siguientes variables de entorno: ${missingEnvVars.join(', ')}`);

// Configuración del transporter
export const mailConfig = {
  service: process.env.EMAIL_SERVICE!,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
};

// Crear transporter reutilizable
export const transporter: Transporter = nodemailer.createTransport(mailConfig);

// Opciones por defecto para los emails
export const defaultMailOptions = {
  from: {
    name: process.env.MAIL_FROM_NAME || 'Estetoscopio.com',
    address: process.env.EMAIL_USER!,
  },
};