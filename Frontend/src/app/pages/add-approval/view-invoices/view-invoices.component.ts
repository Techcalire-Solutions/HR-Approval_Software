import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { VerificationDialogueComponent } from '../view-approval/verification-dialogue/verification-dialogue.component';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SafePipe } from './safe.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformaInvoiceStatus } from '../../../common/interfaces/performa-invoice-status';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-view-invoices',
  standalone: true,
  imports: [
    RouterModule,
    MatTableModule,
    MatCardModule,
    CommonModule,
    MatIconModule,
    SafePipe,
    MatProgressSpinnerModule


  ],
  templateUrl: './view-invoices.component.html',
  styleUrl: './view-invoices.component.scss'
})
export class ViewInvoicesComponent {
  displayedColumns: string[] = ['supplierName', 'supplierPoNo', 'supplierPrice', 'purpose', 'customerName', 'customerPoNo', 'poValue'];
  // dataSource = new MatTableDataSource(ELEMENT_DATA);
  ngOnDestroy(): void {

  }

  constructor(private route: ActivatedRoute, private invoiceService: InvoiceService, private dialog: MatDialog, private snackBar: MatSnackBar,
    private router: Router, private loginService: LoginService
  ){}

  ngOnInit(): void {
    let id = this.route.snapshot.params['id'];
    console.log('idddd',id);

    this.getPiById(id)
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  roleSub!: Subscription;
  roleName!: string;
  sp: boolean = false;
  kam: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      if(this.roleName === 'Sales Executive') this.sp = true;
      if(this.roleName === 'Key Account Manager') this.kam = true;
      if(this.roleName === 'Manager') this.am = true;
      if(this.roleName === 'Accountant') this.ma = true;
    })
  }

  piSub!: Subscription;
  url!: string;
  piNo!: string;
  pi!: PerformaInvoice;
  bankSlip!: string;
  signedUrl:string;
  getPiById(id: number){
    console.log('hihihh');

    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      console.log('pi',pi);

      this.pi = pi.pi;
      this.piNo = pi.pi.piNo;
      this.signedUrl= pi.signedUrl
      // this.url = environment.apiUrl + pi.url;
      if(pi.pi.bankSlip != null) this.bankSlip = pi.bankSlip;
      this.getPiStatusByPiId(id)
    });
  }
  filterValue: string
  statusSub!: Subscription;
  status: PerformaInvoiceStatus[] = [];
  getPiStatusByPiId(id: number){
    this.statusSub = this.invoiceService.getPIStatusByPIId(id, this.filterValue).subscribe(status => {
      console.log(status);
      this.status = status;
    });
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    this.getPiById(this.route.snapshot.params['id'])
  }
  submittingForm: boolean = false;
  verified(value: string){
    this.submittingForm = true;
    let status = this.pi.status;
    console.log(this.pi);

    let sp = this.pi.salesPerson.name

    if(status === 'GENERATED' && value === 'approved') status = 'KAM VERIFIED';
    else if(status === 'GENERATED' && value === 'rejected') status = 'KAM REJECTED';
    else if(status === 'KAM VERIFIED' && value === 'approved') status = 'AM VERIFIED';
    else if(status === 'KAM VERIFIED' && value === 'rejected') status = 'AM REJECTED';
    // else if(status === 'AM VERIFIED' ) return this.addBankSlip(this.pi.id, this.piNo)

    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: this.piNo, status: status, sp: sp }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.submittingForm = true;
        let data = {
          status: status,
          performaInvoiceId: this.pi.id,
          remarks: result.remarks,
          amId: result.amId,
          accountantId: result.accountantId
        }
        console.log(data);

        this.invoiceService.updatePIStatus(data).subscribe(result => {
          console.log(result);

          this.submittingForm = false;
          this.router.navigateByUrl('/home/invoice/view')
          this.snackBar.open(`Invoice ${this.piNo} updated to ${status}...`,"" ,{duration:3000})
        });
      }
    })
  }
  // statusSub!: Subscription;
  // status: PerformaInvoiceStatus[] = [];
  // getPiStatusByPiId(id: number){
  //   this.statusSub = this.invoiceService.getPIStatusByPIId(id, this.filterValue).subscribe(status => {
  //     console.log(status);
  //     this.status = status;
  //   });
  // }
  addBankSlip(piNo: string){
    // let id = this.pi.id;
    // let sp = this.pi.salesPerson.name;

    // const dialogRef = this.dialog.open(AttachBankSlipComponent, {
    //   data: { invoiceNo: piNo, id: id }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if(result){
    //     this.getPiById(id)
    //     this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
    //     // this.invoiceService.updatePIStatusWithBankSlip(data).subscribe(result => {
    //     //   console.log(result);
    //     // });
    //   }
    // })
  }
}

