import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { LeaveTypesComponent } from '../../../pages/admin-leave/leave-types/leave-types.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatGridListModule,
    MatToolbarModule,
    MatCardModule
  ],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ApplicationsComponent implements OnInit {

  constructor(public dialog: MatDialog){ }

  ngOnInit() {
  }
  router=inject(Router)

  openLeaveTypes(): void {
    this.router.navigateByUrl('/login/admin-leave/leave-types')

  }
  openRole(): void {
    this.router.navigateByUrl('/login/role')

  }
  openTeam():void{
    this.router.navigateByUrl('/login/team')
  }
}

