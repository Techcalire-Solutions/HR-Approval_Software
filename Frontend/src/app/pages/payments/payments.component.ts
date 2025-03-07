import { Component, inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { ViewApprovalComponent } from './view-approval/view-approval.component';
import { ViewExpenseComponent } from './expense/view-expense/view-expense.component';
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [MatCardModule, MatTabsModule, MatIconModule, ViewApprovalComponent, ViewExpenseComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit{
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    // this.user = user.id;
    let roleId = user.role
    this.getRoleById(roleId);
  }

  @ViewChildren('viewApproval') viewApprovalComponents!: QueryList<ViewApprovalComponent>;
  @ViewChildren('viewExpense') viewExpenseComponent!: QueryList<ViewExpenseComponent>;
  data: any;
  private invoiceService = inject(InvoiceService);
  isSubmitted!: true;
  status: string = '';
  header: string = '';
  pageStatus: boolean = true;
  dataToPass: any;

  roleSub!: Subscription;
  roleName!: string;
  sp: boolean = false;
  kam: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  admin: boolean = false;
  teamLead: boolean = false;
  pendingHeader : string = '';
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;  
      if(!this.isSubmitted){
        if(this.roleName === 'Sales Executive' || this.roleName === 'Team Lead') { 
          this.status = 'GENERATED'; this.sp = true; this.header = 'REJECTED'; this.pendingHeader='GENERATED'
         }
        if(this.roleName === 'Key Account Manager') { 
          this.status = 'GENERATED'; this.kam = true; this.header = 'AM REJECTED'; this.pendingHeader='GENERATED'
        }
        if(this.roleName === 'Manager') { 
          this.status = 'KAM VERIFIED'; this.am = true; this.header = 'REJECTED'; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Accountant') { 
          this.status = 'AM VERIFIED'; this.ma = true; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Administrator' || this.roleName === 'Super Administrator') { this.admin = true, this.status = '' }
        if(this.roleName === 'Team Lead') { this.teamLead = true }
      }else{
        this.status = '';
        this.pageStatus = false;
        if(this.roleName === 'Sales Executive') { 
          this.sp = true; this.header = 'REJECTED'; this.pendingHeader='GENERATED'
         }
        if(this.roleName === 'Key Account Manager') { 
          this.kam = true; this.header = 'AM REJECTED'; this.pendingHeader='GENERATED'
        }
        if(this.roleName === 'Manager') { 
          this.am = true; this.header = 'REJECTED'; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Accountant') { 
          this.ma = true; this.pendingHeader='VERIFIED'
        }
      }
      this.data = {
        status: this.status,
        roleName: this.roleName,
        sp: this.sp,
        kam: this.kam,
        am: this.am,
        ma: this.ma,
        admin: this.admin,
        teamLead: this.teamLead,
        pageStatus: this.pageStatus
      }
      this.onTabChange(0)
    })
  }

  onTabChange(event: number) {
    switch (this.roleName) {
      case 'Sales Executive':
        switch (event) {
          case 0:
            this.data.status = 'GENERATED';
            this.data.pageStatus = true;
            break;
          case 1:
            this.data.status = 'BANK SLIP ISSUED';
            this.data.pageStatus = false;
            break;
          case 2:
            this.data.status = 'REJECTED';
            this.data.pageStatus = false;
            break;
          case 3:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          case 3:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          default:
            this.data.status = 'GENERATED';
            this.data.pageStatus = false;
            break;
        };
        break;
      case 'Key Account Manager':
        switch (event) {
          case 0:
            this.data.status = 'GENERATED';
            this.data.pageStatus = true;
            break;
          case 1:
            this.data.status = 'BANK SLIP ISSUED';
            this.data.pageStatus = false;
            break;
          case 2:
            this.data.status = 'AM REJECTED';
            this.data.pageStatus = false;
            break;
          case 3:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          default:
            this.data.status = 'GENERATED';
            this.data.pageStatus = false;
            break;
        }
        break;
      case 'Manager':
        switch (event) {
          case 0:
            this.data.status = 'KAM VERIFIED';
            this.data.pageStatus = true;
            break;
          case 1:
            this.data.status = 'BANK SLIP ISSUED';
            this.data.pageStatus = false;
            break;
          case 2:
            this.data.status = 'REJECTED';
            this.data.pageStatus = false;
            break;
          case 3:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          case 4:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          default:
            this.data.status = 'KAM VERIFIED';
            this.data.pageStatus = false;
            break;
        } 
        break;
      case 'Accountant':
        switch (event) {
          case 0:
            this.data.status = 'AM VERIFIED';
            this.data.pageStatus = false;
            break;
          case 1:
            this.data.status = 'BANK SLIP ISSUED';
            this.data.pageStatus = false;
            break;
          case 2:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          case 3:
            this.data.status = '';
            this.data.pageStatus = false;
            break;
          default:
            this.data.status = 'AM VERIFIED';
            break;
        } 
        break;

        case 'Administrator':
          case 'Super Administrator':
            switch (event) {
              case 0:
                this.data.status = '';
                this.data.pageStatus = true;
                break;
              case 1:
                this.data.status = '';
                this.data.pageStatus = false;
                break;
              default:
                this.data.status = '';
                this.data.pageStatus = false;
                break;
            }
            break;
        default:
          switch (event) {
            case 0:
              this.data.status = 'GENERATED';
              break;
            case 1:
              this.data.status = 'BANK SLIP ISSUED';
              break;
            case 2:
              this.data.status = 'AM REJECTED';
              break;
            case 3:
              this.data.status = '';
              break;
            default:
              this.data.status = 'GENERATED';
              break;
          }
          break;
    }
    if (event === 4 && this.viewExpenseComponent.length > 0 ) {
      const activeComponent = this.viewExpenseComponent.toArray()[0]; // or correct index if it's not 0
      if (activeComponent) {
        activeComponent.loadData(this.data);
      } 
    }else if (event === 3 && this.viewExpenseComponent.length > 0 && this.roleName === 'Accountant') {
      const activeComponent = this.viewExpenseComponent.toArray()[0]; // or correct index if it's not 0
      if (activeComponent) {
        activeComponent.loadData(this.data);
      } 
    } else if (event === 0 && this.viewApprovalComponents.length > 0 && (this.roleName === 'Administrator' || this.roleName === 'Super Administrator')) {
      const activeComponent = this.viewApprovalComponents.toArray()[0]; 
      if (activeComponent) {
        activeComponent.loadData(this.data);
      } 
    }  else if (event === 1 && this.viewExpenseComponent.length > 0 && (this.roleName === 'Administrator' || this.roleName === 'Super Administrator')) {
      const activeComponent = this.viewExpenseComponent.toArray()[0]; 
      if (activeComponent) {
        activeComponent.loadData(this.data);
      } 
    } else if (this.viewApprovalComponents.length > 0) {
      const activeComponent = this.viewApprovalComponents.toArray()[event];
      if (activeComponent) {
        activeComponent.loadData(this.data);
      } 
    }

  }
  
}
