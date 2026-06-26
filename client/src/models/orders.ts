export interface ActiveOrderSidebarProps {
  dbTotal: number
  dbCount: number
  budgetLimit: number
  orderItems: any[]
  isTrusted: boolean
  onFinalize: () => void
  onAbort: () => void
  onRemoveItem: (id: number) => void
}
