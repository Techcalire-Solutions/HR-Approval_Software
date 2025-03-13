import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { UserPersonal } from '../../../common/interfaces/users/user-personal';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-birthday',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule,],
  templateUrl: './birthday.component.html',
  styleUrl: './birthday.component.scss'
})
export class BirthdayComponent implements OnInit, OnDestroy{
  userService = inject(UsersService);

  ngOnInit(): void {
    this.getBirthdays();
  }

  birthSub!: Subscription;
  birthdaysThisMonth: UserPersonal[] = [];
  getBirthdays(){
    this.birthSub = this.userService.getBirthdays().subscribe(res=>{
      this.birthdaysThisMonth = res;
    })
  }

  ngOnDestroy(): void {
    this.birthSub?.unsubscribe();
  }
router=inject(Router)
  openDraft(name: string) {

      this.router.navigate(['login/mail/birthday-draft', name]);
    }
  
}
