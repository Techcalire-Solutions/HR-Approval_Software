import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Settings, SettingsService } from './services/settings.service';
import { NgClass } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './common/interceptors/token.interceptor';
import { environment } from '../environments/environment';
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

  ngOnInit() {
    this.setFavicon();
    // document.body.classList.add(`${environment.theme}-theme`);
  }

  setFavicon() {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || 
                 document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = environment.faviconPath;
    console.log(link);
    
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}
