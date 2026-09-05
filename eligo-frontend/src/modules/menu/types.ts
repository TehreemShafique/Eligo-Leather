export type MenuTarget = "_self" | "_blank"

export interface MenuItem {
  id: number
  menu_id?: number
  parent_id?: number | null
  label: string
  url: string
  target?: MenuTarget
  position?: number
  children?: MenuItem[]
}

export interface Menu {
  id: number
  title: string
  handle: string
  created_at?: string
  items?: MenuItem[]
}
