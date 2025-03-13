export interface Event {
  to: string;
  subject: string;
  message: string;
  attachment?: File;

}