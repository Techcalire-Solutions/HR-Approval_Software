import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Settings, SettingsService } from './services/settings.service';
import { NgClass } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './common/interceptors/token.interceptor';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgClass,
    MatProgressSpinnerModule,
    HttpClientModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  settingsService = inject(SettingsService);
  settings: Settings = this.settingsService.settings;

  ngAfterViewInit(){
    
    setTimeout(() => {
      this.settings.loadingSpinner = false; 
    });  
  }
}
