import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'login', loadChildren:()=>import('./pages/pages.routes').then(x=>x.routes)},
    // {
    //     path: '',
    //     loadChildren: () => import('./pages/pages.routes').then(p => p.routes)
    // },
    // {
    //     path: 'landing',
    //     loadComponent: () => import('./pages/landing/landing.component').then(c => c.LandingComponent),
    // },
    // {
    //     path: 'login',
    //     loadComponent: () => import('./pages/login/login.component').then(c => c.LoginComponent),
    // },
    // {
    //     path: 'register',
    //     loadComponent: () => import('./pages/register/register.component').then(c => c.RegisterComponent),
    // },
    // {
    //     path: 'error',
    //     loadComponent: () => import('./pages/errors/error/error.component').then(c => c.ErrorComponent),
    //     data: { breadcrumb: 'Error' }
    // },
    // {
    //     path: '**',
    //     loadComponent: () => import('./pages/errors/not-found/not-found.component').then(c => c.NotFoundComponent)
    // }
];
