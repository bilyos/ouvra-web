export type Role = 'CLIENT' | 'PROVIDER' | 'ADMIN';
export type Gender = 'HOMME' | 'FEMME';
export type NotificationType = 'MESSAGE' | 'REVIEW' | 'FAVORITE' | 'SYSTEM' | 'REQUEST' | 'QUOTE';
export type DevicePlatform = 'WEB' | 'ANDROID' | 'IOS';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  role: Role;
  city: string;
  avatarUrl: string | null;
  providerEnabled: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  /** Rempli seulement quand les SMS sont simulés (développement) */
  devCode?: string | null;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  gender: Gender;
  role?: Role;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface UpdateMeRequest {
  firstName?: string;
  lastName?: string;
  city?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface ProviderCard {
  id: string;
  name: string;
  profession: string;
  categoryId: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;
  startingPrice: number;
  city: string;
  online: boolean;
  available: boolean;
}

export interface ProviderDetail extends ProviderCard {
  description: string;
  availability: string;
  lat: number | null;
  lng: number | null;
  portfolio: string[];
  reviews: Review[];
}

export interface Review {
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface BecomeProviderRequest {
  categoryId: string;
  title: string;
  description: string;
  startingPrice: number;
  city: string;
  availability: string;
  lat?: number;
  lng?: number;
  photoUrls?: string[];
}

export interface UpdateProviderRequest {
  categoryId?: string;
  title?: string;
  description?: string;
  startingPrice?: number;
  city?: string;
  availability?: string;
  lat?: number;
  lng?: number;
  photoUrls?: string[];
}

export interface ProviderStats {
  contacts: number;
  ratingAvg: number;
  reviewCount: number;
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  other: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sentByMe: boolean;
  text: string | null;
  imageUrl: string | null;
  sentAt: string;
  read: boolean;
}

export interface SendMessageRequest {
  text?: string;
  imageUrl?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  refType: string;
  refId: string;
  read: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ── Booking & Payment ──

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOMO' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

/** Où en est l'argent : NONE (pas payé), HELD (bloqué chez Ouvra), RELEASED (versé au prestataire), REFUNDED, DISPUTED */
export type EscrowStatus = 'NONE' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';

export interface BookingItem {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string | null;
  providerName: string | null;
  providerProfession: string | null;
  providerAvatarUrl: string | null;
  title: string;
  description: string | null;
  scheduledAt: string;
  address: string | null;
  price: number;
  status: BookingStatus;
  cancelReason: string | null;
  paid: boolean;
  urgent: boolean;
  categoryId: string | null;
  expiresAt: string | null;
  createdAt: string;
  escrowStatus: EscrowStatus;
  /** Visible uniquement par le client, tant que l'argent est bloqué */
  completionCode?: string | null;
  completedAt?: string | null;
  /** Versement automatique si le client ne réagit pas */
  releaseAt?: string | null;
  disputeReason?: string | null;
  disputedAt?: string | null;
  /** Suivi : vue par le prestataire, acceptée, prestataire en route */
  viewedAt?: string | null;
  acceptedAt?: string | null;
  onTheWayAt?: string | null;
  /** La demande publiée dont vient cette réservation */
  requestId?: string | null;
}

export interface CreateBookingRequest {
  providerId?: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  address?: string;
  price: number;
  urgent?: boolean;
  categoryId?: string;
  /** Position de la demande : seuls les prestataires à moins de 20 km sont prévenus */
  lat?: number;
  lng?: number;
}

export interface InitPaymentRequest {
  method: PaymentMethod;
  phoneNumber?: string;
  finalAmount?: number;
}

export interface PaymentItem {
  id: string;
  bookingId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  providerAmount: number;
  method: PaymentMethod;
  phoneNumber: string | null;
  status: PaymentStatus;
  transactionRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PlatformStats {
  totalRevenue: number;
  totalCommission: number;
  totalProviderPayouts: number;
  completedPayments: number;
}

// ── Wallet ──

export interface WalletInfo {
  id: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export type TxType = 'CREDIT' | 'DEBIT';
export type TxStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface WalletTransaction {
  id: string;
  type: TxType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  reference: string | null;
  status: TxStatus;
  phoneNumber: string | null;
  withdrawalMethod: string | null;
  createdAt: string;
}

export interface WithdrawRequest {
  amount: number;
  method: PaymentMethod;
  phoneNumber: string;
}

// ── Subscriptions ──

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  durationDays: number;
  maxServices: number;
  boostFactor: number;
  badge: string | null;
  verifiedBadge: boolean;
  prioritySupport: boolean;
  statsEnabled: boolean;
  description: string | null;
}

export interface SubscriptionInfo {
  id: string;
  plan: SubscriptionPlan;
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  status: string;
  active: boolean;
}

export interface ProviderSearchParams {
  category?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  online?: boolean;
  available?: boolean;
  minRating?: number;
  sort?: 'proximity' | 'rating' | 'price' | 'reviews';
  page?: number;
  size?: number;
}

// ── Admin ──

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  role: Role;
  city: string;
  avatarUrl: string | null;
  providerEnabled: boolean;
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
}

export interface CategoryStat {
  categoryId: string;
  label: string;
  bookingCount: number;
}

export interface MonthlyStat {
  month: string;
  revenue: number;
  commission: number;
}

export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalProviders: number;
  totalAdmins: number;
  suspendedUsers: number;
  totalBookings: number;
  pendingBookings: number;
  acceptedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalCommission: number;
  totalProviderPayouts: number;
  completedPayments: number;
  activeSubscriptions: number;
  topCategories: CategoryStat[];
  monthlyRevenue: MonthlyStat[];
}

// ---------- Fil de demandes ----------

export type RequestStatus = 'OPEN' | 'ASSIGNED' | 'EXPIRED' | 'CANCELLED';
export type RequestTiming = 'NOW' | 'THIS_WEEK' | 'FLEXIBLE';
export type QuoteStatus = 'SENT' | 'WITHDRAWN' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type PriceKind = 'FIXED' | 'FROM' | 'AFTER_VISIT';

export interface RequestMedia {
  kind: 'PHOTO' | 'VIDEO';
  url: string;
  thumbnailUrl?: string | null;
  seconds?: number | null;
}

export interface JobRequestItem {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  voiceUrl?: string | null;
  voiceSeconds?: number | null;
  media: RequestMedia[];
  city: string;
  quarter?: string | null;
  /** Position arrondie à environ 500 m */
  approxLat?: number | null;
  approxLng?: number | null;
  /** Vue prestataire : distance arrondie au demi-kilomètre */
  distanceKm?: number | null;
  timing: RequestTiming;
  budgetMax?: number | null;
  status: RequestStatus;
  quoteCount: number;
  maxQuotes: number;
  expiresAt: string;
  createdAt: string;
  /** Prénom et initiale : « Aurélien T. » */
  clientName: string;
  clientAvatarUrl?: string | null;
  mine: boolean;
  /** Auteur seulement */
  address?: string | null;
  bookingId?: string | null;
  /** Prestataire seulement : son devis sur cette demande */
  myQuote?: QuoteItem | null;
}

export interface QuoteItem {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  providerTitle: string;
  ratingAvg: number;
  reviewCount: number;
  distanceKm?: number | null;
  price: number;
  priceKind: PriceKind;
  message?: string | null;
  availableAt: string;
  status: QuoteStatus;
  createdAt: string;
  /** Liste « Mes devis » du prestataire */
  request?: JobRequestItem | null;
}

export interface CreateJobRequest {
  categoryId: string;
  title: string;
  description?: string;
  voiceUrl?: string;
  voiceSeconds?: number;
  media?: RequestMedia[];
  city: string;
  quarter?: string;
  lat?: number;
  lng?: number;
  address?: string;
  timing: RequestTiming;
  budgetMax?: number;
}

export interface SendQuoteRequest {
  price: number;
  priceKind: PriceKind;
  message?: string;
  availableAt: string;
}
