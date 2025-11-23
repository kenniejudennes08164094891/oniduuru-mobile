// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private _storage: Storage | null = null;
  private chatHistory: ChatMessage[] = [];
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

  constructor(
    private storage: Storage,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    await this.loadChatHistory();
  }

  private async loadChatHistory() {
    const history = await this._storage?.get('chatHistory');
    this.chatHistory = history || [];
    this.messagesSubject.next(this.chatHistory);
  }

  async addMessage(text: string, sender: 'user' | 'bot'): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };

    this.chatHistory.push(message);
    await this._storage?.set('chatHistory', this.chatHistory);
    this.messagesSubject.next(this.chatHistory); // Notify subscribers
    return message;
  }

  getMessages(): ChatMessage[] {
    return [...this.chatHistory]; // Return copy to prevent direct manipulation
  }

  getMessagesObservable(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  async clearChat(): Promise<void> {
    this.chatHistory = [];
    await this._storage?.set('chatHistory', []);
    this.messagesSubject.next(this.chatHistory);
  }

  async sendToChatbot(userMessage: string): Promise<string> {
    try {
      const url = `${environment.baseUrl}/${endpoints.chatbot}`;

      const requestBody = {
        messageContent: userMessage,
      };

      const response = await this.http
        .post<{ role: string; content: string }>(url, requestBody)
        .toPromise();

      return (
        response?.content ||
        'I apologize, but I am currently unable to respond. Please try again later.'
      );
    } catch (error) {
      console.error('Chatbot API error:', error);

      const fallbackResponses = [
        "I'm having trouble connecting right now. Please try again in a moment.",
        "It seems I'm experiencing some technical difficulties. Maybe ask me about Wizkid instead?",
        "Bàwo ni! I'm here but having connection issues. Let's try that again!",
      ];

      return fallbackResponses[
        Math.floor(Math.random() * fallbackResponses.length)
      ];
    }
  }
}