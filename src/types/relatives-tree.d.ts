declare module 'relatives-tree/lib/types' {
  export interface Node {
    id: string
    gender: 'male' | 'female'
    parents: { id: string; type: 'blood' | 'adopted' | 'half' }[]
    siblings: { id: string; type: 'blood' | 'adopted' | 'half' }[]
    spouses: { id: string; type: 'married' | 'divorced' | 'engaged' }[]
    children: { id: string; type: 'blood' | 'adopted' | 'half' }[]
  }

  export interface ExtNode extends Node {
    top: number
    left: number
    hasSubTree: boolean
  }
}
