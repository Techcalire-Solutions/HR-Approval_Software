/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LeaveService } from '@services/leave.service';
import { single, Subscription } from 'rxjs';
import { multi } from '../../../employee-leave/data/charts.data';
import { LeaveType } from '../../../../common/interfaces/leaves/leaveType';

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
    const user = JSON.parse(token);
    this.userId = user.id;
    this.getLeaveType()
  }

  private ltSub!: Subscription;
  leaveTypes: LeaveType[] = [];
  getLeaveType(): void {
    this.ltSub = this.leaveService.getLeaveType().subscribe({
      next: (leaveTypes) => {
        this.leaveTypes = leaveTypes;
        this.fetchLeaveCounts(); // Call fetchLeaveCounts after leaveTypes are fetched
      },
      error: (error) => {
        console.error('Error fetching leave types:', error);
        this.errorMessage = 'Unable to fetch leave types.';
      }
    });
  }

  fetchLeaveCounts(): void {
    this.leaveCounts = []; // Reset leaveCounts array
    this.hasLeaveCounts = false; // Reset hasLeaveCounts flag
    this.errorMessage = ''; // Reset error message

    if (!this.leaveTypes || this.leaveTypes.length === 0) {
      this.errorMessage = 'No leave types available.';
      return;
    }

    // Fetch leave counts for each leave type
    this.leaveTypes.forEach((leaveType) => {
      this.leaveService.getLeaveCounts(this.userId, leaveType.id).subscribe({
        next: (response) => {
          this.leaveCounts.push({ ...response, leaveType: leaveType.leaveTypeName });

          // Update the single array for the chart
          this.single = this.leaveCounts.map(leave => ({
            name: leave.leaveType,
            value: leave.leaveBalance
          }));

          // If all leave counts have been fetched, set hasLeaveCounts to true
          if (this.leaveCounts.length === this.leaveTypes.length) {
            this.hasLeaveCounts = true;
          }
        },
        error: (error) => {
          console.error('Error fetching leave counts:', error);
          this.errorMessage = 'Failed to fetch leave records for some leave types.';

          // If an error occurs, still check if some leave counts were fetched
          if (this.leaveCounts.length > 0) {
            this.hasLeaveCounts = true;
            this.single = this.leaveCounts.map(leave => ({
              name: leave.leaveType,
              value: leave.leaveBalance
            }));
          }
        }
      });
    });
  }


  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartColors: any[] = [
    {
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] // Add more colors if needed
    }
  ];

  public onSelect(event: any) {
    console.log(event);
  }

  getChartData() {

  }
  ngOnDestroy() {

  }
}

