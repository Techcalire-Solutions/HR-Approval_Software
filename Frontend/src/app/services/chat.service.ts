/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { Chat } from '../common/interfaces/chat/chat';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ChatService {
  private apiUrl = environment.apiUrl;

  private http = inject(HttpClient);

  getChatByUser(loginId: number, userId: number){
    return this.http.get<Chat[]>(this.apiUrl + `/chat/chatsbyuser?loginId=${loginId}&selectedUserId=${userId}`)
  }

  addChat(data: any){
    return this.http.post(this.apiUrl + `/chat/add`, data)
  }

  updateMessageStatus(messageId: number, status: string) {
    return this.http.put(this.apiUrl +`/chat/updatestatus/${messageId}`, { status });
  }

  getChatByUserTo(id: number, userId: number) {
    return this.http.get<Chat[]>(this.apiUrl + `/chat/chatsbyto/?id=${id}&userid=${userId}`);
  }
}