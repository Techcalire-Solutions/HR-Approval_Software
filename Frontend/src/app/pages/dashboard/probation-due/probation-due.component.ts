import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { UsersService } from '@services/users.service';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { User } from '../../../common/interfaces/users/user';

@Component({
  selector: 'app-probation-due',
  standalone: true,
  imports: [MatCardModule, DatePipe],
  templateUrl: './probation-due.component.html',
  styleUrl: './probation-due.component.scss'
})
export class ProbationDueComponent {
  userService = inject(UsersService);

  ngOnInit(): void {
    this.getUsers();
  }

  usersSub!: Subscription;
  dueUsers: User[] = [];
  getUsers(){
    this.usersSub = this.userService.getProbationDues().subscribe(res=>{
      this.dueUsers = res;
      console.log(this.dueUsers);

    })
  }

  ngOnDestroy(): void {
    this.usersSub?.unsubscribe();
  }
}
