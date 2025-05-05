import { Component, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-staff-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './staff-header.component.html',
  styleUrl: './staff-header.component.css',
})
export class StaffHeaderComponent {
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
