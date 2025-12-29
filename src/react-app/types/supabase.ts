export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            inventory: {
                Row: {
                    id: string
                    item_name: string
                    quantity: number
                    price: number
                    low_stock_threshold: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    item_name: string
                    quantity?: number
                    price?: number
                    low_stock_threshold?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    item_name?: string
                    quantity?: number
                    price?: number
                    low_stock_threshold?: number
                    created_at?: string
                }
            }
            daily_stock_records: {
                Row: {
                    id: string
                    date: string
                    item_name: string
                    open_stock: number
                    added_stock: number
                    closing_stock: number
                    price: number
                    profit_margin: number | null
                    daily_sale_amount: number
                    sales_person: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    date: string
                    item_name: string
                    open_stock?: number
                    added_stock?: number
                    closing_stock?: number
                    price?: number
                    profit_margin?: number | null
                    daily_sale_amount?: number
                    sales_person?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    item_name?: string
                    open_stock?: number
                    added_stock?: number
                    closing_stock?: number
                    price?: number
                    profit_margin?: number | null
                    daily_sale_amount?: number
                    sales_person?: string | null
                    created_at?: string
                }
            }
            sales: {
                Row: {
                    id: string
                    sale_date: string
                    item_name: string
                    quantity: number
                    unit_price: number
                    total: number
                    payment: 'Cash' | 'M-Pesa'
                }
                Insert: {
                    id?: string
                    sale_date?: string
                    item_name: string
                    quantity: number
                    unit_price: number
                    total: number
                    payment: 'Cash' | 'M-Pesa'
                }
                Update: {
                    id?: string
                    sale_date?: string
                    item_name?: string
                    quantity?: number
                    unit_price?: number
                    total?: number
                    payment?: 'Cash' | 'M-Pesa'
                }
            }
        }
    }
}
