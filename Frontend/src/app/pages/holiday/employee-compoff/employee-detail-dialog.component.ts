/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-employee-compoff-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  template: `
    <div class="dialog-header">
      <div class="user-info">
        <mat-icon class="avatar-icon">account_circle</mat-icon>
        <div>
          <h2 mat-dialog-title class="title">{{ data.employee.name }}</h2>
          <span class="subtext">Emp No: {{ data.employee.empNo }} | Email: {{ data.employee.email }}</span>
        </div>
      </div>
      <button mat-icon-button (click)="onClose()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="content">
      <div class="stats-grid">
        <div class="stat-card allotted">
          <span class="stat-title">Allotted</span>
          <span class="stat-val">{{ data.employee.totalAllotted }}</span>
        </div>
        <div class="stat-card availed">
          <span class="stat-title">Availed</span>
          <span class="stat-val">{{ data.employee.takenLeaves }}</span>
        </div>
        <div class="stat-card balance">
          <span class="stat-title">Balance</span>
          <span class="stat-val">{{ data.employee.leaveBalance }}</span>
        </div>
      </div>

      <h3 class="section-title">Allotted Holidays History</h3>

      @if (data.employee.holidays && data.employee.holidays.length > 0) {
        <table class="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Holiday Name</th>
              <th>Holiday Date</th>
              <th>Type</th>
              <th>Allotted On</th>
            </tr>
          </thead>
          <tbody>
            @for (h of data.employee.holidays; track h.holidayId; let i = $index) {
              <tr>
                <td>{{ i + 1 }}</td>
                <td class="holiday-name">{{ h.holidayName }}</td>
                <td>{{ h.holidayDate | date:'dd/MM/yyyy' }}</td>
                <td><span class="type-badge">{{ h.holidayType || 'Public' }}</span></td>
                <td>{{ h.allottedAt | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="no-records">
          <mat-icon>event_busy</mat-icon>
          <p>No specific holiday allotment records found for this period.</p>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 10px;
      border-bottom: 1px solid #e0e0e0;
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        .avatar-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
          color: #1976d2;
        }
        .title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .subtext {
          font-size: 13px;
          color: #666;
        }
      }
    }
    .content {
      min-width: 500px;
      padding: 20px;
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 20px;
        .stat-card {
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          .stat-title {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
          }
          .stat-val {
            font-size: 22px;
            font-weight: 700;
            margin-top: 4px;
          }
          &.allotted {
            background: #e3f2fd;
            color: #1565c0;
          }
          &.availed {
            background: #fff3e0;
            color: #e65100;
          }
          &.balance {
            background: #e8f5e9;
            color: #2e7d32;
          }
        }
      }
      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }
      .history-table {
        width: 100%;
        border-collapse: collapse;
        th {
          background: #f1f5f9;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          color: #475569;
          border-bottom: 1px solid #cbd5e1;
        }
        td {
          padding: 10px 12px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
          .type-badge {
            background: #e0f2fe;
            color: #0284c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
          }
        }
        .holiday-name {
          font-weight: 500;
          color: #1e293b;
        }
      }
      .no-records {
        text-align: center;
        padding: 30px;
        color: #888;
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
          color: #ccc;
        }
        p {
          margin-top: 8px;
          font-size: 13px;
        }
      }
    }
  `]
})
export class EmployeeCompoffDetailDialogComponent {
  dialogRef = inject(MatDialogRef<EmployeeCompoffDetailDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}

