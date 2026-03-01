// src/app/components/chat-bot/chat-bot.component.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ChatVisibilityService } from '../../services/chat-visibility.service';
import { imageIcons } from 'src/app/models/stores';
import { AuthService } from '../../services/auth.service';
import { filter, Subscription } from 'rxjs';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.scss'],
})
export class ChatBotComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  images = imageIcons;
  isOpen = false;
  newMessage = '';
  messages: ChatMessage[] = [];
  isLoading = false;

  // Draggable properties
  position = { x: 0, y: 0 };
  isDragging = false;
  dragStartPosition = { x: 0, y: 0 };

  private touchStartTimeout: any;
  private isTouchTap = false;

  private lastTouchStart = 0;

  // Visibility properties
  showChatButton = false;
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private authService: AuthService,
    private chatVisibilityService: ChatVisibilityService,
    private overlayCleanup: OverlayCleanupService,
  ) {}

  ngOnInit() {
    this.loadPositionFromStorage();
    this.checkAuthenticationStatus();
    this.setupRouterListener();
    this.loadMessages();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private checkAuthenticationStatus() {
    const isAuthenticated = this.authService.validateStoredToken();

    this.authSubscription = this.authService.userLoggedIn$.subscribe(
      (loggedIn) => {
        const isOnAuthPage = this.isOnAuthPage(this.router.url);
        const isOnChatPage = this.isOnChatPage(this.router.url);

        this.showChatButton = loggedIn && !isOnAuthPage && !isOnChatPage;
      },
    );

    // Initial check
    const isOnAuthPage = this.isOnAuthPage(this.router.url);
    const isOnChatPage = this.isOnChatPage(this.router.url);
    this.showChatButton = isAuthenticated && !isOnAuthPage && !isOnChatPage;
  }

  private setupRouterListener() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.handleRouteChange(event.url);
      });

    this.handleRouteChange(this.router.url);
  }

  private handleRouteChange(url: string) {
    const isOnAuthPage = this.isOnAuthPage(url);
    const isOnChatPage = this.isOnChatPage(url);
    const isAuthenticated = this.authService.validateStoredToken();

    this.showChatButton = isAuthenticated && !isOnAuthPage && !isOnChatPage;
  }

  private isOnAuthPage(url: string): boolean {
    const hiddenRoutes = [
      '/auth',
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/welcome-page',
      '/talent/onboarding',
    ];
    return hiddenRoutes.some((route) => url.startsWith(route));
  }

  private isOnChatPage(url: string): boolean {
    const chatRoutes = ['/chat', '/scouter/chat', '/talent/chat'];
    return chatRoutes.some((route) => url.startsWith(route));
  }

  onPointerDown(event: PointerEvent) {
    if (this.showChatButton) {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;

      this.dragStartPosition = {
        x: startX - this.position.x,
        y: startY - this.position.y,
      };

      const onPointerMove = (moveEvent: PointerEvent) => {
        this.isDragging = true;
        this.position.x = moveEvent.clientX - this.dragStartPosition.x;
        this.position.y = moveEvent.clientY - this.dragStartPosition.y;
        this.constrainToViewport();
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        const endX = upEvent.clientX;
        const endY = upEvent.clientY;

        // Calculate distance moved
        const distance = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
        );

        // If moved less than 8px, treat as click
        if (distance < 8) {
          this.openChat();
        }

        if (this.isDragging) {
          this.savePositionToStorage();
        }

        this.isDragging = false;

        // Clean up listeners
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    }
  }

  openChat() {
    if (this.showChatButton) {
      // clear any stray backdrops before leaving the current screen
      this.overlayCleanup.cleanBackdrops();
      this.router.navigate(['/chat']);
    }
  }
  private constrainToViewport() {
    const buttonWidth = 56; // w-14 = 3.5rem = 56px
    const buttonHeight = 56;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8; // 8px padding from edges

    this.position.x = Math.max(
      padding,
      Math.min(this.position.x, viewportWidth - buttonWidth - padding),
    );
    this.position.y = Math.max(
      padding,
      Math.min(this.position.y, viewportHeight - buttonHeight - padding),
    );
  }

  private loadPositionFromStorage() {
    const savedPosition = localStorage.getItem('chatButtonPosition');
    if (savedPosition) {
      this.position = JSON.parse(savedPosition);
      // Ensure the loaded position is within current viewport
      this.constrainToViewport();
    } else {
      // Default position: bottom right with some padding
      this.position = {
        x: window.innerWidth - 72, // 56px (button) + 16px (padding)
        y: window.innerHeight - 72,
      };
    }
  }

  private savePositionToStorage() {
    localStorage.setItem('chatButtonPosition', JSON.stringify(this.position));
  }

  // Optional: Method to reset to default position
  resetPosition() {
    this.position = {
      x: window.innerWidth - 72,
      y: window.innerHeight - 72,
    };
    this.savePositionToStorage();
  }

  // Optional: Check if button is in default position
  isInDefaultPosition(): boolean {
    const defaultX = window.innerWidth - 72;
    const defaultY = window.innerHeight - 72;
    const tolerance = 5; // 5px tolerance
    return (
      Math.abs(this.position.x - defaultX) <= tolerance &&
      Math.abs(this.position.y - defaultY) <= tolerance
    );
  }

  // Existing chat methods remain the same
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  loadMessages() {
    this.messages = this.chatService.getMessages();
    if (this.messages.length === 0) {
      this.addWelcomeMessage();
    }
  }

  private addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      text: 'Bàwo ni! I\'m Òní Ìbéèrè – your ever-curious AI companion. Go ahead, ask me anything... maybe start with "Who is Wizkid?"',
      sender: 'bot',
      timestamp: new Date(),
    };
    this.messages.push(welcomeMessage);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const userMessage = await this.chatService.addMessage(
      this.newMessage,
      'user',
    );
    this.messages.push(userMessage);

    const userText = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    try {
      const botResponse = await this.chatService.sendToChatbot(userText);
      const botMessage = await this.chatService.addMessage(botResponse, 'bot');
      this.messages.push(botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = await this.chatService.addMessage(
        'Sorry, I encountered an error. Please try again.',
        'bot',
      );
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
