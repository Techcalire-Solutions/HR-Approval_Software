import { Component } from '@angular/core';

@Component({
  selector: 'app-results-snakbar',
  standalone: true,
  imports: [],
  templateUrl: './results-snakbar.component.html',
  styleUrl: './results-snakbar.component.scss'
})
export class ResultsSnakbarComponent {
  constructor(private snackBar: MatSnackBar) {}

ngOnInit(): void {
  // Fetch the status (for example from a query parameter or the page's state)
  const approvalStatus = this.route.snapshot.queryParams['status'];

  if (approvalStatus === 'approved') {
    this.showSnackbar('Leave Approved Successfully');
  } else if (approvalStatus === 'failed') {
    this.showSnackbar('Failed to approve leave');
  }
}

showSnackbar(message: string) {
  this.snackBar.open(message, 'Close', {
    duration: 3000,
    verticalPosition: 'top',
    horizontalPosition: 'center'
  });

}
