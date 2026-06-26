// shared/types/event-types.ts
// #event-driven-architecture #async-messaging #redis-pubsub

// ============================================
// Event Envelope
// ============================================
export interface EventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  payload: T;
}

// ============================================
// Order Events
// ============================================
export const OrderEvents = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_READY: 'order.ready',
} as const;

export interface OrderCreatedEvent {
  orderId: string;
  cafeId: string;
  tableNumber: number;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
  }>;
  totalAmount: number;
  createdBy: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  cafeId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

// ============================================
// Inventory Events
// ============================================
export const InventoryEvents = {
  STOCK_DEDUCTED: 'inventory.stock.deducted',
  STOCK_ADDED: 'inventory.stock.added',
  LOW_STOCK_ALERT: 'inventory.low_stock.alert',
  REORDER_SUGGESTED: 'inventory.reorder.suggested',
} as const;

export interface StockDeductedEvent {
  ingredientId: string;
  ingredientName: string;
  quantityDeducted: number;
  remainingStock: number;
  reason: string;
  deductedBy: string;
  cafeId: string;
}

export interface LowStockAlertEvent {
  cafeId: string;
  ingredients: Array<{
    id: string;
    name: string;
    currentStock: number;
    threshold: number;
  }>;
}

// ============================================
// Menu Events
// ============================================
export const MenuEvents = {
  MENU_ITEM_UPDATED: 'menu.item.updated',
  MENU_ITEM_DELETED: 'menu.item.deleted',
  CATEGORY_REORDERED: 'menu.category.reordered',
} as const;

export interface MenuItemUpdatedEvent {
  itemId: string;
  cafeId: string;
  changes: Record<string, any>;
  }
