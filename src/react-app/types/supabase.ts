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
            daily_stock_records: {
                Row: {
                    added_stock: number
                    closing_stock: number
                    created_at: string | null
                    date: string
                    id: string
                    opening_stock: number
                    product_id: string
                    status: string
                    updated_at: string | null
                }
                Insert: {
                    added_stock?: number
                    closing_stock?: number
                    created_at?: string | null
                    date?: string
                    id?: string
                    opening_stock?: number
                    product_id: string
                    status?: string
                    updated_at?: string | null
                }
                Update: {
                    added_stock?: number
                    closing_stock?: number
                    created_at?: string | null
                    date?: string
                    id?: string
                    opening_stock?: number
                    product_id?: string
                    status?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_stock_records_product_id_fkey"
                        columns: ["product_id"]
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            inventory: {
                Row: {
                    id: string
                    low_stock_threshold: number
                    product_id: string
                    quantity: number
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    low_stock_threshold?: number
                    product_id: string
                    quantity?: number
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    low_stock_threshold?: number
                    product_id?: string
                    quantity?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "inventory_product_id_fkey"
                        columns: ["product_id"]
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            products: {
                Row: {
                    active: boolean | null
                    category: string | null
                    created_at: string | null
                    id: string
                    name: string
                    selling_price: number
                }
                Insert: {
                    active?: boolean | null
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    name: string
                    selling_price?: number
                }
                Update: {
                    active?: boolean | null
                    category?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                    selling_price?: number
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    full_name: string | null
                    id: string
                    role: string
                }
                Insert: {
                    full_name?: string | null
                    id: string
                    role: string
                }
                Update: {
                    full_name?: string | null
                    id?: string
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            sales: {
                Row: {
                    id: string
                    item_name: string
                    payment_method: string | null
                    product_id: string | null
                    quantity: number
                    sale_date: string | null
                    sales_person: string | null
                    total: number
                    unit_price: number
                }
                Insert: {
                    id?: string
                    item_name: string
                    payment_method?: string | null
                    product_id?: string | null
                    quantity: number
                    sale_date?: string | null
                    sales_person?: string | null
                    total: number
                    unit_price: number
                }
                Update: {
                    id?: string
                    item_name?: string
                    payment_method?: string | null
                    product_id?: string | null
                    quantity?: number
                    sale_date?: string | null
                    sales_person?: string | null
                    total?: number
                    unit_price?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "sales_product_id_fkey"
                        columns: ["product_id"]
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
