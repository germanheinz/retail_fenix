// Products
export interface ProductTag {
  name: string
  displayName: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  tags: ProductTag[]
  artist?: string
  venue?: string
  city?: string
  date?: string
  capacity?: number
  image?: string
}

export interface ProductPage {
  page: number
  size: number
  totalSize: number
  totalPages: number
  products: Product[]
}

// Cart
export interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
}

// Checkout
export interface CheckoutItem {
  id: string
  name: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface ShippingOption {
  token: string
  name: string
  amount: number
  estimatedDays: number
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  email: string
}

export interface Checkout {
  customerSession: string
  items: CheckoutItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingOptions: ShippingOption[]
  shippingAddress?: ShippingAddress
}

export interface CheckoutSubmitted {
  orderId: string
  customerSession: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: ShippingAddress
}

// Orders
export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  createdAt: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: ShippingAddress
}

// Topology
export type TopologyStatus = 'HEALTHY' | 'UNHEALTHY' | 'NONE'

export interface TopologyInfo {
  serviceName: string
  endpoint: string
  status: TopologyStatus
  metadata?: Record<string, string>
}

// Theme
export type Theme = 'default' | 'green' | 'orange' | 'teal'

// Chat
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
