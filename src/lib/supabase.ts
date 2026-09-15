import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Variáveis de ambiente exclusivamente Vite
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmailFormat(normalizedEmail)) {
    return { success: false, needsEmailConfirmation: false, error: 'Formato de e-mail inválido.' };
  }

  if (password.length < 8) {
    return { success: false, needsEmailConfirmation: false, error: 'A senha deve possuir no mínimo 8 caracteres.' };
  }

  // Se Supabase estiver conectado
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone ? phone.trim() : undefined,
          },
        },
      });

      if (error) {
        console.error('[Supabase Auth SignUp Error]', {
          message: error.message,
          status: error.status,
          code: (error as any).code,
        });
        return { success: false, needsEmailConfirmation: false, error: error.message };
      }

      return {
        success: true,
        needsEmailConfirmation: Boolean(data.user && !data.session),
        user: data.user,
      };
    } catch (err: any) {
      console.error('[Supabase Auth SignUp Exception]', err);
      return { success: false, needsEmailConfirmation: false, error: err.message || 'Erro ao comunicar com Supabase.' };
    }
  }

  // Modo Local/Sandbox Simulado quando Supabase URL não configurada
  const createdUser = {
    id: 'user-' + Date.now(),
    email: normalizedEmail,
    full_name: name.trim(),
    phone: phone ? phone.trim() : undefined,
    password,
    email_confirmed: true,
    created_at: new Date().toISOString(),
  };

  const simulatedUsersRaw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
  const simulatedUsers: Record<string, any> = simulatedUsersRaw ? JSON.parse(simulatedUsersRaw) : {};
  simulatedUsers[normalizedEmail] = createdUser;
  localStorage.setItem(STORAGE_KEYS.SIMULATED_USERS, JSON.stringify(simulatedUsers));

  return {
    success: true,
    needsEmailConfirmation: false,
    user: createdUser,
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
 * Solicitação segura de recuperação de senha via Supabase Auth (Seções 9, 10, 11, 14)
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string; error?: string }> {
  if (!isValidEmailFormat(email)) {
    return {
      success: false,
      message: 'Por favor, informe um endereço de e-mail válido.',
      error: 'Formato de e-mail inválido.',
    };
  }

  const genericSuccessMessage =
    'Se existir uma conta associada a esse e-mail, enviaremos as instruções para redefinir a senha.';

  if (supabase) {
    try {
      const officialRedirectUrl = 'https://poupagaiofinancas.vercel.app/redefinir-senha';
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const redirectUrl = isLocalhost ? `${window.location.origin}/redefinir-senha` : officialRedirectUrl;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) {
        console.error('[Supabase Reset Password Error]', error);
      }
      return { success: true, message: genericSuccessMessage };
    } catch (err: any) {
      console.error('[Supabase Reset Password Exception]', err);
      return { success: true, message: genericSuccessMessage };
    }
  }

  // Modo local simulado
  return { success: true, message: genericSuccessMessage };
}

/**
 * Redefinição de senha via token do Supabase Auth (Seções 12, 13)
 */
export async function updateUserPassword(
  newPassword: string,
  userEmail?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (newPassword.length < 8) {
    return {
      success: false,
      error: 'A nova senha deve possuir no mínimo 8 caracteres.',
    };
  }

  if (supabase) {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Senha alterada com sucesso.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao redefinir a senha.' };
    }
  }

  // Modo local simulado
  if (userEmail) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
      if (raw) {
        const users = JSON.parse(raw);
        const key = userEmail.trim().toLowerCase();
        if (users[key]) {
          users[key].password = newPassword;
          localStorage.setItem(STORAGE_KEYS.SIMULATED_USERS, JSON.stringify(users));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return { success: true, message: 'Senha alterada com sucesso.' };
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
 * Login com Supabase Auth e Tratamento Rigoroso de Erros
 */
export async function loginUserWithSupabase(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  needsEmailConfirmation?: boolean;
  error?: string;
  rawError?: { message?: string; status?: number; code?: string };
  user?: any;
  session?: any;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const check = checkLoginAttempts(normalizedEmail);
  if (check.isBlocked) {
    return {
      success: false,
      error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pass,
      });

      console.error("POUPAGAIO AUTH DEBUG", {
        message: error?.message,
        status: error?.status,
        code: (error as any)?.code,
        userId: data?.user?.id,
        hasSession: !!data?.session
      });

      if (error) {
        recordFailedLoginAttempt(normalizedEmail);

        const errMsgLower = error.message?.toLowerCase() || '';
        const errCode = (error as any).code;

        // E-mail não confirmado
        if (errMsgLower.includes('email not confirmed') || errCode === 'email_not_confirmed') {
          return {
            success: false,
            needsEmailConfirmation: true,
            error:
              'E-mail não confirmado no Supabase. Verifique sua caixa de entrada para confirmar a conta.',
            rawError: { message: error.message, status: error.status, code: errCode },
          };
        }

        // Rate Limit pelo Supabase
        if (error.status === 429 || errMsgLower.includes('too many requests')) {
          return {
            success: false,
            error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
            rawError: { message: error.message, status: error.status, code: errCode },
          };
        }

        // Problema de Conexão / Rede
        if (
          errMsgLower.includes('failed to fetch') ||
          errMsgLower.includes('networkerror') ||
          error.status === 0 ||
          (error.status && error.status >= 500)
        ) {
          return {
            success: false,
            error: `Falha de conexão com o Supabase (${error.message || 'NetworkError'}). Tente novamente.`,
            rawError: { message: error.message, status: error.status, code: errCode },
          };
        }

        // Retorna a mensagem de erro original do Supabase
        return {
          success: false,
          error: error.message || 'E-mail ou senha incorretos.',
          rawError: { message: error.message, status: error.status, code: errCode },
        };
      }

      resetLoginAttempts(normalizedEmail);
      return { success: true, user: data.user, session: data.session };
    } catch (err: any) {
      console.error('[Supabase Auth Login Exception]', err);
      recordFailedLoginAttempt(normalizedEmail);
      return {
        success: false,
        error: err.message || 'Não foi possível conectar. Tente novamente.',
        rawError: { message: err.message, status: 0, code: 'EXCEPTION' },
      };
    }
  }

  // Verificação no banco de dados local simulado (somente quando Supabase URL não estiver configurada)
  const raw = localStorage.getItem(STORAGE_KEYS.SIMULATED_USERS);
  const users: Record<string, any> = raw ? JSON.parse(raw) : {};
  const registeredUser = users[normalizedEmail];

  if (registeredUser) {
    if (registeredUser.password !== pass) {
      recordFailedLoginAttempt(normalizedEmail);
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    resetLoginAttempts(normalizedEmail);
    return { success: true, user: registeredUser };
  }

  // Contas padrão de demonstração do Poupagaio (mateus@email.com, luana@email.com)
  if (
    (normalizedEmail === 'mateus@email.com' || normalizedEmail === 'luana@email.com') &&
    pass.length >= 8
  ) {
    resetLoginAttempts(normalizedEmail);
    return {
      success: true,
      user: {
        id: normalizedEmail === 'luana@email.com' ? 'user-luana-02' : 'user-mateus-01',
        email: normalizedEmail,
        full_name: normalizedEmail === 'luana@email.com' ? 'Luana Souza' : 'Mateus Araujo',
        email_confirmed: true,
      },
    };
  }

  recordFailedLoginAttempt(normalizedEmail);
  return { success: false, error: 'E-mail ou senha incorretos.' };
}

/**
 * Atualiza a senha do usuário autenticado no Supabase Auth
 */
export async function updateUserPasswordWithSupabase(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.warn('[Supabase Update Password Warning]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Update Password Exception]', err);
    return { success: false, error: 'Não foi possível alterar a senha. Tente novamente.' };
  }
}

/**
 * Atualiza metadados do perfil do usuário no Supabase Auth
 */
export async function updateUserProfileMetadataWithSupabase(metadata: { full_name?: string; phone?: string }): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }
  try {
    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) {
      console.warn('[Supabase Update Metadata Warning]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Update Metadata Exception]', err);
    return { success: false, error: err.message };
  }
}

