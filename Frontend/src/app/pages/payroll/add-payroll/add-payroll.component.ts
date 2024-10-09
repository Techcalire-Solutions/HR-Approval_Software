import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../common/interfaces/user';

@Component({
  selector: 'app-add-payroll',
  standalone: true,
  imports: [ReactiveFormsModule,],
  templateUrl: './add-payroll.component.html',
  styleUrl: './add-payroll.component.scss'
})
export class AddPayrollComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    
  }

  ngOnInit(): void {
    this.getUserById();
    this.payrollForm.valueChanges.subscribe(() => {
      this.calculatePayroll();
    });
  }
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  userService = inject(UsersService);

  payrollForm = this.fb.group({
    basicPay: <any>[, Validators.required],
    yearbasicPay: <any>[, Validators.required],
    hra: <any>[, Validators.required],
    yearhra: <any>[, Validators.required],
    conveyanceAllowance: <any>[, Validators.required],
    yearconveyanceAllowance: <any>[, Validators.required],
    lta: <any>[],
    yearlta: <any>[],
    specialAllowance: <any>[],
    providentFund: <any>[, Validators.required],
    insurance: <any>[],
    grativity: <any>[],
    userName: [''],
    userRole: ['']
  });

  userSub: Subscription;
  user: User
  getUserById(){
    this.userSub = this.userService.getUserById(this.route.snapshot.params['id']).subscribe(res => {
      this.user = res
      console.log(res);
      
      this.payrollForm.get('userName')?.setValue(this.user.name);
      this.payrollForm.get('userRole')?.setValue(this.user.role.roleName)
    })
  } 

  grossPay: number = 0;
  calculatePayroll() {
    this.payrollForm.get('basicPay')?.valueChanges.subscribe(() => {
      let bp: any = this.payrollForm.get('basicPay')?.value;
      let ybp = 12 * bp;
      this.payrollForm.patchValue({ yearbasicPay: ybp }, { emitEvent: false })
    });

    this.payrollForm.get('hra')?.valueChanges.subscribe(() => {
      let hr: any = this.payrollForm.get('hra')?.value;
      let yhr = 12 * hr;
      this.payrollForm.patchValue({ yearhra: yhr }, { emitEvent: false })
    });

    this.payrollForm.get('conveyanceAllowance')?.valueChanges.subscribe(() => {
      let conveyanceAllowance: any = this.payrollForm.get('conveyanceAllowance')?.value;
      let yca = 12 * conveyanceAllowance;
      this.payrollForm.patchValue({ yearconveyanceAllowance: yca }, { emitEvent: false })
    });

    this.payrollForm.get('lta')?.valueChanges.subscribe(() => {
      let bp: any = this.payrollForm.get('lta')?.value;
      let ylta = 12 * bp;
      this.payrollForm.patchValue({ yearlta: ylta }, { emitEvent: false })
    });
    
    const formValues = this.payrollForm.value;
    if(formValues){
    // this.grossPay = 
    // +formValues.basicPay +
    // +formValues.hra +
    // +formValues.travelAllowance +
    // +formValues.bonuses +
    // +formValues.overtimePay +
    // +formValues.commissions;

  // Calculate Deductions
  // const totalDeductions = 
  //   +formValues.incomeTax +
  //   +formValues.providentFund +
  //   +formValues.insurance +
  //   +formValues.loanDeductions;

  // // Calculate Net Pay
  // this.netPay = this.grossPay - totalDeductions;
    }
  }
}
