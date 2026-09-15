import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Variáveis de ambiente Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Chaves locais para simulação quando Supabase não estiver configurado
const STORAGE_KEYS = {
  PENDING_CONFIRMATION: 'poupagaio_pending_confirmation',
  AUTH_ATTEMPTS: 'poupagaio_auth_attempts',
  SIMULATED_USERS: 'poupagaio_simulated_users',
};

export interface AuthAttemptRecord {
  count: number;
  firstAttemptTimestamp: number;
  blockedUntil?: number;
}

/**
 * Validação rigorosa de formato de e-mail (Seção 1.2)
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Regex compatível com padrões internacionais de e-mail
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}

/**
 * Verificação e registro de tentativas de login (Seção 1.5)
 * Bloqueia após 5 tentativas na janela de 10 minutos (600.000 ms)
 */
export function checkLoginAttempts(email: string): { isBlocked: boolean; remainingMinutes?: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS);
    const attemptsMap: Record<string, AuthAttemptRecord> = raw ? JSON.parse(raw) : {};
    const key = email.trim().toLowerCase();
    const record = attemptsMap[key];

    if (!record) return { isBlocked: false };

    const now = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    // Se estiver bloqueado
    if (record.blockedUntil && now < record.blockedUntil) {
      const remainingMs = record.blockedUntil - now;
      return { isBlocked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
    }

    // Se a janela de 10 minutos já passou, reinicia
    if (now - record.firstAttemptTimestamp > TEN_MINUTES_MS) {
      delete attemptsMap[key];
      localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, JSON.stringify(attemptsMap));
      return { isBlocked: false };
    }

    if (record.count >= 5) {
      const blockedUntil = now + TEN_MINUTES_MS;
      record.blockedUntil = blockedUntil;
      attemptsMap[key] = record;
      localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, JSON.stringify(attemptsMap));
      return { isBlocked: true, remainingMinutes: 10 };
    }

    return { isBlocked: false };
  } catch (e) {
    return { isBlocked: false };
  }
}

export function recordFailedLoginAttempt(email: string): { isBlockedNow: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS);
    const attemptsMap: Record<string, AuthAttemptRecord> = raw ? JSON.parse(raw) : {};
    const key = email.trim().toLowerCase();
    const now = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    let record = attemptsMap[key];
    if (!record || now - record.firstAttemptTimestamp > TEN_MINUTES_MS) {
      record = { count: 1, firstAttemptTimestamp: now };
    } else {
      record.count += 1;
      if (record.count >= 5) {
        record.blockedUntil = now + TEN_MINUTES_MS;
      }
    }

    attemptsMap[key] = record;
    localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, JSON.stringify(attemptsMap));

    return { isBlockedNow: record.count >= 5 };
  } catch (e) {
    return { isBlockedNow: false };
  }
}

export function resetLoginAttempts(email: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_ATTEMPTS);
    if (!raw) return;
    const attemptsMap: Record<string, AuthAttemptRecord> = JSON.parse(raw);
    delete attemptsMap[email.trim().toLowerCase()];
    localStorage.setItem(STORAGE_KEYS.AUTH_ATTEMPTS, JSON.stringify(attemptsMap));
  } catch (e) {
    // Silencioso
  }
}

/**
 * Funções de Cadastro e Confirmação de E-mail
 */
export async function registerUserWithSupabase(params: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{
  success: boolean;
  needsEmailConfirmation: boolean;
  error?: string;
  user?: any;
}> {
  const { name, email, phone, password } = params;

  if (!isValidEmailFormat(email)) {
    return { success: false, needsEmailConfirmation: false, error: 'Formato de e-mail inválido.' };
  }

  if (password.length < 8) {
    return { success: false, needsEmailConfirmation: false, error: 'A senha deve possuir no mínimo 8 caracteres.' };
  }

  // Se Supabase estiver conectado
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone ? phone.trim() : undefined,
          },
        },
      });

      if (error) {
        return { success: false, needsEmailConfirmation: false, error: error.message };
      }

      const needsConfirmation = !data.session && Boolean(data.user);
      return {
        success: true,
        needsEmailConfirmation: needsConfirmation,
        user: data.user,
      };
    } catch (err: any) {
      return { success: false, needsEmailConfirmation: false, error: err.message || 'Erro ao comunicar com Supabase.' };
    }
  }

  // Modo Local/Sandbox Simulado com conformidade rigorosa
  const simulatedUsersRaw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
  const simulatedUsers: Record<string, any> = simulatedUsersRaw ? JSON.parse(simulatedUsersRaw) : {};
  const key = email.trim().toLowerCase();

  simulatedUsers[key] = {
    id: 'user-' + Date.now(),
    email: key,
    full_name: name.trim(),
    phone: phone ? phone.trim() : undefined,
    password, // Salvo apenas localmente para teste de login
    email_confirmed: false,
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.SIMULATED_USERS, JSON.stringify(simulatedUsers));
  localStorage.setItem(STORAGE_KEYS.PENDING_CONFIRMATION, key);

  return {
    success: true,
    needsEmailConfirmation: true,
    user: simulatedUsers[key],
  };
}

/**
 * Reenvio de e-mail de confirmação
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidEmailFormat(email)) {
    return { success: false, error: 'E-mail inválido.' };
  }

  if (supabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao reenviar confirmação.' };
    }
  }

  // Simulação: sempre bem-sucedido
  return { success: true };
}

/**
 * Confirmação manual de e-mail em ambiente simulado
 */
export function simulateConfirmEmail(email: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
    if (!raw) return false;
    const users = JSON.parse(raw);
    const key = email.trim().toLowerCase();
    if (users[key]) {
      users[key].email_confirmed = true;
      localStorage.setItem(STORAGE_KEYS.SIMULATED_USERS, JSON.stringify(users));
      localStorage.removeItem(STORAGE_KEYS.PENDING_CONFIRMATION);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Login com Supabase ou Fallback Seguro
 */
export async function loginUserWithSupabase(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  needsEmailConfirmation?: boolean;
  error?: string;
  user?: any;
}> {
  const check = checkLoginAttempts(email);
  if (check.isBlocked) {
    return {
      success: false,
      error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        recordFailedLoginAttempt(email);
        return {
          success: false,
          error: 'E-mail ou senha incorretos.',
        };
      }

      resetLoginAttempts(email);
      return { success: true, user: data.user };
    } catch (err) {
      recordFailedLoginAttempt(email);
      return {
        success: false,
        error: 'E-mail ou senha incorretos.',
      };
    }
  }

  // Verificação no banco de dados local simulado
  const raw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
  const users: Record<string, any> = raw ? JSON.parse(raw) : {};
  const key = email.trim().toLowerCase();
  const registeredUser = users[key];

  // Se o usuário foi cadastrado localmente
  if (registeredUser) {
    if (registeredUser.password !== pass) {
      recordFailedLoginAttempt(email);
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    if (!registeredUser.email_confirmed) {
      return {
        success: false,
        needsEmailConfirmation: true,
        error: 'Por favor, confirme seu e-mail antes de acessar sua conta.',
      };
    }

    resetLoginAttempts(email);
    return { success: true, user: registeredUser };
  }

  // Contas padrão de demonstração do Poupagaio (mateus@email.com, luana@email.com)
  if (
    (key === 'mateus@email.com' || key === 'luana@email.com') &&
    pass.length >= 8
  ) {
    resetLoginAttempts(email);
    return {
      success: true,
      user: {
        id: key === 'luana@email.com' ? 'user-luana-02' : 'user-mateus-01',
        email: key,
        full_name: key === 'luana@email.com' ? 'Luana Souza' : 'Mateus Araujo',
        email_confirmed: true,
      },
    };
  }

  // Credenciais não coincidem
  recordFailedLoginAttempt(email);
  return { success: false, error: 'E-mail ou senha incorretos.' };
}
