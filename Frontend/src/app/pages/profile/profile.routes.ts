import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { ProjectsComponent } from './projects/projects.component';
import { UserInfoComponent } from './user-info/user-info.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: ProfileComponent,
        children: [
            // { path: '', redirectTo: 'projects', pathMatch: 'full' },
            { path: 'projects', component: ProjectsComponent, data: { breadcrumb: 'Projects' }, canActivate: [AuthGuard] },
            { path: 'user-info', component: UserInfoComponent, data: { breadcrumb: 'User Information' }, canActivate: [AuthGuard] }
        ]
    }
];
