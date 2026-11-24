
import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { TokenService } from '../../core/auth/token.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  get adminName(): string {
    return this.tokenService.getName() || 'Administrator';
  }

  get adminEmail(): string {
    return this.tokenService.getEmail() || 'System Admin';
  }

  get adminInitial(): string {
    return this.adminName.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
