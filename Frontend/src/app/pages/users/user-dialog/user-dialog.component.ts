/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserDocumentsComponent } from './../user-documents/user-documents.component';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UsersService } from '../../../services/users.service';
import { debounce, Subject, Subscription, takeUntil, timer } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonalDetailsComponent } from "../personal-details/personal-details.component";
import { UserPositionComponent } from '../user-position/user-position.component';
import { StatuatoryInfoComponent } from '../statuatory-info/statuatory-info.component';
import { UserAccountComponent } from "../user-account/user-account.component";
import { ActivatedRoute } from '@angular/router';
import { TeamService } from '@services/team.service';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { User } from '../../../common/interfaces/users/user';
import { UserNomineeComponent } from "../user-nominee/user-nominee.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FlexLayoutModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatNativeDateModule, MatRadioModule, MatDialogModule, MatButtonModule, MatToolbarModule, MatProgressSpinnerModule,
    PersonalDetailsComponent, UserPositionComponent, StatuatoryInfoComponent, UserAccountComponent, UserDocumentsComponent, MatCardModule,
    MatOptionModule, MatSelectModule, CommonModule, MatAutocompleteModule, UserNomineeComponent, FormsModule],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit, OnDestroy {
  url = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`;
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder)
  private userService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService)

  public passwordHide: boolean = true;
  editStatus: boolean = false;
  id: number;
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.editStatus = true;
        this.getUser(this.id)
        this.updateOfficialMailIdValidators();
      }else{
        this.generateEmployeeNumber()
      }
    });
    this.setupDebounceTimer();
  }

  form = this.fb.group({
    empNo: [''],
    url: [''],
    name: [ '',  Validators.compose([Validators.required, Validators.minLength(3)]) ],
    email: [ '', Validators.compose([Validators.required, Validators.email]) ],
    phoneNumber: [ '',  Validators.compose([Validators.required, Validators.pattern(/^\d{10}$/)]) ],
    password: [ '', Validators.compose([Validators.required, Validators.minLength(4)]) ],
    roleName: [],
    teamId: <any>[  ],
    officialMailId: [ '', Validators.compose([Validators.required, Validators.email]) ]
  })

  // Function to update validators for officialMailId
  updateOfficialMailIdValidators() {
    const officialMailIdControl = this.form.get('officialMailId');
    if (this.editStatus) {
      // Remove required and email validators when editStatus is true
      officialMailIdControl?.clearValidators();
    } else {
      // Add required and email validators when editStatus is false
      officialMailIdControl?.setValidators([Validators.required, Validators.email]);
    }
    // Update the control's validity
    officialMailIdControl?.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.usersSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
    this.delete?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  userSub!: Subscription;
  userName: string;
  getUser(id: number){
    this.id = id;
    this.userSub = this.userService.getUserById(id).subscribe(user=>{
      this.userName = user.name;
      this.patchUser(user)
    });
  }

  patchUser(user: User){
    this.invNo = user.empNo
    if(user.url != null && user.url != '' && user.url != 'undefined'){
      this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${user.url}`
    }
    this.form.patchValue({
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      password: user.password,
      teamId: user.teamId
    })
    // this.patch(user.role)
  }

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string = '';
  imageUrl: string = '';
  public safeUrl!: SafeResourceUrl;
  allowedFileTypes = ['jpeg', 'jpg', 'png'];
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.fileType = this.file.type.split('/')[1];
    if (!this.allowedFileTypes.includes(this.fileType)) {
      alert('Invalid file type. Please select a JPEG, JPG, or PNG file.');
      return;
    }
    if (this.file) {
      this.uploadComplete = false;

      let fileName = this.file.name;
      if (fileName.length > 12) {
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "... ." + splitName[1];
      }
      this.uploadSub = this.userService.uploadImage(this.file).subscribe({
        next: (invoice) => {

          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
          if (this.imageUrl) {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl);
          }
          this.form.get('url')?.setValue(invoice.fileUrl);
          this.uploadComplete = true; // Set to true when upload is complete
        },
        error: () => {
          this.uploadComplete = true; // Ensure UI updates even on error
          
          // Show error alert
          alert('File upload failed. Please try again.'); 
          
          // Alternatively, use a UI notification library
          // this.toastr.error('File upload failed. Please try again.', 'Error');
        }
      });
    }
  }

  hidePassword: boolean = true;
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  selectedTabIndex: number = 0;
  formSubmitted: boolean = true;
  isFormSubmitted: boolean = false;
  isWorkFormSubmitted: boolean = false;
  isContactsFormSubmitted: boolean = false;
  isSocialFormSubmitted: boolean = false;
  isAccountFormSubmitted: boolean = false;
  isQualFormSubmitted: boolean = false;
  isNomineeFormSubmitted: boolean = false;
  submit!: Subscription;
  onSubmit(){
    this.isLoading = true;
    if(this.editStatus){
      this.submit = this.userService.updateUser(this.id, this.form.getRawValue()).subscribe(()=>{
        this.snackBar.open("User updated succesfully...","" ,{duration:3000})
        this.isLoading = false;
      })
    }else{
      this.submit = this.userService.addUser(this.form.getRawValue()).subscribe((res) => {        
        this.editStatus = true;
        this.id = res.id;
        this.userName = res.name
        this.dataToPass = { id: res.id, empNo: this.invNo, name: res.name, updateStatus: this.editStatus };
        // this.selectedTabIndex = 1;
        // if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        //   this.personalDetailsComponent.ngOnInit();
        // }
        this.isFormSubmitted = true;
        this.formSubmitted = false;
        this.snackBar.open("User added succesfully...","" ,{duration:3000})
        this.isLoading = false;
      })
    }
  }

  personalSubmit(event: any){
    this.isWorkFormSubmitted = event.isFormSubmitted
    this.isFormSubmitted = false;
    this.selectedTabIndex = 2;
    if (this.userPositionComponent && this.selectedTabIndex === 2) {
      this.userPositionComponent.triggerNew();
    }
  }

  workSubmit(event: any){
    this.isContactsFormSubmitted = event.isFormSubmitted
    this.isWorkFormSubmitted = false;
    this.selectedTabIndex = 3
  }

  contactSubmit(event: any){
    this.isSocialFormSubmitted = event.isFormSubmitted
    this.isContactsFormSubmitted = false;
    this.selectedTabIndex = 4
    if (this.userAccountComponent && this.selectedTabIndex === 4) {
      this.userAccountComponent.ngOnInit();
    }
  }

  accountSubmit(event: any){
    this.isNomineeFormSubmitted = event.isFormSubmitted
    this.isSocialFormSubmitted = false;
    this.selectedTabIndex = 5
    // if (this.userNomineeComponent && this.selectedTabIndex === 5) {
    //   this.userNomineeComponent.ngOnInit();
    // }
  }

  nomineeSubmit(event: any){
    this.isAccountFormSubmitted = event.isFormSubmitted
    this.isNomineeFormSubmitted = false;
    this.selectedTabIndex = 6
    if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
      this.userDocumentsComponent.trigger();
    }
  }

  // qualSubmit(event: any){
  //   this.isAccountFormSubmitted = event.isFormSubmitted
  //   this.isQualFormSubmitted = false;
  //   this.selectedTabIndex = 6
  //   if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
  //     this.userDocumentsComponent.trigger();
  //   }
  // }

  isEditingInvNo = false;
  originalInvNo: string = ''; // Initialize with empty string
  showError: boolean = false;
  // When starting to edit
  startEditingInvNo() {
    this.originalInvNo = this.invNo; // Save the original value
    this.isEditingInvNo = true;
  }
  
  showEmptyWarning: boolean = false;
  checkEmpty(event: any) {
    // Check if field will be empty after this backspace
    if ((!this.invNo || this.invNo.length <= 1) && event.key === 'Backspace') {
      // Temporarily show warning
      this.showEmptyWarning = true;
      setTimeout(() => this.showEmptyWarning = false, 1500);
      
      // Restore original value but keep editing
      setTimeout(() => {
        this.invNo = ' Cannot be empty';
      }, 0);
      
      event.preventDefault();
    }
  }
  
  saveInvNo() {
    if (!this.invNo || this.invNo.trim() === '') {
      this.invNo = this.originalInvNo;
      this.showEmptyWarning = true;  
      setTimeout(() => this.showEmptyWarning = false, 1500); 
    }
    this.form.get('empNo')?.setValue(this.invNo);
    this.isEditingInvNo = false;
  }

  private destroy$ = new Subject<void>();
  private inputChange$ = new Subject<void>();
  debounceTime = 2000;
  setupDebounceTimer() {
    this.inputChange$.pipe(
      debounce(() => timer(this.debounceTime)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.saveInvNo();
    });
  }

  showOACWarn: boolean = false;
  onInputChange() {
    // Validate the input
    if (this.invNo && this.invNo.startsWith(`${this.desiredPrefix}-`)) {
      // Revert to original value
      this.showOACWarn = true;
      // this.invNo = this.originalInvNo;
      // Hide warning after 3 seconds
      setTimeout(() => this.showEmptyWarning = false, 3000);
    }
    this.inputChange$.next();
  }
  
  dataToPass: any;
  positionData: any;
  statuatoryData: any;
  accountData: any;
  invNo: string;
  usersSub!: Subscription;
  desiredPrefix: any = 'OAC';
  generateEmployeeNumber() {
    const currentYear = new Date().getFullYear();

    this.userSub = this.userService.getUser().subscribe((res) => {
      const users = res;
      console.log(users);
      
      // Find all users with standard format (AAA-YYYY-NNN)
      const standardFormatUsers = users.filter(user => 
        typeof user.empNo === 'string' && 
        user.empNo.match(/^[A-Za-z]{3}-\d{4}-\d{3}$/)
      ); // Default prefix

      if (standardFormatUsers.length > 0) {
        // Extract prefixes and find the most common one
        const prefixCounts: any = {};
        standardFormatUsers.forEach(user => {
          const prefix = user.empNo.split('-')[0];
          prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
        });

        // Get the most frequent prefix
        this.desiredPrefix = Object.keys(prefixCounts).reduce((a, b) => 
          prefixCounts[a] > prefixCounts[b] ? a : b
        );
      } else {
        // No standard format users found, prompt for prefix
        this.desiredPrefix = prompt('No employees with standard format found. Enter employee number prefix (3 letters):', 'OAC');
        
        // Validate the prefix input
        while (this.desiredPrefix && !/^[A-Za-z]{3}$/.test(this.desiredPrefix)) {
          this.desiredPrefix = prompt('Invalid prefix. Please enter exactly 3 letters:', 'OAC');
        }
        
        if (!this.desiredPrefix) {
          console.warn('No valid prefix provided');
          return;
        }
        
        this.desiredPrefix = this.desiredPrefix.toUpperCase();
      }

      // Filter users with the determined prefix
      const prefixedUsers = users.filter(user => 
        typeof user.empNo === 'string' && 
        user.empNo.startsWith(this.desiredPrefix)
      );

      let nextId;
      if (prefixedUsers.length > 0) {
        // Find the maximum ID among prefixed users
        const maxId = prefixedUsers.reduce((prevMax, user) => {
          const empNoParts = user.empNo.split('-');
          if (empNoParts.length === 3) {
            const idNumber = parseInt(empNoParts[2], 10);
            return !isNaN(idNumber) ? Math.max(prevMax, idNumber) : prevMax;
          }
          return prevMax;
        }, 0);
        nextId = maxId + 1;
      } else {
        // No users with this prefix, start with 001
        nextId = 1;
      }

      // Generate the new employee number
      const paddedId = `${this.desiredPrefix}-${currentYear}-${nextId.toString().padStart(3, "0")}`;
      
      this.invNo = paddedId;
      this.form.get('empNo')?.setValue(paddedId);
    });
  }

  extractLetters(input: string): string {
    const match = input.match(/^[A-Za-z]+/);

    return match ? match[0] : '';
  }

  @ViewChild(PersonalDetailsComponent) personalDetailsComponent!: PersonalDetailsComponent;
  @ViewChild(UserPositionComponent) userPositionComponent!: UserPositionComponent;
  @ViewChild(StatuatoryInfoComponent) statuatoryInfoComponent!: StatuatoryInfoComponent;
  @ViewChild(UserAccountComponent) userAccountComponent!: UserAccountComponent;
  @ViewChild(UserDocumentsComponent) userDocumentsComponent!: UserDocumentsComponent;
  @ViewChild(UserNomineeComponent) userNomineeComponent!: UserNomineeComponent;
  // @ViewChild(UserQualificationComponent) userQualificationComponent!: UserQualificationComponent;
  goToNextTab() {
    if (this.selectedTabIndex < 6) {
      if( this.dataToPass === undefined){
        this.dataToPass = { updateStatus: this.editStatus, id: this.id, name: this.userName }
      }
      this.selectedTabIndex++;

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.isFormSubmitted = true;
        this.personalDetailsComponent.triggerNew(this.dataToPass);
      }

      else if (this.userPositionComponent && this.selectedTabIndex === 2) {
        this.isFormSubmitted = false;
        this.isWorkFormSubmitted = true;
        this.userPositionComponent.triggerNew(this.dataToPass);
      }
      else if (this.statuatoryInfoComponent && this.selectedTabIndex === 3) {
        this.isWorkFormSubmitted = false;
        this.isContactsFormSubmitted = true;
        this.statuatoryInfoComponent.triggerNew(this.dataToPass);
      }
      else if (this.userAccountComponent && this.selectedTabIndex === 4) {
        this.isContactsFormSubmitted = false;
        this.isSocialFormSubmitted = true;
        this.userAccountComponent.triggerNew(this.dataToPass);
      }
      else if (this.userNomineeComponent && this.selectedTabIndex === 5) {
        this.isSocialFormSubmitted = false;
        this.isNomineeFormSubmitted = true;
        this.userNomineeComponent.triggerNew(this.dataToPass);
      }
      // else if (this.userQualificationComponent && this.selectedTabIndex === 5) {
      //   this.isSocialFormSubmitted = false;
      //   this.isQualFormSubmitted = true;
      //   this.userQualificationComponent.triggerNew(this.dataToPass);
      // }
      
      else if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
        this.isNomineeFormSubmitted = false;
        this.isAccountFormSubmitted = true;
        this.userDocumentsComponent.triggerNew(this.dataToPass);
      }
    }
  }

  // editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      this.editStatus = true;
      this.getUser(data.id)
    }
  }

  goToPreviousTab(): void {
    if (this.selectedTabIndex > 0) {
      if( this.dataToPass === undefined){
        this.dataToPass = { updateStatus: this.editStatus, id: this.id, name: this.userName }
      }
      this.selectedTabIndex --;
      if(this.selectedTabIndex === 0){
          this.triggerNew(this.dataToPass)
      }

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.isFormSubmitted = true;
        this.personalDetailsComponent.triggerNew(this.dataToPass);
      }
      
      else if (this.userPositionComponent && this.selectedTabIndex === 2) {
        this.isFormSubmitted = false;
        this.isWorkFormSubmitted = true;
        this.userPositionComponent.triggerNew(this.dataToPass);
      }
      else if (this.statuatoryInfoComponent && this.selectedTabIndex === 3) {
        this.isWorkFormSubmitted = false;
        this.isContactsFormSubmitted = true;
        this.statuatoryInfoComponent.triggerNew(this.dataToPass);
      }
      else if (this.userAccountComponent && this.selectedTabIndex === 4) {
        this.isContactsFormSubmitted = false;
        this.isSocialFormSubmitted = true;
        this.userAccountComponent.triggerNew(this.dataToPass);
      }
      else if (this.userNomineeComponent && this.selectedTabIndex === 5) {
        this.isSocialFormSubmitted = false;
        this.isNomineeFormSubmitted = true;
        this.userNomineeComponent.triggerNew(this.dataToPass);
      }
      // else if (this.userQualificationComponent && this.selectedTabIndex === 5) {
      //   this.isSocialFormSubmitted = false;
      //   this.isQualFormSubmitted = true;
      //   this.userQualificationComponent.triggerNew(this.dataToPass);
      // }
      
      else if (this.userDocumentsComponent && this.selectedTabIndex === 6) {
        this.isQualFormSubmitted = false;
        this.isAccountFormSubmitted = true;
        this.userDocumentsComponent.triggerNew(this.dataToPass);
      }
    }
  }

  generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    this.form.get('password')?.setValue(password);
    // this.form.get('confirmPassword')?.setValue(password);  // Clear confirm password
  }

  copyEmpNoAndPassword() {
    const empNo = this.form.get('empNo')?.value;
    const password = this.form.get('password')?.value;

    if (empNo && password) {
      const textToCopy = `Emp ID: ${empNo}\nPassword: ${password}`;
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          this.snackBar.open('Email and password copied to clipboard',"" ,{duration:3000});
        },
        (err) => {
          console.error('Could not copy text: ', err);
        }
      );
    }
  }

  delete!: Subscription;
  deleteImage() {
    if(this.id){
      this.delete = this.userService.deleteUserImage(this.id, this.imageUrl).subscribe(()=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
        this.getUser(this.id)
      });
    }else{
      this.delete = this.userService.deleteUserImageByurl(this.imageUrl).subscribe(()=>{
        this.imageUrl = ''
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    }
  }

  isLoading: boolean
  updateLoadingState(isLoading: any): void {
      this.isLoading = isLoading;
  }
}


