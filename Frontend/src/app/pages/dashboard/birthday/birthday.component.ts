import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { UserPersonal } from '../../../common/interfaces/users/user-personal';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '@services/role.service';

@Component({
  selector: 'app-birthday',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, CommonModule],
  templateUrl: './birthday.component.html',
  styleUrl: './birthday.component.scss'
})
export class BirthdayComponent implements OnInit, OnDestroy {
  userService = inject(UsersService);
  roleService=inject(RoleService)
  canAccessDraft: boolean = false;
  roleName: string = '';
  ngOnInit(): void {
       this.checkUserRole();
    this.getBirthdays();
      const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role

    

  }


 private roleSub!: Subscription;
  isLoading: boolean = true;
  checkUserRole(): void {
    try {
      const tokenData = localStorage.getItem('token');
      if (!tokenData) {
        this.isLoading = false;
        return;
      }

      const authData = JSON.parse(tokenData);
      // Check both possible locations for roleId
      const roleId = authData.role || authData.token?.roleId;
      
      if (!roleId) {
        console.error('Role ID not found in token data');
        this.isLoading = false;
        return;
      }

      this.getRoleById(roleId);
    } catch (error) {
      console.error('Error parsing token:', error);
      this.isLoading = false;
    }
  }

  getRoleById(id: number): void {
    this.roleSub = this.roleService.getRoleById(id).subscribe({
      next: (role) => {
        this.roleName = role.roleName;
        this.canAccessDraft = ['Super Administrator', 'HR Administrator', 'Super Admin'].includes(this.roleName);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching role:', err);
        const tokenData = JSON.parse(localStorage.getItem('token') || '{}');
        if (tokenData.name && ['Super Admin', 'HR Admin'].includes(tokenData.name)) {
          this.canAccessDraft = true;
        }
        this.isLoading = false;
      }
    });
  }


  birthSub!: Subscription;
  birthdaysThisMonth: UserPersonal[] = [];
  getBirthdays() {
    this.birthSub = this.userService.getBirthdays().subscribe(res => {
      this.birthdaysThisMonth = res;
    })
  }

  ngOnDestroy(): void {
    this.birthSub?.unsubscribe();
  }
  router=inject(Router)
  openDraft(id: number) {

      this.router.navigate(['login/mail/birthday-draft', id]);
    }

  isTodayBirthday(dateOfBirth: string | Date): boolean {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
  }


}
