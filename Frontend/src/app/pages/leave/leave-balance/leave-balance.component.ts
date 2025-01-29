
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LeaveService } from '@services/leave.service';
import { DragulaModule } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { LeaveGraphsComponent } from "./leave-graphs/leave-graphs.component";
import { LeaveType } from '../../../common/interfaces/leaves/leaveType';


@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    DragulaModule,
    CommonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    LeaveGraphsComponent
],
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.scss'
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {

  selectedView: string = 'list';

  // Function triggered on toggle change
  // onToggleView(event: any): void {
  //   this.selectedView = event.value;
  // }

  public icons = ["home", "person", "alarm", "work", "mail", "favorite"];
  public colors = [, "primary", "accent", "warn"];
  userId: number;

  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  leaveService = inject(LeaveService)
  public errorMessage: string | null = null;

  leaveCountsSubscription: Subscription;
  ngOnInit() {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.userId = user.id;
    this.getLeaveType()
    // this.fetchLeaveCounts();
  }

  ltSub!: Subscription;
  leaveTypes: LeaveType[] = [];
  getLeaveType(){
    this.ltSub = this.leaveService.getLeaveType().subscribe(leaveType => {
      console.log(leaveType);
      
      this.leaveTypes = leaveType
      this.fetchLeaveCounts()
    });
  }

  fetchLeaveCounts(): void {
    this.leaveTypes.forEach((leaveType) => {
      this.leaveService.getLeaveCounts(this.userId, leaveType.id).subscribe({
        next: (response) => {
          this.leaveCounts.push({ ...response, leaveType: leaveType.leaveTypeName });
          console.log(this.leaveCounts);
          
        },
        error: (error) => {
          console.error('Error fetching leave counts:', error);
          // this.errorFlag = true;
          this.errorMessage = 'Failed to fetch leave records';
        },
      });
    });
  }

  shouldDisplayLeaveType(leaveType: LeaveType): boolean {
    // Add your logic to determine if the leave type should be displayed
    return true;
  }

  getLeaveCount(leaveType: string): any {
    return this.leaveCounts.find((leave) => leave.leaveType === leaveType);
  }
  onToggleView(event: any) {
    this.selectedView = event.value;
  }

  // errorFlag: boolean = false
  // fetchLeaveCounts() {
  //   this.leaveCountsSubscription = this.leaveService.getLeaveCounts(this.userId).subscribe(
  //     (res) => {
  //       if (res.userLeaves && Array.isArray(res.userLeaves) && res.userLeaves.length > 0) {
  //         this.leaveCounts = res.userLeaves;
  //         this.hasLeaveCounts = true;

  //         this.errorMessage = ''; // Clear any previous error messages
  //       } else {
  //         this.errorFlag = true
  //         this.leaveCounts = [];
  //         this.hasLeaveCounts = false;
  //         this.errorMessage = 'No leave records found for this user.';
  //       }
  //     },
  //     (error) => {
  //       console.error('Error fetching leave counts:', error); // Debugging line
  //       this.errorMessage = 'Unable to fetch leave counts.';
  //       this.hasLeaveCounts = false;
  //       this.leaveCounts = []; // Ensure leaveCounts is empty on error
  //     }
  //   );
  // }



  // shouldDisplayLeaveType(leaveTypeName: string): boolean {
  //   const leave = this.leaveCounts.find(leave => leave.leaveType.leaveTypeName === leaveTypeName);
  //   // return leave && (leave.takenLeaves > 0 || leave.noOfDays > 0);
  //   return leave && (leave.takenLeaves >= 0 || leave.noOfDays > 0);

  // }

  ngOnDestroy() {
    if (this.leaveCountsSubscription) {
      this.leaveCountsSubscription.unsubscribe();
    }
  }

}
