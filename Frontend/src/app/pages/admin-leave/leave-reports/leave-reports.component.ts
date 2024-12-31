import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-leave-reports',
  standalone: true,
  imports: [
    CommonModule, // Required for *ngFor and *ngIf
  ],
  templateUrl: './leave-reports.component.html',
  styleUrl: './leave-reports.component.scss'
})
export class LeaveReportsComponent {
  ngOnInit() {
    console.log(this.employees); // Check if employees data is loaded
  }
  
  employees = [
    {
      id: 'OAC-2020-1',
      name: 'Sijin',
      leaveDetails: [
        {
          type: 'Sick Leave',
          monthlyData: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // Monthly leave counts
          total: 6
        },
        {
          type: 'Casual Leave',
          monthlyData: [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0],
          total: 6
        },
        {
          type: 'Comb Leave Taken',
          monthlyData: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
          total: 2
        },
        {
          type: 'LOP',
          monthlyData: [0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0],
          total: 5
        },
        {
          type: 'Total Absence',
          monthlyData: [1, 2, 1, 2, 4, 1, 2, 1, 1, 2, 2, 0],
          total: 20
        }
      ]
    },
    // Add other employees in the same format as above
  ];
  
}
