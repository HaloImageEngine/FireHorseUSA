import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-media',
  imports: [NgIf],
  templateUrl: './media.component.html',
  styleUrl: './media.component.scss',
})
export class MediaComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  statusMessage = '';

  // TODO: adjust this URL to your actual REST API endpoint
  private readonly uploadUrl = 'https://your-api.example.com/upload';

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      this.previewUrl = null;
      return;
    }

    const file = input.files[0];
    this.selectedFile = file;
    this.statusMessage = '';

    // Create a local preview URL
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadImage(): void {
    if (!this.selectedFile) {
      this.statusMessage = 'Please select an image first.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.isUploading = true;
    this.statusMessage = '';

    this.http.post(this.uploadUrl, formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.statusMessage = 'Image uploaded successfully.';
      },
      error: () => {
        this.isUploading = false;
        this.statusMessage = 'Failed to upload image. Please try again.';
      },
    });
  }

}
