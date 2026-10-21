import type { Paginated } from '@/types/api';

/** Public profile fields only, as `ChatParticipantResponseDto` defines them. */
export interface ChatParticipant {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

/** Mirrors `MessageResponseDto`. Note: it carries no `sender` object. */
export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors `ChatResponseDto`: a one-to-one conversation. */
export interface Chat {
  id: number;
  otherParticipantId: number;
  otherParticipant: ChatParticipant;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /chats` resolves to `ChatListResponseDto`, a paginated list. */
export type ChatList = Paginated<Chat>;
