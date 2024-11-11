import { Component, inject } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { UserPersonal } from '../../../common/interfaces/users/user-personal';

@Component({
  selector: 'app-joining-day',
  standalone: true,
  imports: [MatCardModule, DatePipe],
  templateUrl: './joining-day.component.html',
  styleUrl: './joining-day.component.scss'
})
export class JoiningDayComponent {
  userService = inject(UsersService);

  ngOnInit(): void {
    this.getJoinings();
  }

  joinSub!: Subscription;
  joinThisMonth: UserPersonal[] = [];
  getJoinings(){
    this.joinSub = this.userService.getJoining().subscribe(res=>{
      this.joinThisMonth = res;
    })
  }

  ngOnDestroy(): void {
    this.joinSub?.unsubscribe();
  }
}
