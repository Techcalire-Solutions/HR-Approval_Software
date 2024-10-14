
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LeaveService } from '@services/leave.service';
import { DragulaModule } from 'ng2-dragula';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    DragulaModule,
    CommonModule
  ],
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.scss'
})
export class LeaveBalanceComponent {
  public icons = [ "home", "person", "alarm", "work", "mail", "favorite"];
  public colors = [ , "primary","accent", "warn" ];
  userId : number;

  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  leaveService = inject(LeaveService)
  public errorMessage: string | null = null;

  leaveCountsSubscription: Subscription;
  ngOnInit() {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.userId = user.id;
    this.fetchLeaveCounts();
  }


  fetchLeaveCounts1() {
    this.leaveCountsSubscription= this.leaveService.getLeaveCounts(this.userId).subscribe(
       (res) => {
        console.log(res)
         if (res.userLeaves && res.userLeaves.length > 0) {
           this.leaveCounts = res.userLeaves;
           this.hasLeaveCounts = true;
         } else {
           this.leaveCounts = [];
           this.hasLeaveCounts = false;
           this.errorMessage = 'No leave records found for this user.';
         }
       },
       (error) => {
         this.errorMessage = 'Unable to fetch leave counts.';
         this.hasLeaveCounts = false;
       }
     );
   }
errorFlag :boolean = false
   fetchLeaveCounts() {
    this.leaveCountsSubscription = this.leaveService.getLeaveCounts(this.userId).subscribe(
      (res) => {
        console.log('Response from leave service:', res); // Debugging line
        if (res.userLeaves && Array.isArray(res.userLeaves) && res.userLeaves.length > 0) {
          this.leaveCounts = res.userLeaves;
          this.hasLeaveCounts = true;

          this.errorMessage = ''; // Clear any previous error messages
        } else {
          this.errorFlag = true
          this.leaveCounts = [];
          this.hasLeaveCounts = false;
          this.errorMessage = 'No leave records found for this user.';
        }
      },
      (error) => {
        console.error('Error fetching leave counts:', error); // Debugging line
        this.errorMessage = 'Unable to fetch leave counts.';
        this.hasLeaveCounts = false;
        this.leaveCounts = []; // Ensure leaveCounts is empty on error
      }
    );
  }



 shouldDisplayLeaveType(leaveTypeName: string): boolean {
  const leave = this.leaveCounts.find(leave => leave.leaveType.leaveTypeName === leaveTypeName);
  // return leave && (leave.takenLeaves > 0 || leave.noOfDays > 0);
  return leave && (leave.takenLeaves >= 0 || leave.noOfDays > 0);

}
ngOnDestroy(){
  if(this.leaveCountsSubscription){
    this.leaveCountsSubscription.unsubscribe();
  }
}

}
