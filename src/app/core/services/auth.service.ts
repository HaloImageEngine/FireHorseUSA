import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // User ID signal
  private userIdSignal = signal<string | null>(null);
  // User Alias signal
  private userAliasSignal = signal<string | null>(null);

  /**
   * Get the current userId value
   */
  getUserId(): string | null {
    return this.userIdSignal();
  }

  /**
   * Set the userId (called from header or login components)
   */
  setUserId(userId: string | null): void {
    this.userIdSignal.set(userId);
  }

  /**
   * Get the current userAlias value
   */
  getUserAlias(): string | null {
    return this.userAliasSignal();
  }

  /**
   * Set the userAlias (called from header or login components)
   */
  setUserAlias(userAlias: string | null): void {
    this.userAliasSignal.set(userAlias);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const userId = this.getUserId() || this.getUserIdFromCookie();
    const userAlias = this.getUserAlias() || this.getUserAliasFromCookie();
    return !!(userId && userAlias);
  }

  /**
   * Get userId from cookies (fallback method)
   */
  getUserIdFromCookie(): string | null {
    try {
      if (typeof document === 'undefined') return null;
      const authCookie = this.getCookie('fhUserAuth');
      if (authCookie) {
        const authData = JSON.parse(authCookie);
        return authData?.userId || authData?.UserId || null;
      }
    } catch (err) {
      console.error('Error reading userId from cookie', err);
    }
    return null;
  }

  /**
   * Get userAlias from cookies (fallback method)
   */
  getUserAliasFromCookie(): string | null {
    try {
      if (typeof document === 'undefined') return null;
      return this.getCookie('useralias');
    } catch (err) {
      console.error('Error reading userAlias from cookie', err);
    }
    return null;
  }

  /**
   * Read a cookie by name
   */
  private getCookie(name: string): string | null {
    try {
      if (typeof document === 'undefined') return null;
      const match = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(name + '='));
      if (!match) return null;
      return decodeURIComponent(match.substring(name.length + 1));
    } catch {
      return null;
    }
  }
}
