// Interfaces para login. Rutas donde se usan: app/(auth)/login/page.tsx
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}