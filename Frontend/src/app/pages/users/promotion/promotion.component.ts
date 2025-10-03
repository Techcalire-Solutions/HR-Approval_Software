import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../common/interfaces/users/user';
import { UsersService } from '@services/users.service';
import { PromotionService } from '@services/promotion.service';
import { Promotion } from '../../../common/interfaces/users/promotion';
import { DatePipe } from '@angular/common';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '@services/role.service';
import { Designation } from '../../../common/interfaces/users/designation';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Change to desired format
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Display format for the input field
    monthYearLabel: 'MMM YYYY', // Format for month/year in the header
    dateA11yLabel: 'DD/MM/YYYY', // Accessibility format for dates
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month/year
  },
};


@Component({
  selector: 'app-promotion',
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, 
    MatProgressSpinnerModule, DatePipe, MatButtonModule, MatDividerModule],
  templateUrl: './promotion.component.html',
  styleUrl: './promotion.component.scss',
  standalone: true,
  providers: [provideMomentDateAdapter(MY_FORMATS)]
})
export class PromotionComponent {
  promotionForm: FormGroup;
  employees: User[] = [];
  isLoading = false;
  promotionsHistory: Promotion[] = [];

  constructor(
    private fb: FormBuilder,
    private employeeService: UsersService,
    private promotionService: PromotionService,
    private snackBar: MatSnackBar
  ) {
    this.promotionForm = this.fb.group({
      userId: ['', Validators.required],
      designationId: ['', Validators.required],
      newSalary: ['', [Validators.required, Validators.min(0)]],
      effectiveDate: ['', Validators.required],
      promotionReason: ['', Validators.maxLength(500)],
      previousSalary: ['']
    });
  }

  private subscription: Subscription;
  private readonly payrollService = inject(PayrollService);
  ngOnInit(): void {
    this.getDesignation()
    this.getEmployeeIdFromRoute();
    this.loadPromotionsHistory();

    this.subscription = this.payrollService.currentPayrollData.subscribe(data => {
      if (data) {
        this.promotionForm.get('newSalary')?.setValue(data.current)
        this.promotionForm.get('previousSalary')?.setValue(data.old)
      }
    })

    this.subscription = this.promotionService.currentDesigData.subscribe(data => {
      if (data) {
        this.promotionForm.get('designationId')?.setValue(data)
      }
    })
  }

  private readonly roleService = inject(RoleService);
  designations: Designation[] = [];
  getDesignation(){
    this.roleService.getDesignation().subscribe(res => {
      this.designations = res;
    })
  }

  private readonly route = inject(ActivatedRoute);
  userId: number;
  getEmployeeIdFromRoute(): void {
    this.userId = this.route.snapshot.params['id'];
    this.promotionForm.get('userId')?.setValue(this.userId)
    this.loadEmployee(this.userId)
    // this.route.paramMap.subscribe(params => {
    //   this.employeeId = params.get('id');
    //   if (this.employeeId) {
    //     this.loadEmployee(this.employeeId);
    //     this.promotionForm.patchValue({ employeeId: this.employeeId });
    //   } else {
    //     this.loadAllEmployees(); // Fallback if no ID in route
    //   }
    // });
  }

  user: User;
  loadEmployee(employeeId: number): void {
    this.isLoading = true;
    this.employeeService.getUserById(employeeId).subscribe(
      (employee) => {
        this.user = employee;
        this.isLoading = false;
        this.loadPromotionsHistory();
        
        // Pre-fill form with current position and salary
        // this.promotionForm.patchValue({
        //   newPosition: employee.position,
        //   newSalary: employee.salary
        // });
      },
      (error) => {
        console.error('Error loading employee:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load employee details', 'Close', { duration: 3000 });
      }
    );
  }

  loadPromotionsHistory(): void {
    this.promotionService.getPromotionById(this.userId).subscribe(
      (promotions) => {
        this.promotionsHistory = promotions;
      },
      (error) => {
        console.error('Error loading promotion history:', error);
        this.snackBar.open('Failed to load promotion history', 'Close', { duration: 3000 });
      }
    );
  }

  private readonly router = inject(Router);
  openPayRoll(){
    this.promotionService.updateDesigData(this.promotionForm.get('designationId')?.value);
    this.router.navigateByUrl('login/users/payroll/'+this.user.id)
  }

  onSubmit(): void {
    if (this.promotionForm.invalid) {
      return;
    }

    this.isLoading = true;
    const promotionData: Promotion = {
      ...this.promotionForm.value,
      promotionDate: new Date()
    };
    const momentDate: any = this.promotionForm.get('effectiveDate')?.value; 
    promotionData.effectiveDate = momentDate.format('YYYY-MM-DD');

    this.promotionService.applyPromotion(promotionData).subscribe(
      (response) => {
        this.isLoading = false;
        this.snackBar.open('Promotion applied successfully!', 'Close', { duration: 3000 });
        this.promotionForm.reset();
        this.loadPromotionsHistory();
        
        // // Update the employee list to reflect changes
        // this.loadEmployees();
      },
      (error) => {
        this.isLoading = false;
        console.error('Error applying promotion:', error);
        this.snackBar.open('Failed to apply promotion', 'Close', { duration: 3000 });
      }
    );
  }

  getEmployeeName(employeeId: string): string {
    return 'aaaaaaaaaaa';
    // const employee = this.employees.find(emp => emp.id === employeeId);
    // return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }
}