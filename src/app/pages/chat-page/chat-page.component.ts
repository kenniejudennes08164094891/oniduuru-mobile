import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ChatVisibilityService } from '../../services/chat-visibility.service';
import { imageIcons } from 'src/app/models/stores';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ChatPageComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @Output() chatClosed = new EventEmitter<void>();

  images = imageIcons;
  newMessage = '';
  messages: ChatMessage[] = [];
  isLoading = false;
  private messagesSubscription?: Subscription;
  private shouldScroll = false;
  private routerSubscription?: Subscription;
  private isNavigatingAway = false;

  constructor(
    private chatService: ChatService,
    private chatVisibilityService: ChatVisibilityService,
    private router: Router
  ) { }

  ngOnInit() {
    this.chatVisibilityService.setChatPageOpen(true);
    this.loadMessages();

    this.messagesSubscription = this.chatService
      .getMessagesObservable?.()
      ?.subscribe((messages) => {
        this.messages = messages;
        this.shouldScroll = true;
      });

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const isLeavingChat = !event.url.includes('/chat');
        if (isLeavingChat) {
          this.forceImmediateHide();
        }
      }
    });
  }

  // MODIFIED: Only cleans up and hides chat, no navigation
  goBackImmediately() {
    // Remove background image
    this.removeBackgroundImmediately();
    this.chatClosed.emit();

    // Force cleanup and set flag to prevent further actions
    this.isNavigatingAway = true;
    this.cleanup();

    // Notify chat service/page that chat is being closed
    this.chatVisibilityService.setChatPageOpen(false);

    window.history.back();

  }

  // NEW METHOD: Remove background image from DOM immediately
  private removeBackgroundImmediately() {
    const headers = document.querySelectorAll('.chatBotPageHeaderBg');
    headers.forEach(header => {
      header.setAttribute('style', 'display: none !important; opacity: 0 !important; visibility: hidden !important; background-image: none !important;');
    });

    // Also remove any background from toolbars
    const toolbars = document.querySelectorAll('ion-toolbar.chatBotPageHeaderBg');
    toolbars.forEach(toolbar => {
      toolbar.setAttribute('style', 'display: none !important; opacity: 0 !important; visibility: hidden !important; --background: transparent !important;');
    });
  }

  // NEW METHOD: Force hide everything
  private forceImmediateHide() {
    this.isNavigatingAway = true;
    this.removeBackgroundImmediately();
    this.cleanup();
    this.chatVisibilityService.setChatPageOpen(false);
  }

  ngOnDestroy() {
    this.removeBackgroundImmediately();
    this.chatVisibilityService.setChatPageOpen(false);
    this.cleanup();

    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private cleanup() {
    this.isLoading = false;
    this.newMessage = '';
    this.messages = [];
  }

  // ... rest of your existing methods (scrollToBottom, loadMessages, sendMessage, etc.)
  ngAfterViewChecked() {
    if (this.shouldScroll && !this.isNavigatingAway) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement && !this.isNavigatingAway) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  loadMessages() {
    if (this.isNavigatingAway) return;

    this.messages = this.chatService.getMessages();

    if (this.messages.length === 0) {
      this.addWelcomeMessage();
    }
    this.shouldScroll = true;
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: '👋 Bàwo ni! I\'m Òní Ìbéèrè – your ever-curious AI companion. Go ahead, ask me anything... maybe start with "Who is Wizkid?"',
      sender: 'bot',
      timestamp: new Date(),
    };
    this.chatService.addMessage(welcomeMessage.text, welcomeMessage.sender);
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isNavigatingAway) return;

    const userText = this.newMessage.trim();
    this.newMessage = '';
    this.isLoading = true;

    try {
      await this.chatService.addMessage(userText, 'user');
      const botResponse = await this.chatService.sendToChatbot(userText);
      await this.chatService.addMessage(botResponse, 'bot');
    } catch (error) {
      console.error('Error sending message:', error);
      await this.chatService.addMessage(
        'Sorry, I encountered an error. Please try again.',
        'bot'
      );
    } finally {
      if (!this.isNavigatingAway) {
        this.isLoading = false;
        this.shouldScroll = true;
      }
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !this.isNavigatingAway) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async clearChat() {
    if (this.isNavigatingAway) return;

    await this.chatService.clearChat();
    this.messages = [];
    this.addWelcomeMessage();
  }
}