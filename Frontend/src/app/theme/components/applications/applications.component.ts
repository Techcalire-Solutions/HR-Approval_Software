import { Component, Inject, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
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
  dialog=Inject(MatDialog)
  router=inject(Router)

  ngOnInit() {
  }


  openLeaveTypes(): void {
    this.router.navigateByUrl('/login/leave/leave-types')

  }
  openRole(): void {
    this.router.navigateByUrl('/login/designation')

  }
  openTeam():void{
    this.router.navigateByUrl('/login/team')
  }
  openCompany():void{
    this.router.navigateByUrl('/login/company')
  }
  openHoliday():void{
    this.router.navigateByUrl('/login/holiday')
  }

  openAssets():void{
    this.router.navigateByUrl('/login/assets')
  }
  openMail():void{
    this.router.navigateByUrl('/login/mail')
  }
}

