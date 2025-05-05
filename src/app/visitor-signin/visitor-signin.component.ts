import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-visitor-signin',
  standalone: true,
  imports: [RouterModule, MainHeaderComponent, FormsModule, CommonModule],
  templateUrl: './visitor-signin.component.html',
  styleUrl: './visitor-signin.component.css',
})
export class VisitorSigninComponent {
  authservice = inject(AuthService);
  router = inject(Router);

  userData = {
    email: '',
    password: '',
  };

  onSubmit(): void {
    this.authservice
      .signin(this.userData.email, this.userData.password)
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/visitor-dashboard');
        },
        error: (error) => {
          console.error('Sign-in failed:', error);
          let errorMessage = 'Sign-in Failed. Please try again.';
          if (error & error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        },
      });
  }

  async signInWithFacebook() {
    try {
      await this.authservice.facebookLogin();
      this.router.navigateByUrl('/visitor-dashboard');
    } catch (error) {
      // Handle login error (e.g., display error message)
    }
  }
}
