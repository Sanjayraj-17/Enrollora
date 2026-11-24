
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
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-student-layout',
  styleUrl: './student-layout.css',
  templateUrl: './student-layout.html',
})
export class StudentLayout {

  private authService = inject(AuthService);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  get studentName(): string {
    return this.tokenService.getName() || 'Student';
  }

  get studentEmail(): string {
    return this.tokenService.getEmail() || 'Learning Portal';
  }

  get studentInitial(): string {
    return this.studentName.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
