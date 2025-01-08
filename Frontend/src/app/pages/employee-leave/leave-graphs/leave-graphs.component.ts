import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { multi, single } from '../data/charts.data';
import { LeaveService } from '@services/leave.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-graphs',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    NgxChartsModule
  ],
  templateUrl: './leave-graphs.component.html',
  styleUrl: './leave-graphs.component.scss'
})
export class LeaveGraphsComponent implements OnInit, OnDestroy {

  public single: any[];
  public multi: any[];
  public showLegend = true;
  public gradient = true;
  public colorScheme: any = {
    domain: ['#2F3E9E', '#D22E2E', '#378D3B', '#0096A6', '#F47B00', '#606060']
  };
  public showLabels = true;
  public explodeSlices = false;
  public doughnut = false;

  constructor() {
    Object.assign(this, { single, multi });
  }
  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  leaveService = inject(LeaveService)
  public errorMessage: string | null = null;
  leaveCountsSubscription: Subscription
  userId: number;
  
  ngOnInit() {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.userId = user.id;
    this.fetchLeaveCounts()
  }


  errorFlag: boolean = false
  fetchLeaveCounts() {
    this.leaveCountsSubscription = this.leaveService.getLeaveCounts(this.userId).subscribe(
      (res) => {
        console.log('Response from leave service:', res);

        if (res.userLeaves && Array.isArray(res.userLeaves) && res.userLeaves.length > 0) {
          this.leaveCounts = res.userLeaves;
          this.hasLeaveCounts = true;
          this.errorMessage = '';

          this.single = this.leaveCounts.map(leave => ({
            name: leave.leaveType.leaveTypeName,
            value: leave.leaveBalance
          }));
        } else {

          this.leaveCounts = [];
          this.hasLeaveCounts = false;
          this.errorMessage = 'No leave records found for this user.';
          this.single = [];
        }
      },
      (error) => {
        console.error('Error fetching leave counts:', error);
        this.errorMessage = 'Unable to fetch leave counts.';
        this.hasLeaveCounts = false;
        this.leaveCounts = [];
        this.single = [];
      }
    );
  }




  public onSelect(event: any) {
    console.log(event);
  }

  getChartData() {

  }
  ngOnDestroy() {

  }
}

