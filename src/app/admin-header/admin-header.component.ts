import { Component, HostListener, OnInit, effect } from '@angular/core'; // Added 'effect'
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service'; // Import UserData
import { QrCodeService } from '../qrcode.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Added MatSnackBar and MatSnackBarModule

// Minimal interface for QR data, matching what QrCodeService expects
interface CurrentUserForQr {
  uid: string;
  name: string;
  role: string;
  phoneNumber?: string | null;
}

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterModule, CommonModule, MatSnackBarModule], // Added MatSnackBarModule
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css',
})
export class AdminHeaderComponent implements OnInit {
  // Use 'public' for authService if you directly use it in the template, otherwise 'private' is fine.
  constructor(
    public authService: AuthService,
    private router: Router,
    private qrCodeService: QrCodeService,
    private snackBar: MatSnackBar // Inject MatSnackBar for local messages
  ) {
    // Use an effect to reactively update currentUser whenever authService.currentUserData changes
    effect(() => {
      const user = this.authService.currentUserData(); // Access the signal value
      if (user && user.uid && user.name && user.role) {
        this.currentUser = {
          uid: user.uid,
          name: user.name,
          role: user.role,
          phoneNumber: user.phoneNumber || null,
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  isUserMenuOpen = false;
  currentUser: CurrentUserForQr | null = null; // To hold the current user's data for QR generation

  ngOnInit(): void {
    // ngOnInit is typically for one-time initialization.
    // For reactive updates based on signals, the 'effect' in the constructor is more suitable.
    // You can leave this empty or add other one-time setup logic.
  }

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

  /**
   * Triggers the QR code download for the currently logged-in user.
   */
  async downloadCurrentUserQrCode() {
    if (this.currentUser) {
      // The qrCodeService.downloadQrCode method will handle its own snackbar messages.
      await this.qrCodeService.downloadQrCode(this.currentUser);
    } else {
      // If currentUser is null, display a local snackbar message
      this.snackBar.open(
        'Cannot download QR Code: User data not available or still loading.',
        undefined,
        { duration: 4000, panelClass: ['warning-snackbar'] }
      );
      console.warn(
        'Attempted to download QR code, but currentUser data was not available.'
      );
    }
    // Close the dropdown menu after the action
    this.isUserMenuOpen = false;
  }

  signOut() {
    this.authService.signout().subscribe({
      next: () => {
        console.log('Successfully signed out!');
        this.router.navigate(['/admin-signin']);
      },
      error: (error) => {
        console.error('Error signing out:', error);
        this.snackBar.open('Signout Failed: ' + error.message, undefined, {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }
}
