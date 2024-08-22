import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { ProjectsComponent } from './projects/projects.component';
import { UserInfoComponent } from './user-info/user-info.component';

export const routes: Routes = [
    {
        path: '',
        component: ProfileComponent,
        children: [
            { path: '', redirectTo: 'projects', pathMatch: 'full' },
            { path: 'projects', component: ProjectsComponent, data: { breadcrumb: 'Projects' } },
            { path: 'user-info', component: UserInfoComponent, data: { breadcrumb: 'User Information' } }
        ]
    }
];