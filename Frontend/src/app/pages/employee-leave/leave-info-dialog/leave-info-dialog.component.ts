import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { LeaveService } from '@services/leave.service';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-leave-info-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './leave-info-dialog.component.html',
  styleUrl: './leave-info-dialog.component.scss'
})
export class LeaveInfoDialogComponent {
  message: string = '';

   constructor(
     @Inject(MAT_DIALOG_DATA) public data: any,
     private dialogRef: MatDialogRef<LeaveInfoDialogComponent>
   ) {
     if (data && data.message) {
       this.message = data.message;
     }
   }

   onBack() {
     // Close the dialog and signal that the user wants to go back
     this.dialogRef.close({ action: 'back' });
   }

   onCancel() {
     // Close the dialog and signal that the user has cancelled the request
     this.dialogRef.close({ action: 'cancel' });
   }

   onOk() {
     // Close the dialog and signal that the user wants to proceed with the request
     this.dialogRef.close({ action: 'proceed' });
   }
}

