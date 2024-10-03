import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { UserPersonal } from '../../../common/interfaces/user-personal';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-birthday',
  standalone: true,
  imports: [DatePipe, MatCardModule],
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
      console.log(res);
      this.birthdaysThisMonth = res;
    })
  }

  ngOnDestroy(): void {
    this.birthSub?.unsubscribe();
  }
}
