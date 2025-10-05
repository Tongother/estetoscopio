const emailVerificationTemplate = (verificationLink: string, userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Estilos modernos y minimalistas consistentes */
        body {
            font-family: 'Manrope', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            text-align: center; /* Centrado para emails de verificación */
        }
        .header {
            padding-bottom: 30px;
        }
        .logo {
            max-width: 160px;
            height: auto;
        }
        .title {
            color: #1a202c;
            font-size: 26px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .body-text {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 25px;
        }
        .cta-button {
            background-color: #1D9A89; /* Mismo color verde azulado */
            color: #ffffff !important;
            padding: 15px 30px;
            border-radius: 15px;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            margin-top: 10px;
            letter-spacing: 0.5px;
        }
        .link-text {
            word-break: break-all;
            font-size: 11px;
            color: #a0aec0;
            margin-top: 30px;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            font-size: 12px;
            color: #a0aec0;
        }
        .footer a {
            color: #718096;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
             <img src="https://via.placeholder.com/160x50.png?text=Estetoscopio.com" alt="Logo de Estetoscopio.com" class="logo">
        </div>

        <h1 class="title">
            Confirma tu dirección de correo
        </h1>

        <p class="body-text">
            Hola ${userName},<br>Por favor, haz clic en el botón de abajo para verificar tu correo electrónico y activar tu cuenta en Estetoscopio.com.
        </p>

        <div>
            <a href="${verificationLink}" class="cta-button">
                Verificar mi Correo
            </a>
        </div>
        
        <p class="link-text">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${verificationLink}" style="color: #a0aec0;">${verificationLink}</a>
        </p>

        <div class="footer">
            <p>
                Si no creaste una cuenta, puedes ignorar este mensaje.
            </p>
            <p>
                Estetoscopio.com | <a href="[ENLACE_POLÍTICA_DE_PRIVACIDAD]">Política de Privacidad</a>
            </p>
        </div>

    </div>
</body>
</html>
`;
export { emailVerificationTemplate };

const passwordResetTemplate = (resetLink: string, userName: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hola ${userName},</h1>
    <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
    <a href="${resetLink}">Restablecer Contraseña</a>
  </div>
</body>
</html>
`;
export { passwordResetTemplate };

const welcomeTemplate = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Estilos modernos y minimalistas */
        body {
            font-family: 'Manrope', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
        }
        .logo {
            max-width: 160px;
            height: auto;
        }
        .title {
            color: #1a202c;
            font-size: 26px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 15px;
            text-align: center;
        }
        .body-text {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 25px;
        }
        .cta-button {
            background-color: #1D9A89; /* Un color verde azulado, más profesional */
            color: #ffffff !important;
            padding: 15px 30px;
            border-radius: 50px; /* Forma de píldora */
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            margin-top: 10px;
            letter-spacing: 0.5px;
        }
        .content-center {
            text-align: center;
            margin: 30px 0;
        }
        .signature {
            font-weight: 700;
            color: #2d3748;
        }
        .footer {
            text-align: center;
            padding-top: 30px;
            font-size: 12px;
            color: #a0aec0;
        }
        .footer a {
            color: #718096;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">

        <div class="header">
            <img src="https://via.placeholder.com/160x50.png?text=Estetoscopio.com" alt="Logo de Estetoscopio.com" class="logo">
        </div>

        <h1 class="title">
            Tu viaje hacia un corazón sano comienza ahora
        </h1>
        
        <p class="body-text">Hola ${userName},</p>

        <p class="body-text">
            Te damos la bienvenida a Estetoscopio.com. Estamos felices de acompañarte en el monitoreo de tu salud cardíaca. Nuestra plataforma está diseñada para ofrecerte claridad y control sobre tu bienestar de una manera simple y accesible.
        </p>

        <div class="content-center">
            <a href="[URL_A_TU_DASHBOARD]" class="cta-button">
                Ir a mi Panel de Salud
            </a>
        </div>

        <p class="body-text">
            Si tienes cualquier pregunta, no dudes en contactarnos. Estamos aquí para ayudarte.
        </p>

        <p class="body-text">
            Con nuestros mejores deseos,<br>
            <span class="signature">El equipo de Estetoscopio.com</span>
        </p>

        <div class="footer">
            <p>Estetoscopio.com | [Tu Ciudad o Dirección]</p>
            <p>
                <a href="[ENLACE_DE_DESUSCRIPCIÓN]">Darse de baja</a> &nbsp;&nbsp;|&nbsp;&nbsp; <a href="[ENLACE_POLÍTICA_DE_PRIVACIDAD]">Política de Privacidad</a>
            </p>
        </div>

    </div>
</body>
</html>
`;
export { welcomeTemplate };