import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-facial-recognition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facial-recognition.component.html',
  styleUrl: './facial-recognition.component.css',
})
export class FacialRecognitionComponent implements OnInit, AfterViewInit {
  @ViewChild('webcamVideo') webcamVideo!: ElementRef;
  private videoElement!: HTMLVideoElement;
  @ViewChild('canvas') canvas!: ElementRef;
  private canvasElement!: HTMLCanvasElement;
  private canvasContext!: CanvasRenderingContext2D | null;

  errorMessage: string | null = null;
  videoStream: MediaStream | null = null;
  isCameraActive = false;
  capturedFrame: string | null = null;
  scanResults: any = null; // Adjust the type based on your scan results

  ngOnInit(): void {
    // Initialization, if needed
  }

  ngAfterViewInit(): void {
    this.videoElement = this.webcamVideo.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
  }

  startWebcam(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          this.videoStream = stream;
          this.videoElement.srcObject = stream;
          this.isCameraActive = true;
        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
          this.errorMessage = this.getErrorMessage(error);
          this.isCameraActive = false;
        });
    } else {
      this.errorMessage = 'Webcam access not supported.';
      this.isCameraActive = false;
    }
  }

  stopWebcam(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
      this.videoElement.srcObject = null;
      this.isCameraActive = false;
      this.capturedFrame = null;
      this.scanResults = null;
      this.errorMessage = null;
    }
  }

  cancelRecognition(): void {
    this.stopWebcam();
    // Add any other cancellation logic here
  }

  captureFrame(): void {
    if (this.videoElement && this.canvasElement && this.canvasContext) {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      this.capturedFrame = this.canvasElement.toDataURL('image/png');
    }
  }

  scanFace(): void {
    if (this.capturedFrame) {
      // In a real application, you would send this capturedFrame data
      // to a facial recognition service or use a client-side library.
      // For this example, we'll just simulate a result.
      console.log('Captured Frame Data:', this.capturedFrame);
      setTimeout(() => {
        this.scanResults = {
          faceDetected: true,
          confidence: 0.95,
          userId: 'user123',
        };
      }, 1000); // Simulate processing time
    } else {
      console.warn('No frame captured to scan.');
    }
  }

  getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied by the user.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera device found.';
    } else {
      return 'Failed to access the camera: ' + error.message;
    }
  }
}
