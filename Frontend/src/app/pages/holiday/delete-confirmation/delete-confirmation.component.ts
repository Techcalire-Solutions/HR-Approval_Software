import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [ MatDialogModule, MatButtonModule],
  templateUrl: './delete-confirmation.component.html',
  styleUrl: './delete-confirmation.component.scss'
})
export class DeleteConfirmationComponent {
  public dialogRef = inject(MatDialogRef<DeleteConfirmationComponent>)
  public data = inject(MAT_DIALOG_DATA, { optional: true });
  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Confirm the deletion
  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
