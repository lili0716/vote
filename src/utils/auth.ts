const TOKEN_KEY = "token";
const USERNAME_KEY = "username";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  const token = getToken();
  return typeof token === "string" && token.trim().length > 0;
}

export function setLogin(token: string, username?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  if (username) localStorage.setItem(USERNAME_KEY, username);
}

export function clearLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}
