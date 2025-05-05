import { Component, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-visitor-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './visitor-header.component.html',
  styleUrl: './visitor-header.component.css',
})
export class VisitorHeaderComponent {
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
        this.router.navigate(['/visitor-signin']); // Adjust the route as needed
      },
      error: (error) => {
        console.error('Error signing out:', error);
        // Optionally, display an error message to the user
      },
    });
  }
}
