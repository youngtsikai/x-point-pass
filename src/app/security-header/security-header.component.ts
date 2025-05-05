import { Component, HostListener } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './security-header.component.html',
  styleUrl: './security-header.component.css',
})
export class SecurityHeaderComponent {
  constructor(public authService: AuthService, private router: Router) {}
  isUserMenuOpen = false;

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }

  signOut() {
    this.authService.signout().subscribe({
      next: () => {
        console.log('Successfully signed out!');
        // Optionally, navigate the user to the login page
        this.router.navigate(['/staff-signin']); // Adjust the route as needed
      },
      error: (error) => {
        console.error('Error signing out:', error);
        // Optionally, display an error message to the user
      },
    });
  }
}
