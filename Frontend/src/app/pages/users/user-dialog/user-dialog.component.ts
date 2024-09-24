import { UserDocumentsComponent } from './../user-documents/user-documents.component';
import { Component, inject, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { DatePipe } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { RoleService } from '../../../services/role.service';
import { MaterialModule } from '../../../common/material/material.module';
import {MatToolbarModule} from '@angular/material/toolbar';
import { Role } from '../../../common/interfaces/role';
import { UsersService } from '../../../services/users.service';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { User } from '../../../common/interfaces/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonalDetailsComponent } from "../personal-details/personal-details.component";
import { UserPositionComponent } from '../user-position/user-position.component';
import { StatuatoryInfoComponent } from '../statuatory-info/statuatory-info.component';
import { UserAccountComponent } from "../user-account/user-account.component";
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FlexLayoutModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    DatePipe,
    MaterialModule,
    MatToolbarModule,
    PersonalDetailsComponent,
    UserPositionComponent,
    StatuatoryInfoComponent,
    UserAccountComponent, UserDocumentsComponent
],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  url = environment.apiUrl;
  snackBar = inject(MatSnackBar);
  sanitizer = inject(DomSanitizer);
  fb = inject(FormBuilder)
  roleService = inject(RoleService);
  userService = inject(UsersService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  public form: FormGroup;
  public passwordHide: boolean = true;
  editStatus: boolean = false;
  id: number;
  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.editStatus = true;
        this.getUser(this.id) // Call a function if 'id' exists
      }
    });

    this.form = this.fb.group({
      url: [''],
      name: [ null, Validators.compose([Validators.required, Validators.minLength(3)]) ],
      email: [ null, Validators.compose([Validators.required, Validators.email]) ],
      phoneNumber: [ null, Validators.compose([Validators.required, Validators.pattern(/^\d{10}$/)]) ],
      password: [ null, Validators.compose([Validators.required, Validators.minLength(4)]) ],
      roleId: [ null, Validators.compose([Validators.required])]
    })

    this.getRoles()
    this.generateEmployeeNumber()
  }

  userSub!: Subscription;
  getUser(id: number){
    this.userSub = this.userService.getUserById(id).subscribe(user=>{
      this.patchUser(user)
    });
  }

  patchUser(user: User){
    this.form.patchValue({
      name: user.name,
      roleId: user.roleId,
      phoneNumber: user.phoneNumber,
      email: user.email,
      status: user.status,
      joiningDate: user.createdAt,
      password: user.password
    })
    if(user.url != null) this.imageUrl = this.url + user.url
  }

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string = '';
  imageUrl!: string;
  public safeUrl!: SafeResourceUrl;
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.fileType = this.file.type.split('/')[1];
    if (this.file) {
      this.uploadComplete = false; // Set to false to show the progress bar

      let fileName = this.file.name;
      if (fileName.length > 12) {
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "... ." + splitName[1];
      }

      this.uploadSub = this.userService.uploadImage(this.file).subscribe({
        next: (invoice) => {
          this.imageUrl = this.url + invoice.fileUrl;
          if (this.imageUrl) {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl);
          }
          this.form.get('url')?.setValue(invoice.fileUrl);
          this.uploadComplete = true; // Set to true when upload is complete
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploadComplete = true; // Set to true to remove the progress bar even on error
        }
      });
    }
  }

  hidePassword: boolean = true;
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  roles:Role[]=[];
  roleSub!: Subscription;
  getRoles(){
    this.roleService.getRole().subscribe((res)=>{
      this.roles = res;
    })
  }

  close(): void {
    // this.dialogRef.close();
  }

  selectedTabIndex: number = 0;
  isFormSubmitted: boolean = false;
  isWorkFormSubmitted: boolean = false;
  isContactsFormSubmitted: boolean = false;
  isSocialFormSubmitted: boolean = false;
  isAccountFormSubmitted: boolean = false;
  onSubmit(){
    // if(this.data){
    //   this.userService.updateUser(this.data.id, this.form.getRawValue()).subscribe((res)=>{
    //     console.log(res);
    //     this.dialogRef.close();
    //     this.snackBar.open("User updated succesfully...","" ,{duration:3000})
    //   })
    // }else{
      this.userService.addUser(this.form.getRawValue()).subscribe((res)=>{
        this.dataToPass = { id: res.id, empNo: this.invNo, name: res.name, updateStatus: this.editStatus };
        console.log(this.dataToPass);

        this.selectedTabIndex = 1;
        this.isFormSubmitted = true;
        this.snackBar.open("User added succesfully...","" ,{duration:3000})
      })
  }

  personalSubmit(event: any){
    this.isWorkFormSubmitted = event.isFormSubmitted
    this.selectedTabIndex = 2;
  }

  workSubmit(event: any){
    this.isContactsFormSubmitted = event.isFormSubmitted
    this.selectedTabIndex = 3
  }

  contactSubmit(event: any){
    this.isSocialFormSubmitted = event.isFormSubmitted
    this.selectedTabIndex = 4
  }

  accountSubmit(event: any){
    this.isAccountFormSubmitted = event.isFormSubmitted
    this.selectedTabIndex = 5
  }

  dataToPass: any;
  positionData: any;
  statuatoryData: any;
  accountData: any;
  invNo: string;
  generateEmployeeNumber() {
    let prefix: any;
    const currentYear = new Date().getFullYear();

    this.userService.getUserPersonalDetails().subscribe((res) => {
      let users = res;

      if (users.length > 0) {
        const maxId = users.reduce((prevMax, inv) => {
          const idNumber = parseInt(inv.empNo.replace(/\D/g, ''), 10);

          prefix = this.extractLetters(inv.empNo);

          if (!isNaN(idNumber)) {
            return idNumber > prevMax ? idNumber : prevMax;
          } else {
            return prevMax;
          }
        }, 0);
        // Increment the maxId by 1 to get the next ID
        let nextId = maxId + 1;
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;
        this.invNo = ivNum;
        this.form.get('envNo')?.setValue(ivNum);
      } else {
        // If there are no employees in the array, set the employeeId to 'EMP001'
        let nextId = 0o1;
        prefix =  `OAC-${currentYear}-`;

        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;

        this.form.get('envNo')?.setValue(ivNum);
        this.invNo = ivNum;
      }


    });
  }

  extractLetters(input: string): string {
    // return input.replace(/[^a-zA-Z]/g, "");
    var extractedChars = input.match(/[A-Za-z-]/g);

    // Combine the matched characters into a string
    var result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  @ViewChild(PersonalDetailsComponent) personalDetailsComponent!: PersonalDetailsComponent;
  goToNextTab() {
    if (this.selectedTabIndex < 4) {
      this.dataToPass = { updateStatus: this.editStatus, id: this.id }
      this.selectedTabIndex++;

      if (this.personalDetailsComponent && this.selectedTabIndex === 1) {
        this.personalDetailsComponent.ngOnInit(this.dataToPass);
      }
    }
  }

}


