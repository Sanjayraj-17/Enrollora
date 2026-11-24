
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'enrollora_token';
  private readonly ROLE_KEY = 'enrollora_role';
  private readonly NAME_KEY = 'enrollora_name';
  private readonly EMAIL_KEY = 'enrollora_email';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRole(role: string): void {
    localStorage.setItem(this.ROLE_KEY, role);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  setUserDetails(name: string, email: string): void {
    localStorage.setItem(this.NAME_KEY, name);
    localStorage.setItem(this.EMAIL_KEY, email);
  }

  getName(): string | null {
    return localStorage.getItem(this.NAME_KEY);
  }

  getEmail(): string | null {
    return localStorage.getItem(this.EMAIL_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.NAME_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
